package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Medecin;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Enum.Diagnostic;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.MedecinRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.dto.DossierMedicalDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DossierMedicalServiceTest {

    @Mock
    private DossierMedicalRepository dossierMedicalRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MedecinRepository medecinRepository;

    @InjectMocks
    private DossierMedicalService dossierMedicalService;

    private DossierMedicalDTO newDossierDto;
    private DossierMedical savedEntity;

    @BeforeEach
    void setUp() {
        newDossierDto = new DossierMedicalDTO();
        newDossierDto.setIdPatient(10L);
        newDossierDto.setDateCreation(LocalDate.of(2026, 1, 15));
        newDossierDto.setIdMedecin(5L);
        newDossierDto.setDiagnostic(Diagnostic.CYSTITE);
        newDossierDto.setNotes("notes");

        savedEntity = new DossierMedical();
        savedEntity.setIdDossierMedical(100L);
        savedEntity.setIdPatient(10L);
        savedEntity.setDateCreation(LocalDate.of(2026, 1, 15));
        savedEntity.setIdMedecin(5L);
        savedEntity.setDiagnostic(Diagnostic.CYSTITE);
        savedEntity.setNotes("notes");
        savedEntity.setPoids(BigDecimal.valueOf(20));
        savedEntity.setTaille(BigDecimal.valueOf(110));
        savedEntity.setImc(BigDecimal.valueOf(16.5));
    }

    @Test
    void createDossier_sauvegardeEtEnrichitLesNomsPatientEtMedecin() {
        when(dossierMedicalRepository.countByIdPatient(10L)).thenReturn(0L);
        when(dossierMedicalRepository.save(any(DossierMedical.class))).thenAnswer(inv -> {
            DossierMedical d = inv.getArgument(0);
            d.setIdDossierMedical(100L);
            return d;
        });

        Patient patient = new Patient();
        patient.setIdPatient(10L);
        patient.setFirstName("Alice");
        patient.setLastName("Dupont");
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));

        Medecin medecin = new Medecin();
        medecin.setIdMedecin(5L);
        medecin.setNom("Martin");
        medecin.setPrenom("Paul");
        when(medecinRepository.findById(5L)).thenReturn(Optional.of(medecin));

        DossierMedicalDTO result = dossierMedicalService.createDossier(newDossierDto);

        assertThat(result.getIdDossierMedical()).isEqualTo(100L);
        assertThat(result.getPatientNom()).isEqualTo("Alice Dupont");
        // Aligné sur enrichWithNames (concat nom + partie prénom trim)
        assertThat(result.getMedecinNom()).isEqualTo("Dr. MartinPaul");
        verify(dossierMedicalRepository).save(any(DossierMedical.class));
    }

    @Test
    void createDossier_leveIllegalArgumentException_siPatientADejaUnDossier() {
        when(dossierMedicalRepository.countByIdPatient(10L)).thenReturn(1L);

        assertThatThrownBy(() -> dossierMedicalService.createDossier(newDossierDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("déjà un dossier");
    }

    @Test
    void getDossierById_retourneLeDto_quandTrouve() {
        when(dossierMedicalRepository.findById(100L)).thenReturn(Optional.of(savedEntity));
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        when(medecinRepository.findById(5L)).thenReturn(Optional.empty());

        DossierMedicalDTO dto = dossierMedicalService.getDossierById(100L);

        assertThat(dto.getIdDossierMedical()).isEqualTo(100L);
        assertThat(dto.getPatientNom()).isEqualTo("Patient #10");
        assertThat(dto.getMedecinNom()).isEqualTo("Médecin #5");
    }

    @Test
    void getDossierById_leveRuntimeException_siAbsent() {
        when(dossierMedicalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dossierMedicalService.getDossierById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("non trouvé");
    }

    @Test
    void updateDossier_metAJour_quandExiste() {
        when(dossierMedicalRepository.findById(100L)).thenReturn(Optional.of(savedEntity));
        when(dossierMedicalRepository.save(any(DossierMedical.class))).thenAnswer(inv -> inv.getArgument(0));
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        when(medecinRepository.findById(5L)).thenReturn(Optional.empty());

        DossierMedicalDTO patch = new DossierMedicalDTO();
        patch.setIdPatient(10L);
        patch.setDateCreation(LocalDate.of(2026, 2, 1));
        patch.setIdMedecin(5L);
        patch.setDiagnostic(Diagnostic.PYELONEPHRITE);
        patch.setNotes("updated");

        DossierMedicalDTO out = dossierMedicalService.updateDossier(100L, patch);

        assertThat(out.getDiagnostic()).isEqualTo(Diagnostic.PYELONEPHRITE);
        assertThat(out.getNotes()).isEqualTo("updated");
    }

    @Test
    void deleteDossier_supprime_quandExiste() {
        when(dossierMedicalRepository.existsById(100L)).thenReturn(true);

        dossierMedicalService.deleteDossier(100L);

        verify(dossierMedicalRepository).deleteById(100L);
    }

    @Test
    void deleteDossier_leve_siAbsent() {
        when(dossierMedicalRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> dossierMedicalService.deleteDossier(404L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("non trouvé");
    }

    @Test
    void getAllDossiers_retourneListeEnrichie() {
        when(dossierMedicalRepository.findAll()).thenReturn(List.of(savedEntity));
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        when(medecinRepository.findById(5L)).thenReturn(Optional.empty());

        List<DossierMedicalDTO> all = dossierMedicalService.getAllDossiers();

        assertThat(all).hasSize(1);
        assertThat(all.get(0).getIdDossierMedical()).isEqualTo(100L);
    }

    @Test
    void countDossiersByMedecin_delegueAuRepository() {
        when(dossierMedicalRepository.countByIdMedecin(5L)).thenReturn(3L);

        assertThat(dossierMedicalService.countDossiersByMedecin(5L)).isEqualTo(3L);
    }

    @Test
    void existsDossier_delegueAuRepository() {
        when(dossierMedicalRepository.existsById(1L)).thenReturn(true);

        assertThat(dossierMedicalService.existsDossier(1L)).isTrue();
    }
}
