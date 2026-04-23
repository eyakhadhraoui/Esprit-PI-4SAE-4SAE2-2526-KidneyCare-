package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.MenuJournalierDTO;
import com.example.Nutrition_Service.service.MenuGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nutrition")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class MenuController {

    private final MenuGeneratorService menuService;

    @GetMapping("/menus-semaine/{patientId}")
    public ResponseEntity<Map<String, List<MenuJournalierDTO>>> getMenusSemaine(
            @PathVariable Long patientId) {
        try {
            return ResponseEntity.ok(menuService.genererMenusSemaine(patientId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
