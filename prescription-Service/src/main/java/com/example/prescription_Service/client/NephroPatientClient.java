package com.example.prescription_Service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

/**
 * Client déclaratif vers le microservice NEPHRO (DossierMedical) pour les données patient.
 * L’URL est configurable ; en production avec Eureka, on peut retirer {@code url} et utiliser le nom du service.
 */
@FeignClient(
        name = "nephro-patient-client",
        url = "${nephro.service.url:http://localhost:8089}",
        configuration = NephroFeignConfig.class
)
public interface NephroPatientClient {

    @GetMapping("/api/patients")
    List<Map<String, Object>> listPatients();

    @GetMapping("/api/patients/by-id/{idPatient}")
    Map<String, Object> getPatientById(@PathVariable("idPatient") Long idPatient);
}
