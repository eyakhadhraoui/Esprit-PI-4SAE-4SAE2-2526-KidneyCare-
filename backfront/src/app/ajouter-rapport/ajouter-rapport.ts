import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface Consultation {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
  idDossiermedical?: number;
}

export interface RapportDTO {
  dateRapport: string;
  contenu: string;
  recommendations: string;
  consultation: { idConsultation: number } | null;
}

@Component({
  selector: 'app-ajouter-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ajouter-rapport.html',
  styleUrls: ['./ajouter-rapport.css'],
})
export class AjouterRapportComponent implements OnInit {
  private readonly API = '/projet/rapport/addRapport';
  private readonly CONSULTATIONS = '/projet/consultation/retrieveConsultations';

  isLoading = false;
  toastVisible = false;
  toastMessage = '';
  toastType = 'toast-success';

  formProgress = 0;
  today = new Date().toISOString().split('T')[0];

  consultationsList: Consultation[] = [];
  selectedConsultationId: number | null = null;

  rapport: RapportDTO = this.emptyRapport();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
    this.calcProgress();
  }

  loadConsultations(): void {
    this.http.get<Consultation[]>(this.CONSULTATIONS).subscribe({
      next: (data) => (this.consultationsList = data),
      error: () => {
        this.consultationsList = [
          { idConsultation: 1, dateConsultation: '2026-02-18', diagnostic: 'Rejet aigu de greffe — stade I', notes: 'Surveillance rapprochée' },
          { idConsultation: 2, dateConsultation: '2026-02-19', diagnostic: 'Contrôle post-opératoire normal', notes: 'RAS' },
          { idConsultation: 3, dateConsultation: '2026-02-20', diagnostic: 'Infection urinaire post-greffe', notes: 'Antibiothérapie initiée' },
        ];
      },
    });
  }

  getSelectedConsultation(): Consultation | undefined {
    return this.consultationsList.find((c) => c.idConsultation === this.selectedConsultationId);
  }

  onConsultationChange(): void {
    this.calcProgress();
  }

  calcProgress(): void {
    let score = 0;
    if (this.rapport.dateRapport) score += 34;
    if (this.selectedConsultationId) score += 33;
    if (this.rapport.contenu.length >= 20) score += 33;
    this.formProgress = score;
  }

  emptyRapport(): RapportDTO {
    return {
      dateRapport: new Date().toISOString().split('T')[0],
      contenu: '',
      recommendations: '',
      consultation: null,
    };
  }

  resetForm(): void {
    this.rapport = this.emptyRapport();
    this.selectedConsultationId = null;
    this.formProgress = 34;
  }

  saveRapport(): void {
    if (!this.rapport.contenu || !this.selectedConsultationId) return;

    this.isLoading = true;

    const payload: RapportDTO = {
      ...this.rapport,
      consultation: { idConsultation: this.selectedConsultationId! },
    };

    this.http.post<RapportDTO>(this.API, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast('Rapport créé avec succès ✅', 'toast-success');
        setTimeout(() => this.router.navigate(['/back/consultations']), 1800);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.showToast("Erreur lors de l'enregistrement ❌", 'toast-error');
      },
    });
  }

  showToast(message: string, type = 'toast-success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3500);
  }
}
