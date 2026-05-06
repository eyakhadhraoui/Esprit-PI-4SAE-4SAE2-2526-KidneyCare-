package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.AlimentPortionDTO;
import com.example.Nutrition_Service.dto.MenuJournalierDTO;
import com.example.Nutrition_Service.dto.RepasDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.repository.AlimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MenuGeneratorService {

    private final Nutritionstatsservice nutritionStatsService;
    private final BesoinNutritionnelService besoinService;
    private final AlimentRepository alimentRepository;

    private static final List<String> JOURS = List.of(
            "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"
    );
    private static final List<String> BREAKFAST_CATEGORIES = List.of("FRUIT", "LAIT", "YAOURT", "CEREALE", "PAIN");
    private static final List<String> PROTEIN_CATEGORIES   = List.of("VIANDE", "POISSON", "TOFU", "OEUF", "PROTEINE", "LEGUMINEUSE", "POISSONS");
    private static final List<String> VEGETABLE_CATEGORIES = List.of("LEGUME", "FRUIT", "SALADE", "VERDURE");
    private static final List<String> CARB_CATEGORIES      = List.of("CEREALE", "PAIN", "PATES", "RIZ", "LENTILLE", "POISSONS", "LÉGUMINEUSE", "LEGUMES");

    // Portion profiles per option (breakfast-primary, breakfast-secondary,
    //                              lunch-primary, lunch-secondary,
    //                              dinner-primary, dinner-secondary)
    private static final int[][] PORTION_PROFILES = {
        {100, 80,  150, 120, 140, 140},   // option 0 — portions standard
        { 80, 70,  120, 150, 160, 110},   // option 1 — accent déjeuner/dîner
        {120, 60,  160, 100, 120, 160},   // option 2 — accent petit-déjeuner + dîner
    };

    public Map<String, List<MenuJournalierDTO>> genererMenusSemaine(Long patientId) {
        var besoin = besoinService.getActiveBesoinForPatient(patientId);

        List<Aliment> allowedAliments = null;

        if (besoin != null) {
            allowedAliments = nutritionStatsService.getSuggestionsAliments(
                    patientId,
                    Boolean.TRUE.equals(besoin.getTraitementTacrolimus()),
                    false,
                    besoin.getAgeMois(),
                    toDoubleOrNull(besoin.getPotassiumMaxMg()),
                    toDoubleOrNull(besoin.getSodiumMaxMg()),
                    toDoubleOrNull(besoin.getPhosphoreMaxMg()),
                    toDoubleOrNull(besoin.getSucreMaxG())
            );
        }

        // Fallback: if no besoin or filtered list is empty, use all aliments
        if (allowedAliments == null || allowedAliments.isEmpty()) {
            allowedAliments = alimentRepository.findAll();
        }

        if (allowedAliments.isEmpty()) return new LinkedHashMap<>();

        Map<String, List<MenuJournalierDTO>> out = new LinkedHashMap<>();
        for (int d = 0; d < JOURS.size(); d++) {
            String jour = JOURS.get(d);
            List<MenuJournalierDTO> menus = new ArrayList<>();
            for (int option = 0; option < 3; option++) {
                MenuJournalierDTO menu = new MenuJournalierDTO();
                menu.setNumero(option + 1);
                menu.setJour(jour);
                menu.setRepas(generateRepasForOption(d, option, allowedAliments));
                populateTotals(menu);
                menu.setPctCalories(percent(menu.getTotalCalories(),  besoin != null ? besoin.getCaloriesJour()    : null));
                menu.setPctPotassium(percent(menu.getTotalPotassium(), besoin != null ? besoin.getPotassiumMaxMg() : null));
                menu.setPctSodium(percent(menu.getTotalSodium(),       besoin != null ? besoin.getSodiumMaxMg()    : null));
                menu.setPctPhosphore(percent(menu.getTotalPhosphore(), besoin != null ? besoin.getPhosphoreMaxMg() : null));
                menu.setPctProteines(percent(menu.getTotalProteines(), besoin != null ? besoin.getProteinesMaxG()  : null));
                menu.setPctSucre(percent(menu.getTotalSucre(),         besoin != null ? besoin.getSucreMaxG()      : null));
                menus.add(menu);
            }
            out.put(jour, menus);
        }
        return out;
    }

    /**
     * Generates a single day-menu option.
     *
     * To guarantee the 3 options are visibly different even with a small food
     * database we apply two independent levers:
     *   1. Index offset  — each (dayIndex, option) pair produces a unique starting
     *      position in every pool (odd prime 11 avoids even-pool cancellation).
     *   2. Portion profiles — each option uses a different caloric distribution
     *      across the three meals (see PORTION_PROFILES).
     *
     * For DINER the primary/secondary pools are swapped relative to DEJEUNER
     * so that even if the same food appears, the role (main vs. side) differs.
     */
    private List<RepasDTO> generateRepasForOption(int dayIndex, int option, List<Aliment> allowedAliments) {
        List<Aliment> breakfastPool = filterByCategories(allowedAliments, BREAKFAST_CATEGORIES);
        List<Aliment> proteinPool   = filterByCategories(allowedAliments, PROTEIN_CATEGORIES);
        List<Aliment> veggiePool    = filterByCategories(allowedAliments, VEGETABLE_CATEGORIES);
        List<Aliment> carbPool      = filterByCategories(allowedAliments, CARB_CATEGORIES);
        if (breakfastPool.isEmpty()) breakfastPool = allowedAliments;
        if (proteinPool.isEmpty())   proteinPool   = allowedAliments;
        if (veggiePool.isEmpty())    veggiePool    = allowedAliments;
        if (carbPool.isEmpty())      carbPool      = allowedAliments;

        // base offset: prime 11 × day ensures a different starting position every day;
        // +option shifts by 1 so each of the 3 options picks the next item in the pool.
        int base = dayIndex * 11 + option;

        int[] p = PORTION_PROFILES[option % 3];

        List<RepasDTO> repas = new ArrayList<>();

        // Petit-déjeuner : fruit/céréale + glucide
        repas.add(buildRepas("PETIT_DEJEUNER",
                breakfastPool, carbPool,
                base,     base + 1,
                p[0], p[1]));

        // Déjeuner : protéine principale + légume
        repas.add(buildRepas("DEJEUNER",
                proteinPool, veggiePool,
                base + 2, base + 3,
                p[2], p[3]));

        // Dîner : légume principal + glucide/protéine (pools swapped vs. déjeuner)
        repas.add(buildRepas("DINER",
                veggiePool, carbPool,
                base + 3, base + 4,   // +3 & +4 differ from déjeuner's +2 & +3
                p[4], p[5]));

        return repas;
    }

    private RepasDTO buildRepas(String type,
                                List<Aliment> primaryPool, List<Aliment> secondaryPool,
                                int primaryIdx, int secondaryIdx,
                                int primaryPortion, int secondaryPortion) {
        Aliment primary   = pick(primaryPool,   primaryIdx);
        Aliment secondary = pick(secondaryPool, secondaryIdx);

        List<AlimentPortionDTO> portions = new ArrayList<>();
        if (primary != null) portions.add(toPortion(primary, primaryPortion));
        if (secondary != null && !secondary.equals(primary))
            portions.add(toPortion(secondary, secondaryPortion));

        RepasDTO repas = new RepasDTO();
        repas.setType(type);
        repas.setAliments(portions);
        repas.setTotalCalories(sum(portions, AlimentPortionDTO::getCalories));
        repas.setTotalPotassium(sum(portions, AlimentPortionDTO::getPotassium));
        repas.setTotalSodium(sum(portions, AlimentPortionDTO::getSodium));
        repas.setTotalPhosphore(sum(portions, AlimentPortionDTO::getPhosphore));
        repas.setTotalProteines(sum(portions, AlimentPortionDTO::getProteines));
        repas.setTotalSucre(sum(portions, AlimentPortionDTO::getSucre));
        return repas;
    }

    private Aliment pick(List<Aliment> pool, int index) {
        if (pool == null || pool.isEmpty()) return null;
        return pool.get(Math.floorMod(index, pool.size()));
    }

    private List<Aliment> filterByCategories(List<Aliment> aliments, List<String> categories) {
        if (aliments == null) return List.of();
        return aliments.stream()
                .filter(a -> a.getCategorie() != null &&
                        categories.stream().anyMatch(c -> a.getCategorie().toUpperCase().contains(c)))
                .toList();
    }

    private AlimentPortionDTO toPortion(Aliment aliment, int portionG) {
        double factor = portionG / 100.0;
        return new AlimentPortionDTO(
                aliment.getId(),
                aliment.getNom(),
                aliment.getCategorie(),
                portionG,
                round(toDouble(aliment.getCaloriesKcal()) * factor),
                round(toDouble(aliment.getPotassiumMg())  * factor),
                round(toDouble(aliment.getSodiumMg())     * factor),
                round(toDouble(aliment.getPhosphoreMg())  * factor),
                round(toDouble(aliment.getProteinesG())   * factor),
                round(toDouble(aliment.getSucreG())       * factor)
        );
    }

    private void populateTotals(MenuJournalierDTO menu) {
        double calories = 0, potassium = 0, sodium = 0, phosphore = 0, proteines = 0, sucre = 0;
        for (RepasDTO repas : menu.getRepas()) {
            calories  += repas.getTotalCalories();
            potassium += repas.getTotalPotassium();
            sodium    += repas.getTotalSodium();
            phosphore += repas.getTotalPhosphore();
            proteines += repas.getTotalProteines();
            sucre     += repas.getTotalSucre();
        }
        menu.setTotalCalories(round(calories));
        menu.setTotalPotassium(round(potassium));
        menu.setTotalSodium(round(sodium));
        menu.setTotalPhosphore(round(phosphore));
        menu.setTotalProteines(round(proteines));
        menu.setTotalSucre(round(sucre));
    }

    private double sum(List<AlimentPortionDTO> portions,
                       java.util.function.ToDoubleFunction<AlimentPortionDTO> mapper) {
        return portions.stream().mapToDouble(mapper).sum();
    }

    private double percent(double value, Number max) {
        if (max == null || max.doubleValue() <= 0) return 0;
        return Math.round(Math.min(100.0, value / max.doubleValue() * 100.0));
    }

    private double toDouble(Number number) {
        return number == null ? 0 : number.doubleValue();
    }

    /** Returns null when number is null or zero so JPQL ":x IS NULL" skips the filter. */
    private Double toDoubleOrNull(Number number) {
        if (number == null) return null;
        double v = number.doubleValue();
        return v <= 0 ? null : v;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
