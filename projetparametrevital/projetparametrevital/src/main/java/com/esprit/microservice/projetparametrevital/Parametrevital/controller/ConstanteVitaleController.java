package com.esprit.microservice.projetparametrevital.Parametrevital.controller;

import com.esprit.microservice.projetparametrevital.Parametrevital.Services.IConstanteVitaleInterface;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ConstanteVitaleDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ConstanteVitale;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/constanteVitale")
public class ConstanteVitaleController {

    @Autowired
    IConstanteVitaleInterface iConstanteVitaleInterface;

    // Retrieve all constantes vitales
    @GetMapping("/retrieveConstantesVitales")
    public List<ConstanteVitale> retrieveConstantesVitales() {
        return iConstanteVitaleInterface.retrieveConstantesVitales();
    }

    // Add constante vitale
    @PostMapping("/addConstanteVitale")
    public ConstanteVitale addConstanteVitale(@RequestBody ConstanteVitaleDTO dto) {
        return iConstanteVitaleInterface.addConstanteVitale(dto);
    }

    // Update constante vitale (DTO : évite erreurs 400 JSON → entité JPA avec relations)
    @PutMapping("/updateConstanteVitale/{id}")
    public ConstanteVitale updateConstanteVitale(
            @PathVariable("id") Integer id,
            @RequestBody ConstanteVitaleDTO dto) {
        return iConstanteVitaleInterface.updateConstanteVitale(id, dto);
    }

    // Retrieve constante vitale by id
    @GetMapping("/retrieveConstanteVitale/{constanteVitale-id}")
    public Optional<ConstanteVitale> retrieveConstanteVitale(
            @PathVariable("constanteVitale-id") Integer idConstanteVitale) {
        return iConstanteVitaleInterface.retrieveConstanteVitale(idConstanteVitale);
    }

    // Delete constante vitale
    @DeleteMapping("/removeConstanteVitale/{constanteVitale-id}")
    public void removeConstanteVitale(
            @PathVariable("constanteVitale-id") Integer idConstanteVitale) {
        iConstanteVitaleInterface.removeConstanteVitale(idConstanteVitale);
    }
}
