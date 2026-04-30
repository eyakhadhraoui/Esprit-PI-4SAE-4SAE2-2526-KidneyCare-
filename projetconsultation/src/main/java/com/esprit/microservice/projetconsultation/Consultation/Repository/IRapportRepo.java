package com.esprit.microservice.projetconsultation.Consultation.Repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IRapportRepo extends JpaRepository<Rapport,Integer> {
}
