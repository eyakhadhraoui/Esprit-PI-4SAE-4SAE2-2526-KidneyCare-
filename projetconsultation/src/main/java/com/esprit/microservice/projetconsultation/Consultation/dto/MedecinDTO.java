package com.esprit.microservice.projetconsultation.Consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedecinDTO {

    private Long idMedecin;
    private String username;
    private String nom;
    private String prenom;
}
