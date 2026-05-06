package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.AlerteNutritionDTO;
import com.example.Nutrition_Service.entity.AlerteNutrition;
import com.example.Nutrition_Service.repository.AlerteNutritionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlerteNutritionServiceTest {

    @Mock
    private AlerteNutritionRepository alerteRepository;

    @InjectMocks
    private AlerteNutritionService alerteService;

    private AlerteNutrition alerte;
    private AlerteNutritionDTO alerteDTO;
    private final LocalDateTime now = LocalDateTime.of(2025, 6, 1, 10, 0);

    @BeforeEach
    void setUp() {
        alerte = new AlerteNutrition(
                1L, 10L,
                AlerteNutrition.TypeAlerte.BILAN_ANORMAL,
                "Potassium élevé — revoir le régime alimentaire",
                now,
                false,
                null, null,
                "{\"k\": 6.2}"
        );

        alerteDTO = new AlerteNutritionDTO(
                1L, 10L,
                "BILAN_ANORMAL",
                "Potassium élevé — revoir le régime alimentaire",
                now,
                false,
                null, null,
                "{\"k\": 6.2}"
        );
    }

    // ─── createAlerte ────────────────────────────────────────────────────────────

    @Test
    void createAlerte_success_returnsDTO() {
        when(alerteRepository.save(any(AlerteNutrition.class))).thenReturn(alerte);

        AlerteNutritionDTO result = alerteService.createAlerte(alerteDTO);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo(10L);
        assertThat(result.getType()).isEqualTo("BILAN_ANORMAL");
        assertThat(result.getLue()).isFalse();
        verify(alerteRepository).save(any(AlerteNutrition.class));
    }

    @Test
    void createAlerte_noDate_setsDateAutomatically() {
        AlerteNutritionDTO dtoWithoutDate = new AlerteNutritionDTO(
                null, 10L,
                "RESTRICTION_ACTIVEE",
                "Nouvelle restriction activée",
                null,   // date absente
                false, null, null, null
        );

        AlerteNutrition savedWithDate = new AlerteNutrition(
                2L, 10L,
                AlerteNutrition.TypeAlerte.RESTRICTION_ACTIVEE,
                "Nouvelle restriction activée",
                LocalDateTime.now(),
                false, null, null, null
        );

        when(alerteRepository.save(any(AlerteNutrition.class))).thenReturn(savedWithDate);

        AlerteNutritionDTO result = alerteService.createAlerte(dtoWithoutDate);

        assertThat(result.getDateAlerte()).isNotNull();
    }

    @Test
    void createAlerte_invalidType_throwsBadRequest() {
        AlerteNutritionDTO badDTO = new AlerteNutritionDTO(
                null, 10L,
                "TYPE_INVALIDE",
                "Message test",
                now,
                false, null, null, null
        );

        assertThatThrownBy(() -> alerteService.createAlerte(badDTO))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(alerteRepository, never()).save(any());
    }

    // ─── getAllAlertes ────────────────────────────────────────────────────────────

    @Test
    void getAllAlertes_returnsListOrderedByDate() {
        AlerteNutrition alerte2 = new AlerteNutrition(
                2L, 11L,
                AlerteNutrition.TypeAlerte.INTERACTION_MEDICAMENT,
                "Interaction Tacrolimus détectée",
                now.plusHours(1),
                false, 3L, null, null
        );

        when(alerteRepository.findAllOrderByDateDesc()).thenReturn(List.of(alerte2, alerte));

        List<AlerteNutritionDTO> result = alerteService.getAllAlertes();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getType()).isEqualTo("INTERACTION_MEDICAMENT");
        assertThat(result.get(1).getType()).isEqualTo("BILAN_ANORMAL");
    }

    @Test
    void getAllAlertes_empty_returnsEmptyList() {
        when(alerteRepository.findAllOrderByDateDesc()).thenReturn(List.of());

        List<AlerteNutritionDTO> result = alerteService.getAllAlertes();

        assertThat(result).isEmpty();
    }

    // ─── getAlerteById ───────────────────────────────────────────────────────────

    @Test
    void getAlerteById_found_returnsDTO() {
        when(alerteRepository.findById(1L)).thenReturn(Optional.of(alerte));

        AlerteNutritionDTO result = alerteService.getAlerteById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getMessage()).isEqualTo("Potassium élevé — revoir le régime alimentaire");
    }

    @Test
    void getAlerteById_notFound_throwsNotFound() {
        when(alerteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alerteService.getAlerteById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ─── getAlertesForPatient ────────────────────────────────────────────────────

    @Test
    void getAlertesForPatient_returnsPatientAlertes() {
        when(alerteRepository.findByPatientIdOrderByDateAlerteDesc(10L))
                .thenReturn(List.of(alerte));

        List<AlerteNutritionDTO> result = alerteService.getAlertesForPatient(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPatientId()).isEqualTo(10L);
    }

    // ─── getUnreadAlertesForPatient ──────────────────────────────────────────────

    @Test
    void getUnreadAlertesForPatient_returnsOnlyUnread() {
        AlerteNutrition unread = new AlerteNutrition(
                3L, 10L,
                AlerteNutrition.TypeAlerte.APPORT_EXCESSIF,
                "Dépassement apport potassium",
                now.minusHours(2),
                false, null, null, null
        );

        when(alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(10L))
                .thenReturn(List.of(alerte, unread));

        List<AlerteNutritionDTO> result = alerteService.getUnreadAlertesForPatient(10L);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(dto -> !dto.getLue());
    }

    // ─── countUnreadAlertes ──────────────────────────────────────────────────────

    @Test
    void countUnreadAlertes_returnsCorrectCount() {
        when(alerteRepository.countByPatientIdAndLueFalse(10L)).thenReturn(3L);

        Long count = alerteService.countUnreadAlertes(10L);

        assertThat(count).isEqualTo(3L);
    }

    @Test
    void countUnreadAlertes_noUnread_returnsZero() {
        when(alerteRepository.countByPatientIdAndLueFalse(10L)).thenReturn(0L);

        Long count = alerteService.countUnreadAlertes(10L);

        assertThat(count).isZero();
    }

    // ─── getRecentAlertes ────────────────────────────────────────────────────────

    @Test
    void getRecentAlertes_returnsAlertesWithinWindow() {
        when(alerteRepository.findByDateAlerteAfterOrderByDateAlerteDesc(any(LocalDateTime.class)))
                .thenReturn(List.of(alerte));

        List<AlerteNutritionDTO> result = alerteService.getRecentAlertes(24);

        assertThat(result).hasSize(1);
        verify(alerteRepository).findByDateAlerteAfterOrderByDateAlerteDesc(any(LocalDateTime.class));
    }

    @Test
    void getRecentAlertes_zeroHours_usesAtLeastOneHour() {
        when(alerteRepository.findByDateAlerteAfterOrderByDateAlerteDesc(any(LocalDateTime.class)))
                .thenReturn(List.of());

        // 0 heures → doit être corrigé à 1 heure (Math.max(hours, 1))
        List<AlerteNutritionDTO> result = alerteService.getRecentAlertes(0);

        assertThat(result).isEmpty();
        verify(alerteRepository).findByDateAlerteAfterOrderByDateAlerteDesc(any(LocalDateTime.class));
    }

    // ─── markAsRead ──────────────────────────────────────────────────────────────

    @Test
    void markAsRead_success_setsLueTrue() {
        when(alerteRepository.findById(1L)).thenReturn(Optional.of(alerte));
        when(alerteRepository.save(any(AlerteNutrition.class))).thenReturn(alerte);

        alerteService.markAsRead(1L);

        assertThat(alerte.getLue()).isTrue();
        verify(alerteRepository).save(alerte);
    }

    @Test
    void markAsRead_notFound_throwsNotFound() {
        when(alerteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alerteService.markAsRead(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(alerteRepository, never()).save(any());
    }

    // ─── markAllAsReadForPatient ──────────────────────────────────────────────────

    @Test
    void markAllAsReadForPatient_marksAllUnreadAlertes() {
        AlerteNutrition a1 = new AlerteNutrition(1L, 10L,
                AlerteNutrition.TypeAlerte.BILAN_ANORMAL,
                "Alerte 1", now, false, null, null, null);
        AlerteNutrition a2 = new AlerteNutrition(2L, 10L,
                AlerteNutrition.TypeAlerte.APPORT_EXCESSIF,
                "Alerte 2", now.minusHours(1), false, null, null, null);

        when(alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(10L))
                .thenReturn(List.of(a1, a2));

        alerteService.markAllAsReadForPatient(10L);

        assertThat(a1.getLue()).isTrue();
        assertThat(a2.getLue()).isTrue();
        verify(alerteRepository).saveAll(List.of(a1, a2));
    }

    @Test
    void markAllAsReadForPatient_noUnread_savesEmptyList() {
        when(alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(10L))
                .thenReturn(List.of());

        alerteService.markAllAsReadForPatient(10L);

        verify(alerteRepository).saveAll(List.of());
    }
}
