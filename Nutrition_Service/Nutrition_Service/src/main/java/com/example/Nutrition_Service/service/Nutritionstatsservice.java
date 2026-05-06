package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.NutritionStatsDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.dto.NutritionStatsDTO.*;
import com.example.Nutrition_Service.repository.AlimentRepository;
import com.example.Nutrition_Service.repository.Nutritionstatsrepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class Nutritionstatsservice {

    private final Nutritionstatsrepository statsRepo;
    private final AlimentRepository alimentRepository;

    public DashboardStatsDTO getDashboardStats() {
        return new DashboardStatsDTO(
                statsRepo.countPatientsWithActiveRegime(),
                statsRepo.countPatientsWithoutActiveRegime(),
                statsRepo.countAllUnreadAlertes(),
                statsRepo.avgCaloriesAllPatients(),
                statsRepo.countActiveRestrictions(),
                statsRepo.countAutoRestrictions()
        );
    }

    public List<com.example.Nutrition_Service.entity.BesoinNutritionnel> rechercheMulticriteres(Boolean tacrolimus,
                                                                                              Boolean prednisone,
                                                                                              Double potassiumMax,
                                                                                              Integer caloriesMin,
                                                                                              Boolean avecAlertes,
                                                                                              Boolean avecRestrictions) {
        return statsRepo.rechercheMulticriteres(tacrolimus, prednisone, potassiumMax, caloriesMin, avecAlertes, avecRestrictions);
    }

    public List<AnomalieDTO> getAnomaliesActuelles() {
        List<AnomalieDTO> out = new ArrayList<>();
        // Régimes non mis à jour depuis 60 jours
        for (var b : statsRepo.findRegimesNonMisAJour(LocalDate.now().minusDays(60))) {
            out.add(new AnomalieDTO("REGIME_NON_MIS_A_JOUR", b.getPatientId(),
                    "Régime nutritionnel ancien (non mis à jour)", "WARNING"));
        }
        // Alertes non lues depuis 48h
        for (var a : statsRepo.findAlertesIgnorees(LocalDateTime.now().minusHours(48))) {
            out.add(new AnomalieDTO("ALERTE_IGNOREE", a.getPatientId(),
                    "Alerte nutrition non lue depuis plus de 48h", "CRITICAL"));
        }
        // Patients avec restrictions mais sans régime actif
        for (Long pid : statsRepo.findPatientsSansRegimeMaisAvecRestrictions()) {
            out.add(new AnomalieDTO("RESTRICTIONS_SANS_REGIME", pid,
                    "Restrictions actives sans régime nutritionnel actif", "WARNING"));
        }
        return out;
    }

    public List<AlimentStatDTO> getRapportAliments() {
        List<Object[]> rows = statsRepo.findTopAlimentsRestreints();
        List<AlimentStatDTO> out = new ArrayList<>();
        for (Object[] r : rows) {
            Long alimentId = r[0] != null ? ((Number) r[0]).longValue() : null;
            Long nb = r[1] != null ? ((Number) r[1]).longValue() : 0L;
            String raison = r[2] != null ? String.valueOf(r[2]) : null;
            AlimentStatDTO dto = new AlimentStatDTO(alimentId, nb, raison);
            if (alimentId != null) {
                alimentRepository.findById(alimentId).ifPresent(a -> dto.setAlimentNom(a.getNom()));
            }
            out.add(dto);
        }
        return out;
    }

    public List<Object[]> getRapportParRaison() {
        return statsRepo.countRestrictionsByRaison();
    }

    public List<RisquePatientDTO> getRiskScores() {
        return statsRepo.calculateRiskScores().stream()
                .map(r -> new RisquePatientDTO(((Number) r[0]).longValue(), ((Number) r[1]).longValue()))
                .collect(Collectors.toList());
    }

    public List<EvolutionPointDTO> getEvolutionPatient(Long patientId) {
        var hist = statsRepo.findHistoriquePatient(patientId);
        List<EvolutionPointDTO> out = new ArrayList<>();
        Integer prevCal = null;
        Double prevK = null;
        for (var b : hist) {
            EvolutionPointDTO p = new EvolutionPointDTO();
            p.setDateDebut(Objects.toString(b.getDateDebut(), ""));
            p.setCaloriesJour(b.getCaloriesJour());
            p.setPotassiumMaxMg(b.getPotassiumMaxMg() != null ? b.getPotassiumMaxMg().doubleValue() : null);
            p.setPoidsKg(b.getPoidsKg());
            p.setProteinesMaxG(b.getProteinesMaxG());
            if (prevCal != null && b.getCaloriesJour() != null) p.setDeltaCalories(b.getCaloriesJour() - prevCal);
            if (prevK != null && b.getPotassiumMaxMg() != null) p.setDeltaPotassium(b.getPotassiumMaxMg() - prevK);
            prevCal = b.getCaloriesJour();
            prevK = b.getPotassiumMaxMg() != null ? b.getPotassiumMaxMg().doubleValue() : null;
            out.add(p);
        }
        return out;
    }

    public List<Aliment> getSuggestionsAliments(Long patientId,
                                               boolean hasTacrolimus,
                                               boolean hasCyclosporine,
                                               Integer ageMois,
                                               Double potassiumMax,
                                               Double sodiumMax,
                                               Double phosphoreMax,
                                               Double sucreMax) {
        return statsRepo.findAlimentsAutorisesForPatient(patientId, hasTacrolimus, hasCyclosporine, ageMois, potassiumMax, sodiumMax, phosphoreMax, sucreMax);
    }

    public List<ConformitePatientDTO> getRapportConformite(LocalDateTime debut, LocalDateTime fin) {
        List<Object[]> rows = statsRepo.getRapportConformite(debut, fin);
        List<ConformitePatientDTO> out = new ArrayList<>();
        for (Object[] r : rows) {
            Long pid = ((Number) r[0]).longValue();
            Long total = ((Number) r[1]).longValue();
            Long traitees = ((Number) r[2]).longValue();
            Long ignorees = ((Number) r[3]).longValue();
            LocalDateTime premiere = (LocalDateTime) r[4];
            LocalDateTime derniere = (LocalDateTime) r[5];
            out.add(new ConformitePatientDTO(pid, total, traitees, ignorees, premiere, derniere));
        }
        return out;
    }

    public List<CorrelationDTO> getCorrelationAlimentAlerte(Long patientId) {
        List<Object[]> rows = statsRepo.findCorrelationAlimentAlerte(patientId);
        List<CorrelationDTO> out = new ArrayList<>();
        for (Object[] r : rows) {
            Long alimentId = r[0] != null ? ((Number) r[0]).longValue() : null;
            Long nb = r[1] != null ? ((Number) r[1]).longValue() : 0L;
            LocalDateTime derniere = (LocalDateTime) r[2];
            String type = r[3] != null ? String.valueOf(r[3]) : null;
            CorrelationDTO dto = new CorrelationDTO(alimentId, nb, derniere, type);
            if (alimentId != null) {
                alimentRepository.findById(alimentId).ifPresent(a -> dto.setAlimentNom(a.getNom()));
            }
            out.add(dto);
        }
        return out;
    }
}

