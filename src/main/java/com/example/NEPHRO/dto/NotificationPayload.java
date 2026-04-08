package com.example.NEPHRO.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Payload envoyé au patient via WebSocket (nouvelle image médicale, etc.).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPayload {

    public static final String TYPE_IMAGE_MEDICALE = "IMAGE_MEDICALE";
    public static final String TYPE_SUIVI = "SUIVI";
    /** K+, DFG, etc. — urgence vitale. */
    public static final String TYPE_LAB_CRITIQUE = "LAB_CRITIQUE";
    /** Anomalie à surveiller (ex. K+ modérément élevé). */
    public static final String TYPE_LAB_PREVENTIF = "LAB_PREVENTIF";
    /** Prescription avec examens non réalisés après délai. */
    public static final String TYPE_LAB_RAPPEL_TEST = "LAB_RAPPEL_TEST";

    private String type;
    private String titre;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Long idDossierMedical;
    private Long idItem;
    /** Prescription de bilan concernée (rappel test non fait). */
    private Long idPrescription;
}
