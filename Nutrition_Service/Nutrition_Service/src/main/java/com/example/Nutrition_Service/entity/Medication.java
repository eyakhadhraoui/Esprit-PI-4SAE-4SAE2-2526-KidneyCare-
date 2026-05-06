package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medication")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "category")
    private String category;

    @Column(name = "is_immunosuppressor")
    private Boolean isImmunosuppressor;

    @Column(name = "active_ingredient")
    private String activeIngredient;

    // getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public Boolean getIsImmunosuppressor() { return isImmunosuppressor; }
    public String getActiveIngredient() { return activeIngredient; }
}