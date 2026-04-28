package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Services.PrescriptionBilanService;
import com.example.NEPHRO.Services.ResultatLabtestService;
import com.example.NEPHRO.Services.TraitementBilanPdfService;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.feign.PrescriptionFeignClient;
import com.example.NEPHRO.dto.PrescriptionBilanDTO;
import com.example.NEPHRO.dto.ResultatLabtestDTO;
import com.example.NEPHRO.feign.dto.PrescriptionDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions-bilan")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PrescriptionBilanController {

    private final PrescriptionBilanService prescriptionBilanService;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final ResultatLabtestService resultatLabtestService;
    private final PrescriptionFeignClient prescriptionFeignClient;
    private final TraitementBilanPdfService traitementBilanPdfService;

    @PostMapping
    public ResponseEntity<PrescriptionBilanDTO> create(@Valid @RequestBody PrescriptionBilanDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionBilanService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionBilanDTO> update(@PathVariable Long id, @Valid @RequestBody PrescriptionBilanDTO dto) {
        return ResponseEntity.ok(prescriptionBilanService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        prescriptionBilanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionBilanDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionBilanService.getById(id));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<PrescriptionBilanDTO>> getByDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(prescriptionBilanService.getByDossier(dossierId));
    }

    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<PrescriptionBilanDTO>> getByMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(prescriptionBilanService.getByMedecin(medecinId));
    }

    /**
     * PDF complet pour le médecin : traitement (médicaments actifs du patient via OpenFeign)
     * + résultats de tests (labtest) liés à la demande.
     */
    @GetMapping(value = "/{id}/pdf-complet", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getPdfComplet(@PathVariable Long id) {
        PrescriptionBilanDTO demande = prescriptionBilanService.getById(id);
        if (demande == null || demande.getDossierId() == null) {
            return ResponseEntity.notFound().build();
        }

        Long patientId = dossierMedicalRepository.findById(demande.getDossierId())
                .map(d -> d.getIdPatient())
                .orElse(null);

        List<PrescriptionDTO> meds = patientId != null
                ? prescriptionFeignClient.getActivePrescriptionsByPatient(patientId)
                : List.of();

        List<ResultatLabtestDTO> resultats = resultatLabtestService.getByPrescription(id);

        byte[] pdf = traitementBilanPdfService.generate(patientId, demande, meds, resultats);
        String filename = "rapport-complet-req-" + id + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(pdf);
    }
}
