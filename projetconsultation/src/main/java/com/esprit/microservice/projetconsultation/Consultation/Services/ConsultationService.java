package com.esprit.microservice.projetconsultation.Consultation.Services;

import com.esprit.microservice.projetconsultation.Consultation.Repository.IConsultatonRepo;
import com.esprit.microservice.projetconsultation.Consultation.Repository.IRendezvousRepo;
import com.esprit.microservice.projetconsultation.Consultation.dto.AddConsultationRequest;
import com.esprit.microservice.projetconsultation.Consultation.entity.Consultation;
import com.esprit.microservice.projetconsultation.Consultation.entity.Medecin;
import com.esprit.microservice.projetconsultation.Consultation.entity.Patient;
import com.esprit.microservice.projetconsultation.Consultation.entity.Rendezvous;
import com.esprit.microservice.projetconsultation.Consultation.repository.MedecinRepository;
import com.esprit.microservice.projetconsultation.Consultation.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConsultationService implements IConsultationInterface {

    private final IConsultatonRepo consultationRepo;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final IRendezvousRepo rendezvousRepo;

    @Override
    public List<Consultation> retrieveConsultations() {
        return consultationRepo.findAll();
    }

    @Override
    public Consultation addConsultation(AddConsultationRequest request) {
        Patient patient = null;
        if (request.getIdPatient() != null) {
            patient = patientRepository.findById(request.getIdPatient())
                    .orElseThrow(() -> new RuntimeException("Patient non trouvé avec id = " + request.getIdPatient()));
        }
        Medecin medecin = null;
        if (request.getIdMedecin() != null) {
            medecin = medecinRepository.findById(request.getIdMedecin())
                    .orElseThrow(() -> new RuntimeException("Médecin non trouvé avec id = " + request.getIdMedecin()));
        }
        Rendezvous rendezvous = null;
        if (request.getRendezvous() != null && request.getRendezvous().getIdRendezvous() != null) {
            rendezvous = rendezvousRepo.findById(request.getRendezvous().getIdRendezvous())
                    .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec id = " + request.getRendezvous().getIdRendezvous()));
        }
        Consultation consultation = new Consultation();
        consultation.setDateConsultation(request.getDateConsultation());
        consultation.setDiagnostic(request.getDiagnostic());
        consultation.setNotes(request.getNotes() != null ? request.getNotes() : "");
        consultation.setIdDossiermedical(request.getIdDossiermedical());
        consultation.setPatient(patient);
        consultation.setMedecin(medecin);
        consultation.setRendezvous(rendezvous);
        return consultationRepo.save(consultation);
    }

    @Override
    public Consultation addConsultationEntity(Consultation consultation) {
        return consultationRepo.save(consultation);
    }

    @Override
    public Consultation updateConsultation(Consultation consultation) {
        // Vérifier que la consultation existe
        if(consultation.getIdConsultation() == null ||
                !consultationRepo.existsById(consultation.getIdConsultation())) {
            throw new RuntimeException("Consultation non trouvée avec ID = " + consultation.getIdConsultation());
        }

        // Sauvegarde (update)
        return consultationRepo.save(consultation);
    }


    @Override
    public Optional<Consultation> retrieveConsultation(Integer idConsultation) {
        return consultationRepo.findById(idConsultation);
    }

    @Override
    public void removeConsultation(Integer idConsultation) {
        consultationRepo.deleteById(idConsultation);
    }
}
