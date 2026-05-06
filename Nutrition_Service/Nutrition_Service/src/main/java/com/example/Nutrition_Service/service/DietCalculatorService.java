package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.DietRecommendationDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DietCalculatorService {

    private final BesoinNutritionnelRepository besoinRepository;

    @Transactional(readOnly = true)
    public Optional<DietRecommendationDTO> calculate(Long patientId) {
        Optional<BesoinNutritionnel> besoinOpt = besoinRepository.findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(patientId);
        if (besoinOpt.isEmpty()) return Optional.empty();

        BesoinNutritionnel b = besoinOpt.get();
        DietRecommendationDTO dto = new DietRecommendationDTO();
        dto.setPatientId(patientId);
        dto.setDateBilan(LocalDate.now());
        dto.setCalories(b.getCaloriesJour());
        dto.setPotassiumMax(b.getPotassiumMaxMg());
        dto.setSodiumMax(b.getSodiumMaxMg());
        dto.setPhosphoreMax(b.getPhosphoreMaxMg());
        dto.setProteinesMax(b.getProteinesMaxG());
        dto.setSucreMax(b.getSucreMaxG() != null ? (int) Math.round(b.getSucreMaxG()) : null);
        dto.setMedicamentsActifs(deriveMedicaments(b));
        dto.setNotes(b.getNotes());
        dto.setPoids(b.getPoidsKg());
        return Optional.of(dto);
    }

    private static List<String> deriveMedicaments(BesoinNutritionnel b) {
        // Déduction simple depuis les flags métier existants (évite dépendances sur service prescription).
        // Le front peut afficher ces tags.
        java.util.ArrayList<String> meds = new java.util.ArrayList<>();
        if (Boolean.TRUE.equals(b.getTraitementTacrolimus())) meds.add("Tacrolimus");
        if (Boolean.TRUE.equals(b.getTraitementPrednisone())) meds.add("Prednisone");
        return meds;
    }
}

