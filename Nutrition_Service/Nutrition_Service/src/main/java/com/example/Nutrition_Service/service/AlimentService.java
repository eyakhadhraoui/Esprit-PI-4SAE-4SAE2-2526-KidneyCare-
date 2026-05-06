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
@Transactional
public class AlimentService {

    private final AlimentRepository alimentRepository;

    public AlimentDTO createAliment(AlimentDTO dto) {
        if (alimentRepository.existsByNomIgnoreCase(dto.getNom())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un aliment avec ce nom existe déjà.");
        }
        Aliment saved = alimentRepository.save(toEntity(dto, new Aliment()));
        return toDTO(saved);
    }

    public AlimentDTO updateAliment(Long id, AlimentDTO dto) {
        Aliment existing = alimentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment introuvable."));
        if (dto.getNom() != null && alimentRepository.existsByNomIgnoreCaseAndIdNot(dto.getNom(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un aliment avec ce nom existe déjà.");
        }
        Aliment saved = alimentRepository.save(toEntity(dto, existing));
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getAllAliments() {
        return alimentRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AlimentDTO getAlimentById(Long id) {
        return alimentRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment introuvable."));
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> searchByNom(String nom) {
        return alimentRepository.findByNomContainingIgnoreCase(nom).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getByCategorie(String categorie) {
        return alimentRepository.findByCategorie(categorie).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AlimentDTO> getAlimentsInteractionTacrolimus() {
        return alimentRepository.findByInteractionTacrolimusTrue().stream().map(this::toDTO).toList();
    }

    public void deleteAliment(Long id) {
        if (!alimentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aliment introuvable.");
        }
        alimentRepository.deleteById(id);
    }

    private AlimentDTO toDTO(Aliment a) {
        return new AlimentDTO(
                a.getId(),
                a.getNom(),
                a.getCategorie(),
                a.getPotassiumMg(),
                a.getSodiumMg(),
                a.getPhosphoreMg(),
                a.getProteinesG(),
                a.getSucreG(),
                a.getCaloriesKcal(),
                a.getInteractionTacrolimus(),
                a.getInteractionCyclosporine(),
                a.getAgeMinimumMois(),
                a.getRaisonRestrictionAge(),
                a.getNotes()
        );
    }

    private Aliment toEntity(AlimentDTO dto, Aliment a) {
        a.setNom(dto.getNom());
        a.setCategorie(dto.getCategorie());
        a.setPotassiumMg(dto.getPotassiumMg());
        a.setSodiumMg(dto.getSodiumMg());
        a.setPhosphoreMg(dto.getPhosphoreMg());
        a.setProteinesG(dto.getProteinesG());
        a.setSucreG(dto.getSucreG());
        a.setCaloriesKcal(dto.getCaloriesKcal());
        a.setInteractionTacrolimus(Boolean.TRUE.equals(dto.getInteractionTacrolimus()));
        a.setInteractionCyclosporine(Boolean.TRUE.equals(dto.getInteractionCyclosporine()));
        a.setAgeMinimumMois(dto.getAgeMinimumMois());
        a.setRaisonRestrictionAge(dto.getRaisonRestrictionAge());
        a.setNotes(dto.getNotes());
        return a;
    }
}

