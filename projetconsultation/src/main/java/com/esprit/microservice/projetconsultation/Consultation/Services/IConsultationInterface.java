package com.esprit.microservice.projetconsultation.Consultation.Services;

import com.esprit.microservice.projetconsultation.Consultation.dto.AddConsultationRequest;
import com.esprit.microservice.projetconsultation.Consultation.entity.Consultation;

import java.util.List;
import java.util.Optional;

public interface IConsultationInterface {
    List<Consultation> retrieveConsultations();

    Consultation addConsultation(AddConsultationRequest request);

    Consultation addConsultationEntity(Consultation consultation);

    Consultation updateConsultation(Consultation consultation);

    Optional<Consultation> retrieveConsultation(Integer idConsultation);

    void removeConsultation(Integer idConsultation);
}
