package com.esprit.microservice.projetparametrevital.Parametrevital.Repository;

import com.esprit.microservice.projetparametrevital.Parametrevital.entity.IndicateurVital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IIndicateurVitalRepo extends JpaRepository<IndicateurVital, Integer> {
}
