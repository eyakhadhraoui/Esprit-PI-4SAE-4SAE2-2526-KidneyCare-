package com.esprit.microservice.projetconsultation.Consultation.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Médecin (lien avec Keycloak via username).
 * Un dossier médical référence idMedecin.
 */
@Entity
@Table(name = "medecin", indexes = @Index(unique = true, columnList = "username"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_medecin")
    private Long idMedecin;

    @Column(name = "username", nullable = false, unique = true, length = 255)
    private String username;

    @Column(name = "nom", nullable = false, length = 120)
    private String nom;

    @Column(name = "prenom", length = 120)
    private String prenom;

    @Column(name = "email", length = 255)
    private String email;
}
