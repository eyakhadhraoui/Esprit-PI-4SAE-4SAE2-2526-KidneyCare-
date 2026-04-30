package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.SubstitutDTO;
import com.example.Nutrition_Service.service.SubstitutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/substituts")
@RequiredArgsConstructor
public class SubstitutController {

    private final SubstitutService SubstitutService;

    @GetMapping("/{patientId}/aliment/{alimentId}")
    public ResponseEntity<List<SubstitutDTO>> getSubstituts(
            @PathVariable Long patientId,
            @PathVariable Long alimentId) {
        return ResponseEntity.ok(SubstitutService.trouverSubstituts(patientId, alimentId));
    }
}