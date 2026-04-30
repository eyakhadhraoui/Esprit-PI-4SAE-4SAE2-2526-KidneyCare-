package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.Services.IRendezvousInterface;
import com.esprit.microservice.projetconsultation.Consultation.dto.RendezvousDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Rendezvous;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rendezvous")
public class RendezvousController {

    private final IRendezvousInterface iRendezvousInterface;

    @GetMapping("/retrieveRendezvous")
    public List<Rendezvous> retrieveRendezvous() {
        return iRendezvousInterface.retrieveRendezvous();
    }

    @PostMapping("/addRendezvous")
    public Rendezvous addRendezvous(@RequestBody RendezvousDTO rendezvousDTO) {
        return iRendezvousInterface.addRendezvous(rendezvousDTO);
    }

    @PutMapping("/updateRendezvous")
    public Rendezvous updateRendezvous(@RequestBody RendezvousDTO rendezvousDTO) {
        return iRendezvousInterface.updateRendezvous(rendezvousDTO);
    }

    @GetMapping("/retrieveRendezvous/{id}")
    public Optional<Rendezvous> retrieveRendezvousById(@PathVariable Integer id) {
        return iRendezvousInterface.retrieveRendezvousById(id);
    }

    @DeleteMapping("/removeRendezvous/{id}")
    public void removeRendezvous(@PathVariable Integer id) {
        iRendezvousInterface.removeRendezvous(id);
    }
    @GetMapping("/disponibles")
    public List<Rendezvous> getDisponibles() {
        return iRendezvousInterface.findByConsultationIsNull();
    }
}
