package com.example.nutrition_service.service;

import com.example.nutrition_service.dto.DietRecommendationDTO;
import com.example.nutrition_service.entity.*;
import com.example.nutrition_service.repository.*;
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
                .orElseThrow(() -> new DietCalculationException("Dossier non trouvé"));

        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new DietCalculationException("Patient non trouvé"));

        int ageAns = calculerAge(patient);
        PatientMeasurements mesures = getDernieresMesures(patientId);
        NutritionTargets objectifs = creerObjectifsDeBase(mesures.poids, ageAns);
        List<Medication> meds = prescriptionRepo.findMedicamentsActifs(patientId);

        appliquerContraintesMedicaments(objectifs, meds);
        LabSnapshot bilan = analyserDernierBilan(dossier.getId(), objectifs, mesures.poids);

        DietRecommendationDTO dto = new DietRecommendationDTO();
        dto.setPatientId(patientId);
        dto.setDateBilan(bilan.dateBilan);
        dto.setCalories(objectifs.calories);
        dto.setPotassiumMax(objectifs.potassiumMax);
        dto.setSodiumMax(objectifs.sodiumMax);
        dto.setPhosphoreMax(objectifs.phosphoreMax);
        dto.setProteinesMax(Math.round(objectifs.proteinesMax * 10.0) / 10.0);
        dto.setSucreMax(objectifs.sucreMax);
        dto.setMedicamentsActifs(meds.stream().map(Medication::getName).toList());
        dto.setNotes("Calculé automatiquement — Poids: " + mesures.poids + "kg, Âge: " + ageAns + " ans");
        dto.setPoids(mesures.poids > 0 ? mesures.poids : null);
        dto.setTaille(mesures.taille > 0 ? mesures.taille : null);
        dto.setPotassium(bilan.potassium);
        dto.setSodium(bilan.sodium);
        dto.setPhosphore(bilan.phosphore);
        dto.setDfg(bilan.dfg);
        dto.setCreatinine(bilan.creatinine);
        dto.setAlbumine(bilan.albumine);
        dto.setGlychemie(bilan.glycemie);

        return dto;
    }

    private int calculerAge(Patient patient) {
        return Period.between(patient.getDateNaissance(), LocalDate.now()).getYears();
    }

    private PatientMeasurements getDernieresMesures(Long patientId) {
        PatientWeight poids = weightRepo.findDernierPoidsByPatientId(patientId).orElse(null);
        if (poids == null) {
            return new PatientMeasurements(0, 0);
        }
        double poidsKg = poids.getWeightKg() != null ? poids.getWeightKg() : 0;
        double tailleCm = poids.getHeightCm() != null ? poids.getHeightCm() : 0;
        return new PatientMeasurements(poidsKg, tailleCm);
    }

    private NutritionTargets creerObjectifsDeBase(double poids, int ageAns) {
        int calories = (int) (poids * caloriesParKg(ageAns));
        return new NutritionTargets(
                calories,
                (int) (poids * 40),
                (int) (poids * 30),
                (int) (poids * 20),
                poids * 1.5,
                (int) (calories * 0.10 / 4)
        );
    }

    private int caloriesParKg(int ageAns) {
        if (ageAns < 3) {
            return 80;
        }
        if (ageAns < 6) {
            return 70;
        }
        if (ageAns < 12) {
            return 60;
        }
        return 50;
    }

    private void appliquerContraintesMedicaments(NutritionTargets objectifs, List<Medication> meds) {
        if (contientCorticoide(meds)) {
            objectifs.sucreMax = (int) (objectifs.calories * 0.05 / 4);
        }
        if (contientImmunosuppresseur(meds)) {
            objectifs.sodiumMax = Math.min(objectifs.sodiumMax, 1500);
        }
    }

    private boolean contientCorticoide(List<Medication> meds) {
        return meds.stream().anyMatch(m ->
                m.getCategory() != null &&
                        m.getCategory().toLowerCase().contains("cortico"));
    }

    private boolean contientImmunosuppresseur(List<Medication> meds) {
        return meds.stream().anyMatch(m -> Boolean.TRUE.equals(m.getIsImmunosuppressor()));
    }

    private LabSnapshot analyserDernierBilan(Long dossierId, NutritionTargets objectifs, double poids) {
        List<ResultatLaboratoire> bilans = labRepo.findDernierBilanByDossierId(dossierId);
        LabSnapshot snapshot = new LabSnapshot();
        if (bilans.isEmpty()) {
            return snapshot;
        }

        snapshot.dateBilan = bilans.get(0).getDateResultat();
        for (ResultatLaboratoire resultat : bilans) {
            appliquerResultatBilan(resultat, snapshot, objectifs, poids);
        }
        return snapshot;
    }

    private void appliquerResultatBilan(
            ResultatLaboratoire resultat,
            LabSnapshot snapshot,
            NutritionTargets objectifs,
            double poids) {

        String valeur = resultat.getValeurResultat();
        if (valeur == null) {
            return;
        }

        LabValues values = extraireValeursBilan(valeur);
        snapshot.update(values);
        appliquerContraintesBilan(objectifs, values, poids);
    }

    private LabValues extraireValeursBilan(String valeur) {
        LabValues values = new LabValues();
        values.potassium = extraire(valeur, "Kaliemie");
        values.sodium = extraire(valeur, "Natremie");
        values.phosphore = extraire(valeur, "Phosphoremie");
        values.dfg = extraire(valeur, "DFG");
        values.albumine = extraire(valeur, "Albumine");
        values.glycemie = extraire(valeur, "Glycemie");
        values.creatinine = extraire(valeur, "Creatinine");
        return values;
    }

    private void appliquerContraintesBilan(NutritionTargets objectifs, LabValues values, double poids) {
        ajusterPotassium(objectifs, values.potassium);
        ajusterSodium(objectifs, values.sodium);
        ajusterPhosphore(objectifs, values.phosphore);
        ajusterProteinesSelonDfg(objectifs, values.dfg, poids);
        ajusterProteinesSelonAlbumine(objectifs, values.albumine);
    }

    private void ajusterPotassium(NutritionTargets objectifs, Double potassium) {
        if (potassium == null) {
            return;
        }
        if (potassium > 5.0) {
            objectifs.potassiumMax = Math.min(objectifs.potassiumMax, 1500);
        }
        if (potassium < 3.5) {
            objectifs.potassiumMax += 500;
        }
    }

    private void ajusterSodium(NutritionTargets objectifs, Double sodium) {
        if (sodium != null && sodium > 145) {
            objectifs.sodiumMax = Math.min(objectifs.sodiumMax, 1200);
        }
    }

    private void ajusterPhosphore(NutritionTargets objectifs, Double phosphore) {
        if (phosphore != null && phosphore > 4.5) {
            objectifs.phosphoreMax = Math.min(objectifs.phosphoreMax, 600);
        }
    }

    private void ajusterProteinesSelonDfg(NutritionTargets objectifs, Double dfg, double poids) {
        if (dfg == null) {
            return;
        }
        if (dfg < 15) {
            objectifs.proteinesMax = poids * 0.60;
            return;
        }
        if (dfg < 30) {
            objectifs.proteinesMax = poids * 0.70;
            return;
        }
        if (dfg < 60) {
            objectifs.proteinesMax = poids * 0.75;
        }
    }

    private void ajusterProteinesSelonAlbumine(NutritionTargets objectifs, Double albumine) {
        if (albumine != null && albumine < 3.5) {
            objectifs.proteinesMax *= 1.2;
        }
    }

    private Double extraire(String texte, String cle) {
        String marqueur = cle + "=";
        int debut = texte.indexOf(marqueur);
        if (debut < 0) {
            return null;
        }

        String apres = texte.substring(debut + marqueur.length());
        String valStr = apres.split(" ")[0].replace(",", ".");
        try {
            return Double.parseDouble(valStr);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static final class PatientMeasurements {
        private final double poids;
        private final double taille;

        private PatientMeasurements(double poids, double taille) {
            this.poids = poids;
            this.taille = taille;
        }
    }

    private static final class NutritionTargets {
        private final int calories;
        private int potassiumMax;
        private int sodiumMax;
        private int phosphoreMax;
        private double proteinesMax;
        private int sucreMax;

        private NutritionTargets(
                int calories,
                int potassiumMax,
                int sodiumMax,
                int phosphoreMax,
                double proteinesMax,
                int sucreMax) {
            this.calories = calories;
            this.potassiumMax = potassiumMax;
            this.sodiumMax = sodiumMax;
            this.phosphoreMax = phosphoreMax;
            this.proteinesMax = proteinesMax;
            this.sucreMax = sucreMax;
        }
    }

    private static final class LabValues {
        private Double potassium;
        private Double sodium;
        private Double phosphore;
        private Double dfg;
        private Double albumine;
        private Double glycemie;
        private Double creatinine;
    }

    private static final class LabSnapshot {
        private LocalDate dateBilan;
        private Double potassium;
        private Double sodium;
        private Double phosphore;
        private Double dfg;
        private Double albumine;
        private Double glycemie;
        private Double creatinine;

        private void update(LabValues values) {
            if (values.potassium != null) {
                potassium = values.potassium;
            }
            if (values.sodium != null) {
                sodium = values.sodium;
            }
            if (values.phosphore != null) {
                phosphore = values.phosphore;
            }
            if (values.dfg != null) {
                dfg = values.dfg;
            }
            if (values.albumine != null) {
                albumine = values.albumine;
            }
            if (values.glycemie != null) {
                glycemie = values.glycemie;
            }
            if (values.creatinine != null) {
                creatinine = values.creatinine;
            }
        }
    }

    private static final class DietCalculationException extends RuntimeException {
        private DietCalculationException(String message) {
            super(message);
        }
    }
}
