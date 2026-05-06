package org.example.foncgreffon.Clients;

import org.example.foncgreffon.DTO.ResultatLaboratoireDTO;
import org.example.foncgreffon.config.FeignJacksonConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Client Feign pour accéder aux résultats de laboratoire du microservice NEPHRO (DossierMedical).
 * Utilisé par FoncGreffon pour enrichir le suivi du greffon avec les données biologiques.
 *
 * Communication inter-services : FoncGreffon → DossierMedical (port 8089)
 */
@FeignClient(
        name = "DossierMedical",
        url = "http://localhost:8089",
        configuration = FeignJacksonConfig.class
)
public interface NephroLaboClient {

    /**
     * Récupère tous les résultats de laboratoire d'un dossier médical.
     * Endpoint NEPHRO : GET /api/resultats-laboratoire/dossier/{idDossierMedical}
     */
    @GetMapping("/api/resultats-laboratoire/dossier/{idDossierMedical}")
    List<ResultatLaboratoireDTO> getResultatsByDossier(@PathVariable("idDossierMedical") Long idDossierMedical);

    /**
     * Récupère tous les résultats de laboratoire (tous dossiers).
     * Endpoint NEPHRO : GET /api/resultats-laboratoire
     */
    @GetMapping("/api/resultats-laboratoire")
    List<ResultatLaboratoireDTO> getAllResultats();
}
