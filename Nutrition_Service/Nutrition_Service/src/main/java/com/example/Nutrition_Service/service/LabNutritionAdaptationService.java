package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.client.NephroLabClient;
import com.example.Nutrition_Service.dto.ResultatLaboratoireDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Adapte les besoins nutritionnels d'un patient en fonction de ses derniers
 * résultats de laboratoire récupérés depuis NEPHRO via OpenFeign.
 *
 * Règles métier appliquées (guidelines KDIGO rénaux pédiatriques) :
 *  - Créatinine élevée (ELEVE/CRITIQUE_HAUT) → réduire protéines de 20 %
 *  - Potassium élevé                          → réduire potassium max de 200 mg
 *  - Phosphore élevé                          → réduire phosphore max de 100 mg
 *  - Potassium bas                            → augmenter potassium max de 200 mg
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LabNutritionAdaptationService {

    private final NephroLabClient nephroLabClient;
    private final BesoinNutritionnelRepository besoinRepository;

    /**
     * Récupère les résultats de labo du dossier médical via Feign,
     * puis ajuste et sauvegarde les besoins nutritionnels du patient.
     *
     * @param patientId       ID du patient dans Nutrition_Service
     * @param idDossierMedical ID du dossier médical dans NEPHRO
     * @return le BesoinNutritionnel mis à jour, ou empty si aucun besoin existant
     */
    public Optional<BesoinNutritionnel> adaptFromLabResults(Long patientId, Long idDossierMedical) {
        // 1. Récupérer les résultats depuis NEPHRO
        List<ResultatLaboratoireDTO> resultats;
        try {
            resultats = nephroLabClient.getResultatsByDossier(idDossierMedical);
        } catch (Exception e) {
            log.error("Feign call to NEPHRO failed for dossier {}: {}", idDossierMedical, e.getMessage());
            return Optional.empty();
        }

        if (resultats == null || resultats.isEmpty()) {
            log.info("No lab results found for dossier {}", idDossierMedical);
            return Optional.empty();
        }

        // 2. Charger le besoin nutritionnel actif du patient
        Optional<BesoinNutritionnel> besoinOpt =
                besoinRepository.findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(patientId);
        if (besoinOpt.isEmpty()) {
            log.warn("No active BesoinNutritionnel for patient {}", patientId);
            return Optional.empty();
        }

        BesoinNutritionnel besoin = besoinOpt.get();
        StringBuilder raison = new StringBuilder(
                besoin.getRaisonCalcul() != null ? besoin.getRaisonCalcul() : "");

        // 3. Appliquer les règles métier selon les résultats
        for (ResultatLaboratoireDTO r : resultats) {
            String code = r.getCodeTest() != null ? r.getCodeTest().toUpperCase() : "";
            String nom  = r.getNomTest()  != null ? r.getNomTest().toUpperCase()  : "";
            String interp = r.getInterpretation() != null ? r.getInterpretation().toUpperCase() : "";

            boolean isCreatinine = code.contains("CREAT") || nom.contains("CRÉATININE") || nom.contains("CREATININE");
            boolean isPotassium  = code.contains("K")     || nom.contains("POTASSIUM");
            boolean isPhosphore  = code.contains("PHOS")  || nom.contains("PHOSPHORE");

            // Créatinine élevée → réduire protéines
            if (isCreatinine && (interp.contains("ELEVE") || interp.contains("CRITIQUE"))) {
                double ancien = besoin.getProteinesMaxG();
                besoin.setProteinesMaxG(Math.max(20.0, ancien * 0.80));
                raison.append(String.format(
                        " [Créatinine %s (%.1f %s) → protéines réduites de 20%%]",
                        interp, r.getValeurNumerique() != null ? r.getValeurNumerique() : 0.0,
                        r.getUnite() != null ? r.getUnite() : ""));
            }

            // Potassium élevé → réduire potassium max
            if (isPotassium && (interp.contains("ELEVE") || interp.contains("CRITIQUE_HAUT"))) {
                besoin.setPotassiumMaxMg(Math.max(500, besoin.getPotassiumMaxMg() - 200));
                raison.append(String.format(
                        " [Potassium élevé (%.1f %s) → potassium max réduit de 200 mg]",
                        r.getValeurNumerique() != null ? r.getValeurNumerique() : 0.0,
                        r.getUnite() != null ? r.getUnite() : ""));
            }

            // Potassium bas → augmenter potassium max
            if (isPotassium && interp.contains("BAS")) {
                besoin.setPotassiumMaxMg(besoin.getPotassiumMaxMg() + 200);
                raison.append(String.format(
                        " [Potassium bas (%.1f %s) → potassium max augmenté de 200 mg]",
                        r.getValeurNumerique() != null ? r.getValeurNumerique() : 0.0,
                        r.getUnite() != null ? r.getUnite() : ""));
            }

            // Phosphore élevé → réduire phosphore max
            if (isPhosphore && (interp.contains("ELEVE") || interp.contains("CRITIQUE"))) {
                besoin.setPhosphoreMaxMg(Math.max(300, besoin.getPhosphoreMaxMg() - 100));
                raison.append(String.format(
                        " [Phosphore élevé (%.1f %s) → phosphore max réduit de 100 mg]",
                        r.getValeurNumerique() != null ? r.getValeurNumerique() : 0.0,
                        r.getUnite() != null ? r.getUnite() : ""));
            }
        }

        besoin.setRaisonCalcul(raison.toString());
        BesoinNutritionnel saved = besoinRepository.save(besoin);
        log.info("BesoinNutritionnel updated for patient {} from lab results of dossier {}", patientId, idDossierMedical);
        return Optional.of(saved);
    }

    /**
     * Retourne les résultats de labo bruts d'un dossier (utile pour affichage côté nutrition).
     */
    public List<ResultatLaboratoireDTO> getLabResultsForDossier(Long idDossierMedical) {
        try {
            return nephroLabClient.getResultatsByDossier(idDossierMedical);
        } catch (Exception e) {
            log.error("Cannot fetch lab results for dossier {}: {}", idDossierMedical, e.getMessage());
            return List.of();
        }
    }
}
