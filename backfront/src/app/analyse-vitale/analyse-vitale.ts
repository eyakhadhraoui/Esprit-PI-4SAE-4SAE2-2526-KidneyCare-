import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { from, of } from 'rxjs';
import { catchError, switchMap, timeout } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

interface ParametreVital {
  idParametreVital: number;
  nomParametre: string;
  valeurMesuree: number;
  referenceMin: number;
  referenceMax: number;
  unite: string;
  etat: string;
  poids: number;
  taille: number;
  age: number;
  imc: number;
}

interface Alerte {
  nomParametre: string;
  valeur: number;
  unite: string;
  refMin: number;
  refMax: number;
  score: number;
  ecart: number;
  niveau: 'critique' | 'modere' | 'normal';
  recommandation: string;
}

interface GraphiquePoint {
  valeur: number;
  refMin: number;
  refMax: number;
}

interface CritereRisque {
  label: string;
  poids: number;
  niveau: 'critique' | 'modere' | 'normal';
}

interface ScoreIndividuel {
  nom: string;
  imc: number | null;
  age: number | null;
  horsNorme: boolean;
  score: number;
  niveau: 'critique' | 'modere' | 'normal';
}

@Component({
  selector: 'app-analyse-vitale',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './analyse-vitale.html',
  styleUrls: ['./analyse-vitale.css'],
})
export class AnalyseVitaleComponent implements OnInit {
  loading = true;
  errorMsg = '';
  toastError = false;
  toastMsg = '';

  parametres: ParametreVital[] = [];

  alertes: Alerte[] = [];
  nbCritiques = 0;
  nbModeres = 0;
  nbNormaux = 0;

  nomsParametres: string[] = [];
  selectedParametreGraphique = '';
  graphiqueData: GraphiquePoint[] = [];
  graphiqueRefMin = 0;
  graphiqueRefMax = 0;
  graphiqueMin = 0;
  graphiqueMax = 0;
  graphiqueMoyenne = 0;
  graphiqueHorsNorme = 0;

  readonly graphSvgPadding = 40;
  readonly graphSvgWidth = 720;
  readonly graphSvgHeight = 220;
  readonly graphSvgTop = 10;

  scoreRisqueGlobal = 0;
  niveauRisqueGlobal: 'faible' | 'modere' | 'eleve' = 'faible';
  interpretationRisque = '';
  critereRisque: CritereRisque[] = [];
  scoresIndividuels: ScoreIndividuel[] = [];

  private readonly apiUrl = '/vital/parametreVital/retrieveParametresVitaux';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';
    from(this.auth.getTokenForRequest())
      .pipe(
        switchMap((token) => {
          const opts =
            token != null && token !== ''
              ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
              : {};
          return this.http.get<ParametreVital[]>(this.apiUrl, opts);
        }),
        timeout(10000),
        catchError((err: unknown) => {
          this.loading = false;
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.errorMsg =
              'Non autorisé (401). Déconnectez-vous puis reconnectez-vous, ou vérifiez que Keycloak tourne sur le même hôte/realm que les backends (8080 · kidneyCare-realm).';
          } else {
            const name =
              err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
            this.errorMsg =
              name === 'TimeoutError'
                ? 'Délai dépassé (10 s). Vérifiez le service vitaux (port 8082) et ng serve avec le proxy.'
                : 'Analyse indisponible pour le moment.';
          }
          this.showToastError(this.errorMsg);
          return of<ParametreVital[]>([]);
        }),
      )
      .subscribe({
        next: (data) => {
          this.loading = false;
          this.parametres = Array.isArray(data) ? data : [];
          try {
            this.computeAlertes();
            this.computeNomsParametres();
            this.computeScoresIndividuels();
            this.computeScoreRisqueGlobal();
          } catch (e) {
            console.error(e);
            this.errorMsg = 'Erreur lors du traitement des données.';
            this.showToastError(this.errorMsg);
          }
        },
      });
  }

  computeAlertes(): void {
    this.alertes = [];

    for (const p of this.parametres) {
      if (p.valeurMesuree == null || p.referenceMin == null || p.referenceMax == null) continue;

      const plage = p.referenceMax - p.referenceMin;
      let score = 0;
      let ecart = 0;

      if (plage <= 0) continue;

      if (p.valeurMesuree < p.referenceMin) {
        ecart = Math.round(((p.referenceMin - p.valeurMesuree) / plage) * 100);
        score = Math.min(100, Math.round(ecart * 1.5));
      } else if (p.valeurMesuree > p.referenceMax) {
        ecart = Math.round(((p.valeurMesuree - p.referenceMax) / plage) * 100);
        score = Math.min(100, Math.round(ecart * 1.5));
      } else {
        const milieu = (p.referenceMin + p.referenceMax) / 2;
        const dist = Math.abs(p.valeurMesuree - milieu) / (plage / 2);
        score = Math.round(dist * 20);
        ecart = 0;
      }

      const niveau = score >= 60 ? 'critique' : score >= 25 ? 'modere' : 'normal';
      const recommandation = this.getRecommandation(
        p.nomParametre,
        niveau,
        p.valeurMesuree,
        p.referenceMin,
        p.referenceMax,
      );

      this.alertes.push({
        nomParametre: p.nomParametre,
        valeur: p.valeurMesuree,
        unite: p.unite,
        refMin: p.referenceMin,
        refMax: p.referenceMax,
        score,
        ecart,
        niveau,
        recommandation,
      });
    }

    this.alertes.sort((a, b) => b.score - a.score);

    this.nbCritiques = this.alertes.filter((a) => a.niveau === 'critique').length;
    this.nbModeres = this.alertes.filter((a) => a.niveau === 'modere').length;
    this.nbNormaux = this.alertes.filter((a) => a.niveau === 'normal').length;
  }

  private getRecommandation(nom: string, niveau: string, val: number, min: number, max: number): string {
    if (niveau === 'normal') return 'Valeur dans les normes. Surveillance de routine recommandée.';
    const direction = val < min ? 'basse' : 'élevée';
    if (niveau === 'critique') return `Valeur ${direction} critique pour ${nom}. Consultation urgente recommandée.`;
    return `Valeur ${direction} pour ${nom}. Réévaluation clinique conseillée dans les 48h.`;
  }

  computeNomsParametres(): void {
    const set = new Set<string>();
    this.parametres.forEach((p) => {
      if (p.nomParametre) set.add(p.nomParametre);
    });
    this.nomsParametres = Array.from(set).sort();
  }

  onGraphiqueChange(): void {
    if (!this.selectedParametreGraphique) {
      this.graphiqueData = [];
      return;
    }

    const filtered = this.parametres.filter((p) => p.nomParametre === this.selectedParametreGraphique);
    this.graphiqueData = filtered.map((p) => ({
      valeur: p.valeurMesuree,
      refMin: p.referenceMin,
      refMax: p.referenceMax,
    }));

    if (this.graphiqueData.length === 0) return;

    this.graphiqueRefMin = this.graphiqueData[0].refMin;
    this.graphiqueRefMax = this.graphiqueData[0].refMax;

    const valeurs = this.graphiqueData.map((d) => d.valeur).filter((v) => v != null);
    this.graphiqueMin = Math.min(...valeurs);
    this.graphiqueMax = Math.max(...valeurs);
    this.graphiqueMoyenne = Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 10) / 10;
    this.graphiqueHorsNorme = this.graphiqueData.filter((d) => this.isPointOutOfRange(d)).length;
  }

  private get svgYMin(): number {
    const allVals = this.graphiqueData.map((d) => d.valeur);
    allVals.push(this.graphiqueRefMin, this.graphiqueRefMax);
    return Math.min(...allVals) * 0.9;
  }

  private get svgYMax(): number {
    const allVals = this.graphiqueData.map((d) => d.valeur);
    allVals.push(this.graphiqueRefMin, this.graphiqueRefMax);
    return Math.max(...allVals) * 1.1;
  }

  getY(val: number): number {
    const range = this.svgYMax - this.svgYMin;
    if (range === 0) return this.graphSvgHeight / 2;
    const ratio = (val - this.svgYMin) / range;
    return Math.round(this.graphSvgHeight - ratio * (this.graphSvgHeight - this.graphSvgTop - 20) - 10);
  }

  getX(i: number): number {
    if (this.graphiqueData.length <= 1) return this.graphSvgPadding + this.graphSvgWidth / 2;
    const step = this.graphSvgWidth / (this.graphiqueData.length - 1);
    return Math.round(this.graphSvgPadding + i * step);
  }

  getPolylinePoints(): string {
    return this.graphiqueData.map((d, i) => `${this.getX(i)},${this.getY(d.valeur)}`).join(' ');
  }

  isPointOutOfRange(d: GraphiquePoint): boolean {
    return d.valeur < d.refMin || d.valeur > d.refMax;
  }

  computeScoresIndividuels(): void {
    this.scoresIndividuels = this.parametres.map((p) => {
      let score = 0;
      const horsNorme = this.isOutOfRange(p);

      if (p.imc != null) {
        if (p.imc < 14 || p.imc > 30) score += 25;
        else if (p.imc < 16 || p.imc > 25) score += 10;
      }

      if (p.age != null) {
        if (p.age < 5) score += 20;
        else if (p.age < 10) score += 10;
      }

      if (horsNorme) {
        const plage = p.referenceMax - p.referenceMin || 1;
        const ecart =
          p.valeurMesuree < p.referenceMin
            ? (p.referenceMin - p.valeurMesuree) / plage
            : (p.valeurMesuree - p.referenceMax) / plage;
        score += Math.min(40, Math.round(ecart * 60));
      }

      if (p.etat != null && String(p.etat).length > 0) {
        const etatLower = String(p.etat).toLowerCase();
        if (etatLower.includes('critique') || etatLower.includes('urgence')) score += 15;
        else if (etatLower.includes('anormal') || etatLower.includes('alerte')) score += 8;
      }

      score = Math.min(100, score);
      const niveau: 'critique' | 'modere' | 'normal' =
        score >= 60 ? 'critique' : score >= 25 ? 'modere' : 'normal';

      return {
        nom: p.nomParametre,
        imc: p.imc ?? null,
        age: p.age ?? null,
        horsNorme,
        score,
        niveau,
      };
    });

    this.scoresIndividuels.sort((a, b) => b.score - a.score);
  }

  computeScoreRisqueGlobal(): void {
    if (this.scoresIndividuels.length === 0) {
      this.scoreRisqueGlobal = 0;
      this.niveauRisqueGlobal = 'faible';
      this.interpretationRisque = 'Aucun paramètre disponible.';
      return;
    }

    const nbCrit = this.scoresIndividuels.filter((s) => s.niveau === 'critique').length;
    const nbMod = this.scoresIndividuels.filter((s) => s.niveau === 'modere').length;
    const nbHorsNorm = this.scoresIndividuels.filter((s) => s.horsNorme).length;
    const n = this.scoresIndividuels.length;
    const scoreMoyen = Math.round(this.scoresIndividuels.reduce((acc, s) => acc + s.score, 0) / n);

    let global = scoreMoyen;
    global += nbCrit * 5;
    global += nbMod * 2;
    global = Math.min(100, global);

    this.scoreRisqueGlobal = global;
    this.niveauRisqueGlobal = global >= 60 ? 'eleve' : global >= 30 ? 'modere' : 'faible';

    this.critereRisque = [
      {
        label: `${nbHorsNorm} paramètre(s) hors norme`,
        poids: Math.min(40, nbHorsNorm * 10),
        niveau: nbHorsNorm > 3 ? 'critique' : nbHorsNorm > 0 ? 'modere' : 'normal',
      },
      {
        label: `${nbCrit} paramètre(s) critique(s)`,
        poids: Math.min(30, nbCrit * 10),
        niveau: nbCrit > 2 ? 'critique' : nbCrit > 0 ? 'modere' : 'normal',
      },
      {
        label: `Score moyen des paramètres : ${scoreMoyen}`,
        poids: Math.round(scoreMoyen / 2),
        niveau: scoreMoyen >= 60 ? 'critique' : scoreMoyen >= 30 ? 'modere' : 'normal',
      },
    ];

    if (this.niveauRisqueGlobal === 'eleve') {
      this.interpretationRisque =
        `Score élevé (${global}/100) : ${nbCrit} paramètre(s) critique(s) détecté(s). ` +
        `Une consultation médicale urgente est fortement recommandée pour évaluer le risque de rejet ou de complication post-greffe.`;
    } else if (this.niveauRisqueGlobal === 'modere') {
      this.interpretationRisque =
        `Score modéré (${global}/100) : ${nbMod} paramètre(s) en zone d'alerte. ` +
        `Un suivi rapproché est conseillé dans les prochains jours.`;
    } else {
      this.interpretationRisque =
        `Score faible (${global}/100) : Les paramètres vitaux sont globalement dans les normes. ` +
        `Maintenir la surveillance habituelle.`;
    }
  }

  getGaugeArc(score: number): string {
    const angle = (score / 100) * 180;
    const radians = (angle - 180) * (Math.PI / 180);
    const x = 100 + 80 * Math.cos(radians);
    const y = 100 + 80 * Math.sin(radians);
    const large = angle > 180 ? 1 : 0;
    return `M 20 100 A 80 80 0 ${large} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  getGaugeColor(score: number): string {
    if (score >= 60) return '#ef4444';
    if (score >= 30) return '#f59e0b';
    return '#10b981';
  }

  private isOutOfRange(p: ParametreVital): boolean {
    if (p.valeurMesuree == null || p.referenceMin == null || p.referenceMax == null) return false;
    return p.valeurMesuree < p.referenceMin || p.valeurMesuree > p.referenceMax;
  }

  private showToastError(msg: string): void {
    this.toastMsg = msg;
    this.toastError = true;
    setTimeout(() => (this.toastError = false), 3500);
  }
}
