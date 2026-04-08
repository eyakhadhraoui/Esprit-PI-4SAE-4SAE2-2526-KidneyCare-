package com.example.NEPHRO.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

/** Désérialise RegisterRequest en trimant les chaînes pour éviter 400 (validation @NotBlank après espaces). */
public class RegisterRequestDeserializer extends JsonDeserializer<RegisterRequest> {

    private static String trim(JsonNode n) {
        if (n == null || n.isNull()) return "";
        String s = n.asText("");
        return s != null ? s.trim() : "";
    }

    @Override
    public RegisterRequest deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode root = p.getCodec().readTree(p);
        RegisterRequest req = new RegisterRequest();
        req.setUsername(trim(root.get("username")));
        req.setPassword(trim(root.get("password")));
        req.setEmail(trim(root.get("email")));
        req.setFirstName(trim(root.get("firstName")));
        req.setLastName(trim(root.get("lastName")));
        return req;
    }
}
