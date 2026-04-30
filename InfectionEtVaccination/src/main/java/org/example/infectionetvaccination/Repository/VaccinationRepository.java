package org.example.infectionetvaccination.Repository;

import org.example.infectionetvaccination.Entity.Vaccination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {
    List<Vaccination> findByInfectionId(Long infectionId);

}