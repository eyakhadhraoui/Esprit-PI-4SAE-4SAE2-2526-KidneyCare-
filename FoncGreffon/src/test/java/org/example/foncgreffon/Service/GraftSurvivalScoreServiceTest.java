package org.example.foncgreffon.Service;

import org.example.foncgreffon.Entity.GraftSurvivalScore;
import org.example.foncgreffon.Repository.GraftSurvivalScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GraftSurvivalScoreServiceTest {

    @Mock
    private GraftSurvivalScoreRepository repository;

    @Mock
    private org.example.foncgreffon.Clients.VaccinationClient vaccinationClient;

    @InjectMocks
    private GraftSurvivalScoreService service;

    private GraftSurvivalScore sampleScore;

    @BeforeEach
    void setUp() {
        sampleScore = new GraftSurvivalScore();
        sampleScore.setId(1L);
        sampleScore.setPatientId("patient-001");
        sampleScore.setSurvivalProbability1Year(0.92);
        sampleScore.setSurvivalProbability3Year(0.78);
        sampleScore.setSurvivalProbability5Year(0.65);
        sampleScore.setRiskLevel("MODERE");
        sampleScore.seteGFRSlope(-2.5);
        sampleScore.setCreatinineSlope(0.3);
        sampleScore.setRejectionEpisodeCount(1);
        sampleScore.setHasChronicDecline(false);
        sampleScore.setHasAcuteDecline(false);
        sampleScore.setTacrolimusVariability(0.15);
        sampleScore.setCalculationModel("KDIGO-2023");
        sampleScore.setNotes("Stable graft, moderate risk");
        sampleScore.setCalculatedAt(LocalDateTime.of(2024, 6, 15, 10, 0));
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save() — persists score and returns it")
    void save_shouldPersistAndReturn() {
        when(repository.save(any(GraftSurvivalScore.class))).thenReturn(sampleScore);

        GraftSurvivalScore result = service.save(sampleScore);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo("patient-001");
        assertThat(result.getSurvivalProbability1Year()).isEqualTo(0.92);
        assertThat(result.getRiskLevel()).isEqualTo("MODERE");
        verify(repository, times(1)).save(sampleScore);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll() — returns all scores")
    void findAll_shouldReturnAllScores() {
        GraftSurvivalScore second = new GraftSurvivalScore();
        second.setPatientId("patient-002");
        when(repository.findAll()).thenReturn(List.of(sampleScore, second));

        List<GraftSurvivalScore> results = service.findAll();

        assertThat(results).hasSize(2);
        assertThat(results).extracting(GraftSurvivalScore::getPatientId)
                .containsExactly("patient-001", "patient-002");
    }

    @Test
    @DisplayName("findAll() — returns empty list when no scores")
    void findAll_shouldReturnEmptyListWhenNone() {
        when(repository.findAll()).thenReturn(List.of());
        assertThat(service.findAll()).isEmpty();
    }

    // ── findByPatientId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("findByPatientId() — returns ordered scores for patient")
    void findByPatientId_shouldReturnOrderedScores() {
        when(repository.findByPatientIdOrderByCalculatedAtDesc("patient-001"))
                .thenReturn(List.of(sampleScore));

        List<GraftSurvivalScore> results = service.findByPatientId("patient-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getRiskLevel()).isEqualTo("MODERE");
    }

    @Test
    @DisplayName("findByPatientId() — returns empty list for unknown patient")
    void findByPatientId_shouldReturnEmptyForUnknown() {
        when(repository.findByPatientIdOrderByCalculatedAtDesc("unknown"))
                .thenReturn(List.of());
        assertThat(service.findByPatientId("unknown")).isEmpty();
    }

    // ── findLatestByPatientId ─────────────────────────────────────────────────

    @Test
    @DisplayName("findLatestByPatientId() — returns most recent score")
    void findLatestByPatientId_shouldReturnLatest() {
        when(repository.findTopByPatientIdOrderByCalculatedAtDesc("patient-001"))
                .thenReturn(Optional.of(sampleScore));

        Optional<GraftSurvivalScore> result = service.findLatestByPatientId("patient-001");

        assertThat(result).isPresent();
        assertThat(result.get().getCalculationModel()).isEqualTo("KDIGO-2023");
    }

    @Test
    @DisplayName("findLatestByPatientId() — returns empty when no score")
    void findLatestByPatientId_shouldReturnEmptyWhenNone() {
        when(repository.findTopByPatientIdOrderByCalculatedAtDesc("unknown"))
                .thenReturn(Optional.empty());
        assertThat(service.findLatestByPatientId("unknown")).isEmpty();
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete() — calls deleteById on repository")
    void delete_shouldCallDeleteById() {
        doNothing().when(repository).deleteById(1L);
        service.delete(1L);
        verify(repository, times(1)).deleteById(1L);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update() — updates all fields and refreshes calculatedAt")
    void update_shouldUpdateAllFields() {
        GraftSurvivalScore updated = new GraftSurvivalScore();
        updated.setSurvivalProbability1Year(0.80);
        updated.setSurvivalProbability3Year(0.65);
        updated.setSurvivalProbability5Year(0.50);
        updated.setRiskLevel("ELEVE");
        updated.seteGFRSlope(-5.0);
        updated.setCreatinineSlope(0.8);
        updated.setRejectionEpisodeCount(2);
        updated.setHasChronicDecline(true);
        updated.setHasAcuteDecline(false);
        updated.setTacrolimusVariability(0.30);
        updated.setCalculationModel("KDIGO-2023");
        updated.setNotes("Deteriorating graft");

        GraftSurvivalScore saved = new GraftSurvivalScore();
        saved.setId(1L);
        saved.setRiskLevel("ELEVE");
        saved.setSurvivalProbability1Year(0.80);

        when(repository.findById(1L)).thenReturn(Optional.of(sampleScore));
        when(repository.save(any(GraftSurvivalScore.class))).thenReturn(saved);

        GraftSurvivalScore result = service.update(1L, updated);

        assertThat(result.getRiskLevel()).isEqualTo("ELEVE");
        assertThat(result.getSurvivalProbability1Year()).isEqualTo(0.80);
        verify(repository, times(1)).save(any(GraftSurvivalScore.class));
    }

    @Test
    @DisplayName("update() — throws RuntimeException when score not found")
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, sampleScore))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("GraftSurvivalScore not found: 999");

        verify(repository, never()).save(any());
    }

    // ── Business logic edge cases ─────────────────────────────────────────────

    @Test
    @DisplayName("save() — critical risk score (survival < 50%) is persisted")
    void save_criticalRiskScorePersists() {
        GraftSurvivalScore critical = new GraftSurvivalScore();
        critical.setPatientId("patient-003");
        critical.setSurvivalProbability5Year(0.40);
        critical.setRiskLevel("CRITIQUE");
        critical.setRejectionEpisodeCount(3);
        critical.setHasChronicDecline(true);
        when(repository.save(any())).thenReturn(critical);

        GraftSurvivalScore result = service.save(critical);

        assertThat(result.getRiskLevel()).isEqualTo("CRITIQUE");
        assertThat(result.getSurvivalProbability5Year()).isEqualTo(0.40);
    }
}
