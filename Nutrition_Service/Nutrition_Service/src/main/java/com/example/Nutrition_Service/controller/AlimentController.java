package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.AlimentDTO;
import com.example.Nutrition_Service.service.AlimentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aliments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AlimentController {

    private final AlimentService alimentService;

    @PostMapping
    public ResponseEntity<AlimentDTO> createAliment(@Valid @RequestBody AlimentDTO dto) {
        AlimentDTO created = alimentService.createAliment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlimentDTO> updateAliment(@PathVariable Long id, @Valid @RequestBody AlimentDTO dto) {
        AlimentDTO updated = alimentService.updateAliment(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<AlimentDTO>> getAllAliments() {
        List<AlimentDTO> aliments = alimentService.getAllAliments();
        return ResponseEntity.ok(aliments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlimentDTO> getAlimentById(@PathVariable Long id) {
        AlimentDTO aliment = alimentService.getAlimentById(id);
        return ResponseEntity.ok(aliment);
    }

    @GetMapping("/search")
    public ResponseEntity<List<AlimentDTO>> searchByNom(@RequestParam String nom) {
        List<AlimentDTO> aliments = alimentService.searchByNom(nom);
        return ResponseEntity.ok(aliments);
    }

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<AlimentDTO>> getByCategorie(@PathVariable String categorie) {
        List<AlimentDTO> aliments = alimentService.getByCategorie(categorie);
        return ResponseEntity.ok(aliments);
    }

    @GetMapping("/interaction-tacrolimus")
    public ResponseEntity<List<AlimentDTO>> getAlimentsInteractionTacrolimus() {
        List<AlimentDTO> aliments = alimentService.getAlimentsInteractionTacrolimus();
        return ResponseEntity.ok(aliments);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAliment(@PathVariable Long id) {
        alimentService.deleteAliment(id);
        return ResponseEntity.noContent().build();
    }
}