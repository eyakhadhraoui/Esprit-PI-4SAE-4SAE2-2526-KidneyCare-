package org.example.infectionetvaccination.Clients;

import org.example.infectionetvaccination.DTO.GraftFunctionEntry;
import org.example.infectionetvaccination.Configs.FeignJacksonConfig;
import org.example.infectionetvaccination.DTO.GraftSurvivalScoreDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "GraftFunctionEntry", url = "http://localhost:8089", configuration = FeignJacksonConfig.class )
public interface GraftFunctionEntryClient {

    @GetMapping("/api/graft-entries/all")
    List<GraftFunctionEntry> getAllGraftFunctionEntry();

    @GetMapping("/api/graft-entries/{id}")
    GraftFunctionEntry getGraftFunctionEntryById(@PathVariable("id") Long id);

    @GetMapping("/api/survival-scores/patient/{patientId}/latest")
    GraftSurvivalScoreDto getLatestByPatientId(@PathVariable("patientId") String patientId);
}
