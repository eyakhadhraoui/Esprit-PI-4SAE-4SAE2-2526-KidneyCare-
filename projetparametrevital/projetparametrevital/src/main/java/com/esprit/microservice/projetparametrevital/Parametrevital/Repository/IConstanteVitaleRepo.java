package com.esprit.microservice.projetparametrevital.Parametrevital.Repository;

import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ConstanteVitale;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IConstanteVitaleRepo extends JpaRepository<ConstanteVitale,Integer> {
}
