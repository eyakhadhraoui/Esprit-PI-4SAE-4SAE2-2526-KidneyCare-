package com.example.NEPHRO.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RapportBilanDTO {
    private Long id;
    @NotNull private Long dossierId;
    @NotNull private LocalDate periodeDebut;
    @NotNull private LocalDate periodeFin;
    private List<Long> resultatsIds;
    private String commentaireMedecin;
    private String pdfUrl;
    private Boolean partageFamille;
    private LocalDateTime dateGeneration;
    private Long generePar;
    /** Lien vers la prescription labo (non obligatoire). */
    private Long prescriptionId;
    /** Data URL PNG de la signature (non obligatoire côté validation). */
    private String signatureDataUrl;
    /** Si true, envoi d’un email au patient après création (non persisté). */
    private Boolean notifyPatient;
}
