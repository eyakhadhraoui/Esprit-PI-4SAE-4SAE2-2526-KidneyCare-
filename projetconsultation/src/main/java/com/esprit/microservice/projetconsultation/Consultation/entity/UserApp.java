package com.esprit.microservice.projetconsultation.Consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Utilisateur stocké en MySQL, synchronisé depuis Keycloak à chaque login.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserApp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String keycloakSubject;

    private String username;
    private String email;


    private LocalDateTime lastLogin;

    @PreUpdate
    @PrePersist
    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }
}
