package com.example.NEPHRO.mapper;

import com.example.NEPHRO.Entities.Patient;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PatientApiMapperTest {

    @Test
    void toListItem_mappeLesChampsEtDateNaissanceVide() {
        Patient p = Patient.builder()
                .idPatient(7L)
                .username("alice")
                .email("a@b.c")
                .firstName("Ali")
                .lastName("Ce")
                .dateNaissance(LocalDate.of(1990, 5, 20))
                .dateCreation(LocalDateTime.now())
                .build();

        Map<String, Object> m = PatientApiMapper.toListItem(p);

        assertThat(m.get("idPatient")).isEqualTo(7L);
        assertThat(m.get("username")).isEqualTo("alice");
        assertThat(m.get("firstName")).isEqualTo("Ali");
        assertThat(m.get("lastName")).isEqualTo("Ce");
        assertThat(m.get("dateNaissance")).isEqualTo("1990-05-20");
    }

    @Test
    void toListItem_champsNulls_deviennentChainesVides() {
        Patient p = Patient.builder()
                .idPatient(1L)
                .username(null)
                .email("x@y.z")
                .firstName(null)
                .lastName(null)
                .dateCreation(LocalDateTime.now())
                .build();

        Map<String, Object> m = PatientApiMapper.toListItem(p);

        assertThat(m.get("username")).isEqualTo("");
        assertThat(m.get("firstName")).isEqualTo("");
        assertThat(m.get("lastName")).isEqualTo("");
        assertThat(m.get("dateNaissance")).isEqualTo("");
    }
}
