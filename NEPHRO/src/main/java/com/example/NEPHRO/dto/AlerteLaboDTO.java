package com.example.NEPHRO.dto;

import com.example.NEPHRO.Enum.TypeAlerteLabo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteLaboDTO {
    private Long id;
    private Long resultatId;
    private Long prescriptionId;
    /** Dossier du résultat (pour lien métier / affichage). */
    private Long dossierId;
    /** Nom du patient concerné (résolu côté serveur). */
    private String patientNom;
    private TypeAlerteLabo typeAlerte;
    private String message;
    private Long acquitteePar;
    private LocalDateTime dateAcquittement;
    private String actionRealisee;
}
