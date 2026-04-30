package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.*;
import com.example.Nutrition_Service.entity.*;
import com.example.Nutrition_Service.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MenuGeneratorService {

    @Autowired AlimentRepository alimentRepo;
    @Autowired BesoinNutritionnelRepository besoinRepo;
    @Autowired PrescriptionRepository prescriptionRepo;

    private static final String[] JOURS = {
            "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"
    };

    public Map<String, List<MenuJournalierDTO>> genererMenusSemaine(Long patientId) {

        BesoinNutritionnel besoin = besoinRepo
                .findActiveBesoinForPatient(patientId)
                .orElseThrow(() -> new RuntimeException("Aucun régime actif"));

        boolean hasTacrolimus = prescriptionRepo
                .findMedicamentsActifs(patientId).stream()
                .anyMatch(m -> m.getName() != null &&
                        m.getName().toLowerCase().contains("tacrolimus"));

        List<Aliment> disponibles = alimentRepo.findAlimentsDisponibles(
                patientId,
                besoin.getPotassiumMaxMg(),
                besoin.getSodiumMaxMg(),
                besoin.getPhosphoreMaxMg(),
                besoin.getProteinesMaxG(),
                besoin.getSucreMaxG(),
                besoin.getAgeMois() != null ? besoin.getAgeMois() : 0,
                hasTacrolimus
        );

        if (disponibles.isEmpty())
            throw new RuntimeException("Aucun aliment disponible après restrictions");

        Map<String, List<Aliment>> parCategorie = disponibles.stream()
                .collect(Collectors.groupingBy(Aliment::getCategorie));

        Map<String, List<MenuJournalierDTO>> semaine = new LinkedHashMap<>();
        Set<Long> alimentsRecents = new HashSet<>();

        for (String jour : JOURS) {
            Map<String, List<Aliment>> parCategorieJour = new HashMap<>();
            parCategorie.forEach((cat, liste) -> {
                List<Aliment> copie = new ArrayList<>(liste);
                copie.removeIf(a -> alimentsRecents.contains(a.getId()));
                if (copie.size() < 2) copie = new ArrayList<>(liste);
                Collections.shuffle(copie, new Random());
                parCategorieJour.put(cat, copie);
            });

            List<MenuJournalierDTO> menusJour = new ArrayList<>();
            for (int i = 1; i <= 3; i++) {
                menusJour.add(genererMenu(i, jour, besoin, parCategorieJour));
            }

            menusJour.get(0).getRepas().forEach(r ->
                    r.getAliments().forEach(a ->
                            alimentsRecents.add(a.getAlimentId())
                    )
            );
            if (alimentsRecents.size() > 12) alimentsRecents.clear();

            semaine.put(jour, menusJour);
        }
        return semaine;
    }

    private MenuJournalierDTO genererMenu(int numero, String jour,
                                          BesoinNutritionnel besoin,
                                          Map<String, List<Aliment>> parCategorie) {

        MenuJournalierDTO menu = new MenuJournalierDTO();
        menu.setNumero(numero);
        menu.setJour(jour);

        double calMatin = besoin.getCaloriesJour() * 0.25;
        double calMidi  = besoin.getCaloriesJour() * 0.40;
        double calSoir  = besoin.getCaloriesJour() * 0.35;

        List<RepasDTO> repas = new ArrayList<>();
        repas.add(composerRepas("PETIT_DEJEUNER", numero,
                List.of("FRUIT","CEREALE","PRODUIT_LAITIER"),
                parCategorie, calMatin, besoin, 0.25));
        repas.add(composerRepas("DEJEUNER", numero,
                List.of("VIANDE","LEGUME","CEREALE"),
                parCategorie, calMidi, besoin, 0.40));
        repas.add(composerRepas("DINER", numero,
                List.of("VIANDE","LEGUME","FRUIT"),
                parCategorie, calSoir, besoin, 0.35));

        menu.setRepas(repas);

        double totCal  = repas.stream().mapToDouble(RepasDTO::getTotalCalories).sum();
        double totK    = repas.stream().flatMap(r -> r.getAliments().stream()).mapToDouble(AlimentPortionDTO::getPotassium).sum();
        double totNa   = repas.stream().flatMap(r -> r.getAliments().stream()).mapToDouble(AlimentPortionDTO::getSodium).sum();
        double totP    = repas.stream().flatMap(r -> r.getAliments().stream()).mapToDouble(AlimentPortionDTO::getPhosphore).sum();
        double totProt = repas.stream().flatMap(r -> r.getAliments().stream()).mapToDouble(AlimentPortionDTO::getProteines).sum();
        double totSuc  = repas.stream().flatMap(r -> r.getAliments().stream()).mapToDouble(AlimentPortionDTO::getSucre).sum();

        menu.setTotalCalories(round(totCal));
        menu.setTotalPotassium(round(totK));
        menu.setTotalSodium(round(totNa));
        menu.setTotalPhosphore(round(totP));
        menu.setTotalProteines(round(totProt));
        menu.setTotalSucre(round(totSuc));

        menu.setPctCalories(Math.round(totCal  / besoin.getCaloriesJour()   * 100));
        menu.setPctPotassium(Math.round(totK   / besoin.getPotassiumMaxMg() * 100));
        menu.setPctSodium(Math.round(totNa     / besoin.getSodiumMaxMg()    * 100));
        menu.setPctPhosphore(Math.round(totP   / besoin.getPhosphoreMaxMg() * 100));
        menu.setPctProteines(Math.round(totProt/ besoin.getProteinesMaxG()  * 100));
        menu.setPctSucre(Math.round(totSuc     / besoin.getSucreMaxG()      * 100));

        return menu;
    }

    // ✅ UNE SEULE méthode composerRepas — version corrigée avec portions en grammes
    private RepasDTO composerRepas(String type, int numeroMenu,
                                   List<String> categories,
                                   Map<String, List<Aliment>> parCategorie,
                                   double calMax, BesoinNutritionnel besoin,
                                   double facteur) {

        RepasDTO repas = new RepasDTO();
        repas.setType(type);
        List<AlimentPortionDTO> portions = new ArrayList<>();

        for (String cat : categories) {
            List<Aliment> liste = parCategorie.getOrDefault(cat, List.of());
            if (liste.isEmpty()) continue;

            int index = Math.min(numeroMenu - 1, liste.size() - 1);
            Aliment a = liste.get(index);

            // ✅ Calories allouées par aliment dans ce repas
            double calParAliment = calMax / categories.size();
            double portionG;

            if (a.getCaloriesKcal() != null && a.getCaloriesKcal() > 0) {
                // (calories cibles / calories/100g) × 100 = grammes nécessaires
                portionG = (calParAliment / a.getCaloriesKcal()) * 100.0;
                portionG = Math.max(30, Math.min(300, portionG)); // bornes réalistes
            } else {
                portionG = 100.0; // fallback
            }

            // Arrondir au multiple de 5g le plus proche → ex: 147g → 145g
            portionG = Math.round(portionG / 5.0) * 5.0;

            double f = portionG / 100.0;

            AlimentPortionDTO ap = new AlimentPortionDTO();
            ap.setAlimentId(a.getId());
            ap.setNom(a.getNom());
            ap.setCategorie(a.getCategorie());
            ap.setPortionG(portionG);                                                          // ex: 150.0
            ap.setCalories(round(a.getCaloriesKcal() != null ? a.getCaloriesKcal() * f : 0)); // ex: 247.5
            ap.setPotassium(round(a.getPotassiumMg() != null ? a.getPotassiumMg()  * f : 0));
            ap.setSodium(round(a.getSodiumMg()       != null ? a.getSodiumMg()     * f : 0));
            ap.setPhosphore(round(a.getPhosphoreMg() != null ? a.getPhosphoreMg()  * f : 0));
            ap.setProteines(round(a.getProteinesG()  != null ? a.getProteinesG()   * f : 0));
            ap.setSucre(round(a.getSucreG()          != null ? a.getSucreG()       * f : 0));

            portions.add(ap);
        }

        repas.setAliments(portions);
        repas.setTotalCalories(round(portions.stream().mapToDouble(AlimentPortionDTO::getCalories).sum()));
        repas.setTotalPotassium(round(portions.stream().mapToDouble(AlimentPortionDTO::getPotassium).sum()));
        repas.setTotalSodium(round(portions.stream().mapToDouble(AlimentPortionDTO::getSodium).sum()));
        repas.setTotalPhosphore(round(portions.stream().mapToDouble(AlimentPortionDTO::getPhosphore).sum()));
        repas.setTotalProteines(round(portions.stream().mapToDouble(AlimentPortionDTO::getProteines).sum()));
        repas.setTotalSucre(round(portions.stream().mapToDouble(AlimentPortionDTO::getSucre).sum()));
        return repas;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}