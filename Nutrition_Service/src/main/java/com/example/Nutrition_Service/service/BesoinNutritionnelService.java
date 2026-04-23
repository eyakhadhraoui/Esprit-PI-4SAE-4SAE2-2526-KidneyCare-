package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.BesoinNutritionnelDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BesoinNutritionnelService {

    private final BesoinNutritionnelRepository besoinRepository;

    @PostConstruct
    @Transactional
    public void initStaticData() {
        if (besoinRepository.count() == 0) {
            createPatientData();
        }
    }

    @Transactional
    public void createPatientData() {

        BesoinNutritionnel patient1 = new BesoinNutritionnel();
        patient1.setPatientId(1L);
        patient1.setPoidsKg(22.0);
        patient1.setAgeMois(24);
        patient1.setTraitementTacrolimus(true);
        patient1.setTraitementPrednisone(false);
        patient1.setPotassiumMaxMg(1800);
        patient1.setSodiumMaxMg(1200);
        patient1.setPhosphoreMaxMg(800);
        patient1.setProteinesMaxG(40.0);
        patient1.setSucreMaxG(35.0);
        patient1.setCaloriesJour(1200);
        patient1.setDateDebut(LocalDate.now());
        patient1.setDateFin(null);
        patient1.setRaisonCalcul("Calculé selon poids (22kg) + âge (2 ans) + Tacrolimus actif");
        patient1.setNotes(
                "Poids: 22 kg, Taille: 85 cm, IMC: 30.4 (surpoids)\n" +
                "Tacrolimus: 2mg matin + 2mg soir\n" +
                "Potassium: 5.2 mmol/L ÉLEVÉ\n" +
                "Restrictions: Éviter banane, fruits secs, épinards, pamplemousse INTERDIT"
        );
        besoinRepository.save(patient1);

        BesoinNutritionnel patient2 = new BesoinNutritionnel();
        patient2.setPatientId(2L);
        patient2.setPoidsKg(9.0);
        patient2.setAgeMois(9);
        patient2.setTraitementTacrolimus(false);
        patient2.setTraitementPrednisone(false);
        patient2.setPotassiumMaxMg(1000);
        patient2.setSodiumMaxMg(800);
        patient2.setPhosphoreMaxMg(500);
        patient2.setProteinesMaxG(20.0);
        patient2.setSucreMaxG(25.0);
        patient2.setCaloriesJour(800);
        patient2.setDateDebut(LocalDate.now());
        patient2.setDateFin(null);
        patient2.setRaisonCalcul("Calculé selon âge (9 mois) et poids (9kg) - Pas de traitement immunosuppresseur");
        patient2.setNotes(
                "Poids: 9 kg, Taille: 72 cm, IMC: 17.4 (normal)\n" +
                "Aucun immunosuppresseur\n" +
                "Restrictions: Raisins secs et fruits à coques interdits (< 12 mois)"
        );
        besoinRepository.save(patient2);

        BesoinNutritionnel patient3 = new BesoinNutritionnel();
        patient3.setPatientId(3L);
        patient3.setPoidsKg(38.0);
        patient3.setAgeMois(144);
        patient3.setTraitementTacrolimus(true);
        patient3.setTraitementPrednisone(true);
        patient3.setPotassiumMaxMg(2500);
        patient3.setSodiumMaxMg(1500);
        patient3.setPhosphoreMaxMg(1200);
        patient3.setProteinesMaxG(55.0);
        patient3.setSucreMaxG(45.0);
        patient3.setCaloriesJour(1800);
        patient3.setDateDebut(LocalDate.now());
        patient3.setDateFin(null);
        patient3.setRaisonCalcul("Calculé selon poids (38kg) + âge (12 ans) + Tacrolimus + Prednisone actifs");
        patient3.setNotes(
                "Poids: 38 kg, Taille: 148 cm, IMC: 17.3 (normal)\n" +
                "Tacrolimus: 3mg matin + 3mg soir, Prednisone: 5mg/jour\n" +
                "Glycémie: 6.8 mmol/L ÉLEVÉ, HbA1c: 5.9% Prédiabète\n" +
                "Restrictions: Limiter sucres rapides, pamplemousse INTERDIT"
        );
        besoinRepository.save(patient3);
    }

    @Transactional
    public BesoinNutritionnelDTO createBesoin(BesoinNutritionnelDTO dto) {
        Optional<BesoinNutritionnel> ancien = besoinRepository.findActiveByPatientId(dto.getPatientId());
        ancien.ifPresent(b -> {
            b.setDateFin(LocalDate.now());
            besoinRepository.save(b);
        });
        BesoinNutritionnel besoin = toEntity(dto);
        BesoinNutritionnel saved = besoinRepository.save(besoin);
        return toDTO(saved);
    }

    @Transactional
    public BesoinNutritionnelDTO updateBesoin(Long id, BesoinNutritionnelDTO dto) {
        BesoinNutritionnel besoin = besoinRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé"));
        updateEntityFromDTO(besoin, dto);
        BesoinNutritionnel updated = besoinRepository.save(besoin);
        return toDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getAllBesoins() {
        return besoinRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getBesoinById(Long id) {
        BesoinNutritionnel besoin = besoinRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé"));
        return toDTO(besoin);
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getActiveBesoinForPatient(Long patientId) {
        BesoinNutritionnel besoin = besoinRepository.findActiveByPatientId(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun besoin actif pour ce patient"));
        return toDTO(besoin);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getHistoryForPatient(Long patientId) {
        return besoinRepository.findByPatientIdOrderByDateDebutDesc(patientId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public void deleteBesoin(Long id) {
        if (!besoinRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé");
        }
        besoinRepository.deleteById(id);
    }

    private BesoinNutritionnelDTO toDTO(BesoinNutritionnel entity) {
        BesoinNutritionnelDTO dto = new BesoinNutritionnelDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setPotassiumMaxMg(entity.getPotassiumMaxMg());
        dto.setSodiumMaxMg(entity.getSodiumMaxMg());
        dto.setPhosphoreMaxMg(entity.getPhosphoreMaxMg());
        dto.setProteinesMaxG(entity.getProteinesMaxG());
        dto.setSucreMaxG(entity.getSucreMaxG());
        dto.setCaloriesJour(entity.getCaloriesJour());
        dto.setPoidsKg(entity.getPoidsKg());
        dto.setAgeMois(entity.getAgeMois());
        dto.setTraitementTacrolimus(entity.getTraitementTacrolimus());
        dto.setTraitementPrednisone(entity.getTraitementPrednisone());
        dto.setRaisonCalcul(entity.getRaisonCalcul());
        dto.setDateDebut(entity.getDateDebut());
        dto.setDateFin(entity.getDateFin());
        dto.setNotes(entity.getNotes());
        return dto;
    }

    private BesoinNutritionnel toEntity(BesoinNutritionnelDTO dto) {
        BesoinNutritionnel entity = new BesoinNutritionnel();
        updateEntityFromDTO(entity, dto);
        return entity;
    }

    private void updateEntityFromDTO(BesoinNutritionnel entity, BesoinNutritionnelDTO dto) {
        entity.setPatientId(dto.getPatientId());
        entity.setPotassiumMaxMg(dto.getPotassiumMaxMg());
        entity.setSodiumMaxMg(dto.getSodiumMaxMg());
        entity.setPhosphoreMaxMg(dto.getPhosphoreMaxMg());
        entity.setProteinesMaxG(dto.getProteinesMaxG());
        entity.setSucreMaxG(dto.getSucreMaxG());
        entity.setCaloriesJour(dto.getCaloriesJour());
        entity.setPoidsKg(dto.getPoidsKg());
        entity.setAgeMois(dto.getAgeMois());
        entity.setTraitementTacrolimus(dto.getTraitementTacrolimus());
        entity.setTraitementPrednisone(dto.getTraitementPrednisone());
        entity.setRaisonCalcul(dto.getRaisonCalcul());
        entity.setDateDebut(dto.getDateDebut());
        entity.setDateFin(dto.getDateFin());
        entity.setNotes(dto.getNotes());
    }
}
