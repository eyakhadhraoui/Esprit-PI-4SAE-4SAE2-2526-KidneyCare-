import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DossierMedical } from './dossier';
import { ResultatLaboratoire, formatValeurResultat } from './resultat-laboratoire';
import { NotificationService } from './notification.service';
import { PrescriptionBilanDTO } from './module-labo.service';
import { PrescriptionItemDTO } from './prescription.service';

/**
 * PDF à partir d’un résultat labo déjà enregistré (même rendu que « Mes résultats » → Report côté patient).
 */
@Injectable({ providedIn: 'root' })
export class LabResultStoredPdfService {
  constructor(private notification: NotificationService) {}

  generateFromStoredResult(r: ResultatLaboratoire, dossier: DossierMedical | null): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 12;
    const contentW = pageW - margin * 2;
    let y = 14;
    const titre = r.nomTest || r.codeTest || 'Laboratory test';
    const ref = `LAB-${new Date().getFullYear()}-${String(r.idDossierMedical ?? 0).padStart(4, '0')}`;
    const patient = dossier?.patientNom || 'Patient';
    const val = formatValeurResultat(r);
    const parsed = this.parseMetricsFromValue(r.valeurResultat);
    if (r.valeurNumerique != null && Number.isFinite(r.valeurNumerique) && Object.keys(parsed).length === 0) {
      const nk = this.normKey(r.nomTest || r.codeTest || 'result');
      const guess =
        nk.includes('creatinin') || nk.includes('creatinine')
          ? 'creatininemie'
          : nk.includes('uree') || nk.includes('urea')
            ? 'uree'
            : nk.includes('potass')
              ? 'potassium'
              : nk.includes('sodium')
                ? 'sodium'
                : 'value';
      parsed[guess] = r.valeurNumerique;
    }

    const ensureY = (h: number) => {
      if (y + h <= pageH - 20) return;
      doc.addPage();
      y = 14;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text('Central Medical Laboratory', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ref. ${ref} · ${new Date().toLocaleDateString('en-GB')}`, margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${patient}`, margin, y);
    y += 5;
    doc.text(`Result date: ${this.formatDateResultat(r)}`, margin, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 55);
    doc.text('Panel / test', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(titre, margin, y);
    y += 7;

    const tableRows: { test: string; result: string; unit: string; ref: string; flag: string }[] = [];
    for (const [rawKey, num] of Object.entries(parsed)) {
      const meta = this.pdfResolveLabMeta(rawKey);
      if (meta) {
        tableRows.push({
          test: meta.labelEn,
          result: String(num),
          unit: meta.unit,
          ref: meta.refText,
          flag: this.pdfEvalStatus(meta, num),
        });
      } else {
        tableRows.push({
          test: rawKey.replace(/=/g, ' ').trim() || 'Parameter',
          result: String(num),
          unit: r.unite || '—',
          ref: 'see lab',
          flag: '—',
        });
      }
    }

    if (tableRows.length > 0) {
      ensureY(16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Results with reference intervals', margin, y);
      y += 6;
      const colW = [58, 22, 22, 38, 22];
      doc.setFillColor(55, 65, 81);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      const heads = ['Test', 'Result', 'Unit', 'Reference', 'Flag'];
      let xh = margin;
      heads.forEach((h, i) => {
        doc.text(h, xh + 2, y + 5.5);
        xh += colW[i];
      });
      y += 8;
      tableRows.forEach((row, idx) => {
        ensureY(10);
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y, contentW, 8, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentW, 8, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        let xc = margin;
        const cells = [row.test, row.result, row.unit, row.ref, row.flag];
        cells.forEach((cell, i) => {
          if (i === 4) {
            if (row.flag.includes('High')) doc.setTextColor(220, 38, 38);
            else if (row.flag.includes('Low')) doc.setTextColor(217, 119, 6);
            else doc.setTextColor(5, 150, 105);
          } else doc.setTextColor(55, 65, 81);
          doc.text(cell, xc + (i === 0 ? 2 : colW[i] / 2), y + 5.2, {
            align: i === 0 ? 'left' : 'center',
            maxWidth: colW[i] - 3,
          });
          xc += colW[i];
        });
        y += 8;
      });
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    ensureY(10);
    doc.text('Raw summary / text', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const valLines = doc.splitTextToSize(val, contentW);
    for (const line of valLines as string[]) {
      ensureY(5);
      doc.text(line, margin, y);
      y += 4.2;
    }
    y += 3;
    if (r.etat) {
      ensureY(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(this.mapEtatResultatToEn(r.etat) || r.etat, margin + 18, y);
      y += 7;
    }
    if (r.conclusion?.trim()) {
      ensureY(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Conclusion', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const cl = doc.splitTextToSize(r.conclusion.trim(), contentW);
      for (const line of cl as string[]) {
        ensureY(5);
        doc.text(line, margin, y);
        y += 4.2;
      }
    }
    const abn = tableRows.filter((row) => row.flag.includes('High') || row.flag.includes('Low'));
    if (abn.length > 0) {
      ensureY(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 50, 50);
      doc.text(`Abnormalities: ${abn.length} flagged value(s).`, margin, y);
      y += 6;
    }
    ensureY(10);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${new Date().toLocaleString('en-GB')} · Source: medical record`, margin, pageH - 12);
    const safe = titre.replace(/[^\w\-]+/g, '_').slice(0, 36);
    doc.save(`Lab_Report_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.notification.success('PDF generated from saved result.');
  }

  private formatDateResultat(r: ResultatLaboratoire): string {
    if (!r) return '—';
    const d = (r as { dateRendu?: string; datePrelevement?: string }).dateRendu
      ?? (r as { datePrelevement?: string }).datePrelevement
      ?? r.dateResultat;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private normKey(v: string): string {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private parseMetricsFromValue(valeur: string | undefined | null): Record<string, number> {
    const out: Record<string, number> = {};
    const raw = String(valeur || '');
    const segments = raw.split('|');
    for (const seg of segments) {
      for (const part of seg.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const left = part.slice(0, idx).trim();
        const right = part.slice(idx + 1).trim();
        const k = this.normKey(left);
        const m = String(right).match(/-?\d+(?:[.,]\d+)?/);
        if (!m) continue;
        const n = Number(m[0].replace(',', '.'));
        if (Number.isFinite(n)) out[k] = n;
      }
    }
    return out;
  }

  private pdfLabMetaByNormKey(): Record<
    string,
    { labelEn: string; unit: string; refText: string; kind: 'between' | 'lte' | 'gte'; lo?: number; hi?: number }
  > {
    return {
      creatininemie: { labelEn: 'Creatinine', unit: 'µmol/L', refText: '53–97', kind: 'between', lo: 53, hi: 97 },
      uree: { labelEn: 'Urea', unit: 'mmol/L', refText: '2.5–7.5', kind: 'between', lo: 2.5, hi: 7.5 },
      'acide urique': { labelEn: 'Uric acid', unit: 'µmol/L', refText: '150–420', kind: 'between', lo: 150, hi: 420 },
      'cystatine c': { labelEn: 'Cystatin C', unit: 'mg/L', refText: '0.53–1.02', kind: 'between', lo: 0.53, hi: 1.02 },
      'dfg estime': { labelEn: 'eGFR (estimated)', unit: 'mL/min/1.73m²', refText: '≥60', kind: 'gte', lo: 60 },
      'dfg cystatine c': { labelEn: 'eGFR (Cystatin C)', unit: 'mL/min/1.73m²', refText: '≥60', kind: 'gte', lo: 60 },
      glycemiejeun: { labelEn: 'Fasting glucose', unit: 'mmol/L', refText: '3.9–6.1', kind: 'between', lo: 3.9, hi: 6.1 },
      'cholesterol total': { labelEn: 'Total cholesterol', unit: 'mmol/L', refText: '<5.2', kind: 'lte', hi: 5.2 },
      ldl: { labelEn: 'LDL cholesterol', unit: 'mmol/L', refText: '<3.4', kind: 'lte', hi: 3.4 },
      hdl: { labelEn: 'HDL cholesterol', unit: 'mmol/L', refText: '≥1.2', kind: 'gte', lo: 1.2 },
      triglycerides: { labelEn: 'Triglycerides', unit: 'mmol/L', refText: '<1.7', kind: 'lte', hi: 1.7 },
      tsh: { labelEn: 'TSH', unit: 'mIU/L', refText: '0.4–4.0', kind: 'between', lo: 0.4, hi: 4.0 },
      potassium: { labelEn: 'Potassium', unit: 'mmol/L', refText: '3.5–5.1', kind: 'between', lo: 3.5, hi: 5.1 },
      k: { labelEn: 'Potassium', unit: 'mmol/L', refText: '3.5–5.1', kind: 'between', lo: 3.5, hi: 5.1 },
      sodium: { labelEn: 'Sodium', unit: 'mmol/L', refText: '136–145', kind: 'between', lo: 136, hi: 145 },
      na: { labelEn: 'Sodium', unit: 'mmol/L', refText: '136–145', kind: 'between', lo: 136, hi: 145 },
      cl: { labelEn: 'Chloride', unit: 'mmol/L', refText: '98–107', kind: 'between', lo: 98, hi: 107 },
      hco3: { labelEn: 'Bicarbonate', unit: 'mmol/L', refText: '22–29', kind: 'between', lo: 22, hi: 29 },
      ca: { labelEn: 'Calcium', unit: 'mmol/L', refText: '2.15–2.55', kind: 'between', lo: 2.15, hi: 2.55 },
      mg: { labelEn: 'Magnesium', unit: 'mmol/L', refText: '0.75–1.00', kind: 'between', lo: 0.75, hi: 1.0 },
      p: { labelEn: 'Phosphate', unit: 'mmol/L', refText: '0.81–1.45', kind: 'between', lo: 0.81, hi: 1.45 },
      hb: { labelEn: 'Hemoglobin', unit: 'g/dL', refText: '12.0–16.0', kind: 'between', lo: 12, hi: 16 },
      ht: { labelEn: 'Hematocrit', unit: '%', refText: '36–46', kind: 'between', lo: 36, hi: 46 },
      gb: { labelEn: 'WBC', unit: '×10³/µL', refText: '4.0–10.0', kind: 'between', lo: 4, hi: 10 },
      rbc: { labelEn: 'RBC', unit: 'T/L', refText: '4.5–5.9', kind: 'between', lo: 4.5, hi: 5.9 },
      'glycemie a jeun': { labelEn: 'Fasting glucose', unit: 'mmol/L', refText: '3.9–6.1', kind: 'between', lo: 3.9, hi: 6.1 },
      neutrophiles: { labelEn: 'Neutrophils', unit: '%', refText: '40–70', kind: 'between', lo: 40, hi: 70 },
      lymphocytes: { labelEn: 'Lymphocytes', unit: '%', refText: '20–45', kind: 'between', lo: 20, hi: 45 },
      monocytes: { labelEn: 'Monocytes', unit: '%', refText: '2–10', kind: 'between', lo: 2, hi: 10 },
      eosinophiles: { labelEn: 'Eosinophils', unit: '%', refText: '0–7', kind: 'between', lo: 0, hi: 7 },
      basophiles: { labelEn: 'Basophils', unit: '%', refText: '0–2', kind: 'between', lo: 0, hi: 2 },
      plaquettes: { labelEn: 'Platelets', unit: '×10³/µL', refText: '150–400', kind: 'between', lo: 150, hi: 400 },
    };
  }

  private pdfResolveLabMeta(normKey: string) {
    return this.pdfLabMetaByNormKey()[this.normKey(normKey)] ?? null;
  }

  private pdfEvalStatus(
    meta: { kind: 'between' | 'lte' | 'gte'; lo?: number; hi?: number },
    val: number,
  ): string {
    if (meta.kind === 'between' && meta.lo != null && meta.hi != null) {
      if (val < meta.lo) return 'Low ↓';
      if (val > meta.hi) return 'High ↑';
      return 'Normal';
    }
    if (meta.kind === 'lte' && meta.hi != null) return val <= meta.hi ? 'Normal' : 'High ↑';
    if (meta.kind === 'gte' && meta.lo != null) return val >= meta.lo ? 'Normal' : 'Low ↓';
    return '—';
  }

  private mapEtatResultatToEn(etat: string | undefined): string {
    const s = String(etat || '').trim().toLowerCase();
    if (!s) return '';
    if (s.includes('anormal')) return 'Abnormal';
    if (s.includes('normal') && !s.includes('anormal')) return 'Normal';
    if (s.includes('surveill') || s.includes('monitor')) return 'Monitor';
    if (s.includes('élev') || s.includes('eleve') || s.includes('high')) return 'High';
    if (s.includes('bas') || s.includes('low')) return 'Low';
    return etat || '';
  }

  // ══════════════════════════════════════════════════════════════════════
  // PDF COMPLET — prescription + tous les résultats enregistrés
  // ══════════════════════════════════════════════════════════════════════

  generateCompletPdfPrescription(
    p: PrescriptionBilanDTO,
    results: ResultatLaboratoire[],
    dossier: DossierMedical | null,
    medecinNom: string,
    medications: PrescriptionItemDTO[] = [],
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = 14;

    const ensureY = (h: number) => {
      if (y + h > pageH - 20) { doc.addPage(); y = 14; }
    };

    const patient = dossier?.patientNom || 'Patient';
    const year = p.datePrescription ? new Date(p.datePrescription).getFullYear() : new Date().getFullYear();
    const ref = p.id ? `REQ-${year}-${String(p.id).padStart(2, '0')}` : 'REQ-—';
    const dateStr = p.datePrescription
      ? new Date(p.datePrescription).toLocaleDateString('fr-FR')
      : '—';

    // ── HEADER BAR ───────────────────────────────────────────────────────
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('Central Medical Laboratory', margin, 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(209, 213, 219);
    doc.text('Complete Test Request Report', margin, 16);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7.5);
    doc.text(`Generated ${new Date().toLocaleString('fr-FR')}`, pageW - margin, 16, { align: 'right' });
    y = 28;

    // ── PRESCRIPTION INFO BOX ────────────────────────────────────────────
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(147, 197, 253);
    doc.roundedRect(margin, y, contentW, 36, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(`Reference: ${ref}`, margin + 4, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Patient: ${patient}`, margin + 4, y + 15);
    doc.text(`Physician: ${medecinNom}`, margin + 4, y + 21);
    doc.text(`Date: ${dateStr}`, margin + 4, y + 27);
    doc.text(
      `Type: ${p.typeBilanLibelle || p.typeBilan || '—'}   |   Urgency: ${p.urgence ? 'URGENT' : 'Normal'}   |   Status: ${p.statut || '—'}`,
      margin + 4, y + 33,
    );
    y += 42;

    // ── MEDICATIONS ──────────────────────────────────────────────────────
    ensureY(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Current Medications  (${medications.length})`, margin, y);
    y += 7;

    if (medications.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No active medications found for this patient.', margin, y);
      y += 8;
    } else {
      const mColW = [50, 38, 28, 22, 24];
      ensureY(10);
      doc.setFillColor(124, 58, 237);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let xhm = margin;
      ['Medication', 'Dosage', 'Frequency', 'Duration', 'Route'].forEach((h, i) => {
        doc.text(h, xhm + 2, y + 5.5); xhm += mColW[i];
      });
      y += 8;

      for (let idx = 0; idx < medications.length; idx++) {
        const med = medications[idx];
        ensureY(10);
        if (idx % 2 === 0) {
          doc.setFillColor(245, 243, 255);
          doc.rect(margin, y, contentW, 9, 'F');
        }
        doc.setDrawColor(221, 214, 254);
        doc.rect(margin, y, contentW, 9, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);

        const name  = med.medicationName || String(med.medicationId ?? '—');
        const dose  = med.dosageInstructions || (med.medicationDosage ? `${med.medicationDosage} ${med.medicationUnit || ''}`.trim() : '—');
        const freq  = med.frequency || '—';
        const dur   = med.duration ? `${med.duration}j` : (med.endDate ? med.endDate.substring(0, 10) : '—');
        const route = med.administrationRoute || '—';

        let xc = margin;
        [name, dose, freq, dur, route].forEach((cell, i) => {
          doc.text(String(cell), xc + (i === 0 ? 2 : mColW[i] / 2), y + 6, {
            align: i === 0 ? 'left' : 'center',
            maxWidth: mColW[i] - 3,
          });
          xc += mColW[i];
        });

        if (med.isImmunosuppressor) {
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(7);
          doc.text('IS', pageW - margin - 2, y + 6, { align: 'right' });
        }
        y += 9;

        if (med.specialInstructions?.trim()) {
          ensureY(7);
          doc.setFillColor(255, 251, 235);
          doc.rect(margin, y, contentW, 7, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(92, 64, 12);
          const si = doc.splitTextToSize('  ' + med.specialInstructions.trim(), contentW - 5) as string[];
          doc.text(si[0], margin + 2, y + 4.5);
          doc.setFont('helvetica', 'normal');
          y += 7;
        }
      }
      y += 4;
    }

    // ── TESTS ORDERED ────────────────────────────────────────────────────
    if (p.examens && p.examens.length > 0) {
      ensureY(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text('Tests ordered:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const examsLine = p.examens.join('  ·  ');
      const examLines = doc.splitTextToSize(examsLine, contentW) as string[];
      for (const line of examLines) { ensureY(5); doc.text(line, margin, y); y += 4.5; }
      y += 5;
    }

    // ── RESULTS TABLE ────────────────────────────────────────────────────
    ensureY(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Laboratory Results  (${results.length} recorded)`, margin, y);
    y += 7;

    if (results.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No laboratory results recorded for this request yet.', margin, y);
      y += 10;
    } else {
      const colW = [55, 28, 20, 38, 22, 19];
      ensureY(10);
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let xh = margin;
      ['Test', 'Value', 'Unit', 'Reference', 'Flag', 'Date'].forEach((h, i) => {
        doc.text(h, xh + 2, y + 5.5); xh += colW[i];
      });
      y += 8;

      for (let idx = 0; idx < results.length; idx++) {
        const r = results[idx];
        ensureY(10);
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentW, 9, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentW, 9, 'S');

        const testName = r.nomTest || r.codeTest || '—';
        const valStr   = this.formatValueForPdf(r);
        const unit     = r.unite || '—';
        const nk       = this.normKey(r.nomTest || r.codeTest || '');
        const meta     = this.pdfResolveLabMeta(nk);
        const numVal   = r.valeurNumerique ?? null;
        const refText  = meta ? meta.refText : '—';
        const flagStr  = meta && numVal != null
          ? this.pdfEvalStatus(meta, numVal)
          : this.mapInterpretationToFlag(r.interpretation || r.etat);
        const dateR    = (r.dateRendu || r.dateResultat || r.datePrelevement || '').toString().substring(0, 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        let xc = margin;
        [testName, valStr, unit, refText].forEach((cell, i) => {
          doc.text(cell, xc + (i === 0 ? 2 : colW[i] / 2), y + 6, {
            align: i === 0 ? 'left' : 'center',
            maxWidth: colW[i] - 3,
          });
          xc += colW[i];
        });

        // flag — couleur selon statut
        const isHigh = flagStr.includes('High') || flagStr.includes('ELEVE') || flagStr.includes('Crit ↑');
        const isLow  = flagStr.includes('Low')  || flagStr.includes('BAS')   || flagStr.includes('Crit ↓');
        if (isHigh)      doc.setTextColor(220, 38, 38);
        else if (isLow)  doc.setTextColor(217, 119, 6);
        else             doc.setTextColor(5, 150, 105);
        doc.text(flagStr.substring(0, 9), xc + colW[4] / 2, y + 6, { align: 'center', maxWidth: colW[4] - 2 });
        xc += colW[4];

        doc.setTextColor(107, 114, 128);
        doc.setFontSize(7.5);
        doc.text(dateR, xc + 2, y + 6, { maxWidth: colW[5] - 2 });
        y += 9;

        if (r.conclusion?.trim()) {
          ensureY(7);
          doc.setFillColor(255, 251, 235);
          doc.rect(margin, y, contentW, 7, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(92, 64, 12);
          const cl = doc.splitTextToSize('  ' + r.conclusion.trim(), contentW - 5) as string[];
          doc.text(cl[0], margin + 2, y + 4.5);
          doc.setFont('helvetica', 'normal');
          y += 7;
        }
      }
      y += 4;
    }

    // ── NOTE CLINIQUE ─────────────────────────────────────────────────────
    if (p.noteClinique?.trim()) {
      ensureY(18);
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
      doc.roundedRect(margin, y, contentW, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61);
      doc.text('Clinical note:', margin + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 78, 45);
      const nl = doc.splitTextToSize(p.noteClinique.trim(), contentW - 8) as string[];
      doc.text(nl[0] || '', margin + 3, y + 11);
      y += 18;
    }

    // ── FOOTER on every page ──────────────────────────────────────────────
    const totalPages = (doc as any).getNumberOfPages();
    for (let pg = 1; pg <= totalPages; pg++) {
      doc.setPage(pg);
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text('KidneyCare Medical System · Confidential document', margin, pageH - 8);
      doc.text(`Page ${pg} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
    }

    const safe = patient.replace(/[^\w\-]+/g, '_').slice(0, 20);
    doc.save(`Report_${ref}_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.notification.success('PDF complet généré avec succès.');
  }

  private formatValueForPdf(r: ResultatLaboratoire): string {
    if (r.valeurNumerique != null) return String(r.valeurNumerique);
    const vr = (r.valeurResultat ?? '').trim();
    if (vr && !vr.includes('=')) return vr.length > 18 ? vr.substring(0, 18) + '…' : vr;
    const parsed = this.parseMetricsFromValue(r.valeurResultat);
    const first = Object.values(parsed)[0];
    if (first != null) return String(first);
    if (r.valeurTexte) return r.valeurTexte.length > 18 ? r.valeurTexte.substring(0, 18) + '…' : r.valeurTexte;
    return '—';
  }

  private mapInterpretationToFlag(val: string | undefined): string {
    const s = String(val || '').trim().toUpperCase();
    if (!s || s === 'UNDEFINED' || s === 'NULL') return '—';
    if (s === 'CRITIQUE_HAUT') return 'Crit ↑';
    if (s === 'CRITIQUE_BAS')  return 'Crit ↓';
    if (s === 'ELEVE')         return 'High ↑';
    if (s === 'BAS')           return 'Low ↓';
    if (s === 'NORMAL')        return 'Normal';
    return s.substring(0, 8);
  }
}
