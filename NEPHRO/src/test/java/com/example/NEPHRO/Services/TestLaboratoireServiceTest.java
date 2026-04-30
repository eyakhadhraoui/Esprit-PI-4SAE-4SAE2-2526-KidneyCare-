package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.TestLaboratoire;
import com.example.NEPHRO.Repository.TestLaboratoireRepository;
import com.example.NEPHRO.dto.TestLaboratoireDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestLaboratoireServiceTest {

    @Mock
    private TestLaboratoireRepository testLaboratoireRepository;

    @InjectMocks
    private TestLaboratoireService testLaboratoireService;

    private TestLaboratoireDTO validDto;
    private TestLaboratoire persisted;

    @BeforeEach
    void setUp() {
        validDto = new TestLaboratoireDTO();
        validDto.setCodeTest("CREA-01");
        validDto.setNomTest("Créatinine");
        validDto.setCodeLoinc("2160-0");
        validDto.setCategorie("RENAL");
        validDto.setDelaiRenduHeures(4);
        validDto.setNecessiteJeune(false);

        persisted = TestLaboratoire.builder()
                .idTestLaboratoire(1L)
                .codeTest("CREA-01")
                .nomTest("Créatinine")
                .codeLoinc("2160-0")
                .categorie("RENAL")
                .delaiRenduHeures(4)
                .necessiteJeune(false)
                .build();
    }

    @Test
    void create_persisteQuandCodeEtNomPresentsEtCodeUnique() {
        when(testLaboratoireRepository.existsByCodeTest("CREA-01")).thenReturn(false);
        when(testLaboratoireRepository.save(any(TestLaboratoire.class))).thenAnswer(inv -> {
            TestLaboratoire e = inv.getArgument(0);
            e.setIdTestLaboratoire(1L);
            return e;
        });

        TestLaboratoireDTO out = testLaboratoireService.create(validDto);

        assertThat(out.getIdTestLaboratoire()).isEqualTo(1L);
        assertThat(out.getCodeTest()).isEqualTo("CREA-01");
        verify(testLaboratoireRepository).save(any(TestLaboratoire.class));
    }

    @Test
    void create_leveIllegalArgumentException_siCodeVide() {
        validDto.setCodeTest("   ");

        assertThatThrownBy(() -> testLaboratoireService.create(validDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("code");
    }

    @Test
    void create_leveIllegalArgumentException_siNomVide() {
        validDto.setNomTest(null);

        assertThatThrownBy(() -> testLaboratoireService.create(validDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nom");
    }

    @Test
    void create_leveIllegalArgumentException_siCodeDejaUtilise() {
        when(testLaboratoireRepository.existsByCodeTest("CREA-01")).thenReturn(true);

        assertThatThrownBy(() -> testLaboratoireService.create(validDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    void getById_retourneDto_quandTrouve() {
        when(testLaboratoireRepository.findById(1L)).thenReturn(Optional.of(persisted));

        TestLaboratoireDTO out = testLaboratoireService.getById(1L);

        assertThat(out.getCodeTest()).isEqualTo("CREA-01");
        assertThat(out.getNomTest()).isEqualTo("Créatinine");
    }

    @Test
    void getById_leve_siAbsent() {
        when(testLaboratoireRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> testLaboratoireService.getById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("non trouvé");
    }

    @Test
    void getAll_retourneListe() {
        when(testLaboratoireRepository.findAll()).thenReturn(List.of(persisted));

        List<TestLaboratoireDTO> list = testLaboratoireService.getAll();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getCodeTest()).isEqualTo("CREA-01");
    }

    @Test
    void update_metAJour_quandExiste() {
        when(testLaboratoireRepository.findById(1L)).thenReturn(Optional.of(persisted));
        when(testLaboratoireRepository.save(any(TestLaboratoire.class))).thenAnswer(inv -> inv.getArgument(0));

        TestLaboratoireDTO patch = new TestLaboratoireDTO();
        patch.setCodeTest("CREA-01");
        patch.setNomTest("Creatinine updated");
        patch.setDelaiRenduHeures(8);

        TestLaboratoireDTO out = testLaboratoireService.update(1L, patch);

        assertThat(out.getNomTest()).isEqualTo("Creatinine updated");
        assertThat(out.getDelaiRenduHeures()).isEqualTo(8);
    }

    @Test
    void delete_supprime_quandExiste() {
        when(testLaboratoireRepository.existsById(1L)).thenReturn(true);

        testLaboratoireService.delete(1L);

        verify(testLaboratoireRepository).deleteById(1L);
    }

    @Test
    void delete_leve_siAbsent() {
        when(testLaboratoireRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> testLaboratoireService.delete(404L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("non trouvé");
    }
}
