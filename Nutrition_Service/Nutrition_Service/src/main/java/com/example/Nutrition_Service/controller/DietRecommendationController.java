package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.DietRecommendationDTO;
import com.example.Nutrition_Service.service.DietCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nutrition")
@CrossOrigin(origins = "http://localhost:4200")
public class DietRecommendationController {

    @Autowired
    DietCalculatorService dietCalculatorService;

    @GetMapping("/diet-recommendation/{patientId}")
    public ResponseEntity<DietRecommendationDTO> getRecommendation(
            @PathVariable Long patientId) {

        return dietCalculatorService.calculate(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}