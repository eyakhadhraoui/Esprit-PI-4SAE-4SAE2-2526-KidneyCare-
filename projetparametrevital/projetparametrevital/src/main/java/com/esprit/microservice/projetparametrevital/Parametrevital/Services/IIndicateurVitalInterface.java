package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.dto.IndicateurVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.IndicateurVital;

import java.util.List;
import java.util.Optional;

public interface IIndicateurVitalInterface {

    List<IndicateurVital> retrieveIndicateursVital();

    IndicateurVital addIndicateurVital(IndicateurVital indicateurVital);

    IndicateurVital updateIndicateurVital(Integer id, IndicateurVitalDTO dto);

    Optional<IndicateurVital> retrieveIndicateurVital(Integer idIndicateurVital);

    void removeIndicateurVital(Integer idIndicateurVital);
}
