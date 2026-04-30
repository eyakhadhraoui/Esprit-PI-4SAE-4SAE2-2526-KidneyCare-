package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ConstanteVitaleDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ConstanteVitale;

import java.util.List;
import java.util.Optional;

public interface IConstanteVitaleInterface {
    List<ConstanteVitale> retrieveConstantesVitales();

    ConstanteVitale addConstanteVitale(ConstanteVitaleDTO dto);

    /** Mise à jour à partir du DTO (même contrat que {@link #addConstanteVitale}). */
    ConstanteVitale updateConstanteVitale(Integer id, ConstanteVitaleDTO dto);

    Optional<ConstanteVitale> retrieveConstanteVitale(Integer idConstanteVitale);

    void removeConstanteVitale(Integer idConstanteVitale);
}
