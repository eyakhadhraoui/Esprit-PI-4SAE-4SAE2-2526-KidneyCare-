package com.esprit.microservice.projetparametrevital.Parametrevital.Services;

import com.esprit.microservice.projetparametrevital.Parametrevital.Repository.IConstanteVitaleRepo;
import com.esprit.microservice.projetparametrevital.Parametrevital.Repository.IParametreVitalRepo;
import com.esprit.microservice.projetparametrevital.Parametrevital.dto.ParametreVitalDTO;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ConstanteVitale;
import com.esprit.microservice.projetparametrevital.Parametrevital.entity.ParametreVital;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class ParametreVitalService implements IParametreVitalInterface{
    @Autowired
    IParametreVitalRepo parametreVitalRepo;

    @Autowired
    IConstanteVitaleRepo constanteVitaleRepo;

    @Override
    public List<ParametreVital> retrieveParametresVitaux() {
        return parametreVitalRepo.findAll();
    }

    @Override
    public ParametreVital addParametreVital(ParametreVitalDTO dto) {
        ParametreVital p = new ParametreVital();
        p.setIdResultatLaboratoire(dto.getIdResultatLaboratoire());
        p.setNomParametre(dto.getNomParametre());
        p.setValeurMesuree(dto.getValeurMesuree());
        p.setUnite(dto.getUnite());
        p.setReferenceMin(dto.getReferenceMin());
        p.setReferenceMax(dto.getReferenceMax());
        p.setEtat(dto.getEtat());
        p.setPoids(dto.getPoids());
        p.setTaille(dto.getTaille());
        p.setAge(dto.getAge());
        p.setImc(dto.getImc());
        if (dto.getConstanteVitaleId() != null) {
            ConstanteVitale ref = constanteVitaleRepo.getReferenceById(dto.getConstanteVitaleId());
            p.setConstanteVitale(ref);
        }
        return parametreVitalRepo.save(p);
    }

    @Override
    public ParametreVital updateParametreVital(Integer id, ParametreVitalDTO dto) {
        ParametreVital p = parametreVitalRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("ParametreVital non trouvé avec ID = " + id));
        if (dto.getNomParametre() != null) {
            p.setNomParametre(dto.getNomParametre());
        }
        if (dto.getUnite() != null) {
            p.setUnite(dto.getUnite());
        }
        p.setReferenceMin(dto.getReferenceMin());
        p.setReferenceMax(dto.getReferenceMax());
        if (dto.getIdResultatLaboratoire() != null) {
            p.setIdResultatLaboratoire(dto.getIdResultatLaboratoire());
        }
        if (dto.getValeurMesuree() != null) {
            p.setValeurMesuree(dto.getValeurMesuree());
        }
        if (dto.getEtat() != null) {
            p.setEtat(dto.getEtat());
        }
        if (dto.getPoids() != null) {
            p.setPoids(dto.getPoids());
        }
        if (dto.getTaille() != null) {
            p.setTaille(dto.getTaille());
        }
        if (dto.getAge() != null) {
            p.setAge(dto.getAge());
        }
        if (dto.getImc() != null) {
            p.setImc(dto.getImc());
        }
        if (dto.getConstanteVitaleId() != null) {
            p.setConstanteVitale(constanteVitaleRepo.getReferenceById(dto.getConstanteVitaleId()));
        }
        return parametreVitalRepo.save(p);
    }

    @Override
    public Optional<ParametreVital> retrieveParametreVital(Integer idParametreVital) {
        return parametreVitalRepo.findById(idParametreVital);
    }

    @Override
    public void removeParametreVital(Integer idParametreVital) {
        parametreVitalRepo.deleteById(idParametreVital);
    }
}
