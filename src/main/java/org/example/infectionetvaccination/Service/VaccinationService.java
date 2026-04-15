package org.example.infectionetvaccination.Service;

import org.example.infectionetvaccination.Clients.GraftSurvivalScoreClient;
import org.example.infectionetvaccination.DTO.GraftSurvivalScoreDto;
import org.example.infectionetvaccination.Entity.Vaccination;
import org.example.infectionetvaccination.Repository.VaccinationRepository;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;

@Service
public class VaccinationService {

    private final VaccinationRepository vaccinationRepository;

    private final GraftSurvivalScoreClient graftSurvivalScoreClient;

    public VaccinationService(VaccinationRepository vaccinationRepository, GraftSurvivalScoreClient graftSurvivalScoreClient) {
        this.vaccinationRepository = vaccinationRepository;
        this.graftSurvivalScoreClient = graftSurvivalScoreClient;
    }

    public Vaccination save(Vaccination vaccination) {
        return vaccinationRepository.save(vaccination);
    }

    public List<Vaccination> findAll() {
        return vaccinationRepository.findAll();
    }

    public Optional<Vaccination> findById(int id) {
        return vaccinationRepository.findById(id);
    }

    public List<Vaccination> findByInfectionId(int infectionId) {
        return vaccinationRepository.findByInfectionId(infectionId);
    }

    public void delete(int id) {
        vaccinationRepository.deleteById(id);
    }

    public GraftSurvivalScoreDto getLatestSurvivalScore(String patientId) {
        return graftSurvivalScoreClient.getLatestScoreByPatientId(patientId);
    }



}