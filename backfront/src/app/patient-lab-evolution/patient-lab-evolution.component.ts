import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ResultatLaboratoire, formatValeurResultat } from '../services/resultat-laboratoire';
import {
  MetricSlot,
  NFS_METRICS,
  RENAL_METRICS,
  barTone,
  parseLabMetrics,
  pickMetric,
  TONE_BG,
} from './lab-metrics-parser';

Chart.register(...registerables);

/** NFS affiché comme sur la maquette (sans plaquettes sur l’axe X). */
const NFS_CHART_SLOTS = NFS_METRICS.slice(0, 9);

interface LabSession {
  t: number;
  /** Libellé date court (peut être dupliqué entre résultats). */
  label: string;
  /** Légende unique par fiche résultat (date ou date + #id). */
  legendLabel: string;
  metrics: Record<string, number>;
}

@Component({
  selector: 'app-patient-lab-evolution',
  standalone: false,
  templateUrl: './patient-lab-evolution.component.html',
  styleUrls: ['./patient-lab-evolution.component.css'],
})
export class PatientLabEvolutionComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() resultats: ResultatLaboratoire[] | null = null;

  @ViewChild('canvasRenal') canvasRenal?: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasNfs') canvasNfs?: ElementRef<HTMLCanvasElement>;

  private chartRenal: Chart | null = null;
  private chartNfs: Chart | null = null;
  /** Sessions triées (pour graphiques), mises à jour avec la visibilité. */
  private sessions: LabSession[] = [];

  showRenal = false;
  showNfs = false;
  renalTitle = 'Renal panel (creatinine, urea, uric acid, cystatin C, eGFR)';
  nfsTitle = 'Full blood count (CBC)';

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.scheduleDraw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resultats']) {
      this.scheduleDraw();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /** Recalcule les drapeaux d’affichage puis dessine après mise à jour du DOM (canvas sous *ngIf). */
  private scheduleDraw(): void {
    this.refreshVisibility();
    this.cdr.detectChanges();
    setTimeout(() => this.drawCharts(), 0);
  }

  private destroyCharts(): void {
    this.chartRenal?.destroy();
    this.chartRenal = null;
    this.chartNfs?.destroy();
    this.chartNfs = null;
  }

  private refreshVisibility(): void {
    this.sessions = this.buildSessions(this.resultats);
    this.showRenal = this.shouldShowChart(this.sessions, RENAL_METRICS);
    this.showNfs = this.shouldShowChart(this.sessions, NFS_CHART_SLOTS);
  }

  private drawCharts(): void {
    this.destroyCharts();
    const sessions = this.sessions;
    if (!sessions.length) return;

    if (this.showRenal && this.canvasRenal?.nativeElement) {
      this.chartRenal = this.createMixedChart(this.canvasRenal.nativeElement, RENAL_METRICS, sessions);
    }
    if (this.showNfs && this.canvasNfs?.nativeElement) {
      this.chartNfs = this.createMixedChart(this.canvasNfs.nativeElement, NFS_CHART_SLOTS, sessions);
    }
  }

  private shouldShowChart(sessions: LabSession[], slots: MetricSlot[]): boolean {
    if (!sessions.length) return false;
    return sessions.some((s) => slots.some((slot) => pickMetric(s.metrics, slot) != null));
  }

  private buildSessions(rows: ResultatLaboratoire[] | null): LabSession[] {
    if (!rows?.length) return [];
    type Row = { t: number; label: string; metrics: Record<string, number>; id?: number };
    const tmp: Row[] = rows.map((r) => ({
      t: this.getResultTime(r),
      label: this.formatSessionDate(r),
      metrics: parseLabMetrics(formatValeurResultat(r)),
      id: r.idResultatLaboratoire,
    }));
    tmp.sort((a, b) => a.t - b.t);
    const countByLabel = new Map<string, number>();
    for (const x of tmp) {
      countByLabel.set(x.label, (countByLabel.get(x.label) || 0) + 1);
    }
    const occByLabel = new Map<string, number>();
    return tmp.map((x) => {
      const totalSame = countByLabel.get(x.label) || 1;
      const dup = totalSame > 1;
      const occ = (occByLabel.get(x.label) || 0) + 1;
      occByLabel.set(x.label, occ);
      let legendLabel = x.label;
      if (dup) {
        legendLabel =
          x.id != null ? `${x.label} · #${x.id}` : `${x.label} · ${occ}/${totalSame}`;
      }
      return { t: x.t, label: x.label, legendLabel, metrics: x.metrics };
    });
  }

  private getResultTime(r: ResultatLaboratoire): number {
    const d = (r as any).dateRendu ?? (r as any).datePrelevement ?? r.dateResultat;
    const ms = d ? new Date(d).getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
  }

  private formatSessionDate(r: ResultatLaboratoire): string {
    const d = (r as any).dateRendu ?? (r as any).datePrelevement ?? r.dateResultat;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Maquette : barres = dernière mesure (couleurs seuils) ;
   * jusqu’à 2 lignes en pointillés (gris = plus ancien, bleu = visite passée la plus récente) pour l’historique.
   */
  private createMixedChart(canvas: HTMLCanvasElement, slots: MetricSlot[], sessions: LabSession[]): Chart {
    const labels = slots.map((s) => s.label);
    const LINE_GREY = '#94a3b8';
    const LINE_BLUE = '#2563eb';

    const datasets: ChartConfiguration['data']['datasets'] = [];

    /** Les 2 visites juste avant la dernière (même logique que slice(-3,-1) sur la liste triée). */
    const linesToPlot =
      sessions.length <= 1 ? [] : sessions.length === 2 ? [sessions[0]] : sessions.slice(-3, -1);

    linesToPlot.forEach((sess, i) => {
      const data = slots.map((slot) => {
        const v = pickMetric(sess.metrics, slot);
        return v != null && Number.isFinite(v) ? v : null;
      });
      if (!data.some((x) => x != null)) return;
      const color = linesToPlot.length === 1 ? LINE_GREY : i === 0 ? LINE_GREY : LINE_BLUE;
      datasets.push({
        type: 'line',
        label: sess.legendLabel,
        data,
        borderColor: color,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.15,
        fill: false,
        spanGaps: false,
        order: i,
      });
    });

    const last = sessions[sessions.length - 1];
    const barData = slots.map((slot) => {
      const v = pickMetric(last.metrics, slot);
      return v != null && Number.isFinite(v) ? v : null;
    });
    const barColors = slots.map((slot, i) => {
      const v = barData[i];
      const tone = barTone(v, slot);
      return TONE_BG[tone];
    });
    datasets.push({
      type: 'bar',
      label: `Dernière · ${last.legendLabel}`,
      data: barData,
      backgroundColor: barColors,
      borderWidth: 0,
      maxBarThickness: 44,
      order: 10,
    });

    let yMax = 1;
    for (const ds of datasets) {
      const arr = (ds.data as (number | null)[]) || [];
      for (const v of arr) {
        if (v != null && Number.isFinite(v)) yMax = Math.max(yMax, v);
      }
    }
    yMax = Math.ceil(yMax * 1.12);

    const config: ChartConfiguration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: sessions.length >= 2,
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          title: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const v = ctx.parsed.y;
                if (v == null) return `${ctx.dataset.label}: —`;
                return `${ctx.dataset.label}: ${typeof v === 'number' ? v.toLocaleString('fr-FR') : v}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            suggestedMax: yMax,
            grid: { color: 'rgba(15, 23, 42, 0.06)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    };

    return new Chart(canvas, config);
  }
}
