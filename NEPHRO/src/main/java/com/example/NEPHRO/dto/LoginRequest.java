package com.example.NEPHRO.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Identifiant requis")
    private String username;

    @NotBlank(message = "Mot de passe requis")
    private String password;
}
