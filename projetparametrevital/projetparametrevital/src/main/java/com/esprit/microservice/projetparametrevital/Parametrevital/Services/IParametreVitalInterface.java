package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ParametreVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ParametreVital;

import java.util.List;
import java.util.Optional;

public interface IParametreVitalInterface {
    List<ParametreVital> retrieveParametresVitaux();

    ParametreVital addParametreVital(ParametreVitalDTO dto);

    ParametreVital updateParametreVital(Integer id, ParametreVitalDTO dto);

    Optional<ParametreVital> retrieveParametreVital(Integer idParametreVital);

    void removeParametreVital(Integer idParametreVital);
}
