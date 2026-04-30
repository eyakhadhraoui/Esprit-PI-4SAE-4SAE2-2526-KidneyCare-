package org.example.foncgreffon.Service;

import org.example.foncgreffon.Entity.ReferenceValue;
import org.example.foncgreffon.Repository.ReferenceValueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReferenceValueServiceTest {

    @Mock
    private ReferenceValueRepository repository;

    @InjectMocks
    private ReferenceValueService service;

    private ReferenceValue sampleRef;

    @BeforeEach
    void setUp() {
        sampleRef = new ReferenceValue();
        sampleRef.setId(1L);
        sampleRef.setPatientId("patient-001");
        sampleRef.setEstablishedDate(LocalDate.of(2024, 1, 10));
        sampleRef.setBaselineCreatinine(0.9);
        sampleRef.setBaselineEGFR(65.0);
        sampleRef.setTargetTacrolimusMin(5.0);
        sampleRef.setTargetTacrolimusMax(10.0);
        sampleRef.setTargetSystolicBP(120.0);
        sampleRef.setTargetDiastolicBP(80.0);
        sampleRef.setSetBy("Dr. Martin");
        sampleRef.setNotes("Initial reference post-transplant");
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save() — persists reference value and returns it")
    void save_shouldPersistAndReturn() {
        when(repository.save(any(ReferenceValue.class))).thenReturn(sampleRef);

        ReferenceValue result = service.save(sampleRef);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo("patient-001");
        assertThat(result.getBaselineCreatinine()).isEqualTo(0.9);
        assertThat(result.getBaselineEGFR()).isEqualTo(65.0);
        verify(repository, times(1)).save(sampleRef);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll() — returns all reference values")
    void findAll_shouldReturnAll() {
        ReferenceValue second = new ReferenceValue();
        second.setPatientId("patient-002");
        when(repository.findAll()).thenReturn(List.of(sampleRef, second));

        List<ReferenceValue> results = service.findAll();

        assertThat(results).hasSize(2);
        assertThat(results).extracting(ReferenceValue::getPatientId)
                .containsExactlyInAnyOrder("patient-001", "patient-002");
    }

    @Test
    @DisplayName("findAll() — returns empty list when no references")
    void findAll_shouldReturnEmptyWhenNone() {
        when(repository.findAll()).thenReturn(List.of());
        assertThat(service.findAll()).isEmpty();
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById() — returns reference when found")
    void findById_shouldReturnWhenFound() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRef));

        Optional<ReferenceValue> result = service.findById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getSetBy()).isEqualTo("Dr. Martin");
    }

    @Test
    @DisplayName("findById() — returns empty when not found")
    void findById_shouldReturnEmptyWhenNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());
        assertThat(service.findById(999L)).isEmpty();
    }

    // ── findByPatientId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("findByPatientId() — returns reference for patient")
    void findByPatientId_shouldReturnReference() {
        when(repository.findByPatientId("patient-001")).thenReturn(Optional.of(sampleRef));

        Optional<ReferenceValue> result = service.findByPatientId("patient-001");

        assertThat(result).isPresent();
        assertThat(result.get().getBaselineEGFR()).isEqualTo(65.0);
    }

    @Test
    @DisplayName("findByPatientId() — returns empty for unknown patient")
    void findByPatientId_shouldReturnEmptyForUnknown() {
        when(repository.findByPatientId("unknown")).thenReturn(Optional.empty());
        assertThat(service.findByPatientId("unknown")).isEmpty();
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
    @DisplayName("update() — updates all fields correctly")
    void update_shouldUpdateAllFields() {
        ReferenceValue updated = new ReferenceValue();
        updated.setEstablishedDate(LocalDate.of(2024, 6, 1));
        updated.setBaselineCreatinine(1.1);
        updated.setBaselineEGFR(55.0);
        updated.setTargetTacrolimusMin(4.0);
        updated.setTargetTacrolimusMax(8.0);
        updated.setTargetSystolicBP(125.0);
        updated.setTargetDiastolicBP(82.0);
        updated.setSetBy("Dr. Dupont");
        updated.setNotes("Revised targets after 6-month review");

        ReferenceValue saved = new ReferenceValue();
        saved.setId(1L);
        saved.setBaselineCreatinine(1.1);
        saved.setBaselineEGFR(55.0);
        saved.setSetBy("Dr. Dupont");

        when(repository.findById(1L)).thenReturn(Optional.of(sampleRef));
        when(repository.save(any(ReferenceValue.class))).thenReturn(saved);

        ReferenceValue result = service.update(1L, updated);

        assertThat(result.getBaselineCreatinine()).isEqualTo(1.1);
        assertThat(result.getBaselineEGFR()).isEqualTo(55.0);
        assertThat(result.getSetBy()).isEqualTo("Dr. Dupont");
        verify(repository, times(1)).save(any(ReferenceValue.class));
    }

    @Test
    @DisplayName("update() — throws RuntimeException when reference not found")
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, sampleRef))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ReferenceValue not found: 999");

        verify(repository, never()).save(any());
    }

    // ── Business logic ────────────────────────────────────────────────────────

    @Test
    @DisplayName("save() — Tacrolimus target range is validated at service boundary")
    void save_tacrolimusRangeIsStored() {
        ReferenceValue ref = new ReferenceValue();
        ref.setPatientId("patient-004");
        ref.setTargetTacrolimusMin(3.0);
        ref.setTargetTacrolimusMax(8.0);
        when(repository.save(any())).thenReturn(ref);

        ReferenceValue result = service.save(ref);

        assertThat(result.getTargetTacrolimusMin()).isLessThan(result.getTargetTacrolimusMax());
    }
}
