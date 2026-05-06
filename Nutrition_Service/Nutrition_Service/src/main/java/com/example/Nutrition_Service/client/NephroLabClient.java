package com.example.Nutrition_Service.client;

import com.example.Nutrition_Service.dto.ResultatLaboratoireDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Client Feign déclaratif vers le microservice NEPHRO (DossierMedical, port 8089).
 * Récupère les résultats de laboratoire d'un dossier médical pour adapter
 * les recommandations nutritionnelles (potassium, phosphore, protéines, etc.).
 */
@FeignClient(
        name = "nephro-lab-client",
        url = "${nephro.service.url:http://localhost:8089}",
        configuration = NephroFeignConfig.class
)
public interface NephroLabClient {

    /**
     * Récupère tous les résultats de labo d'un dossier médical.
     * Endpoint NEPHRO : GET /api/resultats-laboratoire/dossier/{idDossierMedical}
     */
    @GetMapping("/api/resultats-laboratoire/dossier/{idDossierMedical}")
    List<ResultatLaboratoireDTO> getResultatsByDossier(@PathVariable("idDossierMedical") Long idDossierMedical);

    /**
     * Récupère tous les résultats de labo (tous dossiers).
     * Endpoint NEPHRO : GET /api/resultats-laboratoire
     */
    @GetMapping("/api/resultats-laboratoire")
    List<ResultatLaboratoireDTO> getAllResultats();
}
