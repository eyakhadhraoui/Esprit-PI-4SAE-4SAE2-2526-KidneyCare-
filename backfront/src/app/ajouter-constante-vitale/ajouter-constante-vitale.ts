import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Corps attendu par le backend (ConstanteVitaleDTO) — id plat, pas d’objet imbriqué. */
export interface ConstanteVitaleCreate {
  nomParametre: string;
  unite: string;
  valeurMinNormale: number | null;
  valeurMaxNormale: number | null;
  poidsMin: number | null;
  poidsMax: number | null;
  tailleMin: number | null;
  tailleMax: number | null;
  idIndicateurVital: number | null;
}

export interface IndicateurVital {
  idIndicateurVital: number;
  nomIndicateur: string;
  unite: string;
  description: string;
  actif: boolean;
}

export interface ConstanteVitale extends ConstanteVitaleCreate {
  idConstanteVitale: number;
  /** Réponse API : objet lié (liste retrieve) */
  indicateurVital?: { idIndicateurVital: number } | null;
}

@Component({
  selector: 'app-ajouter-constante-vitale',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ajouter-constante-vitale.html',
  styleUrl: './ajouter-constante-vitale.css',
})
export class AjouterConstanteVitale implements OnInit {
  private readonly BASE_URL = '/vital/constanteVitale';
  private readonly BASE_INDICATEUR = '/vital/indicateurVital';

  constante: ConstanteVitaleCreate = {
    nomParametre: '',
    unite: '',
    valeurMinNormale: null,
    valeurMaxNormale: null,
    poidsMin: null,
    poidsMax: null,
    tailleMin: null,
    tailleMax: null,
    idIndicateurVital: null,
  };

  indicateursList: IndicateurVital[] = [];
  selectedIndicateurId: number | null = null;
  loadingIndicateurs = false;
  unitesSuggestions: string[] = [];
  loadingUnites = false;

  doctor = { initials: 'DR' };
  submitted = false;
  loading = false;
  errorMsg = '';
  toastSuccess = false;
  formProgress = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadIndicateurs();
    this.loadUnitesSuggestions();
    this.calcProgress();
  }

  loadIndicateurs(): void {
    this.loadingIndicateurs = true;
    this.http.get<IndicateurVital[]>(`${this.BASE_INDICATEUR}/retrieveIndicateursVital`).subscribe({
      next: (data) => {
        this.indicateursList = data.filter((i) => i.actif !== false);
        this.loadingIndicateurs = false;
      },
      error: () => {
        this.indicateursList = [];
        this.loadingIndicateurs = false;
      },
    });
  }

  loadUnitesSuggestions(): void {
    this.loadingUnites = true;
    this.http.get<ConstanteVitale[]>(`${this.BASE_URL}/retrieveConstantesVitales`).subscribe({
      next: (data) => {
        const unites = data.map((c) => c.unite).filter((u): u is string => !!u && u.trim().length > 0);
        this.unitesSuggestions = [...new Set(unites)];
        this.loadingUnites = false;
      },
      error: () => {
        this.loadingUnites = false;
      },
    });
  }

  onIndicateurChange(): void {
    const ind = this.getSelectedIndicateur();
    if (ind?.unite) {
      this.constante.unite = ind.unite;
    }
    this.constante.idIndicateurVital = this.selectedIndicateurId;
    this.calcProgress();
  }

  getSelectedIndicateur(): IndicateurVital | undefined {
    return this.indicateursList.find((i) => i.idIndicateurVital === this.selectedIndicateurId);
  }

  calcProgress(): void {
    let score = 0;
    if (this.constante.nomParametre?.trim()) score++;
    if (this.constante.unite?.trim()) score++;
    if (this.constante.valeurMinNormale !== null && this.constante.valeurMinNormale !== undefined) score++;
    if (this.constante.valeurMaxNormale !== null && this.constante.valeurMaxNormale !== undefined) score++;
    this.formProgress = Math.round((score / 4) * 100);
  }

  selectUnite(u: string): void {
    this.constante.unite = u;
    this.calcProgress();
  }

  submit(): void {
    this.submitted = true;
    this.errorMsg = '';

    if (!this.constante.nomParametre?.trim()) return;
    if (!this.constante.unite?.trim()) return;
    if (this.constante.valeurMinNormale === null) return;
    if (this.constante.valeurMaxNormale === null) return;
    if (this.constante.valeurMinNormale > this.constante.valeurMaxNormale!) {
      this.errorMsg = 'La valeur minimale ne peut pas être supérieure à la valeur maximale.';
      return;
    }

    this.constante.idIndicateurVital = this.selectedIndicateurId;

    this.loading = true;

    this.http.post(`${this.BASE_URL}/addConstanteVitale`, this.constante).subscribe({
      next: () => {
        this.loading = false;
        this.toastSuccess = true;
        setTimeout(() => {
          this.toastSuccess = false;
          this.router.navigate(['/back/parametres-vitaux']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || "Erreur lors de l'enregistrement. Veuillez réessayer.";
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/back/parametres-vitaux']);
  }

  logout(): void {
    this.router.navigate(['/home']);
  }
}
