package com.example.prescription_Service.controller;

import com.example.prescription_Service.client.NephroPatientClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test de la couche web (contrôleur) sans charger tout le contexte (pas de JPA, Eureka, Keycloak).
 */
@WebMvcTest(controllers = DernierBilanController.class)
@AutoConfigureMockMvc(addFilters = false)
class DernierBilanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NephroPatientClient nephroPatientClient;

    @Test
    void getDernierBilan_retourneIdPatientEtDonneesFeign() throws Exception {
        when(nephroPatientClient.getPatientById(42L)).thenReturn(
                Map.of("idPatient", 42, "username", "u1", "firstName", "A", "lastName", "B", "dateNaissance", "")
        );

        mockMvc.perform(get("/api/bilan/patient/42/dernier"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_patient").value(42))
                .andExpect(jsonPath("$.source_nephro").value(true))
                .andExpect(jsonPath("$.patient.username").value("u1"));
    }
}
