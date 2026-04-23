package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.AlimentDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.repository.AlimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlimentService {

    private final AlimentRepository alimentRepository;

    @Transactional
    public AlimentDTO createAliment(AlimentDTO dto) {
        if (alimentRepository.existsByNomIgnoreCase(dto.getNom().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un aliment avec ce nom existe déjà");
        }
        Aliment aliment = toEntity(dto);
        Aliment saved = alimentRepository.save(aliment);
        return toDTO(saved);
    }

    @Transactional
    public AlimentDTO updateAliment(Long id, AlimentDTO dto) {
        Aliment aliment = alimentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment non trouvé"));

        if (alimentRepository.existsByNomIgnoreCaseAndIdNot(dto.getNom().trim(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un aliment avec ce nom existe déjà");
        }

        updateEntityFromDTO(aliment, dto);
        Aliment updated = alimentRepository.save(aliment);
        return toDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getAllAliments() {
        return alimentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlimentDTO getAlimentById(Long id) {
        Aliment aliment = alimentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment non trouvé"));
        return toDTO(aliment);
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> searchByNom(String nom) {
        return alimentRepository.findByNomContainingIgnoreCase(nom).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getByCategorie(String categorie) {
        return alimentRepository.findByCategorie(categorie).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getAlimentsInteractionTacrolimus() {
        return alimentRepository.findByInteractionTacrolimusTrue().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public void deleteAliment(Long id) {
        if (!alimentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment non trouvé");
        }
        alimentRepository.deleteById(id);
    }

    private AlimentDTO toDTO(Aliment entity) {
        AlimentDTO dto = new AlimentDTO();
        dto.setId(entity.getId());
        dto.setNom(entity.getNom());
        dto.setCategorie(entity.getCategorie());
        dto.setPotassiumMg(entity.getPotassiumMg());
        dto.setSodiumMg(entity.getSodiumMg());
        dto.setPhosphoreMg(entity.getPhosphoreMg());
        dto.setProteinesG(entity.getProteinesG());
        dto.setSucreG(entity.getSucreG());
        dto.setCaloriesKcal(entity.getCaloriesKcal());
        dto.setInteractionTacrolimus(entity.getInteractionTacrolimus());
        dto.setInteractionCyclosporine(entity.getInteractionCyclosporine());
        dto.setAgeMinimumMois(entity.getAgeMinimumMois());
        dto.setRaisonRestrictionAge(entity.getRaisonRestrictionAge());
        dto.setNotes(entity.getNotes());
        return dto;
    }

    private Aliment toEntity(AlimentDTO dto) {
        Aliment entity = new Aliment();
        updateEntityFromDTO(entity, dto);
        return entity;
    }

    private void updateEntityFromDTO(Aliment entity, AlimentDTO dto) {
        entity.setNom(dto.getNom().trim());
        entity.setCategorie(dto.getCategorie());
        entity.setPotassiumMg(dto.getPotassiumMg());
        entity.setSodiumMg(dto.getSodiumMg());
        entity.setPhosphoreMg(dto.getPhosphoreMg());
        entity.setProteinesG(dto.getProteinesG());
        entity.setSucreG(dto.getSucreG());
        entity.setCaloriesKcal(dto.getCaloriesKcal());
        entity.setInteractionTacrolimus(dto.getInteractionTacrolimus());
        entity.setInteractionCyclosporine(dto.getInteractionCyclosporine());
        entity.setAgeMinimumMois(dto.getAgeMinimumMois());
        entity.setRaisonRestrictionAge(dto.getRaisonRestrictionAge());
        entity.setNotes(dto.getNotes());
    }
}
