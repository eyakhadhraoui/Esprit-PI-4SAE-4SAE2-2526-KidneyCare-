/**
 * Parse les textes de résultats (wizard patient : « Créatininémie=… ; Urée=… | Na=… »).
 */

export function normKeyLab(v: string): string {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Extrait paires clé → nombre depuis une synthèse labo. */
export function parseLabMetrics(raw: string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  const text = String(raw || '');
  const segments = text.split('|');
  for (const seg of segments) {
    for (const part of seg.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const left = part.slice(0, idx).trim();
      const right = part.slice(idx + 1).trim();
      const k = normKeyLab(left);
      const m = right.match(/-?\d+(?:[.,]\d+)?/);
      if (!m) continue;
      const n = Number(m[0].replace(',', '.'));
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

export interface MetricSlot {
  id: string;
  label: string;
  /** Clés possibles après normKeyLab */
  keys: string[];
  /** Seuils grossiers pour couleur barre (vert / orange / rouge) */
  minOk?: number;
  maxOk?: number;
}

export const RENAL_METRICS: MetricSlot[] = [
  { id: 'creat', label: 'Créat.', keys: ['creatininemie', 'creatinine'], minOk: 53, maxOk: 120 },
  { id: 'uree', label: 'Urée', keys: ['uree'], minOk: 2.5, maxOk: 7.5 },
  { id: 'au', label: 'Ac. urique', keys: ['acide urique'], minOk: 150, maxOk: 420 },
  { id: 'cyst', label: 'Cystat. C', keys: ['cystatine c'], minOk: 0.5, maxOk: 1.2 },
  { id: 'dfg1', label: 'DFG estimé', keys: ['dfg estime'], minOk: 60, maxOk: 130 },
  { id: 'dfg2', label: 'DFG cyst.', keys: ['dfg cystatine c'], minOk: 60, maxOk: 130 },
];

export const NFS_METRICS: MetricSlot[] = [
  { id: 'hb', label: 'Hb', keys: ['hb'], minOk: 12, maxOk: 16 },
  { id: 'ht', label: 'Ht', keys: ['ht'], minOk: 36, maxOk: 46 },
  { id: 'rbc', label: 'RBC', keys: ['rbc'], minOk: 4, maxOk: 5.9 },
  { id: 'gb', label: 'GB', keys: ['gb'], minOk: 4, maxOk: 11 },
  { id: 'neu', label: 'Neutro', keys: ['neutrophiles'], minOk: 40, maxOk: 75 },
  { id: 'lym', label: 'Lympho', keys: ['lymphocytes'], minOk: 20, maxOk: 45 },
  { id: 'mono', label: 'Mono', keys: ['monocytes'], minOk: 2, maxOk: 10 },
  { id: 'eos', label: 'Éosino', keys: ['eosinophiles'], minOk: 0, maxOk: 6 },
  { id: 'baso', label: 'Baso', keys: ['basophiles'], minOk: 0, maxOk: 2 },
  { id: 'plaq', label: 'Plaq.', keys: ['plaquettes'], minOk: 150, maxOk: 400 },
];

export const IONO_METRICS: MetricSlot[] = [
  { id: 'na', label: 'Na', keys: ['na'], minOk: 135, maxOk: 145 },
  { id: 'k', label: 'K', keys: ['k'], minOk: 3.5, maxOk: 5.1 },
  { id: 'cl', label: 'Cl', keys: ['cl'], minOk: 98, maxOk: 107 },
  { id: 'hco3', label: 'HCO3', keys: ['hco3'], minOk: 22, maxOk: 29 },
  { id: 'ca', label: 'Ca', keys: ['ca'], minOk: 2.1, maxOk: 2.55 },
  { id: 'mg', label: 'Mg', keys: ['mg'], minOk: 0.65, maxOk: 1.05 },
  { id: 'p', label: 'P', keys: ['p'], minOk: 0.8, maxOk: 1.5 },
];

export function pickMetric(m: Record<string, number>, slot: MetricSlot): number | null {
  for (const want of slot.keys) {
    const t = normKeyLab(want);
    if (m[t] != null && Number.isFinite(m[t])) return m[t];
  }
  for (const key of Object.keys(m)) {
    for (const want of slot.keys) {
      const t = normKeyLab(want);
      if (key === t || key.includes(t) || t.includes(key)) return m[key];
    }
  }
  return null;
}

export function barTone(v: number | null, slot: MetricSlot): 'ok' | 'warn' | 'bad' {
  if (v == null || !Number.isFinite(v)) return 'ok';
  const { minOk, maxOk } = slot;
  if (minOk != null && v < minOk) return v < minOk * 0.85 ? 'bad' : 'warn';
  if (maxOk != null && v > maxOk) return v > maxOk * 1.15 ? 'bad' : 'warn';
  return 'ok';
}

export const TONE_BG = { ok: 'rgba(34, 197, 94, 0.65)', warn: 'rgba(245, 158, 11, 0.75)', bad: 'rgba(239, 68, 68, 0.75)' };
