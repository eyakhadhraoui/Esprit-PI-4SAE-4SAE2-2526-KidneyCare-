package com.esprit.microservice.projetparametrevital.Parametrevital.controller;

import com.esprit.microservice.projetparametrevital.Parametrevital.Services.IParametreVitalInterface;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ParametreVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ParametreVital;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/parametreVital")
public class ParametreVitalController {

    @Autowired
    IParametreVitalInterface iParametreVitalInterface;

    // Retrieve all parametres vitaux
    @GetMapping("/retrieveParametresVitaux")
    public List<ParametreVital> retrieveParametresVitaux() {
        return iParametreVitalInterface.retrieveParametresVitaux();
    }

    // Add parametre vital
    @PostMapping("/addParametreVital")
    public ParametreVital addParametreVital(@RequestBody ParametreVitalDTO dto) {
        return iParametreVitalInterface.addParametreVital(dto);
    }

    // Update parametre vital (DTO : noms alignés sur referenceMin/referenceMax, pas d’entité JPA partielle)
    @PutMapping("/updateParametreVital/{id}")
    public ParametreVital updateParametreVital(
            @PathVariable("id") Integer id,
            @RequestBody ParametreVitalDTO dto) {
        return iParametreVitalInterface.updateParametreVital(id, dto);
    }

    // Retrieve parametre vital by id
    @GetMapping("/retrieveParametreVital/{parametreVital-id}")
    public Optional<ParametreVital> retrieveParametreVital(
            @PathVariable("parametreVital-id") Integer idParametreVital) {
        return iParametreVitalInterface.retrieveParametreVital(idParametreVital);
    }

    // Delete parametre vital
    @DeleteMapping("/removeParametreVital/{parametreVital-id}")
    public void removeParametreVital(
            @PathVariable("parametreVital-id") Integer idParametreVital) {
        iParametreVitalInterface.removeParametreVital(idParametreVital);
    }
}
