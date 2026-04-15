package org.example.infectionetvaccination.Clients;

import org.example.infectionetvaccination.DTO.GraftSurvivalScoreDto;
import org.example.infectionetvaccination.Configs.FeignJacksonConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
        name = "graftSurvivalScore",
        url = "http://localhost:8089",
        configuration = FeignJacksonConfig.class
)
public interface GraftSurvivalScoreClient {

    // Fetch the latest score for a patient (most common use case)
    @GetMapping("/api/survival-scores/patient/{patientId}/latest")
    GraftSurvivalScoreDto getLatestScoreByPatientId(@PathVariable("patientId") String patientId);

    // Fetch all scores for a patient (historical)
    @GetMapping("/api/survival-scores/patient/{patientId}")
    List<GraftSurvivalScoreDto> getScoresByPatientId(@PathVariable("patientId") String patientId);

    // Fetch a single score by its ID
    @GetMapping("/api/survival-scores/{id}")
    GraftSurvivalScoreDto getScoreById(@PathVariable("id") Long id);
}