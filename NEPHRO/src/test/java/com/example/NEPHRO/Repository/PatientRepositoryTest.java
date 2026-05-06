package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.Patient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;

    @Test
    void saveEtFindByUsername() {
        Patient p = Patient.builder()
                .username("repo_user")
                .email("r@test.com")
                .firstName("R")
                .lastName("U")
                .dateCreation(LocalDateTime.now())
                .build();
        patientRepository.save(p);

        Optional<Patient> found = patientRepository.findByUsername("repo_user");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("r@test.com");
    }
}
