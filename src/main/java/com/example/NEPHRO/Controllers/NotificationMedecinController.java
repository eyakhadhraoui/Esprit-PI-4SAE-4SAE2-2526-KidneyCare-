package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Services.MedecinService;
import com.example.NEPHRO.Services.NotificationMedecinService;
import com.example.NEPHRO.dto.NotificationMedecinDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur des alertes/notifications pour le médecin.
 * Inclut les alertes "médicament non pris" (observance).
 */
@RestController
@RequestMapping("/api/notifications-medecin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationMedecinController {

    private final NotificationMedecinService notificationMedecinService;
    private final MedecinService medecinService;

    /** Liste toutes les notifications du médecin (pour le dashboard). */
    @GetMapping("/medecin/{idMedecin}")
    public ResponseEntity<List<NotificationMedecinDTO>> getByMedecin(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(notificationMedecinService.getByMedecin(idMedecin));
    }

    /** Uniquement les non lues (ex: badge). */
    @GetMapping("/medecin/{idMedecin}/non-lues")
    public ResponseEntity<List<NotificationMedecinDTO>> getNonLues(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(notificationMedecinService.getNonLuesByMedecin(idMedecin));
    }

    /** Nombre de notifications non lues (pour badge). */
    @GetMapping("/medecin/{idMedecin}/count-non-lues")
    public ResponseEntity<Map<String, Long>> countNonLues(@PathVariable Long idMedecin) {
        long count = notificationMedecinService.countNonLuesByMedecin(idMedecin);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/lu")
    public ResponseEntity<Void> marquerCommeLu(@PathVariable Long id) {
        notificationMedecinService.marquerCommeLu(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/medecin/{idMedecin}/toutes-lues")
    public ResponseEntity<Void> marquerToutesCommeLues(@PathVariable Long idMedecin) {
        notificationMedecinService.marquerToutesCommeLues(idMedecin);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint DEV : pousse une notification temps réel au médecin connecté + persiste en base
     * (permet de valider la chaîne WS sans dépendre du flux patient).
     */
    @PostMapping("/me/test-ws")
    public ResponseEntity<?> pushTestToCurrentMedecin(@AuthenticationPrincipal Jwt jwt,
                                                      @RequestBody(required = false) Map<String, Object> body) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username absent du token"));
        }

        var medecin = medecinService.findOrCreateByUsername(username);
        Long idMedecin = medecin != null ? medecin.getIdMedecin() : null;
        if (idMedecin == null || idMedecin <= 0) {
            return ResponseEntity.status(500).body(Map.of("message", "idMedecin introuvable"));
        }

        String nomPatient = body != null ? String.valueOf(body.getOrDefault("patientName", "Patient Démo")) : "Patient Démo";
        String nomTest = body != null ? String.valueOf(body.getOrDefault("testName", "Créatinine")) : "Créatinine";
        String date = body != null ? String.valueOf(body.getOrDefault("date", java.time.LocalDate.now().toString())) : java.time.LocalDate.now().toString();

        // IDs démo : ils servent juste à afficher / naviguer si besoin.
        Long idDossierMedical = 1L;
        Long idResultatLaboratoire = System.currentTimeMillis();

        notificationMedecinService.creerPourNouveauTestLabo(
                idMedecin, idDossierMedical, idResultatLaboratoire, nomPatient, nomTest, date
        );

        return ResponseEntity.accepted().body(Map.of(
                "message", "Notification test envoyée",
                "idMedecin", idMedecin
        ));
    }

    /**
     * POST /api/notifications-medecin/medicament-non-pris
     * Crée une alerte quand un patient n'a pas pris son médicament.
     * Appelé par le service prescription (8086) ou un job planifié.
     */
    @PostMapping("/medicament-non-pris")
    public ResponseEntity<NotificationMedecinDTO> creerAlerteMedicamentNonPris(
            @RequestBody MedicamentNonPrisRequest request) {
        notificationMedecinService.creerPourMedicamentNonPris(
                request.getIdMedecin(),
                request.getIdDossierMedical(),
                request.getIdPatient(),
                request.getNomPatient(),
                request.getNomMedicament(),
                request.getDatePrise());
        return ResponseEntity.accepted().build();
    }

    /** Requête pour créer une alerte "médicament non pris". */
    @lombok.Data
    public static class MedicamentNonPrisRequest {
        private Long idMedecin;
        private Long idDossierMedical;
        private Long idPatient;
        private String nomPatient;
        private String nomMedicament;
        private String datePrise;
    }
}
