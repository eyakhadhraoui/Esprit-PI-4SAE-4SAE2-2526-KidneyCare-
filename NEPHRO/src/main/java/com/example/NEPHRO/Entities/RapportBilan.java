package com.example.NEPHRO.Entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Rapport de bilan : période, résultats inclus, commentaire médecin, PDF, partage famille.
 */
@Entity
@Table(name = "rapport_bilan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportBilan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "periode_debut", nullable = false)
    private LocalDate periodeDebut;

    @Column(name = "periode_fin", nullable = false)
    private LocalDate periodeFin;

    /** IDs des résultats inclus dans ce rapport. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "rapport_bilan_resultats", joinColumns = @JoinColumn(name = "rapport_id"))
    @Column(name = "resultat_id")
    @Builder.Default
    private List<Long> resultatsIds = new ArrayList<>();

    @Column(name = "commentaire_medecin", columnDefinition = "TEXT")
    private String commentaireMedecin;

    @Column(name = "pdf_url", length = 512)
    private String pdfUrl;

    @Column(name = "partage_famille", nullable = false)
    @Builder.Default
    private Boolean partageFamille = false;

    @Column(name = "date_generation", nullable = false)
    private LocalDateTime dateGeneration;

    @Column(name = "genere_par", nullable = false)
    private Long generePar;

    /** Demande de labo liée (optionnel). */
    @Column(name = "prescription_id")
    private Long prescriptionId;

    /** Image PNG base64 (data URL) de la signature numérique du médecin. */
    @Lob
    @Column(name = "signature_data_url", columnDefinition = "LONGTEXT")
    private String signatureDataUrl;
}
