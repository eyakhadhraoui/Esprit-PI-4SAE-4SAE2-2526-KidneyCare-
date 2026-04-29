package org.example.infectionetvaccination.RestController;

import org.example.infectionetvaccination.DTO.GraftFunctionEntry;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Service.InfectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/infections")
public class InfectionRestController {

    private final InfectionService infectionService;

    public InfectionRestController(InfectionService infectionService) {
        this.infectionService = infectionService;
    }


    @PostMapping
    public Infection create(@RequestBody Infection infection) { return infectionService.save(infection); }

    @GetMapping
    public List<Infection> getAll() { return infectionService.findAll(); }

    @GetMapping("/{id}")
    public Infection getById(@PathVariable int id) { return infectionService.findById(id).orElseThrow(); }

    @PutMapping("/{id}")
    public ResponseEntity<Infection> update(@PathVariable int id, @RequestBody Infection infection) {
        try {
            Infection updated = infectionService.update(id, infection);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            // The service throws RuntimeException with message "Infection not found: " + id
            return ResponseEntity.notFound().build();
        }}


            @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) { infectionService.delete(id); }


    @GetMapping("/api/graft-entries/all")
    public List<GraftFunctionEntry> getAllGraftFunctionEntry() {
        return infectionService.getAllGraftFunctionEntry();
    }
    @GetMapping("/GraftFunctionEntry/{id}")
    public GraftFunctionEntry getGraftFunctionEntryById(@PathVariable int id) {
        return infectionService.getGraftFunctionEntryById(id);
    }


}