package com.example.NEPHRO.mapper;

import com.example.NEPHRO.Entities.Patient;

import java.util.HashMap;
import java.util.Map;

/**
 * Transformation entité {@link Patient} → carte JSON pour l’API liste (logique métier / présentation).
 */
public final class PatientApiMapper {

    private PatientApiMapper() {}

    public static Map<String, Object> toListItem(Patient p) {
        Map<String, Object> m = new HashMap<>();
        m.put("idPatient", p.getIdPatient());
        m.put("username", p.getUsername() != null ? p.getUsername() : "");
        m.put("firstName", p.getFirstName() != null ? p.getFirstName() : "");
        m.put("lastName", p.getLastName() != null ? p.getLastName() : "");
        m.put("dateNaissance", p.getDateNaissance() != null ? p.getDateNaissance().toString() : "");
        return m;
    }
}
