import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const BASE = '/projet';

/** Rendez-vous (liste disponibles). */
export interface Rendezvous {
  idRendezvous?: number;
  dateRendezvous?: string;
  etat?: string;
  idPatient?: number;
  idConsultation?: number;
  patient?: unknown;
  consultation?: unknown;
}

/** Patient (liste). */
export interface PatientDTO {
  idPatient: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  dateNaissance?: string;
}

/** Médecin (liste). */
export interface MedecinDTO {
  idMedecin: number;
  nom: string;
  prenom: string;
  username?: string;
}

/** Consultation (réponse création). */
export interface Consultation {
  idConsultation?: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
  idDossiermedical?: number;
  patient?: { idPatient: number };
  medecin?: { idMedecin: number };
  rendezvous?: Rendezvous;
}

export interface ConsultationForm {
  dateConsultation: string;
  diagnostic: string;
  notes: string;
  idDossiermedical: number | null;
}

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consultation.html',
  styleUrls: ['./consultation.css'],
})
export class ConsultationComponent implements OnInit {
  isLoading = false;
  toastVisible = false;
  toastMessage = '';
  toastType: 'toast-success' | 'toast-error' = 'toast-success';
  formProgress = 0;
  today = new Date().toISOString().split('T')[0];

  rendezvousList: Rendezvous[] = [];
  patientsList: PatientDTO[] = [];
  medecinsList: MedecinDTO[] = [];
  selectedRendezvousId: number | null = null;
  selectedPatientId: number | null = null;
  selectedMedecinId: number | null = null;
  consultation: ConsultationForm = this.emptyConsultation();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRendezvousDisponibles();
    this.loadPatients();
    this.loadMedecins();
    this.calcProgress();
  }

  loadPatients(): void {
    this.http.get<PatientDTO[]>(`${BASE}/patient/retrievePatients`).subscribe({
      next: (data) => {
        this.patientsList = data || [];
      },
      error: (err) => {
        console.error('Erreur patients:', err);
        this.patientsList = [];
      },
    });
  }

  loadMedecins(): void {
    this.http.get<MedecinDTO[]>(`${BASE}/medecin/retrieveMedecins`).subscribe({
      next: (data) => {
        this.medecinsList = data || [];
      },
      error: (err) => {
        console.error('Erreur médecins:', err);
        this.medecinsList = [];
      },
    });
  }

  loadRendezvousDisponibles(): void {
    this.http.get<Rendezvous[]>(`${BASE}/rendezvous/disponibles`).subscribe({
      next: (data) => {
        this.rendezvousList = data || [];
      },
      error: (err) => {
        console.error('Erreur RDV disponibles:', err);
        this.rendezvousList = [];
        this.showToast('Impossible de charger les rendez-vous disponibles', 'toast-error');
      },
    });
  }

  getSelectedRdv(): Rendezvous | undefined {
    return this.rendezvousList.find((r) => r.idRendezvous === this.selectedRendezvousId);
  }

  onRdvChange(): void {
    this.calcProgress();
  }
  onPatientChange(): void {
    this.calcProgress();
  }
  onMedecinChange(): void {
    this.calcProgress();
  }

  getSelectedPatient(): PatientDTO | undefined {
    return this.patientsList.find((p) => p.idPatient === this.selectedPatientId);
  }

  getSelectedMedecin(): MedecinDTO | undefined {
    return this.medecinsList.find((m) => m.idMedecin === this.selectedMedecinId);
  }

  calcProgress(): void {
    let score = 0;
    if (this.consultation.dateConsultation) score += 20;
    if (this.consultation.diagnostic.length >= 5) score += 20;
    if (this.consultation.idDossiermedical && this.consultation.idDossiermedical > 0) score += 20;
    if (this.selectedRendezvousId) score += 20;
    if (this.selectedPatientId) score += 10;
    if (this.selectedMedecinId) score += 10;
    this.formProgress = Math.min(100, score);
  }

  emptyConsultation(): ConsultationForm {
    return {
      dateConsultation: new Date().toISOString().split('T')[0],
      diagnostic: '',
      notes: '',
      idDossiermedical: null,
    };
  }

  resetForm(): void {
    this.consultation = this.emptyConsultation();
    this.selectedRendezvousId = null;
    this.selectedPatientId = null;
    this.selectedMedecinId = null;
    this.calcProgress();
    this.loadRendezvousDisponibles();
  }

  saveConsultation(): void {
    if (!this.consultation.idDossiermedical || this.consultation.idDossiermedical <= 0) {
      this.showToast('Veuillez renseigner un ID de dossier valide', 'toast-error');
      return;
    }
    if (this.consultation.diagnostic.trim().length < 5) {
      this.showToast('Le diagnostic doit contenir au moins 5 caractères', 'toast-error');
      return;
    }

    this.isLoading = true;

    const payload: {
      dateConsultation: string;
      diagnostic: string;
      notes: string;
      idDossiermedical: number;
      idPatient?: number;
      idMedecin?: number;
      rendezvous?: { idRendezvous: number };
    } = {
      dateConsultation: this.consultation.dateConsultation,
      diagnostic: this.consultation.diagnostic.trim(),
      notes: this.consultation.notes?.trim() || '',
      idDossiermedical: this.consultation.idDossiermedical,
    };
    if (this.selectedPatientId) payload.idPatient = this.selectedPatientId;
    if (this.selectedMedecinId) payload.idMedecin = this.selectedMedecinId;
    if (this.selectedRendezvousId) payload.rendezvous = { idRendezvous: this.selectedRendezvousId };

    this.http.post<Consultation>(`${BASE}/consultation/addConsultation`, payload).subscribe({
      next: () => {
        this.showToast('Consultation créée avec succès ✅', 'toast-success');
        this.resetForm();
        this.isLoading = false;
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err.error?.message || "Erreur lors de l'enregistrement";
        this.showToast(msg, 'toast-error');
        this.isLoading = false;
      },
    });
  }

  showToast(message: string, type: 'toast-success' | 'toast-error' = 'toast-success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3500);
  }
}
