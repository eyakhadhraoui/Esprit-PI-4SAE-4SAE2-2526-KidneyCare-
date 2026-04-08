import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DossierMedical } from './dossier';
import { ResultatLaboratoire, formatValeurResultat } from './resultat-laboratoire';
import { NotificationService } from './notification.service';

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
}
