package com.example.NEPHRO.feign;

import com.example.NEPHRO.feign.dto.PrescriptionDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Client OpenFeign vers prescription-Service (port 8086).
 * L'Authorization Bearer est propagé automatiquement via {@link com.example.NEPHRO.feign.config.FeignAuthConfig}.
 */
@FeignClient(
        name = "prescription-service",
        url = "${prescription.service.url:http://localhost:8086}",
        configuration = com.example.NEPHRO.feign.config.FeignAuthConfig.class
)
public interface PrescriptionFeignClient {

    @GetMapping("/api/prescriptions/patient/{patientId}/active")
    List<PrescriptionDTO> getActivePrescriptionsByPatient(@PathVariable("patientId") Long patientId);
}

