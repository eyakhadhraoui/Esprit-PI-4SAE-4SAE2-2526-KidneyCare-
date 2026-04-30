package com.esprit.microservice.projetparametrevital.Parametrevital.Repository;

import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ParametreVital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IParametreVitalRepo extends JpaRepository<ParametreVital,Integer> {
}
