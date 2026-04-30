package org.example.infectionetvaccination.Entity;


import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "vaccinations")
public class Vaccination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Date vaccination_date;
    private Date booster_date;
    private Long infectionId;
    private boolean taken;
    private boolean booster_taken;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getVaccination_date() {
        return vaccination_date;
    }

    public void setVaccination_date(Date vaccination_date) {
        this.vaccination_date = vaccination_date;
    }

    public Date getBooster_date() {
        return booster_date;
    }

    public void setBooster_date(Date booster_date) {
        this.booster_date = booster_date;
    }

    public Long getInfectionId() {
        return infectionId;
    }

    public void setInfectionId(Long infectionId) {
        this.infectionId = infectionId;
    }

    public boolean isTaken() {
        return taken;
    }

    public void setTaken(boolean taken) {
        this.taken = taken;
    }

    public boolean isBooster_taken() {
        return booster_taken;
    }

    public void setBooster_taken(boolean booster_taken) {
        this.booster_taken = booster_taken;
    }



    public Vaccination(){}

    public Vaccination(String name, Date vaccination_date, Date booster_date, boolean taken, Long infectionId, boolean booster_taken) {
        this.name = name;
        this.vaccination_date = vaccination_date;
        this.booster_date = booster_date;
        this.taken = taken;
        this.infectionId = infectionId;
        this.booster_taken = booster_taken;
    }

    public Vaccination(String name, Date vaccination_date, Date booster_date) {
        this.name = name;
        this.vaccination_date = vaccination_date;
        this.booster_date = booster_date;
    }

    public void setId(Long id) {
        this.id = id;
    }
}