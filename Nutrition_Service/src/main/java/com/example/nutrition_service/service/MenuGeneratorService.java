package com.example.nutrition_service.service;

import com.example.nutrition_service.dto.*;
import com.example.nutrition_service.entity.*;
import com.example.nutrition_service.repository.*;
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
                .orElseThrow(() -> new MenuGenerationException("Aucun régime actif"));

        boolean hasTacrolimus = prescriptionRepo
                .findMedicamentsActifs(patientId).stream()
                .anyMatch(m -> m.getName() != null &&
                        m.getName().toLowerCase().contains("tacrolimus"));

        List<Aliment> disponibles = alimentRepo.findAlimentsDisponibles(
                new AlimentRepository.AlimentsDisponiblesCriteria(
                patientId,
                besoin.getPotassiumMaxMg(),
                besoin.getSodiumMaxMg(),
                besoin.getPhosphoreMaxMg(),
                besoin.getProteinesMaxG(),
                besoin.getSucreMaxG(),
                besoin.getAgeMois() != null ? besoin.getAgeMois() : 0,
                hasTacrolimus
                )
        );

        if (disponibles.isEmpty()) {
            throw new MenuGenerationException("Aucun aliment disponible après restrictions");
        }

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
                parCategorie, calMatin));
        repas.add(composerRepas("DEJEUNER", numero,
                List.of("VIANDE","LEGUME","CEREALE"),
                parCategorie, calMidi));
        repas.add(composerRepas("DINER", numero,
                List.of("VIANDE","LEGUME","FRUIT"),
                parCategorie, calSoir));

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

    private RepasDTO composerRepas(String type, int numeroMenu,
                                   List<String> categories,
                                   Map<String, List<Aliment>> parCategorie,
                                   double calMax) {

        RepasDTO repas = new RepasDTO();
        repas.setType(type);
        List<AlimentPortionDTO> portions = new ArrayList<>();

        for (String cat : categories) {
            AlimentPortionDTO portion = creerPortion(cat, numeroMenu, categories.size(), parCategorie, calMax);
            if (portion != null) {
                portions.add(portion);
            }
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

    private AlimentPortionDTO creerPortion(
            String categorie,
            int numeroMenu,
            int nombreCategories,
            Map<String, List<Aliment>> parCategorie,
            double calMax) {

        List<Aliment> aliments = parCategorie.getOrDefault(categorie, List.of());
        if (aliments.isEmpty()) {
            return null;
        }

        Aliment aliment = selectionnerAliment(aliments, numeroMenu);
        double caloriesParAliment = calMax / nombreCategories;
        double portionG = calculerPortion(aliment, caloriesParAliment);
        return toPortion(aliment, portionG);
    }

    private Aliment selectionnerAliment(List<Aliment> aliments, int numeroMenu) {
        int index = Math.min(numeroMenu - 1, aliments.size() - 1);
        return aliments.get(index);
    }

    private double calculerPortion(Aliment aliment, double caloriesParAliment) {
        if (aliment.getCaloriesKcal() == null || aliment.getCaloriesKcal() <= 0) {
            return 100.0;
        }

        double portionG = (caloriesParAliment / aliment.getCaloriesKcal()) * 100.0;
        double portionBornee = Math.max(30, Math.min(300, portionG));
        return Math.round(portionBornee / 5.0) * 5.0;
    }

    private AlimentPortionDTO toPortion(Aliment aliment, double portionG) {
        double facteur = portionG / 100.0;
        AlimentPortionDTO portion = new AlimentPortionDTO();
        portion.setAlimentId(aliment.getId());
        portion.setNom(aliment.getNom());
        portion.setCategorie(aliment.getCategorie());
        portion.setPortionG(portionG);
        portion.setCalories(round(valeurPourPortion(aliment.getCaloriesKcal(), facteur)));
        portion.setPotassium(round(valeurPourPortion(aliment.getPotassiumMg(), facteur)));
        portion.setSodium(round(valeurPourPortion(aliment.getSodiumMg(), facteur)));
        portion.setPhosphore(round(valeurPourPortion(aliment.getPhosphoreMg(), facteur)));
        portion.setProteines(round(valeurPourPortion(aliment.getProteinesG(), facteur)));
        portion.setSucre(round(valeurPourPortion(aliment.getSucreG(), facteur)));
        return portion;
    }

    private double valeurPourPortion(Number valeur, double facteur) {
        return valeur != null ? valeur.doubleValue() * facteur : 0;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static final class MenuGenerationException extends RuntimeException {
        private MenuGenerationException(String message) {
            super(message);
        }
    }
}
