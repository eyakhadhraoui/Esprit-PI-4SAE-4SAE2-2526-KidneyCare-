package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.dto.PatientDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Patient;
import com.esprit.microservice.projetconsultation.Consultation.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;

    @GetMapping("/retrievePatients")
    public List<PatientDTO> retrievePatients() {
        try {
            List<PatientDTO> list = patientRepository.findAll().stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            if (!list.isEmpty()) return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        // Fallback si base vide ou erreur (données de test)
        return List.of(
            new PatientDTO(1L, "EYA", "nourjeddi5@gmail.com", "nour", "Jeddi", "22222222", null)
        );
    }

    private PatientDTO toDTO(Patient p) {
        PatientDTO dto = new PatientDTO();
        dto.setIdPatient(p.getIdPatient());
        dto.setUsername(p.getUsername());
        dto.setEmail(p.getEmail());
        dto.setFirstName(p.getFirstName());
        dto.setLastName(p.getLastName());
        dto.setTelephone(p.getTelephone());
        dto.setDateNaissance(p.getDateNaissance());
        return dto;
    }
}
