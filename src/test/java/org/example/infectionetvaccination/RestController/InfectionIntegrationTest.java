package org.example.infectionetvaccination.RestController;



import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Repository.InfectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Date;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InfectionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InfectionRepository infectionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanUp() {
        infectionRepository.deleteAll();
    }

    // ── POST /infections ──────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /infections — creates infection and returns 201")
    void createInfection_shouldReturn201() throws Exception {
        Infection infection = new Infection("COVID-19", new Date(), "HIGH", "John Doe");

        mockMvc.perform(post("/infections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(infection)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("COVID-19"))
                .andExpect(jsonPath("$.severity").value("HIGH"))
                .andExpect(jsonPath("$.patientName").value("John Doe"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    // ── GET /infections ───────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /infections — returns all infections")
    void getAllInfections_shouldReturnList() throws Exception {
        infectionRepository.save(new Infection("COVID-19", new Date(), "HIGH", "John Doe"));
        infectionRepository.save(new Infection("Flu", new Date(), "LOW", "Jane Doe"));

        mockMvc.perform(get("/infections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].type", containsInAnyOrder("COVID-19", "Flu")));
    }

    @Test
    @DisplayName("GET /infections — returns empty list when none exist")
    void getAllInfections_shouldReturnEmptyListWhenNone() throws Exception {
        mockMvc.perform(get("/infections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── GET /infections/{id} ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /infections/{id} — returns infection when found")
    void getInfectionById_shouldReturnInfection() throws Exception {
        Infection saved = infectionRepository.save(
                new Infection("Flu", new Date(), "MEDIUM", "Alice"));

        mockMvc.perform(get("/infections/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("Flu"))
                .andExpect(jsonPath("$.patientName").value("Alice"));
    }



    // ── PUT /infections/{id} ──────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /infections/{id} — updates and returns updated infection")
    void updateInfection_shouldReturnUpdated() throws Exception {
        Infection saved = infectionRepository.save(
                new Infection("COVID-19", new Date(), "HIGH", "John Doe"));

        Infection updatedPayload = new Infection("Flu", new Date(), "LOW", "Jane Doe");

        mockMvc.perform(put("/infections/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("Flu"))
                .andExpect(jsonPath("$.severity").value("LOW"))
                .andExpect(jsonPath("$.patientName").value("Jane Doe"));
    }

    @Test
    @DisplayName("PUT /infections/{id} — returns 404 when infection does not exist")
    void updateInfection_shouldReturn404WhenNotFound() throws Exception {
        Infection payload = new Infection("Flu", new Date(), "LOW", "Jane");

        mockMvc.perform(put("/infections/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /infections/{id} ───────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /infections/{id} — deletes and returns 204")
    void deleteInfection_shouldReturn204() throws Exception {
        Infection saved = infectionRepository.save(
                new Infection("COVID-19", new Date(), "HIGH", "John Doe"));

        mockMvc.perform(delete("/infections/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/infections/" + saved.getId()))
                .andExpect(status().isNotFound());
    }
}