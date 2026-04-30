import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface PatientListItem {
  idPatient: number;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-ajouter-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ajouter-rendezvous.html',
  styleUrls: ['./ajouter-rendezvous.css'],
})
export class AjouterRendezvousComponent implements OnInit {
  private readonly BASE = '/projet/rendezvous';
  private readonly BASE_CONSULT = '/projet/consultation';
  private readonly PATIENTS = '/api/patients';

  isLoading = false;
  toastVisible = false;
  toastMessage = '';
  toastType = 'toast-success';

  formProgress = 0;
  minRendezvousDate = '';

  rendezvous: { dateRendezvous: string; etat: string } = { dateRendezvous: '', etat: '' };

  patientsList: PatientListItem[] = [];
  selectedPatientId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const t = new Date();
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    this.minRendezvousDate = t.toISOString().slice(0, 16);
    this.loadPatients();
    this.calcProgress();
  }

  loadPatients(): void {
    this.http.get<PatientListItem[]>(this.PATIENTS).subscribe({
      next: (data) => (this.patientsList = Array.isArray(data) ? data : []),
      error: () => (this.patientsList = []),
    });
  }

  onDateChange(): void {
    const d = this.rendezvous.dateRendezvous;
    if (!d) return;
    const selected = new Date(d);
    const today = new Date();
    const isToday = selected.toDateString() === today.toDateString();
    const isPast = selected < today;
    const etat = (this.rendezvous.etat || '').toUpperCase();
    if (etat !== 'ANNULE') {
      if (isPast) this.rendezvous.etat = 'TERMINE';
      else if (isToday) this.rendezvous.etat = 'CONFIRME';
    }
    this.calcProgress();
  }

  calcProgress(): void {
    let filled = 0;
    if (this.rendezvous.dateRendezvous?.trim()) filled++;
    if (this.rendezvous.etat?.trim()) filled++;
    if (this.selectedPatientId) filled++;
    this.formProgress = Math.round((filled / 3) * 100);
  }

  resetForm(): void {
    this.rendezvous = { dateRendezvous: '', etat: '' };
    this.selectedPatientId = null;
    this.formProgress = 0;
  }

  saveRendezvous(): void {
    if (!this.rendezvous.dateRendezvous || !this.selectedPatientId) return;

    this.isLoading = true;

    let etatToSend = this.rendezvous.etat;
    if ((etatToSend || '').toUpperCase() !== 'ANNULE') {
      const selected = new Date(this.rendezvous.dateRendezvous);
      const today = new Date();
      if (selected.toDateString() === today.toDateString()) etatToSend = 'CONFIRME';
      else if (selected < today) etatToSend = 'TERMINE';
    }

    const dateVal = this.rendezvous.dateRendezvous;
    const dateForBackend = dateVal && dateVal.length <= 10 ? `${dateVal}T12:00:00` : dateVal;

    const payload = {
      dateRendezvous: dateForBackend,
      etat: etatToSend,
      idPatient: this.selectedPatientId,
    };

    this.http.post(`${this.BASE}/addRendezvous`, payload).subscribe({
      next: () => {
        this.showToast('Rendez-vous enregistré avec succès', 'toast-success');
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/back/consultations']), 1500);
      },
      error: (err) => {
        console.error(err);
        this.showToast("Erreur lors de l'enregistrement", 'toast-error');
        this.isLoading = false;
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
