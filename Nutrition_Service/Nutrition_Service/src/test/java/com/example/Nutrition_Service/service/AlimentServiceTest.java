package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.AlimentDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.repository.AlimentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlimentServiceTest {

    @Mock
    private AlimentRepository alimentRepository;

    @InjectMocks
    private AlimentService alimentService;

    private Aliment banane;
    private AlimentDTO bananeDTO;

    @BeforeEach
    void setUp() {
        banane = new Aliment(1L, "Banane", "FRUIT",
                358, 1, 22, 1.1, 12.2, 89,
                false, false, null, null, "riche en potassium");

        bananeDTO = new AlimentDTO(1L, "Banane", "FRUIT",
                358, 1, 22, 1.1, 12.2, 89,
                false, false, null, null, "riche en potassium");
    }

    // ─── createAliment ──────────────────────────────────────────────────────────

    @Test
    void createAliment_success_returnsDTO() {
        when(alimentRepository.existsByNomIgnoreCase("Banane")).thenReturn(false);
        when(alimentRepository.save(any(Aliment.class))).thenReturn(banane);

        AlimentDTO result = alimentService.createAliment(bananeDTO);

        assertThat(result).isNotNull();
        assertThat(result.getNom()).isEqualTo("Banane");
        assertThat(result.getCategorie()).isEqualTo("FRUIT");
        verify(alimentRepository).save(any(Aliment.class));
    }

    @Test
    void createAliment_duplicateName_throwsConflict() {
        when(alimentRepository.existsByNomIgnoreCase("Banane")).thenReturn(true);

        assertThatThrownBy(() -> alimentService.createAliment(bananeDTO))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(alimentRepository, never()).save(any());
    }

    // ─── updateAliment ──────────────────────────────────────────────────────────

    @Test
    void updateAliment_success_returnsUpdatedDTO() {
        AlimentDTO updateDTO = new AlimentDTO(null, "Banane Mûre", "FRUIT",
                400, 1, 22, 1.2, 14.0, 95,
                false, false, null, null, null);

        when(alimentRepository.findById(1L)).thenReturn(Optional.of(banane));
        when(alimentRepository.existsByNomIgnoreCaseAndIdNot("Banane Mûre", 1L)).thenReturn(false);
        Aliment updated = new Aliment(1L, "Banane Mûre", "FRUIT",
                400, 1, 22, 1.2, 14.0, 95,
                false, false, null, null, null);
        when(alimentRepository.save(any(Aliment.class))).thenReturn(updated);

        AlimentDTO result = alimentService.updateAliment(1L, updateDTO);

        assertThat(result.getNom()).isEqualTo("Banane Mûre");
        assertThat(result.getCaloriesKcal()).isEqualTo(95);
    }

    @Test
    void updateAliment_notFound_throwsNotFound() {
        when(alimentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alimentService.updateAliment(99L, bananeDTO))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateAliment_duplicateName_throwsConflict() {
        AlimentDTO updateDTO = new AlimentDTO(null, "Pamplemousse", "FRUIT",
                100, 0, 18, 0.8, 8.0, 40,
                true, false, null, null, null);

        when(alimentRepository.findById(1L)).thenReturn(Optional.of(banane));
        when(alimentRepository.existsByNomIgnoreCaseAndIdNot("Pamplemousse", 1L)).thenReturn(true);

        assertThatThrownBy(() -> alimentService.updateAliment(1L, updateDTO))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    // ─── getAllAliments ──────────────────────────────────────────────────────────

    @Test
    void getAllAliments_returnsListOfDTOs() {
        Aliment pomme = new Aliment(2L, "Pomme", "FRUIT",
                107, 1, 11, 0.3, 10.4, 52,
                false, false, null, null, null);

        when(alimentRepository.findAll()).thenReturn(List.of(banane, pomme));

        List<AlimentDTO> result = alimentService.getAllAliments();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(AlimentDTO::getNom).containsExactly("Banane", "Pomme");
    }

    @Test
    void getAllAliments_emptyRepository_returnsEmptyList() {
        when(alimentRepository.findAll()).thenReturn(List.of());

        List<AlimentDTO> result = alimentService.getAllAliments();

        assertThat(result).isEmpty();
    }

    // ─── getAlimentById ──────────────────────────────────────────────────────────

    @Test
    void getAlimentById_found_returnsDTO() {
        when(alimentRepository.findById(1L)).thenReturn(Optional.of(banane));

        AlimentDTO result = alimentService.getAlimentById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getNom()).isEqualTo("Banane");
    }

    @Test
    void getAlimentById_notFound_throwsNotFound() {
        when(alimentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alimentService.getAlimentById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ─── searchByNom ─────────────────────────────────────────────────────────────

    @Test
    void searchByNom_returnMatchingDTOs() {
        when(alimentRepository.findByNomContainingIgnoreCase("ban")).thenReturn(List.of(banane));

        List<AlimentDTO> result = alimentService.searchByNom("ban");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNom()).isEqualTo("Banane");
    }

    // ─── getByCategorie ──────────────────────────────────────────────────────────

    @Test
    void getByCategorie_returnsFruitsOnly() {
        when(alimentRepository.findByCategorie("FRUIT")).thenReturn(List.of(banane));

        List<AlimentDTO> result = alimentService.getByCategorie("FRUIT");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategorie()).isEqualTo("FRUIT");
    }

    // ─── getAlimentsInteractionTacrolimus ────────────────────────────────────────

    @Test
    void getAlimentsInteractionTacrolimus_returnsTacrolimusAliments() {
        Aliment pampl = new Aliment(3L, "Pamplemousse", "FRUIT",
                135, 0, 18, 0.8, 9.0, 42,
                true, false, null, null, "Interaction Tacrolimus");

        when(alimentRepository.findByInteractionTacrolimusTrue()).thenReturn(List.of(pampl));

        List<AlimentDTO> result = alimentService.getAlimentsInteractionTacrolimus();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getInteractionTacrolimus()).isTrue();
        assertThat(result.get(0).getNom()).isEqualTo("Pamplemousse");
    }

    // ─── deleteAliment ───────────────────────────────────────────────────────────

    @Test
    void deleteAliment_success_deletesAliment() {
        when(alimentRepository.existsById(1L)).thenReturn(true);

        alimentService.deleteAliment(1L);

        verify(alimentRepository).deleteById(1L);
    }

    @Test
    void deleteAliment_notFound_throwsNotFound() {
        when(alimentRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> alimentService.deleteAliment(99L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(alimentRepository, never()).deleteById(any());
    }
}
