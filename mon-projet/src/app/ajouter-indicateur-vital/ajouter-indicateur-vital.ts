import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface IndicateurVitalCreate {
  nomIndicateur: string;
  unite: string;
  description: string;
  actif: boolean;
}

@Component({
  selector: 'app-ajouter-indicateur-vital',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ajouter-indicateur-vital.html',
  styleUrl: './ajouter-indicateur-vital.css',
})
export class AjouterIndicateurVital implements OnInit {
  private readonly BASE_URL = '/vital/indicateurVital';

  indicateur: IndicateurVitalCreate = {
    nomIndicateur: '',
    unite: '',
    description: '',
    actif: true,
  };

  unitesSuggestions = [
    'mg/dL',
    'mmol/L',
    'µmol/L',
    'mL/min/1.73m²',
    'mg/24h',
    'ng/mL',
    'g/L',
    '%',
    'UI/L',
  ];

  doctor = { initials: 'DR' };
  submitted = false;
  loading = false;
  errorMsg = '';
  toastSuccess = false;
  formProgress = 33;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.calcProgress();
  }

  calcProgress(): void {
    let score = 0;
    if (this.indicateur.nomIndicateur?.trim()) score++;
    if (this.indicateur.unite?.trim()) score++;
    if (this.indicateur.actif !== null && this.indicateur.actif !== undefined) score++;
    this.formProgress = Math.round((score / 3) * 100);
  }

  selectUnite(u: string): void {
    this.indicateur.unite = u;
    this.calcProgress();
  }

  submit(): void {
    this.submitted = true;
    this.errorMsg = '';

    if (!this.indicateur.nomIndicateur?.trim()) return;
    if (!this.indicateur.unite?.trim()) return;

    this.loading = true;

    this.http.post(`${this.BASE_URL}/addIndicateurVital`, this.indicateur).subscribe({
      next: () => {
        this.loading = false;
        this.showSuccess();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || err?.message || "Erreur lors de l'enregistrement. Veuillez réessayer.";
      },
    });
  }

  private showSuccess(): void {
    this.toastSuccess = true;
    setTimeout(() => {
      this.toastSuccess = false;
      this.router.navigate(['/back/parametres-vitaux']);
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/back/parametres-vitaux']);
  }

  logout(): void {
    this.router.navigate(['/home']);
  }
}
