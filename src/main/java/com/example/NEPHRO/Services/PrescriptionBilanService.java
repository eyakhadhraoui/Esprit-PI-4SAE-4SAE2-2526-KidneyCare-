package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.AlerteLabo;
import com.example.NEPHRO.Entities.Medecin;
import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Entities.RapportBilan;
import com.example.NEPHRO.Entities.ResultatLaboratoire;
import com.example.NEPHRO.Entities.ResultatLabtest;
import com.example.NEPHRO.Enum.StatutPrescription;
import com.example.NEPHRO.Repository.AlerteLaboRepository;
import com.example.NEPHRO.Repository.MedecinRepository;
import com.example.NEPHRO.Repository.NotificationMedecinRepository;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import com.example.NEPHRO.Repository.RapportBilanRepository;
import com.example.NEPHRO.Repository.ResultatLaboratoireRepository;
import com.example.NEPHRO.Repository.ResultatLabtestRepository;
import com.example.NEPHRO.dto.PrescriptionBilanDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionBilanService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final MedecinRepository medecinRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final ResultatLaboratoireRepository resultatLaboratoireRepository;
    private final AlerteLaboRepository alerteLaboRepository;
    private final NotificationMedecinRepository notificationMedecinRepository;
    private final RapportBilanRepository rapportBilanRepository;

    private PrescriptionBilanDTO toDTO(PrescriptionBilan e) {
        PrescriptionBilanDTO dto = new PrescriptionBilanDTO();
        dto.setId(e.getId());
        dto.setDossierId(e.getDossierId());
        dto.setMedecinId(e.getMedecinId());
        dto.setDatePrescription(e.getDatePrescription());
        dto.setTypeBilan(e.getTypeBilan());
        dto.setTypeBilanLibelle(e.getTypeBilan() != null ? e.getTypeBilan().getLibelle() : null);
        dto.setExamens(e.getExamens() != null ? List.copyOf(e.getExamens()) : List.of());
        dto.setUrgence(e.getUrgence());
        dto.setLaboId(e.getLaboId());
        dto.setLaboLibelle(libelleLaboratoire(e.getLaboId()));
        dto.setMedecinNomComplet(medecinNomComplet(e.getMedecinId()));
        dto.setStatut(e.getStatut());
        dto.setNoteClinique(e.getNoteClinique());
        return dto;
    }

    private static String libelleLaboratoire(Long laboId) {
        if (laboId == null) return null;
        return switch (laboId.intValue()) {
            case 1 -> "Labo Central Tunis";
            case 2 -> "Labo Enfant CHU";
            case 3 -> "Labo Privé";
            default -> "Laboratoire n°" + laboId;
        };
    }

    private String medecinNomComplet(Long medecinId) {
        if (medecinId == null) return null;
        return medecinRepository.findById(medecinId)
                .map(this::formatMedecin)
                .orElse(null);
    }

    private String formatMedecin(Medecin m) {
        String p = m.getPrenom() != null ? m.getPrenom().trim() : "";
        String n = m.getNom() != null ? m.getNom().trim() : "";
        String both = (p + " " + n).trim();
        if (both.isEmpty()) return null;
        return "Dr. " + both;
    }

    private PrescriptionBilan toEntity(PrescriptionBilanDTO dto) {
        PrescriptionBilan e = PrescriptionBilan.builder()
                .dossierId(dto.getDossierId())
                .medecinId(dto.getMedecinId())
                .datePrescription(dto.getDatePrescription() != null ? dto.getDatePrescription() : java.time.LocalDateTime.now())
                .typeBilan(dto.getTypeBilan())
                .examens(dto.getExamens() != null ? new java.util.ArrayList<>(dto.getExamens()) : new java.util.ArrayList<>())
                .urgence(dto.getUrgence() != null ? dto.getUrgence() : false)
                .laboId(dto.getLaboId())
                .statut(dto.getStatut() != null ? dto.getStatut() : StatutPrescription.EN_ATTENTE)
                .noteClinique(dto.getNoteClinique())
                .build();
        if (dto.getId() != null) e.setId(dto.getId());
        return e;
    }

    public PrescriptionBilanDTO create(PrescriptionBilanDTO dto) {
        dto.setStatut(StatutPrescription.EN_ATTENTE);
        PrescriptionBilan saved = prescriptionBilanRepository.save(toEntity(dto));
        if (saved.getDossierId() != null) {
            recalculerStatutsPrescriptionsDossier(saved.getDossierId());
            saved = prescriptionBilanRepository.findById(saved.getId()).orElse(saved);
        }
        return toDTO(saved);
    }

    public PrescriptionBilanDTO update(Long id, PrescriptionBilanDTO dto) {
        PrescriptionBilan e = prescriptionBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Prescription non trouvée: " + id));
        e.setTypeBilan(dto.getTypeBilan());
        e.setExamens(dto.getExamens() != null ? new java.util.ArrayList<>(dto.getExamens()) : e.getExamens());
        e.setUrgence(dto.getUrgence() != null ? dto.getUrgence() : e.getUrgence());
        e.setNoteClinique(dto.getNoteClinique());
        if (dto.getStatut() != null) e.setStatut(dto.getStatut());
        if (dto.getLaboId() != null) e.setLaboId(dto.getLaboId());
        return toDTO(prescriptionBilanRepository.save(e));
    }

    /**
     * Supprime la demande : notifications et rapports référençant les {@code resultat_labtest},
     * alertes, résultats, puis la prescription (ordre compatible contraintes FK MySQL).
     */
    public void delete(Long id) {
        PrescriptionBilan p = prescriptionBilanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée: " + id));
        List<ResultatLabtest> resultats = resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(id);
        Set<Long> resultIds = resultats.stream().map(ResultatLabtest::getId).collect(Collectors.toCollection(HashSet::new));

        if (!resultIds.isEmpty()) {
            notificationMedecinRepository.deleteAllByIdResultatLaboratoireIn(resultIds);
            retirerResultatsIdsDesRapportsBilan(p.getDossierId(), resultIds);
        }
        for (ResultatLabtest r : resultats) {
            List<AlerteLabo> alertes = alerteLaboRepository.findByResultatIdOrderByIdDesc(r.getId());
            alerteLaboRepository.deleteAll(alertes);
        }
        resultatLabtestRepository.deleteAll(resultats);
        prescriptionBilanRepository.delete(p);
    }

    /** Enlève les IDs de résultats supprimés des listes {@code rapport_bilan.resultats_ids} (évite FK / orphelins). */
    private void retirerResultatsIdsDesRapportsBilan(Long dossierId, Set<Long> resultIds) {
        if (dossierId == null || resultIds == null || resultIds.isEmpty()) return;
        List<RapportBilan> rapports = rapportBilanRepository.findByDossierIdOrderByDateGenerationDesc(dossierId);
        for (RapportBilan rb : rapports) {
            if (rb.getResultatsIds() == null || rb.getResultatsIds().isEmpty()) continue;
            List<Long> restants = rb.getResultatsIds().stream()
                    .filter(id -> id != null && !resultIds.contains(id))
                    .collect(Collectors.toList());
            if (restants.size() != rb.getResultatsIds().size()) {
                rb.setResultatsIds(new ArrayList<>(restants));
                rapportBilanRepository.save(rb);
            }
        }
    }

    /**
     * Résultat saisi par le patient (table {@code resultat_laboratoire}) pris en compte seulement s’il est
     * au moins aussi récent que la prescription : sinon une ancienne analyse du même LOINC ferait disparaître
     * la demande de « Mes demandes » (filtre EN_ATTENTE) alors qu’aucun nouveau prélèvement n’a été fait.
     */
    private boolean aResultatPatientApresPrescription(Long dossierId, String codeLoinc, LocalDateTime datePrescription) {
        if (dossierId == null || codeLoinc == null || codeLoinc.isBlank()) return false;
        String code = codeLoinc.trim();
        if (datePrescription == null) {
            return resultatLaboratoireRepository.existsByDossierMedical_IdDossierMedicalAndTestLaboratoire_CodeLoinc(
                    dossierId, code);
        }
        List<ResultatLaboratoire> liste = resultatLaboratoireRepository
                .findByDossierMedical_IdDossierMedicalAndTestLaboratoire_CodeLoinc(dossierId, code);
        LocalDate jourPresc = datePrescription.toLocalDate();
        for (ResultatLaboratoire r : liste) {
            LocalDateTime instant = r.getDateRendu();
            if (instant == null) instant = r.getDatePrelevement();
            if (instant != null) {
                if (!instant.isBefore(datePrescription)) return true;
                continue;
            }
            LocalDate d = r.getDateResultat();
            if (d != null && !d.isBefore(jourPresc)) return true;
        }
        return false;
    }

    /**
     * Met à jour le statut selon les résultats liés à la prescription.
     * Chaque ligne demandée (même LOINC répété, ex. deux examens 2000-8) doit avoir un résultat correspondant.
     */
    public void mettreAJourStatut(Long prescriptionId) {
        PrescriptionBilan p = prescriptionBilanRepository.findById(prescriptionId).orElse(null);
        if (p == null) return;
        List<String> examens = p.getExamens() == null ? List.of() : p.getExamens().stream()
                .filter(x -> x != null && !x.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        if (examens.isEmpty()) return;

        List<ResultatLabtest> resultats = resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(prescriptionId);
        List<String> restant = new ArrayList<>(examens);
        for (ResultatLabtest r : resultats) {
            if (r.getCodeLoinc() == null || r.getCodeLoinc().isBlank()) continue;
            String c = r.getCodeLoinc().trim();
            restant.remove(c);
        }

        if (restant.isEmpty()) {
            p.setStatut(StatutPrescription.COMPLET);
        } else if (!resultats.isEmpty()) {
            p.setStatut(StatutPrescription.PARTIEL);
        }
        prescriptionBilanRepository.save(p);
    }

    /**
     * Recalcule EN_ATTENTE / PARTIEL / COMPLET pour toutes les prescriptions du dossier,
     * en comptant à la fois les {@link ResultatLabtest} liés et les {@link com.example.NEPHRO.Entities.ResultatLaboratoire}
     * saisis par le patient (même code LOINC qu’à la demande).
     */
    public void recalculerStatutsPrescriptionsDossier(Long dossierId) {
        if (dossierId == null) return;
        List<PrescriptionBilan> list = prescriptionBilanRepository.findByDossierIdOrderByDatePrescriptionDesc(dossierId);
        for (PrescriptionBilan p : list) {
            if (p.getStatut() == StatutPrescription.ANNULE) continue;
            if (p.getId() == null) continue;
            List<String> examens = p.getExamens() == null ? List.of() : p.getExamens().stream()
                    .filter(x -> x != null && !x.isBlank())
                    .map(String::trim)
                    .collect(Collectors.toList());
            if (examens.isEmpty()) continue;

            List<ResultatLabtest> labtests = resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(p.getId());
            List<String> restant = new ArrayList<>(examens);
            for (ResultatLabtest r : labtests) {
                if (r.getCodeLoinc() == null || r.getCodeLoinc().isBlank()) continue;
                String c = r.getCodeLoinc().trim();
                restant.remove(c);
            }
            LocalDateTime dateRefPrescription = p.getDatePrescription();
            for (String code : new ArrayList<>(restant)) {
                if (aResultatPatientApresPrescription(dossierId, code, dateRefPrescription)) {
                    restant.remove(code);
                }
            }

            StatutPrescription nouveau;
            if (restant.isEmpty()) {
                nouveau = StatutPrescription.COMPLET;
            } else if (restant.size() < examens.size()) {
                nouveau = StatutPrescription.PARTIEL;
            } else {
                nouveau = StatutPrescription.EN_ATTENTE;
            }
            if (p.getStatut() != nouveau) {
                p.setStatut(nouveau);
                prescriptionBilanRepository.save(p);
            }
        }
    }

    @Transactional(readOnly = true)
    public PrescriptionBilanDTO getById(Long id) {
        return toDTO(prescriptionBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Prescription non trouvée: " + id)));
    }

    @Transactional(readOnly = true)
    public List<PrescriptionBilanDTO> getByDossier(Long dossierId) {
        return prescriptionBilanRepository.findByDossierIdOrderByDatePrescriptionDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionBilanDTO> getByMedecin(Long medecinId) {
        return prescriptionBilanRepository.findByMedecinIdOrderByDatePrescriptionDesc(medecinId).stream().map(this::toDTO).collect(Collectors.toList());
    }
}
