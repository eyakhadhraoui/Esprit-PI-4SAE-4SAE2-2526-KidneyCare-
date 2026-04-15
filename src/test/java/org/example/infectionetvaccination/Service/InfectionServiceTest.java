package org.example.infectionetvaccination.Service;

import org.example.infectionetvaccination.DTO.GraftFunctionEntry;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Clients.GraftFunctionEntryClient;
import org.example.infectionetvaccination.Repository.InfectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InfectionServiceTest {

    @Mock
    private InfectionRepository infectionRepository;

    @Mock
    private ExerciseClient exerciseClient;

    @Mock
    private GraftFunctionEntryClient graftFunctionEntryClient;

    @InjectMocks
    private InfectionService infectionService;

    private Infection sampleInfection;

    @BeforeEach
    void setUp() {
        sampleInfection = new Infection("COVID-19", new Date(), "HIGH", "John Doe");
        sampleInfection.setId(1);
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save() — persists and returns the infection")
    void save_shouldPersistAndReturnInfection() {
        when(infectionRepository.save(any(Infection.class))).thenReturn(sampleInfection);

        Infection result = infectionService.save(sampleInfection);

        assertThat(result).isNotNull();
        assertThat(result.getType()).isEqualTo("COVID-19");
        assertThat(result.getSeverity()).isEqualTo("HIGH");
        assertThat(result.getPatientName()).isEqualTo("John Doe");
        verify(infectionRepository, times(1)).save(sampleInfection);
    }

    @Test
    @DisplayName("save() — calls repository exactly once")
    void save_shouldCallRepositoryOnce() {
        when(infectionRepository.save(any(Infection.class))).thenReturn(sampleInfection);
        infectionService.save(sampleInfection);
        verify(infectionRepository, times(1)).save(any(Infection.class));
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll() — returns all infections from repository")
    void findAll_shouldReturnAllInfections() {
        Infection second = new Infection("Flu", new Date(), "LOW", "Jane Doe");
        when(infectionRepository.findAll()).thenReturn(List.of(sampleInfection, second));

        List<Infection> results = infectionService.findAll();

        assertThat(results).hasSize(2);
        assertThat(results).extracting(Infection::getType).containsExactly("COVID-19", "Flu");
    }

    @Test
    @DisplayName("findAll() — returns empty list when no infections exist")
    void findAll_shouldReturnEmptyListWhenNoneExist() {
        when(infectionRepository.findAll()).thenReturn(List.of());

        List<Infection> results = infectionService.findAll();

        assertThat(results).isEmpty();
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById() — returns infection when found")
    void findById_shouldReturnInfectionWhenFound() {
        when(infectionRepository.findById(1)).thenReturn(Optional.of(sampleInfection));

        Optional<Infection> result = infectionService.findById(1);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1);
        assertThat(result.get().getType()).isEqualTo("COVID-19");
    }

    @Test
    @DisplayName("findById() — returns empty Optional when not found")
    void findById_shouldReturnEmptyWhenNotFound() {
        when(infectionRepository.findById(999)).thenReturn(Optional.empty());

        Optional<Infection> result = infectionService.findById(999);

        assertThat(result).isEmpty();
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete() — calls deleteById on repository")
    void delete_shouldCallDeleteById() {
        doNothing().when(infectionRepository).deleteById(anyInt());

        infectionService.delete(1);

        verify(infectionRepository, times(1)).deleteById(1);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update() — updates all fields and saves")
    void update_shouldUpdateAllFieldsAndSave() {
        Infection updated = new Infection("Flu", new Date(), "LOW", "Jane Doe");
        Infection saved   = new Infection("Flu", updated.getDetectionDate(), "LOW", "Jane Doe");
        saved.setId(1);

        when(infectionRepository.findById(1)).thenReturn(Optional.of(sampleInfection));
        when(infectionRepository.save(any(Infection.class))).thenReturn(saved);

        Infection result = infectionService.update(1, updated);

        assertThat(result.getType()).isEqualTo("Flu");
        assertThat(result.getSeverity()).isEqualTo("LOW");
        assertThat(result.getPatientName()).isEqualTo("Jane Doe");
        verify(infectionRepository, times(1)).save(any(Infection.class));
    }

    @Test
    @DisplayName("update() — throws RuntimeException when infection not found")
    void update_shouldThrowWhenInfectionNotFound() {
        when(infectionRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> infectionService.update(999, sampleInfection))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Infection not found: 999");

        verify(infectionRepository, never()).save(any());
    }

    // ── Feign clients ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getExercises() — delegates to ExerciseClient")
    void getExercises_shouldDelegateToClient() {
        Exercise ex = new Exercise();
        when(exerciseClient.getAllExercises()).thenReturn(List.of(ex));

        List<Exercise> results = infectionService.getExercises();

        assertThat(results).hasSize(1);
        verify(exerciseClient, times(1)).getAllExercises();
    }



    @Test
    @DisplayName("getGraftFunctionEntryById() — delegates with cast id")
    void getGraftFunctionEntryById_shouldDelegateToClient() {
        GraftFunctionEntry entry = new GraftFunctionEntry();
        when(graftFunctionEntryClient.getGraftFunctionEntryById(3L)).thenReturn(entry);

        GraftFunctionEntry result = infectionService.getGraftFunctionEntryById(3);

        assertThat(result).isNotNull();
        verify(graftFunctionEntryClient, times(1)).getGraftFunctionEntryById(3L);
    }
}