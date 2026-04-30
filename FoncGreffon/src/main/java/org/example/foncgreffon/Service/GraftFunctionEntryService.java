package org.example.foncgreffon.Service;

import org.example.foncgreffon.Clients.NephroLaboClient;
import org.example.foncgreffon.DTO.ResultatLaboratoireDTO;
import org.example.foncgreffon.Entity.GraftFunctionEntry;
import org.example.foncgreffon.Repository.GraftFunctionEntryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class GraftFunctionEntryService {

    private final GraftFunctionEntryRepository repository;
    private final NephroLaboClient nephroLaboClient;

    public GraftFunctionEntryService(GraftFunctionEntryRepository repository,
                                     NephroLaboClient nephroLaboClient) {
        this.repository = repository;
        this.nephroLaboClient = nephroLaboClient;
    }

    /**
     * Récupère les résultats de laboratoire d'un dossier médical depuis NEPHRO.
     * Communication inter-services via OpenFeign (FoncGreffon → DossierMedical).
     */
    public List<ResultatLaboratoireDTO> getResultatsByDossier(Long idDossierMedical) {
        return nephroLaboClient.getResultatsByDossier(idDossierMedical);
    }

    public List<ResultatLaboratoireDTO> getAllResultatsLaboratoire() {
        return nephroLaboClient.getAllResultats();
    }

    public GraftFunctionEntry save(GraftFunctionEntry entry) {
        return repository.save(entry);
    }

    public List<GraftFunctionEntry> findAll() {
        return repository.findAll();
    }

    public Optional<GraftFunctionEntry> findById(Long id) {
        return repository.findById(id);
    }

    public List<GraftFunctionEntry> findByPatientId(String patientId) {
        return repository.findByPatientIdOrderByMeasurementDateDesc(patientId);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public GraftFunctionEntry update(Long id, GraftFunctionEntry updated) {
        return repository.findById(id).map(entry -> {
            entry.setMeasurementDate(updated.getMeasurementDate());
            entry.setCreatinine(updated.getCreatinine());
            entry.seteGFR(updated.geteGFR());
            entry.setUrineOutput(updated.getUrineOutput());
            entry.setTacrolimusLevel(updated.getTacrolimusLevel());
            entry.setSystolicBP(updated.getSystolicBP());
            entry.setDiastolicBP(updated.getDiastolicBP());
            entry.setWeight(updated.getWeight());
            entry.setTemperature(updated.getTemperature());
            entry.setCollectionType(updated.getCollectionType());
            entry.setNotes(updated.getNotes());
            return repository.save(entry);
        }).orElseThrow(() -> new RuntimeException("GraftFunctionEntry not found: " + id));
    }
}