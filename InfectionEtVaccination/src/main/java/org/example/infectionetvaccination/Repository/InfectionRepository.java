package org.example.infectionetvaccination.Repository;


import org.example.infectionetvaccination.Entity.Infection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InfectionRepository extends JpaRepository<Infection, Long> {
    List<Infection> findByPatientName(String patientName);
}