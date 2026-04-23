package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.DietRecommendationDTO;
import com.example.Nutrition_Service.entity.*;
import com.example.Nutrition_Service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DietCalculatorService {

    private final DossierMedicalRepository dossierRepo;
    private final ResultatLaboratoireRepository labRepo;
    private final PrescriptionRepository prescriptionRepo;
    private final PatientRepository patientRepo;
    private final PatientWeightRepository weightRepo;

    @Transactional(readOnly = true)
    public DietRecommendationDTO calculate(Long patientId) {

        DossierMedical dossier = dossierRepo.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));

        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        int ageAns = Period.between(patient.getDateNaissance(), LocalDate.now()).getYears();

        PatientWeight pw = weightRepo.findDernierPoidsByPatientId(patientId).orElse(null);
        double poids  = pw != null ? pw.getWeightKg() : 0;
        double taille = pw != null && pw.getHeightCm() != null ? pw.getHeightCm() : 0;

        int kcalParKg = ageAns < 3 ? 80 : ageAns < 6 ? 70 : ageAns < 12 ? 60 : 50;
        int calories  = (int)(poids * kcalParKg);

        int    kMax    = (int)(poids * 40);
        int    naMax   = (int)(poids * 30);
        int    pMax    = (int)(poids * 20);
        double protMax = poids * 1.5;
        int    sucreMax = (int)(calories * 0.10 / 4);

        List<Medication> meds = prescriptionRepo.findMedicamentsActifs(patientId);

        boolean corticoide = meds.stream().anyMatch(m ->
                m.getCategory() != null &&
                m.getCategory().toLowerCase().contains("cortico"));

        boolean immunosuppresseur = meds.stream().anyMatch(m ->
                Boolean.TRUE.equals(m.getIsImmunosuppressor()));

        if (corticoide)        sucreMax = (int)(calories * 0.05 / 4);
        if (immunosuppresseur) naMax = Math.min(naMax, 1500);

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

                if (k  != null && k  > 5.0) kMax = Math.min(kMax, 1500);
                if (k  != null && k  < 3.5) kMax = kMax + 500;
                if (na != null && na > 145)  naMax = Math.min(naMax, 1200);
                if (p  != null && p  > 4.5)  pMax = Math.min(pMax, 600);
                if (dfg != null) {
                    if (dfg < 15)      protMax = poids * 0.60;
                    else if (dfg < 30) protMax = poids * 0.70;
                    else if (dfg < 60) protMax = poids * 0.75;
                }
                if (alb != null && alb < 3.5) protMax = protMax * 1.2;
            }
        }

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
        dto.setPoids(poids > 0 ? poids : null);
        dto.setTaille(taille > 0 ? taille : null);
        dto.setPotassium(rawK);
        dto.setSodium(rawNa);
        dto.setPhosphore(rawP);
        dto.setDfg(rawDfg);
        dto.setCreatinine(rawCreat);
        dto.setAlbumine(rawAlb);
        dto.setGlychemie(rawGly);

        return dto;
    }

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
