package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.SubstitutDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.repository.AlimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubstitutService {

    private final AlimentRepository alimentRepository;

    public List<SubstitutDTO> trouverSubstituts(Long patientId, Long alimentRefuseId) {
        Aliment ref = alimentRepository.findById(alimentRefuseId)
                .orElseThrow(() -> new RuntimeException("Aliment non trouvé"));

        List<Aliment> candidats = alimentRepository.findSubstitutsDansAliments(
                patientId,
                alimentRefuseId,
                ref.getCaloriesKcal() != null ? ref.getCaloriesKcal() : 0,
                ref.getProteinesG()   != null ? ref.getProteinesG()   : 0
        );

        return candidats.stream()
                .map(a -> toDTO(a, ref))
                .sorted(Comparator.comparingInt(SubstitutDTO::getScoreCompatibilite).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private SubstitutDTO toDTO(Aliment a, Aliment ref) {
        return SubstitutDTO.builder()
                .id(a.getId())
                .nom(a.getNom())
                .calories(a.getCaloriesKcal()  != null ? a.getCaloriesKcal()  : 0)
                .proteines(a.getProteinesG()   != null ? a.getProteinesG()    : 0)
                .glucides(a.getSucreG()         != null ? a.getSucreG()        : 0)
                .potassium(a.getPotassiumMg()   != null ? a.getPotassiumMg()   : 0)
                .sodium(a.getSodiumMg()         != null ? a.getSodiumMg()      : 0)
// ✅ CORRECT
                .phosphore(a.getPhosphoreMg() != null ? a.getPhosphoreMg()   : 0)                .scoreCompatibilite(calculerScore(a, ref))
                .build();
    }

    private int calculerScore(Aliment a, Aliment ref) {
        double refCal  = ref.getCaloriesKcal() != null ? ref.getCaloriesKcal() : 1;
        double refProt = ref.getProteinesG()   != null ? ref.getProteinesG()   : 1;
        double aCal    = a.getCaloriesKcal()   != null ? a.getCaloriesKcal()   : 0;
        double aProt   = a.getProteinesG()     != null ? a.getProteinesG()     : 0;

        double diffCal  = Math.abs(aCal  - refCal)  / refCal  * 100;
        double diffProt = Math.abs(aProt - refProt)  / refProt * 100;
        return (int) Math.max(0, Math.min(100, 100 - (diffCal * 0.5 + diffProt * 0.5)));
    }
}