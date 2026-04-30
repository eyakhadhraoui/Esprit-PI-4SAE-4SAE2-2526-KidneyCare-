package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.Repository.IConstanteVitaleRepo;
import com.esprit.microservice.projetparametrevital.Parametrevital.Repository.IIndicateurVitalRepo;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ConstanteVitaleDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ConstanteVitale;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.IndicateurVital;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConstanteVitaleService implements IConstanteVitaleInterface {

    @Autowired
    private IConstanteVitaleRepo constanteVitaleRepo;

    @Autowired
    private IIndicateurVitalRepo indicateurVitalRepo;

    @Override
    public List<ConstanteVitale> retrieveConstantesVitales() {
        return constanteVitaleRepo.findAll();
    }

    @Override
    public ConstanteVitale addConstanteVitale(ConstanteVitaleDTO dto) {
        ConstanteVitale cv = new ConstanteVitale();
        cv.setNomParametre(dto.getNomParametre());
        cv.setUnite(dto.getUnite());
        cv.setValeurMinNormale(dto.getValeurMinNormale());
        cv.setValeurMaxNormale(dto.getValeurMaxNormale());
        cv.setPoidsMin(dto.getPoidsMin());
        cv.setPoidsMax(dto.getPoidsMax());
        cv.setTailleMin(dto.getTailleMin());
        cv.setTailleMax(dto.getTailleMax());
        if (dto.getIdIndicateurVital() != null) {
            IndicateurVital ref = indicateurVitalRepo.getReferenceById(dto.getIdIndicateurVital());
            cv.setIndicateurVital(ref);
        }
        return constanteVitaleRepo.save(cv);
    }

    @Override
    public ConstanteVitale updateConstanteVitale(Integer id, ConstanteVitaleDTO dto) {
        ConstanteVitale cv = constanteVitaleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("ConstanteVitale non trouvée avec ID = " + id));
        cv.setNomParametre(dto.getNomParametre());
        cv.setUnite(dto.getUnite());
        cv.setValeurMinNormale(dto.getValeurMinNormale());
        cv.setValeurMaxNormale(dto.getValeurMaxNormale());
        cv.setPoidsMin(dto.getPoidsMin());
        cv.setPoidsMax(dto.getPoidsMax());
        cv.setTailleMin(dto.getTailleMin());
        cv.setTailleMax(dto.getTailleMax());
        if (dto.getIdIndicateurVital() != null) {
            cv.setIndicateurVital(indicateurVitalRepo.getReferenceById(dto.getIdIndicateurVital()));
        } else {
            cv.setIndicateurVital(null);
        }
        return constanteVitaleRepo.save(cv);
    }

    @Override
    public Optional<ConstanteVitale> retrieveConstanteVitale(Integer idConstanteVitale) {
        return constanteVitaleRepo.findById(idConstanteVitale);
    }

    @Override
    public void removeConstanteVitale(Integer idConstanteVitale) {
        constanteVitaleRepo.deleteById(idConstanteVitale);
    }
}
