package com.esprit.microservice.projetparametrevital.Parametrevital.controller;

import com.esprit.microservice.projetparametrevital.Parametrevital.Services.IIndicateurVitalInterface;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.IndicateurVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.IndicateurVital;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/indicateurVital")
public class IndicateurVitalController {

    IIndicateurVitalInterface iIndicateurVitalInterface;

    @GetMapping("/retrieveIndicateursVital")
    public List<IndicateurVital> retrieveIndicateursVital() {
        return iIndicateurVitalInterface.retrieveIndicateursVital();
    }

    @PostMapping("/addIndicateurVital")
    public IndicateurVital addIndicateurVital(@RequestBody IndicateurVital indicateurVital) {
        return iIndicateurVitalInterface.addIndicateurVital(indicateurVital);
    }

    @PutMapping("/updateIndicateurVital/{id}")
    public IndicateurVital updateIndicateurVital(
            @PathVariable("id") Integer id,
            @RequestBody IndicateurVitalDTO dto) {
        return iIndicateurVitalInterface.updateIndicateurVital(id, dto);
    }

    @GetMapping("/retrieveIndicateurVital/{id}")
    public Optional<IndicateurVital> retrieveIndicateurVital(@PathVariable Integer id) {
        return iIndicateurVitalInterface.retrieveIndicateurVital(id);
    }

    @DeleteMapping("/removeIndicateurVital/{id}")
    public void removeIndicateurVital(@PathVariable Integer id) {
        iIndicateurVitalInterface.removeIndicateurVital(id);
    }
}