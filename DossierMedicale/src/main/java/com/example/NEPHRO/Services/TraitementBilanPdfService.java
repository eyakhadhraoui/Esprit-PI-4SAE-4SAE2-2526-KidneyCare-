package com.example.NEPHRO.Services;

import com.example.NEPHRO.dto.PrescriptionBilanDTO;
import com.example.NEPHRO.dto.ResultatLabtestDTO;
import com.example.NEPHRO.feign.dto.PrescriptionDTO;
import com.example.NEPHRO.feign.dto.PrescriptionItemDTO;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

/**
 * PDF complet : résumé traitement (médicaments) + résultats de tests liés à une prescription bilan.
 */
@Service
public class TraitementBilanPdfService {

    private static final Font H1 = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font H1_SUB = new Font(Font.HELVETICA, 12, Font.NORMAL);
    private static final Font H2 = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font P = new Font(Font.HELVETICA, 10, Font.NORMAL);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generate(
            Long patientId,
            PrescriptionBilanDTO demande,
            List<PrescriptionDTO> prescriptionsActives,
            List<ResultatLabtestDTO> resultats) {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 36, 36, 36, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        doc.add(new Paragraph("Rapport Médical", H1));
        doc.add(new Paragraph("Traitement & Résultats de laboratoire", H1_SUB));
        doc.add(Chunk.NEWLINE);

        Paragraph meta = new Paragraph("", P);
        meta.add(new Chunk("Patient ID " + safe(patientId) + "\n", P));
        meta.add(new Chunk("Dossier ID " + safe(demande != null ? demande.getDossierId() : null) + "\n", P));
        meta.add(new Chunk("Demande (REQ) #" + safe(demande != null ? demande.getId() : null) + "\n", P));
        if (demande != null && demande.getDatePrescription() != null) {
            meta.add(new Chunk("Date de demande " + DT.format(demande.getDatePrescription()) + "\n", P));
        }
        doc.add(meta);
        if (demande != null) {
            String typeLabel = null;
            if (demande.getTypeBilanLibelle() != null && !demande.getTypeBilanLibelle().isBlank()) typeLabel = demande.getTypeBilanLibelle();
            else if (demande.getTypeBilan() != null) typeLabel = demande.getTypeBilan().name();
            if (typeLabel != null) {
                doc.add(Chunk.NEWLINE);
                doc.add(new Paragraph(typeLabel, H2));
            }
        }
        doc.add(Chunk.NEWLINE);

        // ── Traitement ───────────────────────────────────────────────
        doc.add(new Paragraph("Résumé du traitement — Prescriptions actives", H2));
        doc.add(Chunk.NEWLINE);
        if (prescriptionsActives == null || prescriptionsActives.isEmpty()) {
            doc.add(new Paragraph("Aucune prescription active trouvée.", P));
        } else {
            // Table : médicament / dose / fréquence / période / horaires
            PdfPTable t = new PdfPTable(new float[]{3.2f, 2.2f, 1.8f, 2.3f, 2.0f});
            t.setWidthPercentage(100);
            t.addCell(cellHeader("Médicament"));
            t.addCell(cellHeader("Dosage"));
            t.addCell(cellHeader("Fréquence"));
            t.addCell(cellHeader("Période"));
            t.addCell(cellHeader("Horaires"));

            prescriptionsActives.stream()
                    .filter(p -> p != null && p.getPrescriptionItems() != null)
                    .sorted(Comparator.comparing(PrescriptionDTO::getPrescriptionDate, Comparator.nullsLast(Comparator.reverseOrder())))
                    .forEach(presc -> {
                        for (PrescriptionItemDTO it : presc.getPrescriptionItems()) {
                            if (it == null) continue;
                            String med = safe(it.getMedicationName());
                            if (med.isBlank()) med = "Médicament #" + safe(it.getMedicationId());
                            t.addCell(cell(med));
                            t.addCell(cell(safe(it.getDosageInstructions())));
                            t.addCell(cell(safe(it.getFrequency())));
                            t.addCell(cell(period(it)));
                            t.addCell(cell(times(it)));
                        }
                    });
            doc.add(t);
        }
        doc.add(Chunk.NEWLINE);

        // ── Résultats ────────────────────────────────────────────────
        doc.add(new Paragraph("Résultats de laboratoire (demande)", H2));
        doc.add(Chunk.NEWLINE);
        if (resultats == null || resultats.isEmpty()) {
            doc.add(new Paragraph("Aucun résultat enregistré pour cette demande.", P));
        } else {
            PdfPTable t = new PdfPTable(new float[]{2.1f, 3.7f, 2.2f, 2.0f});
            t.setWidthPercentage(100);
            t.addCell(cellHeader("LOINC"));
            t.addCell(cellHeader("Examen"));
            t.addCell(cellHeader("Valeur"));
            t.addCell(cellHeader("Date"));
            resultats.stream()
                    .sorted(Comparator.comparing(ResultatLabtestDTO::getDateRendu, Comparator.nullsLast(Comparator.reverseOrder())))
                    .forEach(r -> {
                        t.addCell(cell(safe(r.getCodeLoinc())));
                        t.addCell(cell(safe(r.getLibelleExamen())));
                        t.addCell(cell(valeur(r)));
                        t.addCell(cell(dateResultat(r)));
                    });
            doc.add(t);
        }

        // ── Calendrier ───────────────────────────────────────────────
        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Calendrier de prise — Mois en cours", H2));
        doc.add(Chunk.NEWLINE);
        PdfPTable cal = new PdfPTable(new float[]{3.6f, 2.2f, 2.2f, 1.6f});
        cal.setWidthPercentage(100);
        cal.addCell(cellHeader("Médicament"));
        cal.addCell(cellHeader("Matin (08:00)"));
        cal.addCell(cellHeader("Soir (20:00)"));
        cal.addCell(cellHeader("Statut"));

        boolean any = false;
        if (prescriptionsActives != null) {
            for (PrescriptionDTO presc : prescriptionsActives) {
                if (presc == null || presc.getPrescriptionItems() == null) continue;
                for (PrescriptionItemDTO it : presc.getPrescriptionItems()) {
                    if (it == null) continue;
                    String med = safe(it.getMedicationName());
                    if (med.isBlank()) med = "Médicament #" + safe(it.getMedicationId());
                    String dosage = safe(it.getDosageInstructions());
                    String freq = safe(it.getFrequency());
                    String label = (med + (freq.isBlank() ? "" : " · " + freq)).trim();
                    String morning = hasTime(it, 8) ? (dosage.isBlank() ? "1 prise" : dosage) : "";
                    String evening = hasTime(it, 20) ? (dosage.isBlank() ? "1 prise" : dosage) : "";
                    String statut = isActiveNow(it) ? "Actif" : "Inactif";
                    cal.addCell(cell(label));
                    cal.addCell(cell(morning));
                    cal.addCell(cell(evening));
                    cal.addCell(cell(statut));
                    any = true;
                }
            }
        }
        if (any) {
            doc.add(cal);
        } else {
            doc.add(new Paragraph("Aucun horaire de prise disponible.", P));
        }

        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Généré automatiquement le " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " — Document confidentiel (usage médical uniquement)", new Font(Font.HELVETICA, 9, Font.ITALIC)));

        doc.close();
        return out.toByteArray();
    }

    private static String safe(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static String period(PrescriptionItemDTO it) {
        String s = it.getStartDate() != null ? it.getStartDate().toString() : "";
        String e = it.getEndDate() != null ? it.getEndDate().toString() : "";
        if (!s.isBlank() && !e.isBlank()) return s + " → " + e;
        return !s.isBlank() ? s : e;
    }

    private static String times(PrescriptionItemDTO it) {
        if (it.getScheduledTimes() == null || it.getScheduledTimes().isEmpty()) return "";
        return it.getScheduledTimes().stream()
                .sorted()
                .map(t -> t != null ? t.toString() : "")
                .filter(x -> !x.isBlank())
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private static boolean hasTime(PrescriptionItemDTO it, int hour) {
        if (it.getScheduledTimes() == null) return false;
        return it.getScheduledTimes().stream().anyMatch(t -> t != null && t.getHour() == hour);
    }

    private static boolean isActiveNow(PrescriptionItemDTO it) {
        java.time.LocalDate now = java.time.LocalDate.now();
        if (it.getStartDate() != null && now.isBefore(it.getStartDate())) return false;
        if (it.getEndDate() != null && now.isAfter(it.getEndDate())) return false;
        return true;
    }

    private static String valeur(ResultatLabtestDTO r) {
        String v = r.getValeur() != null ? r.getValeur().toPlainString() : "";
        String u = r.getUnite() != null ? r.getUnite() : "";
        return (v + " " + u).trim();
    }

    private static String dateResultat(ResultatLabtestDTO r) {
        if (r.getDateRendu() != null) return DT.format(r.getDateRendu());
        if (r.getDatePrelevement() != null) return DT.format(r.getDatePrelevement());
        return "";
    }

    private static PdfPCell cellHeader(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 10, Font.BOLD)));
        c.setBackgroundColor(new java.awt.Color(240, 244, 248));
        c.setPadding(6f);
        return c;
    }

    private static PdfPCell cell(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text == null ? "" : text, P));
        c.setPadding(5f);
        return c;
    }
}

