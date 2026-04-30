import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import type { Consultation, Rapport, Rendezvous } from '../services/consultation.service';

/** Ligne enrichie affichée dans le tableau / export. */
export interface ConsultationDisplayRow {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes: string;
  idDossiermedical?: number;
  patientLabel: string;
  medecinLabel: string;
  rdvId?: number;
  rdvDate?: string;
  rdvEtat?: string;
  rapportId?: number;
  rapportDate?: string;
  riskScore: number;
  riskLabel: 'Élevé' | 'Modéré' | 'Faible';
}

@Component({
  selector: 'app-affiche-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './affiche-consultation.html',
  styleUrls: ['./affiche-consultation.css'],
})
export class AfficheConsultationComponent implements OnInit, OnDestroy {
  private readonly BASE = '/projet/consultation';
  private readonly BASE_RDV = '/projet/rendezvous';
  private readonly BASE_RAPPORT = '/projet/rapport';

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private loadSub: Subscription | null = null;

  loading = false;
  loadError = '';

  nowLabel = '';
  consultationsRaw: Consultation[] = [];
  rendezvousList: Rendezvous[] = [];
  rapportsList: Rapport[] = [];

  searchTerm = '';
  sortOrder: 'recent' | 'ancien' | 'diagnostic' | 'risk' = 'recent';
  filteredRows: ConsultationDisplayRow[] = [];

  toastSuccess = false;
  toastError = false;
  toastMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.tick();
    this.tickHandle = setInterval(() => this.tick(), 1000);
    this.loadAll();
  }

  ngOnDestroy(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    this.loadSub?.unsubscribe();
  }

  tick(): void {
    const d = new Date();
    this.nowLabel = d.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Tri typé : retourne un nouveau tableau du même type T que l'entrée.
   */
  sortArr<T>(items: T[], compare: (a: T, b: T) => number): T[] {
    return [...items].sort(compare);
  }

  getRiskScore(diagnostic: string, notes?: string): number {
    const text = `${diagnostic || ''} ${notes || ''}`.toLowerCase();
    let score = 12;
    const rules: { kw: string; pts: number }[] = [
      { kw: 'urgence', pts: 35 },
      { kw: 'critique', pts: 30 },
      { kw: 'rejet', pts: 28 },
      { kw: 'infection', pts: 22 },
      { kw: 'sepsis', pts: 32 },
      { kw: 'insuffisance', pts: 20 },
      { kw: 'déshydratation', pts: 15 },
      { kw: 'douleur', pts: 10 },
    ];
    for (const r of rules) {
      if (text.includes(r.kw)) {
        score += r.pts;
      }
    }
    return Math.min(100, Math.round(score));
  }

  riskLabelFromScore(score: number): 'Élevé' | 'Modéré' | 'Faible' {
    if (score >= 60) {
      return 'Élevé';
    }
    if (score >= 35) {
      return 'Modéré';
    }
    return 'Faible';
  }

  loadAll(): void {
    this.loading = true;
    this.loadError = '';
    this.loadSub?.unsubscribe();
    this.loadSub = forkJoin({
      consultations: this.http
        .get<Consultation[]>(`${this.BASE}/retrieveConsultations`)
        .pipe(catchError(() => of([] as Consultation[]))),
      rdv: this.http
        .get<Rendezvous[]>(`${this.BASE_RDV}/retrieveRendezvous`)
        .pipe(catchError(() => of([] as Rendezvous[]))),
      rapports: this.http
        .get<Rapport[]>(`${this.BASE_RAPPORT}/retrieveRapports`)
        .pipe(catchError(() => of([] as Rapport[]))),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: ({ consultations, rdv, rapports }) => {
          this.consultationsRaw = Array.isArray(consultations) ? consultations : [];
          this.rendezvousList = Array.isArray(rdv) ? rdv : [];
          this.rapportsList = Array.isArray(rapports) ? rapports : [];
          this.applyFilters();
        },
        error: () => {
          this.loadError = 'Impossible de charger les consultations.';
          this.showToast(false, this.loadError);
        },
      });
  }

  private buildRows(): ConsultationDisplayRow[] {
    return this.consultationsRaw.map((c) => {
      const id = c.idConsultation ?? 0;
      const rdv = this.rendezvousList.find((r) => {
        if (r.idConsultation === id) {
          return true;
        }
        const nested = (r as Rendezvous & { consultation?: { idConsultation?: number } })
          .consultation;
        return nested?.idConsultation === id;
      });
      const rapport = this.rapportsList.find((r) => r.idConsultation === id);
      const diag = c.diagnostic || '';
      const notes = c.notes || '';
      const risk = this.getRiskScore(diag, notes);
      const patient = c.patient;
      const med = c.medecin;
      const patientLabel =
        patient?.idPatient != null ? `Patient #${patient.idPatient}` : '—';
      const medecinLabel = med
        ? `Dr. ${med.prenom || ''} ${med.nom || ''}`.trim() || med.username || `Médecin #${med.idMedecin}`
        : '—';

      return {
        idConsultation: id,
        dateConsultation: c.dateConsultation || '',
        diagnostic: diag,
        notes,
        idDossiermedical: c.idDossiermedical,
        patientLabel,
        medecinLabel,
        rdvId: rdv?.idRendezvous,
        rdvDate: rdv?.dateRendezvous,
        rdvEtat: rdv?.etat,
        rapportId: rapport?.idRapport,
        rapportDate: rapport?.dateRapport,
        riskScore: risk,
        riskLabel: this.riskLabelFromScore(risk),
      };
    });
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    let rows = this.buildRows();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.diagnostic.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.patientLabel.toLowerCase().includes(q) ||
          String(r.idConsultation).includes(q)
      );
    }

    const byDate = (a: ConsultationDisplayRow, b: ConsultationDisplayRow) =>
      new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime();

    if (this.sortOrder === 'recent') {
      this.filteredRows = this.sortArr(rows, byDate);
    } else if (this.sortOrder === 'ancien') {
      this.filteredRows = this.sortArr(rows, (a, b) => -byDate(a, b));
    } else if (this.sortOrder === 'diagnostic') {
      this.filteredRows = this.sortArr(rows, (a, b) =>
        a.diagnostic.localeCompare(b.diagnostic, 'fr')
      );
    } else {
      this.filteredRows = this.sortArr(rows, (a, b) => b.riskScore - a.riskScore);
    }
  }

  exportCSV(): void {
    const headers = [
      'idConsultation',
      'dateConsultation',
      'diagnostic',
      'notes',
      'patient',
      'medecin',
      'riskScore',
      'riskLabel',
      'rdvId',
      'rapportId',
    ];
    const lines = [
      headers.join(';'),
      ...this.filteredRows.map((r) =>
        [
          r.idConsultation,
          this.csvEscape(r.dateConsultation),
          this.csvEscape(r.diagnostic),
          this.csvEscape(r.notes),
          this.csvEscape(r.patientLabel),
          this.csvEscape(r.medecinLabel),
          r.riskScore,
          r.riskLabel,
          r.rdvId ?? '',
          r.rapportId ?? '',
        ].join(';')
      ),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(true, 'Export CSV généré.');
  }

  private csvEscape(s: string): string {
    const v = (s || '').replace(/"/g, '""');
    return `"${v}"`;
  }

  private showToast(ok: boolean, msg: string): void {
    this.toastMsg = msg;
    this.toastSuccess = ok;
    this.toastError = !ok;
    setTimeout(() => {
      this.toastSuccess = false;
      this.toastError = false;
    }, 3200);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.searchTerm) {
      this.searchTerm = '';
      this.applyFilters();
    }
  }

  trackById(_i: number, row: ConsultationDisplayRow): number {
    return row.idConsultation;
  }

  get kpiHighRisk(): number {
    return this.filteredRows.filter((r) => r.riskLabel === 'Élevé').length;
  }

  get kpiWithRdv(): number {
    return this.filteredRows.filter((r) => r.rdvId != null).length;
  }
}
