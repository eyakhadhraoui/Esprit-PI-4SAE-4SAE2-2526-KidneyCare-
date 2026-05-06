package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.BesoinNutritionnelDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BesoinNutritionnelService {

    private final BesoinNutritionnelRepository besoinRepository;

    public BesoinNutritionnelDTO createBesoin(BesoinNutritionnelDTO dto) {
        BesoinNutritionnel saved = besoinRepository.save(toEntity(dto, new BesoinNutritionnel()));
        return toDTO(saved);
    }

    public BesoinNutritionnelDTO updateBesoin(Long id, BesoinNutritionnelDTO dto) {
        BesoinNutritionnel existing = besoinRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin introuvable."));
        BesoinNutritionnel saved = besoinRepository.save(toEntity(dto, existing));
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getAllBesoins() {
        return besoinRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getBesoinById(Long id) {
        return besoinRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin introuvable."));
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getActiveBesoinForPatient(Long patientId) {
        return besoinRepository.findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(patientId)
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getHistoryForPatient(Long patientId) {
        return besoinRepository.findByPatientIdOrderByDateDebutDesc(patientId).stream().map(this::toDTO).toList();
    }

    public void deleteBesoin(Long id) {
        if (!besoinRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin introuvable.");
        }
        besoinRepository.deleteById(id);
    }

    private BesoinNutritionnelDTO toDTO(BesoinNutritionnel b) {
        return new BesoinNutritionnelDTO(
                b.getId(),
                b.getPatientId(),
                b.getPotassiumMaxMg(),
                b.getSodiumMaxMg(),
                b.getPhosphoreMaxMg(),
                b.getProteinesMaxG(),
                b.getSucreMaxG(),
                b.getCaloriesJour(),
                b.getPoidsKg(),
                b.getAgeMois(),
                b.getTraitementTacrolimus(),
                b.getTraitementPrednisone(),
                b.getRaisonCalcul(),
                b.getDateDebut(),
                b.getDateFin(),
                b.getNotes()
        );
    }

    private BesoinNutritionnel toEntity(BesoinNutritionnelDTO dto, BesoinNutritionnel b) {
        b.setPatientId(dto.getPatientId());
        b.setPotassiumMaxMg(dto.getPotassiumMaxMg());
        b.setSodiumMaxMg(dto.getSodiumMaxMg());
        b.setPhosphoreMaxMg(dto.getPhosphoreMaxMg());
        b.setProteinesMaxG(dto.getProteinesMaxG());
        b.setSucreMaxG(dto.getSucreMaxG());
        b.setCaloriesJour(dto.getCaloriesJour());
        b.setPoidsKg(dto.getPoidsKg());
        b.setAgeMois(dto.getAgeMois());
        b.setTraitementTacrolimus(Boolean.TRUE.equals(dto.getTraitementTacrolimus()));
        b.setTraitementPrednisone(Boolean.TRUE.equals(dto.getTraitementPrednisone()));
        b.setRaisonCalcul(dto.getRaisonCalcul());
        b.setDateDebut(dto.getDateDebut());
        b.setDateFin(dto.getDateFin());
        b.setNotes(dto.getNotes());
        return b;
    }
}

