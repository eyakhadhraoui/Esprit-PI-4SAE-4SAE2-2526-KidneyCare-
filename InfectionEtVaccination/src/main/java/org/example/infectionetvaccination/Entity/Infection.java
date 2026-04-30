package org.example.infectionetvaccination.Entity;


import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "infections")
public class Infection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date detectionDate;
    private String severity;
    private String patientName;



    public Date getDetectionDate() {
        return detectionDate;
    }

    public void setDetectionDate(Date detectionDate) {
        this.detectionDate = detectionDate;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }



    public Infection(){}

    public Infection(String type, Date detectionDate, String severity, String treatment, List<Vaccination> vaccinations) {

        this.detectionDate = detectionDate;
        this.severity = severity;

    }

    public Infection( Date detectionDate, String severity, String treatment) {

        this.detectionDate = detectionDate;
        this.severity = severity;

    }

    public void setId(Long id) {
        this.id = id;
    }
}
