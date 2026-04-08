package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Entities.ResultatLaboratoire;
import com.example.NEPHRO.Entities.TestLaboratoire;
import com.example.NEPHRO.dto.ResultatLabtestDTO;
import com.example.NEPHRO.Enum.StatutResultat;
import com.example.NEPHRO.Enum.StatutPrescription;
import com.example.NEPHRO.Enum.SourceResultat;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import com.example.NEPHRO.Repository.ResultatLabtestRepository;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.Repository.ResultatLaboratoireRepository;
import com.example.NEPHRO.Repository.TestLaboratoireRepository;
import com.example.NEPHRO.dto.ResultatLaboratoireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResultatLaboratoireService {

    private final ResultatLaboratoireRepository resultatLaboratoireRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final TestLaboratoireRepository testLaboratoireRepository;
    private final PatientRepository patientRepository;
    private final NotificationMedecinService notificationMedecinService;
    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final PrescriptionBilanService prescriptionBilanService;
    private final ModuleLaboService moduleLaboService;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final ResultatLabtestService resultatLabtestService;

    private static final Pattern FIRST_NUMBER_PATTERN = Pattern.compile("(-?\\d+(?:[\\.,]\\d+)?)");

    private ResultatLaboratoireDTO toDTO(ResultatLaboratoire entity) {
        ResultatLaboratoireDTO dto = new ResultatLaboratoireDTO();
        dto.setIdResultatLaboratoire(entity.getIdResultatLaboratoire());
        dto.setIdDossierMedical(entity.getDossierMedical() != null ? entity.getDossierMedical().getIdDossierMedical() : null);
        dto.setIdTestLaboratoire(entity.getTestLaboratoire() != null ? entity.getTestLaboratoire().getIdTestLaboratoire() : null);
        dto.setDatePrelevement(entity.getDatePrelevement());
        dto.setDateRendu(entity.getDateRendu());
        dto.setDateResultat(entity.getDateResultat());
        dto.setValeurNumerique(entity.getValeurNumerique());
        dto.setValeurTexte(entity.getValeurTexte());
        dto.setValeurResultat(entity.getValeurResultat());
        dto.setUnite(entity.getUnite());
        dto.setConclusion(entity.getConclusion());
        dto.setStatutResultat(entity.getStatutResultat());
        dto.setInterpretation(entity.getInterpretation());
        dto.setSourceImport(entity.getSourceImport());
        dto.setValideParMedecin(entity.getValideParMedecin());
        dto.setDateValidation(entity.getDateValidation());
        dto.setPartagePatient(entity.getPartagePatient());
        dto.setEtat(entity.getEtat());
        if (entity.getTestLaboratoire() != null) {
            dto.setNomTest(entity.getTestLaboratoire().getNomTest());
            dto.setCodeTest(entity.getTestLaboratoire().getCodeTest());
        }
        return dto;
    }

    private ResultatLaboratoire toEntity(ResultatLaboratoireDTO dto) {
        ResultatLaboratoire entity = new ResultatLaboratoire();
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        TestLaboratoire test = testLaboratoireRepository.findById(dto.getIdTestLaboratoire())
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé: " + dto.getIdTestLaboratoire()));
        entity.setDossierMedical(dossier);
        entity.setTestLaboratoire(test);
        entity.setDatePrelevement(dto.getDatePrelevement());
        entity.setDateRendu(dto.getDateRendu());
        entity.setDateResultat(dto.getDateResultat());
        entity.setValeurNumerique(dto.getValeurNumerique());
        entity.setValeurTexte(dto.getValeurTexte());
        entity.setValeurResultat(dto.getValeurResultat());
        entity.setUnite(dto.getUnite());
        entity.setConclusion(dto.getConclusion());
        entity.setStatutResultat(dto.getStatutResultat() != null ? dto.getStatutResultat() : StatutResultat.EN_ATTENTE);
        entity.setInterpretation(dto.getInterpretation());
        entity.setSourceImport(dto.getSourceImport());
        entity.setValideParMedecin(dto.getValideParMedecin());
        entity.setDateValidation(dto.getDateValidation());
        entity.setPartagePatient(dto.getPartagePatient() != null ? dto.getPartagePatient() : false);
        entity.setEtat(dto.getEtat());
        return entity;
    }

    public ResultatLaboratoireDTO create(ResultatLaboratoireDTO dto) {
        ResultatLaboratoire saved = resultatLaboratoireRepository.save(toEntity(dto));
        notifierMedecinNouveauTestLabo(saved);
        boolean lieAUneDemande = false;
        try {
            lieAUneDemande = maybeCreateLabtestFromDemand(saved);
        } catch (Exception ignored) {
            // Ne bloque pas la création du résultat patient.
        }
        if (!lieAUneDemande) {
            try {
                notifierKaliemieSiSaisiePatientSansLabtest(saved);
            } catch (Exception ignored) {
            }
        }
        if (saved.getDossierMedical() != null && saved.getDossierMedical().getIdDossierMedical() != null) {
            prescriptionBilanService.recalculerStatutsPrescriptionsDossier(saved.getDossierMedical().getIdDossierMedical());
        }
        return toDTO(saved);
    }

    /** K+ saisi sans prescription correspondante : alertes patient / médecin via {@link ModuleLaboService}. */
    private void notifierKaliemieSiSaisiePatientSansLabtest(ResultatLaboratoire saved) {
        if (saved.getTestLaboratoire() == null || saved.getDossierMedical() == null) return;
        String loinc = saved.getTestLaboratoire().getCodeLoinc();
        String nom = saved.getTestLaboratoire().getNomTest();
        if (loinc == null && nom == null) return;
        String lib = (nom != null ? nom : "").toLowerCase();
        String c = loinc != null ? loinc.trim() : "";
        boolean potassium = "2823-3".equalsIgnoreCase(c) || lib.contains("kali") || lib.contains("potassium");
        if (!potassium) return;
        Double val = saved.getValeurNumerique();
        if (val == null && saved.getValeurResultat() != null && !saved.getValeurResultat().isBlank()) {
            Matcher m = FIRST_NUMBER_PATTERN.matcher(saved.getValeurResultat().trim());
            if (m.find()) {
                try {
                    val = Double.parseDouble(m.group(1).replace(',', '.'));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        if (val == null) return;
        moduleLaboService.notifierKaliemieDepuisSaisiePatient(
                val, saved.getDossierMedical().getIdDossierMedical(), saved.getIdResultatLaboratoire());
    }

    /**
     * Synchronise le résultat saisi (ResultatLaboratoire) avec le module labo (PrescriptionBilan -> ResultatLabtest).
     * Ainsi, les statuts des demandes et les alertes critiques restent cohérents.
     */
    /** @return true si un {@link com.example.NEPHRO.Entities.ResultatLabtest} a été créé (alertes K+ déjà gérées côté labtest). */
    private boolean maybeCreateLabtestFromDemand(ResultatLaboratoire saved) {
        if (saved == null) return false;
        if (saved.getDossierMedical() == null) return false;
        if (saved.getTestLaboratoire() == null) return false;

        Long dossierId = saved.getDossierMedical().getIdDossierMedical();
        String codeLoinc = saved.getTestLaboratoire().getCodeLoinc();
        if (dossierId == null || codeLoinc == null || codeLoinc.isBlank()) return false;

        // Cherche la demande (en attente/partielle) qui contient ce LOINC.
        List<PrescriptionBilan> demandes = prescriptionBilanRepository.findByDossierIdOrderByDatePrescriptionDesc(dossierId);
        Optional<PrescriptionBilan> matched = demandes.stream()
                .filter(p -> p.getStatut() == StatutPrescription.EN_ATTENTE || p.getStatut() == StatutPrescription.PARTIEL)
                .filter(p -> p.getExamens() != null && p.getExamens().contains(codeLoinc))
                .findFirst();

        if (matched.isEmpty()) return false;
        PrescriptionBilan presc = matched.get();
        if (presc.getId() == null) return false;

        if (resultatLabtestRepository.existsByPrescriptionIdAndDossierIdAndCodeLoinc(presc.getId(), dossierId, codeLoinc)) {
            return true;
        }

        ParsedValeur parsed = parseValeurForLabtest(saved.getValeurNumerique(), saved.getValeurResultat());

        ResultatLabtestDTO labDto = new ResultatLabtestDTO();
        labDto.setPrescriptionId(presc.getId());
        labDto.setDossierId(dossierId);
        labDto.setCodeLoinc(codeLoinc);
        labDto.setLibelleExamen(saved.getTestLaboratoire().getNomTest());
        labDto.setValeur(parsed.valeur());
        labDto.setUnite(parsed.unite());
        labDto.setDatePrelevement(saved.getDatePrelevement());
        labDto.setDateRendu(saved.getDateRendu());
        labDto.setSource(SourceResultat.SAISIE_MANUELLE);

        // Création + interprétation auto + alertes + mise à jour statut de la demande.
        resultatLabtestService.create(labDto);
        return true;
    }

    private record ParsedValeur(BigDecimal valeur, String unite) {}

    private ParsedValeur parseValeurForLabtest(Double valeurNumerique, String valeurResultatLegacy) {
        // Cas 1 : valeur numérique déjà fournie.
        if (valeurNumerique != null) {
            return new ParsedValeur(BigDecimal.valueOf(valeurNumerique), null);
        }

        // Cas 2 : on tente d'extraire un nombre depuis la valeur legacy (ex: "14.2 g/L").
        if (valeurResultatLegacy == null || valeurResultatLegacy.isBlank()) {
            return new ParsedValeur(null, null);
        }

        String input = valeurResultatLegacy.trim();
        Matcher m = FIRST_NUMBER_PATTERN.matcher(input);
        if (!m.find()) {
            // Résultat qualitatif : ex "Normal", "Positif"...
            return new ParsedValeur(null, null);
        }

        String numberStr = m.group(1).replace(',', '.');
        BigDecimal valeur;
        try {
            valeur = new BigDecimal(numberStr);
        } catch (Exception e) {
            valeur = null;
        }

        String after = input.substring(m.end()).trim();
        after = after.replaceAll("^[—–-\\s]+", "").trim();
        String unite = after.isBlank() ? null : after;
        return new ParsedValeur(valeur, unite);
    }

    private void notifierMedecinNouveauTestLabo(ResultatLaboratoire resultat) {
        DossierMedical dossier = resultat.getDossierMedical();
        if (dossier == null || dossier.getIdMedecin() == null) return;
        String nomPatient = "";
        if (dossier.getIdPatient() != null) {
            Optional<Patient> opt = patientRepository.findById(dossier.getIdPatient());
            if (opt.isPresent()) {
                Patient p = opt.get();
                nomPatient = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
            }
        }
        String nomTest = resultat.getTestLaboratoire() != null ? resultat.getTestLaboratoire().getNomTest() : null;
        String dateStr = resultat.getDateRendu() != null ? resultat.getDateRendu().toString() : (resultat.getDateResultat() != null ? resultat.getDateResultat().toString() : null);
        notificationMedecinService.creerPourNouveauTestLabo(
                dossier.getIdMedecin(),
                dossier.getIdDossierMedical(),
                resultat.getIdResultatLaboratoire(),
                nomPatient,
                nomTest,
                dateStr
        );
    }

    public ResultatLaboratoireDTO update(Long id, ResultatLaboratoireDTO dto) {
        ResultatLaboratoire entity = resultatLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id));
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        TestLaboratoire test = testLaboratoireRepository.findById(dto.getIdTestLaboratoire())
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé: " + dto.getIdTestLaboratoire()));
        entity.setDossierMedical(dossier);
        entity.setTestLaboratoire(test);
        entity.setDatePrelevement(dto.getDatePrelevement());
        entity.setDateRendu(dto.getDateRendu());
        entity.setDateResultat(dto.getDateResultat());
        entity.setValeurNumerique(dto.getValeurNumerique());
        entity.setValeurTexte(dto.getValeurTexte());
        entity.setValeurResultat(dto.getValeurResultat());
        entity.setUnite(dto.getUnite());
        entity.setConclusion(dto.getConclusion());
        if (dto.getStatutResultat() != null) entity.setStatutResultat(dto.getStatutResultat());
        entity.setInterpretation(dto.getInterpretation());
        entity.setSourceImport(dto.getSourceImport());
        entity.setValideParMedecin(dto.getValideParMedecin());
        entity.setDateValidation(dto.getDateValidation());
        if (dto.getPartagePatient() != null) entity.setPartagePatient(dto.getPartagePatient());
        entity.setEtat(dto.getEtat());
        ResultatLaboratoire saved = resultatLaboratoireRepository.save(entity);
        if (saved.getDossierMedical() != null && saved.getDossierMedical().getIdDossierMedical() != null) {
            prescriptionBilanService.recalculerStatutsPrescriptionsDossier(saved.getDossierMedical().getIdDossierMedical());
        }
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public ResultatLaboratoireDTO getById(Long id) {
        ResultatLaboratoire entity = resultatLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id));
        return toDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getAll() {
        return resultatLaboratoireRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getByDossier(Long idDossierMedical) {
        return resultatLaboratoireRepository.findByDossierMedicalIdDossierMedicalOrderByDateResultatDesc(idDossierMedical)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return resultatLaboratoireRepository.findByDateResultatBetween(dateDebut, dateFin)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void delete(Long id) {
        ResultatLaboratoire entity = resultatLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id));
        Long dossierId = entity.getDossierMedical() != null ? entity.getDossierMedical().getIdDossierMedical() : null;
        resultatLaboratoireRepository.deleteById(id);
        if (dossierId != null) {
            prescriptionBilanService.recalculerStatutsPrescriptionsDossier(dossierId);
        }
    }
}
