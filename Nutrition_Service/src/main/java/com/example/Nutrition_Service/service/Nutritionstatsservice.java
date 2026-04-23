
import com.example.Nutrition_Service.dto.NutritionStatsDTO.*;
import com.example.Nutrition_Service.entity.*;
import com.example.Nutrition_Service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class Nutritionstatsservice {

    private final Nutritionstatsrepository     statsRepository;
    private final AlimentRepository            alimentRepository;
    private final AlerteNutritionRepository    alerteRepository;
    private final BesoinNutritionnelRepository besoinRepository;

    // ══════════════════════════════════════════════════════════════════════
    // F9 — TABLEAU DE BORD
    // ══════════════════════════════════════════════════════════════════════

    public DashboardStatsDTO getDashboardStats() {
        Long   patientsAvec   = statsRepository.countPatientsWithActiveRegime();
        Long   patientsSans   = statsRepository.countPatientsWithoutActiveRegime();
        Long   alertesNonLues = statsRepository.countAllUnreadAlertes();
        Double moyCalories    = statsRepository.avgCaloriesAllPatients();
        Long   restrictions   = statsRepository.countActiveRestrictions();
        Long   restrictAuto   = statsRepository.countAutoRestrictions();

        return new DashboardStatsDTO(
                patientsAvec, patientsSans,
                alertesNonLues, moyCalories,
                restrictions, restrictAuto
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // F10 — RECHERCHE MULTICRITÈRES
    // ══════════════════════════════════════════════════════════════════════

    public List<BesoinNutritionnel> rechercheMulticriteres(
            Boolean tacrolimus, Boolean prednisone,
            Double potassiumMax, Integer caloriesMin,
            Boolean avecAlertes, Boolean avecRestrictions) {

        return statsRepository.rechercheMulticriteres(
                tacrolimus, prednisone,
                potassiumMax, caloriesMin,
                avecAlertes, avecRestrictions
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // F11 — DÉTECTION ANOMALIES
    // ══════════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void detecterAnomalies() {
        System.out.println("=== DÉTECTION ANOMALIES === " + LocalDateTime.now());
        getAnomaliesActuelles().forEach(a ->
                System.out.println("[" + a.getSeverite() + "] Patient "
                        + a.getPatientId() + " — " + a.getMessage())
        );
    }

    public List<AnomalieDTO> getAnomaliesActuelles() {
        List<AnomalieDTO> anomalies = new ArrayList<>();

        // Anomalie 1 — Régimes non mis à jour depuis 30 jours
        LocalDate limite30j = LocalDate.now().minusDays(30);
        statsRepository.findRegimesNonMisAJour(limite30j).forEach(b ->
                anomalies.add(new AnomalieDTO(
                        "REGIME_OBSOLETE",
                        b.getPatientId(),   // ✅ patientId depuis BesoinNutritionnel
                        "Régime nutritionnel non révisé depuis plus de 30 jours",
                        "WARNING"
                ))
        );

        // Anomalie 2 — Alertes ignorées depuis 48h
        // ✅ AlerteNutrition a bien patientId et un champ "message" ou "type"
        // On utilise le type de l'alerte car getMessage() n'existe pas
        LocalDateTime limite48h = LocalDateTime.now().minusHours(48);
        statsRepository.findAlertesIgnorees(limite48h).forEach(a ->
                anomalies.add(new AnomalieDTO(
                        "ALERTE_IGNOREE",
                        a.getPatientId(),   // ✅ patientId depuis AlerteNutrition
                        "Alerte non lue depuis 48h — Type : " + a.getType(),  // ✅ getType() au lieu de getMessage()
                        "CRITIQUE"
                ))
        );

        // Anomalie 3 — Patients sans régime mais avec restrictions
        statsRepository.findPatientsSansRegimeMaisAvecRestrictions().forEach(patientId ->
                anomalies.add(new AnomalieDTO(
                        "SANS_REGIME",
                        patientId,
                        "Patient a des restrictions actives mais aucun régime défini",
                        "WARNING"
                ))
        );

        return anomalies;
    }

    // ══════════════════════════════════════════════════════════════════════
    // F12 — RAPPORT STATS ALIMENTS
    // ══════════════════════════════════════════════════════════════════════

    public List<AlimentStatDTO> getRapportAliments() {
        return statsRepository.findTopAlimentsRestreints().stream()
                .map(row -> {
                    Long   alimentId      = ((Number) row[0]).longValue();
                    Long   nbRestrictions = ((Number) row[1]).longValue();
                    String raison         = (String)  row[2];

                    AlimentStatDTO dto = new AlimentStatDTO(alimentId, nbRestrictions, raison);
                    alimentRepository.findById(alimentId).ifPresent(a ->
                            dto.setAlimentNom(a.getNom())
                    );
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<Object[]> getRapportParRaison() {
        return statsRepository.countRestrictionsByRaison();
    }

    // ══════════════════════════════════════════════════════════════════════
    // F13 — SCORE DE RISQUE
    // ══════════════════════════════════════════════════════════════════════

    public List<RisquePatientDTO> getRiskScores() {
        return statsRepository.calculateRiskScores().stream()
                .map(row -> {
                    Long patientId = ((Number) row[0]).longValue();
                    Long score     = row[1] != null ? ((Number) row[1]).longValue() : 0L;

                    // ✅ countByPatientIdAndLue ajouté dans AlerteNutritionRepository
                    Long alertesNonLues = alerteRepository.countByPatientIdAndLue(patientId, false);
                    if (alertesNonLues > 0) score += 3;

                    return new RisquePatientDTO(patientId, score);
                })
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // F14 — ÉVOLUTION NUTRITIONNELLE
    // ══════════════════════════════════════════════════════════════════════

    public List<EvolutionPointDTO> getEvolutionPatient(Long patientId) {
        List<BesoinNutritionnel> historique = statsRepository.findHistoriquePatient(patientId);
        List<EvolutionPointDTO>  result     = new ArrayList<>();

        for (int i = 0; i < historique.size(); i++) {
            BesoinNutritionnel current = historique.get(i);
            EvolutionPointDTO  point   = new EvolutionPointDTO();

            point.setDateDebut(current.getDateDebut().toString());
            point.setCaloriesJour(current.getCaloriesJour());
            // ✅ potassiumMaxMg est Double dans l'entité → pas de conversion nécessaire
            point.setPotassiumMaxMg(Double.valueOf(current.getPotassiumMaxMg()));
            point.setPoidsKg(current.getPoidsKg());
            point.setProteinesMaxG( current.getProteinesMaxG());

            if (i > 0) {
                BesoinNutritionnel previous = historique.get(i - 1);
                point.setDeltaCalories(
                        current.getCaloriesJour() - previous.getCaloriesJour()
                );
                // ✅ cast explicite en Double pour éviter l'erreur int→Double
                if (current.getPotassiumMaxMg() != null && previous.getPotassiumMaxMg() != null) {
                    double delta = current.getPotassiumMaxMg() - previous.getPotassiumMaxMg();
                    point.setDeltaPotassium(delta);
                }
            }
            result.add(point);
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // F15 — SUGGESTIONS ALIMENTS AUTORISÉS
    // ══════════════════════════════════════════════════════════════════════

    // ✅ Retourne List<Aliment> depuis com.example.Nutrition_Service.entity.Aliment
    public List<Aliment> getSuggestionsAliments(
            Long patientId, boolean hasTacrolimus, boolean hasCyclosporine,
            Integer ageMois, Double potassiumMax, Double sodiumMax,
            Double phosphoreMax, Double sucreMax) {

        return statsRepository.findAlimentsAutorisesForPatient(
                patientId, hasTacrolimus, hasCyclosporine,
                ageMois, potassiumMax, sodiumMax, phosphoreMax, sucreMax
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // F16 — RAPPORT CONFORMITÉ
    // ══════════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 8 * * MON")
    public void genererRapportHebdomadaire() {
        System.out.println("=== RAPPORT CONFORMITÉ HEBDOMADAIRE === " + LocalDateTime.now());
        LocalDateTime debut = LocalDateTime.now().minusDays(7);
        LocalDateTime fin   = LocalDateTime.now();
        getRapportConformite(debut, fin).forEach(dto ->
                System.out.println("Patient " + dto.getPatientId()
                        + " — Taux: " + dto.getTauxConformite() + "%"
                        + " | Ignorées: " + dto.getAlertesIgnorees())
        );
    }

    public List<ConformitePatientDTO> getRapportConformite(LocalDateTime debut, LocalDateTime fin) {
        return statsRepository.getRapportConformite(debut, fin).stream()
                .map(row -> new ConformitePatientDTO(
                        ((Number) row[0]).longValue(),
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).longValue(),
                        row[4] != null ? (LocalDateTime) row[4] : null,
                        row[5] != null ? (LocalDateTime) row[5] : null
                ))
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // F17 — CORRÉLATION ALIMENT-ALERTE
    // ══════════════════════════════════════════════════════════════════════

    public List<CorrelationDTO> getCorrelationAlimentAlerte(Long patientId) {
        return statsRepository.findCorrelationAlimentAlerte(patientId).stream()
                .map(row -> {
                    Long          alimentId = ((Number) row[0]).longValue();
                    Long          nb        = ((Number) row[1]).longValue();
                    LocalDateTime derniere  = row[2] != null ? (LocalDateTime) row[2] : null;
                    String        type      = (String) row[3];

                    CorrelationDTO dto = new CorrelationDTO(alimentId, nb, derniere, type);
                    alimentRepository.findById(alimentId).ifPresent(a ->
                            dto.setAlimentNom(a.getNom())
                    );
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
