package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Services.LabAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lab-analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LabAnalysisController {

    private final LabAnalysisService labAnalysisService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> analyze(
            @RequestBody Map<String, Object> payload,
            @RequestParam(name = "aiConclusion", defaultValue = "false") boolean aiConclusion) {
        return ResponseEntity.ok(labAnalysisService.analyze(payload, aiConclusion));
    }
}
