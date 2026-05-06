package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.BesoinNutritionnelDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BesoinNutritionnelServiceTest {

    @Mock
    private BesoinNutritionnelRepository besoinRepository;

    @InjectMocks
    private BesoinNutritionnelService besoinService;

    private BesoinNutritionnel besoin;
    private BesoinNutritionnelDTO besoinDTO;

    @BeforeEach
    void setUp() {
        besoin = new BesoinNutritionnel(
                1L, 10L,
                1800, 1200, 800, 40.0, 35.0, 1500,
                22.0, 36,
                true, false,
                "Post-transplantation rénale",
                LocalDate.of(2025, 1, 1), null,
                "Régime strict en potassium"
        );

        besoinDTO = new BesoinNutritionnelDTO(
                1L, 10L,
                1800, 1200, 800, 40.0, 35.0, 1500,
                22.0, 36,
                true, false,
                "Post-transplantation rénale",
                LocalDate.of(2025, 1, 1), null,
                "Régime strict en potassium"
        );
    }

    // ─── createBesoin ────────────────────────────────────────────────────────────

    @Test
    void createBesoin_success_returnsDTO() {
        when(besoinRepository.save(any(BesoinNutritionnel.class))).thenReturn(besoin);

        BesoinNutritionnelDTO result = besoinService.createBesoin(besoinDTO);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo(10L);
        assertThat(result.getPotassiumMaxMg()).isEqualTo(1800);
        assertThat(result.getCaloriesJour()).isEqualTo(1500);
        verify(besoinRepository).save(any(BesoinNutritionnel.class));
    }

    @Test
    void createBesoin_withTacrolimus_savesCorrectly() {
        BesoinNutritionnel tacrolimusBesoin = new BesoinNutritionnel(
                2L, 11L,
                1600, 1000, 700, 35.0, 30.0, 1400,
                18.0, 24,
                true, true,
                "Tacrolimus + Prednisone",
                LocalDate.of(2025, 3, 1), null,
                null
        );

        BesoinNutritionnelDTO dto = new BesoinNutritionnelDTO(
                null, 11L,
                1600, 1000, 700, 35.0, 30.0, 1400,
                18.0, 24,
                true, true,
                "Tacrolimus + Prednisone",
                LocalDate.of(2025, 3, 1), null,
                null
        );

        when(besoinRepository.save(any(BesoinNutritionnel.class))).thenReturn(tacrolimusBesoin);

        BesoinNutritionnelDTO result = besoinService.createBesoin(dto);

        assertThat(result.getTraitementTacrolimus()).isTrue();
        assertThat(result.getTraitementPrednisone()).isTrue();
    }

    // ─── updateBesoin ────────────────────────────────────────────────────────────

    @Test
    void updateBesoin_success_returnsUpdatedDTO() {
        BesoinNutritionnelDTO updateDTO = new BesoinNutritionnelDTO(
                null, 10L,
                2000, 1300, 850, 45.0, 38.0, 1600,
                23.0, 37,
                true, false,
                "Mise à jour post-bilan",
                LocalDate.of(2025, 6, 1), null,
                "Réévaluation"
        );

        BesoinNutritionnel updated = new BesoinNutritionnel(
                1L, 10L,
                2000, 1300, 850, 45.0, 38.0, 1600,
                23.0, 37,
                true, false,
                "Mise à jour post-bilan",
                LocalDate.of(2025, 6, 1), null,
                "Réévaluation"
        );

        when(besoinRepository.findById(1L)).thenReturn(Optional.of(besoin));
        when(besoinRepository.save(any(BesoinNutritionnel.class))).thenReturn(updated);

        BesoinNutritionnelDTO result = besoinService.updateBesoin(1L, updateDTO);

        assertThat(result.getPotassiumMaxMg()).isEqualTo(2000);
        assertThat(result.getCaloriesJour()).isEqualTo(1600);
        assertThat(result.getRaisonCalcul()).isEqualTo("Mise à jour post-bilan");
    }

    @Test
    void updateBesoin_notFound_throwsNotFound() {
        when(besoinRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> besoinService.updateBesoin(99L, besoinDTO))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(besoinRepository, never()).save(any());
    }

    // ─── getAllBesoins ────────────────────────────────────────────────────────────

    @Test
    void getAllBesoins_returnsListOfDTOs() {
        BesoinNutritionnel besoin2 = new BesoinNutritionnel(
                2L, 12L,
                1500, 1000, 750, 38.0, 32.0, 1350,
                20.0, 30,
                false, true,
                "Autre patient",
                LocalDate.of(2025, 2, 1), null,
                null
        );

        when(besoinRepository.findAll()).thenReturn(List.of(besoin, besoin2));

        List<BesoinNutritionnelDTO> result = besoinService.getAllBesoins();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(BesoinNutritionnelDTO::getPatientId)
                .containsExactly(10L, 12L);
    }

    @Test
    void getAllBesoins_emptyRepository_returnsEmptyList() {
        when(besoinRepository.findAll()).thenReturn(List.of());

        List<BesoinNutritionnelDTO> result = besoinService.getAllBesoins();

        assertThat(result).isEmpty();
    }

    // ─── getBesoinById ───────────────────────────────────────────────────────────

    @Test
    void getBesoinById_found_returnsDTO() {
        when(besoinRepository.findById(1L)).thenReturn(Optional.of(besoin));

        BesoinNutritionnelDTO result = besoinService.getBesoinById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getPatientId()).isEqualTo(10L);
    }

    @Test
    void getBesoinById_notFound_throwsNotFound() {
        when(besoinRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> besoinService.getBesoinById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ─── getActiveBesoinForPatient ───────────────────────────────────────────────

    @Test
    void getActiveBesoinForPatient_found_returnsDTO() {
        when(besoinRepository.findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(10L))
                .thenReturn(Optional.of(besoin));

        BesoinNutritionnelDTO result = besoinService.getActiveBesoinForPatient(10L);

        assertThat(result).isNotNull();
        assertThat(result.getDateFin()).isNull();
        assertThat(result.getPatientId()).isEqualTo(10L);
    }

    @Test
    void getActiveBesoinForPatient_noActiveRegime_returnsNull() {
        when(besoinRepository.findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(10L))
                .thenReturn(Optional.empty());

        BesoinNutritionnelDTO result = besoinService.getActiveBesoinForPatient(10L);

        assertThat(result).isNull();
    }

    // ─── getHistoryForPatient ────────────────────────────────────────────────────

    @Test
    void getHistoryForPatient_returnsOrderedHistory() {
        BesoinNutritionnel old = new BesoinNutritionnel(
                3L, 10L,
                1600, 1100, 780, 38.0, 33.0, 1400,
                21.0, 34,
                true, false,
                "Ancien régime",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31),
                null
        );

        when(besoinRepository.findByPatientIdOrderByDateDebutDesc(10L))
                .thenReturn(List.of(besoin, old));

        List<BesoinNutritionnelDTO> result = besoinService.getHistoryForPatient(10L);

        assertThat(result).hasSize(2);
        // Premier = plus récent (dateDebut 2025), deuxième = ancien (dateFin non null)
        assertThat(result.get(0).getDateFin()).isNull();
        assertThat(result.get(1).getDateFin()).isEqualTo(LocalDate.of(2024, 12, 31));
    }

    // ─── deleteBesoin ────────────────────────────────────────────────────────────

    @Test
    void deleteBesoin_success_deletesEntry() {
        when(besoinRepository.existsById(1L)).thenReturn(true);

        besoinService.deleteBesoin(1L);

        verify(besoinRepository).deleteById(1L);
    }

    @Test
    void deleteBesoin_notFound_throwsNotFound() {
        when(besoinRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> besoinService.deleteBesoin(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(besoinRepository, never()).deleteById(any());
    }
}
