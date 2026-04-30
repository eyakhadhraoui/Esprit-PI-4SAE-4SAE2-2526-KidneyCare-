package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.DietRecommendationDTO;
import com.example.Nutrition_Service.entity.*;
import com.example.Nutrition_Service.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Optional;

@Service
public class DietCalculatorService {

    @Autowired
    DossierMedicalRepository dossierRepo;
    @Autowired
    ResultatLaboratoireRepository labRepo;
    @Autowired
    PrescriptionRepository prescriptionRepo;
    @Autowired
    PatientRepository patientRepo;
@Autowired
PatientWeightRepository weightRepo;

    public Optional<DietRecommendationDTO> calculate(Long patientId) {

        // 1. Dossier médical
        DossierMedical dossier = dossierRepo.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));

        // 2. Patient → date naissance → âge
        Patient patient = patientRepo.findById(patientId).orElseThrow();
        int ageAns = Period.between(patient.getDateNaissance(), LocalDate.now()).getYears();

        // 3. Poids
        PatientWeight pw = weightRepo.findDernierPoidsByPatientId(patientId).orElse(null);
        double poids  = pw != null ? pw.getWeightKg() : 0;
        double taille = pw != null && pw.getHeightCm() != null ? pw.getHeightCm() : 0;
        // 4. Calories selon âge
        int kcalParKg = ageAns < 3 ? 80 : ageAns < 6 ? 70 : ageAns < 12 ? 60 : 50;
        int calories = (int)(poids * kcalParKg);

        // 5. Limites de base
        int    kMax    = (int)(poids * 40);
        int    naMax   = (int)(poids * 30);
        int    pMax    = (int)(poids * 20);
        double protMax = poids * 1.5;
        int    sucreMax = (int)(calories * 0.10 / 4);

        // 6. Médicaments actifs → catégorie
        List<Medication> meds = prescriptionRepo.findMedicamentsActifs(patientId);
        boolean corticoide = meds.stream().anyMatch(m ->
                m.getCategory() != null &&
                        m.getCategory().toLowerCase().contains("cortico"));
        boolean immunosuppresseur = meds.stream().anyMatch(m ->
                Boolean.TRUE.equals(m.getIsImmunosuppressor()));

        if (corticoide)        sucreMax = (int)(calories * 0.05 / 4);
        if (immunosuppresseur) naMax = Math.min(naMax, 1500);

        // 7. Dernier bilan labo
        List<ResultatLaboratoire> bilans =
                labRepo.findDernierBilanByDossierId(dossier.getId());

        LocalDate dateBilan = null;
        Double rawK = null, rawNa = null, rawP = null, rawDfg = null;
        Double rawAlb = null, rawGly = null, rawCreat = null;

        if (!bilans.isEmpty()) {
            dateBilan = bilans.get(0).getDateResultat();

            for (ResultatLaboratoire rl : bilans) {
                String val = rl.getValeurResultat();
                if (val == null) continue;

                Double k   = extraire(val, "Kaliemie");
                Double na  = extraire(val, "Natremie");
                Double p   = extraire(val, "Phosphoremie");
                Double dfg = extraire(val, "DFG");
                Double alb = extraire(val, "Albumine");
                Double gly = extraire(val, "Glycemie");
                Double cr  = extraire(val, "Creatinine");

                if (k   != null) rawK    = k;
                if (na  != null) rawNa   = na;
                if (p   != null) rawP    = p;
                if (dfg != null) rawDfg  = dfg;
                if (alb != null) rawAlb  = alb;
                if (gly != null) rawGly  = gly;
                if (cr  != null) rawCreat = cr;

                // Ajustements selon labo
                if (k  != null && k  > 5.0) kMax = Math.min(kMax, 1500);
                if (k  != null && k  < 3.5) kMax = kMax + 500;
                if (na != null && na > 145)  naMax = Math.min(naMax, 1200);
                if (p  != null && p  > 4.5)  pMax = Math.min(pMax, 600);
                if (dfg != null) {
                    if (dfg < 15) protMax = poids * 0.60;
                    else if (dfg < 30) protMax = poids * 0.70;
                    else if (dfg < 60) protMax = poids * 0.75;
                }
                if (alb != null && alb < 3.5) protMax = protMax * 1.2;
            }
        }

        // 8. Construire DTO
        DietRecommendationDTO dto = new DietRecommendationDTO();
        dto.setPatientId(patientId);
        dto.setDateBilan(dateBilan);
        dto.setCalories(calories);
        dto.setPotassiumMax(kMax);
        dto.setSodiumMax(naMax);
        dto.setPhosphoreMax(pMax);
        dto.setProteinesMax(Math.round(protMax * 10.0) / 10.0);
        dto.setSucreMax(sucreMax);
        dto.setMedicamentsActifs(meds.stream().map(Medication::getName).toList());
        dto.setNotes("Calculé automatiquement — Poids: " + poids + "kg, Âge: " + ageAns + " ans");
        // Valeurs brutes du bilan
        dto.setPoids(poids > 0 ? poids : null);
        dto.setTaille(taille > 0 ? taille : null);
        dto.setPotassium(rawK);
        dto.setSodium(rawNa);
        dto.setPhosphore(rawP);
        dto.setDfg(rawDfg);
        dto.setCreatinine(rawCreat);
        dto.setAlbumine(rawAlb);
        dto.setGlychemie(rawGly);
        return Optional.of(dto);
    }

    // Extrait la valeur numérique depuis "Kaliemie=5.4 mmol/L"
    private Double extraire(String texte, String cle) {
        try {
            if (!texte.contains(cle + "=")) return null;
            String apres = texte.split(cle + "=")[1];
            String valStr = apres.split(" ")[0].replace(",", ".");
            return Double.parseDouble(valStr);
        } catch (Exception e) {
            return null;
        }
    }
}