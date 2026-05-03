package org.example.foncgreffon.Entity;

import org.example.foncgreffon.Repository.GraftFunctionEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class GraftFunctionEntryIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private GraftFunctionEntryRepository repository;

    private GraftFunctionEntry sampleEntry;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        sampleEntry = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 6, 15),
                1.2, 55.0, 1500.0, 8.5,
                120.0, 80.0, 70.0, 37.1,
                "ROUTINE", "Stable", LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("POST /api/graft-entries — creates entry and returns it")
    void createEntry_shouldReturn201() {
        ResponseEntity<GraftFunctionEntry> response = restTemplate.postForEntity(
                url("/api/graft-entries"), sampleEntry, GraftFunctionEntry.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getPatientId()).isEqualTo("patient-001");
        assertThat(response.getBody().getCreatinine()).isEqualTo(1.2);
        assertThat(response.getBody().geteGFR()).isEqualTo(55.0);
        assertThat(response.getBody().getCollectionType()).isEqualTo("ROUTINE");
        assertThat(response.getBody().getId()).isNotNull();
    }

    @Test
    @DisplayName("GET /api/graft-entries — returns all entries")
    void getAllEntries_shouldReturnList() {
        repository.save(sampleEntry);
        GraftFunctionEntry second = new GraftFunctionEntry(
                "patient-002", LocalDate.now(),
                1.5, 45.0, 1200.0, 9.0,
                130.0, 85.0, 75.0, 37.3,
                "URGENT", "Rising creatinine", LocalDateTime.now()
        );
        repository.save(second);

        ResponseEntity<GraftFunctionEntry[]> response = restTemplate.getForEntity(
                url("/api/graft-entries"), GraftFunctionEntry[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        List<String> patientIds = Arrays.stream(response.getBody())
                .map(GraftFunctionEntry::getPatientId)
                .toList();
        assertThat(patientIds).containsExactlyInAnyOrder("patient-001", "patient-002");
    }

    @Test
    @DisplayName("GET /api/graft-entries/{id} — returns entry when found")
    void getById_shouldReturnEntry() {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        ResponseEntity<GraftFunctionEntry> response = restTemplate.getForEntity(
                url("/api/graft-entries/" + saved.getId()), GraftFunctionEntry.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getPatientId()).isEqualTo("patient-001");
        assertThat(response.getBody().geteGFR()).isEqualTo(55.0);
    }

    @Test
    @DisplayName("GET /api/graft-entries/{id} — returns 404 when not found")
    void getById_shouldReturn404() {
        ResponseEntity<Void> response = restTemplate.getForEntity(
                url("/api/graft-entries/99999"), Void.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("GET /api/graft-entries/patient/{patientId} — returns patient entries ordered by date desc")
    void getByPatientId_shouldReturnOrderedEntries() {
        GraftFunctionEntry older = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 1, 1),
                1.0, 60.0, 1600.0, 7.5,
                115.0, 75.0, 69.0, 37.0,
                "ROUTINE", "Old entry", LocalDateTime.now()
        );
        GraftFunctionEntry newer = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 6, 1),
                1.4, 48.0, 1300.0, 9.0,
                125.0, 82.0, 71.0, 37.2,
                "ROUTINE", "Newer entry", LocalDateTime.now()
        );
        repository.save(older);
        repository.save(newer);

        ResponseEntity<GraftFunctionEntry[]> response = restTemplate.getForEntity(
                url("/api/graft-entries/patient/patient-001"), GraftFunctionEntry[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody()[0].getMeasurementDate()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(response.getBody()[1].getMeasurementDate()).isEqualTo(LocalDate.of(2024, 1, 1));
    }

    @Test
    @DisplayName("PUT /api/graft-entries/{id} — updates entry fields")
    void updateEntry_shouldReturnUpdated() {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        GraftFunctionEntry payload = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 8, 1),
                2.0, 35.0, 1000.0, 11.0,
                140.0, 90.0, 73.0, 37.8,
                "URGENT", "Creatinine spike", LocalDateTime.now()
        );

        HttpEntity<GraftFunctionEntry> request = new HttpEntity<>(payload);
        ResponseEntity<GraftFunctionEntry> response = restTemplate.exchange(
                url("/api/graft-entries/" + saved.getId()),
                HttpMethod.PUT, request, GraftFunctionEntry.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCreatinine()).isEqualTo(2.0);
        assertThat(response.getBody().geteGFR()).isEqualTo(35.0);
        assertThat(response.getBody().getCollectionType()).isEqualTo("URGENT");
    }

    @Test
    @DisplayName("PUT /api/graft-entries/{id} — returns 404 when not found")
    void updateEntry_shouldReturn404WhenNotFound() {
        HttpEntity<GraftFunctionEntry> request = new HttpEntity<>(sampleEntry);
        ResponseEntity<Void> response = restTemplate.exchange(
                url("/api/graft-entries/99999"),
                HttpMethod.PUT, request, Void.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("DELETE /api/graft-entries/{id} — deletes and confirms removal")
    void deleteEntry_shouldReturn204AndRemove() {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                url("/api/graft-entries/" + saved.getId()),
                HttpMethod.DELETE, null, Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<Void> getResponse = restTemplate.getForEntity(
                url("/api/graft-entries/" + saved.getId()), Void.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
