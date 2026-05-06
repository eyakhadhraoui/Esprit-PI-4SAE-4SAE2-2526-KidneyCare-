package com.example.NEPHRO.dto;

import com.example.NEPHRO.Enum.StatutPrescription;
import com.example.NEPHRO.Enum.TypeBilan;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionBilanDTO {
    private Long id;
    @NotNull private Long dossierId;
    @NotNull private Long medecinId;
    @NotNull private LocalDateTime datePrescription;
    private TypeBilan typeBilan;
    /** Libellé français (affichage patient / listes). */
    private String typeBilanLibelle;
    private List<String> examens;
    private Boolean urgence;
    private Long laboId;
    /** Nom du laboratoire (résolu côté API, ex. depuis laboId). */
    private String laboLibelle;
    /** « Dr. Prénom Nom » — résolu depuis medecinId. */
    private String medecinNomComplet;
    private StatutPrescription statut;
    private String noteClinique;
}
