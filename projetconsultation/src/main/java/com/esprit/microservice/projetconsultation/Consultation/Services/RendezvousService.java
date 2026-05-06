package com.esprit.microservice.projetconsultation.Consultation.Services;

import com.esprit.microservice.projetconsultation.Consultation.Repository.IConsultatonRepo;
import com.esprit.microservice.projetconsultation.Consultation.Repository.IRendezvousRepo;
import com.esprit.microservice.projetconsultation.Consultation.repository.PatientRepository;
import com.esprit.microservice.projetconsultation.Consultation.dto.RendezvousDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Consultation;
import com.esprit.microservice.projetconsultation.Consultation.entity.Patient;
import com.esprit.microservice.projetconsultation.Consultation.entity.Rendezvous;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RendezvousService implements IRendezvousInterface {

    private final IRendezvousRepo rendezvousRepo;
    private final IConsultatonRepo consultatonRepo;
    private final PatientRepository patientRepository;

    @Override
    public List<Rendezvous> retrieveRendezvous() {
        return rendezvousRepo.findAll();
    }

    @Override
    public Rendezvous addRendezvous(RendezvousDTO dto) {

        Rendezvous r = new Rendezvous();
        r.setDateRendezvous(dto.getDateRendezvous());
        r.setEtat(dto.getEtat());

        if (dto.getIdPatient() != null) {
            Patient patient = patientRepository.findById(dto.getIdPatient())
                    .orElseThrow(() -> new RuntimeException("Patient non trouvé avec ID : " + dto.getIdPatient()));
            r.setPatient(patient);
        }

        if (dto.getIdConsultation() != null) {
            Consultation consultation = consultatonRepo.findById(dto.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée avec ID : " + dto.getIdConsultation()));
            if (consultation.getRendezvous() != null) {
                throw new RuntimeException("Cette consultation a déjà un rendez-vous associé.");
            }
            r.setConsultation(consultation);
        }

        return rendezvousRepo.save(r);
    }

    @Override
    public Rendezvous updateRendezvous(RendezvousDTO dto) {

        Rendezvous existingRdv = rendezvousRepo.findById(dto.getIdRendezvous())
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec ID : " + dto.getIdRendezvous()));

        existingRdv.setDateRendezvous(dto.getDateRendezvous());
        existingRdv.setEtat(dto.getEtat());

        if (dto.getIdPatient() != null) {
            Patient patient = patientRepository.findById(dto.getIdPatient())
                    .orElseThrow(() -> new RuntimeException("Patient non trouvé avec ID : " + dto.getIdPatient()));
            existingRdv.setPatient(patient);
        } else {
            existingRdv.setPatient(null);
        }

        if (dto.getIdConsultation() != null) {
            Consultation consultation = consultatonRepo.findById(dto.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée avec ID : " + dto.getIdConsultation()));
            existingRdv.setConsultation(consultation);
        }

        return rendezvousRepo.save(existingRdv);
    }

    @Override
    public Optional<Rendezvous> retrieveRendezvousById(Integer idRendezvous) {
        return rendezvousRepo.findById(idRendezvous);
    }

    @Override
    public void removeRendezvous(Integer idRendezvous) {
        if (!rendezvousRepo.existsById(idRendezvous)) {
            throw new RuntimeException("Rendez-vous non trouvé avec ID : " + idRendezvous);
        }
        rendezvousRepo.deleteById(idRendezvous);
    }
    @Override
    public List<Rendezvous> findByConsultationIsNull() {
        return rendezvousRepo.findByConsultationIsNull();
    }
}
