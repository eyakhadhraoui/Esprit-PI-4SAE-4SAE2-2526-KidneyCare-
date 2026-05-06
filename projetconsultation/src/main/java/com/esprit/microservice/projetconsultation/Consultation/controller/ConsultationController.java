package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.Repository.IConsultatonRepo;
import com.esprit.microservice.projetconsultation.Consultation.Services.IConsultationInterface;
import com.esprit.microservice.projetconsultation.Consultation.dto.AddConsultationRequest;
import com.esprit.microservice.projetconsultation.Consultation.entity.Consultation;
import com.esprit.microservice.projetconsultation.Consultation.repository.PatientRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/consultation")
public class ConsultationController {
    @Autowired
    IConsultationInterface iConsultationInterface;
    @Autowired
    IConsultatonRepo consultationRepo;
    @Autowired
    PatientRepository patientRepository;

    /** Consultations du patient connecté (JWT → username → fiche patient). */
    @GetMapping("/patient/me")
    public ResponseEntity<?> patientMe(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("message", "Username absent du token"));
        }
        return patientRepository.findByUsername(username)
                .map(p -> ResponseEntity.ok(consultationRepo.findByPatient_IdPatientOrderByDateConsultationDesc(p.getIdPatient())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    /** Consultations du médecin connecté (JWT → preferred_username). */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("message", "Username absent du token"));
        }
        List<Consultation> list = consultationRepo.findByMedecin_Username(username);
        return ResponseEntity.ok(list);
    }

    // Retrieve all consultations
    @GetMapping("/retrieveConsultations")
    public List<Consultation> retrieveConsultations() {
        return iConsultationInterface.retrieveConsultations();
    }

    /** Consultations sans rendez-vous (pour le formulaire d'ajout de RDV). */
    @GetMapping("/sansRendezvous")
    public List<Consultation> consultationsSansRendezvous() {
        return consultationRepo.findByRendezvousIsNull();
    }

    // Add consultation (idPatient et idMedecin pris des entités Patient et Medecin)
    @PostMapping("/addConsultation")
    public Consultation addConsultation(@RequestBody AddConsultationRequest request) {
        return iConsultationInterface.addConsultation(request);
    }


    @PutMapping("/updateConsultation/{id}")
    public Consultation updateConsultation(
            @PathVariable("id") Integer id,
            @RequestBody Consultation consultation) {

        consultation.setIdConsultation(id); // assure que l'ID du JSON correspond à l'ID de l'URL
        return iConsultationInterface.updateConsultation(consultation);
    }


    // Retrieve consultation by id
    @GetMapping("/retrieveConsultation/{consultation-id}")
    public Optional<Consultation> retrieveConsultation(
            @PathVariable("consultation-id") Integer idConsultation) {
        return iConsultationInterface.retrieveConsultation(idConsultation);
    }

    // Delete consultation
    @DeleteMapping("/removeConsultation/{consultation-id}")
    public void removeConsultation(
            @PathVariable("consultation-id") Integer idConsultation) {
        iConsultationInterface.removeConsultation(idConsultation);
    }
}
