package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.Services.IRapportInterface;
import com.esprit.microservice.projetconsultation.Consultation.dto.RapportDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Rapport;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/rapport")
public class RapportController {
    @Autowired
    IRapportInterface iRapportInterface;


    @GetMapping("/retrieveRapports")
    public List<Rapport> retrieveRapports() {
        return iRapportInterface.retrieveRapports();
    }


    @PostMapping("/addRapport")
    public Rapport addRapport(@RequestBody RapportDTO rapportDTO) {
        return iRapportInterface.addRapport(rapportDTO);
    }



    @PutMapping("/updateRapport")
    public Rapport updateRapport(@RequestBody RapportDTO rapportDTO) {
        return iRapportInterface.updateRapport(rapportDTO);
    }


    @GetMapping("/retrieveRapport/{rapport-id}")
    public Rapport retrieveRapport(@PathVariable("rapport-id") Integer idRapport) {
        return iRapportInterface.retrieveRapport(idRapport)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé : " + idRapport));
    }

    // Delete rapport
    @DeleteMapping("/removeRapport/{rapport-id}")
    public void removeRapport(@PathVariable("rapport-id") Integer idRapport) {
        iRapportInterface.removeRapport(idRapport);
    }
}
