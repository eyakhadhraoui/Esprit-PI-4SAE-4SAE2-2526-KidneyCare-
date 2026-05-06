package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.ImageMedicale;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Entities.RapportBilan;
import com.example.NEPHRO.Entities.ResultatLaboratoire;
import com.example.NEPHRO.Entities.ResultatLabtest;
import com.example.NEPHRO.Entities.Suivi;
import com.example.NEPHRO.Enum.TypeBilan;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.ImageMedicaleRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import com.example.NEPHRO.Repository.RapportBilanRepository;
import com.example.NEPHRO.Repository.ResultatLaboratoireRepository;
import com.example.NEPHRO.Repository.ResultatLabtestRepository;
import com.example.NEPHRO.Repository.SuiviRepository;
import com.example.NEPHRO.dto.CalendrierEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Agrège suivis, images médicales, demandes d'examens, résultats et rapports de bilan pour le calendrier patient.
 */
@Service
@RequiredArgsConstructor
public class CalendrierService {

    private final PatientRepository patientRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final SuiviRepository suiviRepository;
    private final ImageMedicaleRepository imageMedicaleRepository;
    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final ResultatLaboratoireRepository resultatLaboratoireRepository;
    private final RapportBilanRepository rapportBilanRepository;

    /**
     * Retourne tous les événements calendrier du patient connecté.
     */
    @Transactional(readOnly = true)
    public List<CalendrierEventDTO> getEvenementsPourPatient(String username) {
        Optional<Patient> opt = patientRepository.findByUsername(username);
        if (opt.isEmpty()) return List.of();
        Patient patient = opt.get();

        Set<Long> idDossiers = dossierMedicalRepository.findByIdPatient(patient.getIdPatient()).stream()
                .map(d -> d.getIdDossierMedical())
                .collect(Collectors.toSet());
        if (idDossiers.isEmpty()) return List.of();

        List<CalendrierEventDTO> events = new ArrayList<>();

        List<Suivi> suivis = suiviRepository.findByDossierMedical_IdDossierMedicalIn(idDossiers);
        for (Suivi s : suivis) {
            Long idDossier = s.getDossierMedical() != null ? s.getDossierMedical().getIdDossierMedical() : null;
            if (idDossier == null) continue;
            String titre = "Suivi — " + (s.getResultat() != null ? s.getResultat().getLibelle() : "Ajouté par le médecin");
            String desc = s.getNotes() != null && !s.getNotes().isBlank() ? s.getNotes() : null;
            if (desc != null && desc.length() > 100) desc = desc.substring(0, 97) + "...";
            events.add(new CalendrierEventDTO(
                    s.getDateSuivi(),
                    CalendrierEventDTO.TypeEvent.SUIVI,
                    titre,
                    s.getIdSuivi(),
                    idDossier,
                    desc
            ));
        }

        List<ImageMedicale> images = imageMedicaleRepository.findByDossierMedical_IdDossierMedicalIn(idDossiers);
        for (ImageMedicale img : images) {
            Long idDossier = img.getDossierMedical() != null ? img.getDossierMedical().getIdDossierMedical() : null;
            if (idDossier == null) continue;
            String titre = img.getTypeImage() != null ? img.getTypeImage().getLibelle() : "Image médicale";
            String desc = img.getDescription() != null && !img.getDescription().isBlank() ? img.getDescription() : null;
            if (desc != null && desc.length() > 100) desc = desc.substring(0, 97) + "...";
            events.add(new CalendrierEventDTO(
                    img.getDateCapture(),
                    CalendrierEventDTO.TypeEvent.IMAGE_MEDICALE,
                    titre,
                    img.getIdImage(),
                    idDossier,
                    desc
            ));
        }

        List<PrescriptionBilan> prescriptions = prescriptionBilanRepository.findByDossierIdIn(idDossiers);
        for (PrescriptionBilan p : prescriptions) {
            if (p.getDossierId() == null || p.getDatePrescription() == null) continue;
            LocalDate d = p.getDatePrescription().toLocalDate();
            String titreDemande = titrePrescription(p);
            String desc = descriptionPrescription(p);
            events.add(new CalendrierEventDTO(
                    d,
                    CalendrierEventDTO.TypeEvent.TEST_DEMANDE,
                    titreDemande,
                    p.getId(),
                    p.getDossierId(),
                    desc
            ));
        }

        List<ResultatLabtest> labtests = resultatLabtestRepository.findByDossierIdIn(idDossiers);
        List<ResultatLaboratoire> laboratoires = resultatLaboratoireRepository.findByDossierMedical_IdDossierMedicalIn(idDossiers);
        ajouterEvenementsTestsRealises(events, labtests, laboratoires);

        List<RapportBilan> rapports = rapportBilanRepository.findByDossierIdIn(idDossiers);
        for (RapportBilan rb : rapports) {
            if (rb.getDossierId() == null || rb.getDateGeneration() == null) continue;
            LocalDate d = rb.getDateGeneration().toLocalDate();
            String titre = rb.getPrescriptionId() != null
                    ? ("Rapport médical — demande #" + rb.getPrescriptionId())
                    : "Rapport médical";
            String desc = null;
            if (rb.getCommentaireMedecin() != null && !rb.getCommentaireMedecin().isBlank()) {
                desc = rb.getCommentaireMedecin().trim();
                if (desc.length() > 120) desc = desc.substring(0, 117) + "...";
            }
            events.add(new CalendrierEventDTO(
                    d,
                    CalendrierEventDTO.TypeEvent.RAPPORT_BILAN,
                    titre,
                    rb.getId(),
                    rb.getDossierId(),
                    desc
            ));
        }

        events.sort((a, b) -> {
            int c = b.getDate().compareTo(a.getDate());
            if (c != 0) return c;
            return a.getType().compareTo(b.getType());
        });
        return events;
    }

    private static String titrePrescription(PrescriptionBilan p) {
        TypeBilan tb = p.getTypeBilan();
        if (tb != null) {
            return "Demande d'examen — " + tb.getLibelle();
        }
        return "Demande d'examens de laboratoire";
    }

    private static String descriptionPrescription(PrescriptionBilan p) {
        StringBuilder sb = new StringBuilder();
        sb.append("Statut : ").append(p.getStatut() != null ? p.getStatut().name() : "");
        if (Boolean.TRUE.equals(p.getUrgence())) {
            sb.append(" — Urgent");
        }
        if (p.getExamens() != null && !p.getExamens().isEmpty()) {
            sb.append(" — ").append(p.getExamens().size()).append(" code(s) LOINC");
        }
        if (p.getNoteClinique() != null && !p.getNoteClinique().isBlank()) {
            String n = p.getNoteClinique().trim();
            if (n.length() > 80) n = n.substring(0, 77) + "...";
            sb.append(" — ").append(n);
        }
        String out = sb.toString();
        return out.length() > 200 ? out.substring(0, 197) + "..." : out;
    }

    /**
     * Résultats d'examens : d'abord les {@link ResultatLabtest}, puis {@link ResultatLaboratoire}
     * seulement s'il n'existe pas déjà un résultat module labo le même jour × même LOINC (évite doublon).
     */
    private void ajouterEvenementsTestsRealises(
            List<CalendrierEventDTO> events,
            List<ResultatLabtest> labtests,
            List<ResultatLaboratoire> laboratoires) {

        Set<String> clesDejaVues = new HashSet<>();

        for (ResultatLabtest r : labtests) {
            if (r.getDossierId() == null) continue;
            LocalDate d = datePourResultatLabtest(r);
            if (d == null) continue;
            String loinc = r.getCodeLoinc() != null ? r.getCodeLoinc().trim() : "";
            clesDejaVues.add(cleRealise(r.getDossierId(), loinc, d));
            String lib = r.getLibelleExamen() != null && !r.getLibelleExamen().isBlank()
                    ? r.getLibelleExamen()
                    : ("Examen " + loinc);
            String desc = r.getValeur() != null
                    ? ("Valeur : " + r.getValeur() + (r.getUnite() != null ? " " + r.getUnite() : ""))
                    : null;
            events.add(new CalendrierEventDTO(
                    d,
                    CalendrierEventDTO.TypeEvent.TEST_REALISE,
                    "Examen réalisé — " + lib,
                    r.getId(),
                    r.getDossierId(),
                    desc
            ));
        }

        for (ResultatLaboratoire r : laboratoires) {
            Long idDossier = r.getDossierMedical() != null ? r.getDossierMedical().getIdDossierMedical() : null;
            if (idDossier == null) continue;
            LocalDate d = datePourResultatLaboratoire(r);
            if (d == null) continue;
            String loinc = "";
            if (r.getTestLaboratoire() != null && r.getTestLaboratoire().getCodeLoinc() != null) {
                loinc = r.getTestLaboratoire().getCodeLoinc().trim();
            }
            String cle = cleRealise(idDossier, loinc, d);
            if (clesDejaVues.contains(cle)) continue;
            clesDejaVues.add(cle);

            String lib = r.getTestLaboratoire() != null && r.getTestLaboratoire().getNomTest() != null
                    ? r.getTestLaboratoire().getNomTest()
                    : "Résultat d'examen";
            String desc = null;
            if (r.getValeurNumerique() != null) {
                desc = "Valeur : " + r.getValeurNumerique() + (r.getUnite() != null ? " " + r.getUnite() : "");
            } else if (r.getValeurTexte() != null && !r.getValeurTexte().isBlank()) {
                desc = r.getValeurTexte();
            }
            events.add(new CalendrierEventDTO(
                    d,
                    CalendrierEventDTO.TypeEvent.TEST_REALISE,
                    "Examen réalisé — " + lib,
                    r.getIdResultatLaboratoire(),
                    idDossier,
                    desc
            ));
        }
    }

    private static String cleRealise(Long dossierId, String loinc, LocalDate d) {
        return dossierId + "|" + loinc + "|" + d;
    }

    private static LocalDate datePourResultatLabtest(ResultatLabtest r) {
        if (r.getDateRendu() != null) return r.getDateRendu().toLocalDate();
        if (r.getDatePrelevement() != null) return r.getDatePrelevement().toLocalDate();
        return null;
    }

    private static LocalDate datePourResultatLaboratoire(ResultatLaboratoire r) {
        LocalDateTime rendu = r.getDateRendu();
        if (rendu != null) return rendu.toLocalDate();
        LocalDateTime prel = r.getDatePrelevement();
        if (prel != null) return prel.toLocalDate();
        return r.getDateResultat();
    }
}
