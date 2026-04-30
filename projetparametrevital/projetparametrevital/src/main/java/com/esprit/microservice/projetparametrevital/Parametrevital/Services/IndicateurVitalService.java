package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.Repository.IIndicateurVitalRepo;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.IndicateurVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.IndicateurVital;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IndicateurVitalService implements IIndicateurVitalInterface {

    @Autowired
    private IIndicateurVitalRepo indicateurVitalRepo;

    @Override
    public List<IndicateurVital> retrieveIndicateursVital() {
        return indicateurVitalRepo.findAll();
    }

    @Override
    public IndicateurVital addIndicateurVital(IndicateurVital indicateurVital) {
        if (indicateurVital.getActif() == null) {
            indicateurVital.setActif(true);
        }
        return indicateurVitalRepo.save(indicateurVital);
    }

    @Override
    public IndicateurVital updateIndicateurVital(Integer id, IndicateurVitalDTO dto) {
        IndicateurVital e = indicateurVitalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("IndicateurVital non trouvé avec ID = " + id));
        if (dto.getNomIndicateur() != null) {
            e.setNomIndicateur(dto.getNomIndicateur());
        }
        if (dto.getUnite() != null) {
            e.setUnite(dto.getUnite());
        }
        if (dto.getDescription() != null) {
            e.setDescription(dto.getDescription());
        }
        if (dto.getActif() != null) {
            e.setActif(dto.getActif());
        }
        return indicateurVitalRepo.save(e);
    }

    @Override
    public Optional<IndicateurVital> retrieveIndicateurVital(Integer idIndicateurVital) {
        return indicateurVitalRepo.findById(idIndicateurVital);
    }

    @Override
    public void removeIndicateurVital(Integer idIndicateurVital) {
        indicateurVitalRepo.deleteById(idIndicateurVital);
    }
}
