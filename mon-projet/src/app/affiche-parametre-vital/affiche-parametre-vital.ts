import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

export interface ParametreVital {
  idParametreVital: number;
  nomParametre: string;
  valeurMesuree: number;
  unite: string;
  referenceMin: number;
  referenceMax: number;
  etat: string;
  poids: number;
  taille: number;
  age: number;
  imc: number;
  idResultatLaboratoire: number;
}
export interface ConstanteVitale {
  idConstanteVitale: number;
  nomParametre: string;
  valeurMinNormale: number | null;
  valeurMaxNormale: number | null;
  unite: string;
  poidsMin: number | null;
  poidsMax: number | null;
  tailleMin: number | null;
  tailleMax: number | null;
  indicateurVital?: { idIndicateurVital: number; nomIndicateur: string; unite: string };
}
export interface IndicateurVital {
  idIndicateurVital: number;
  nomIndicateur: string;
  unite: string;
  description: string;
  actif: boolean;
}

export interface EditParametreForm {
  idParametreVital?: number;
  nomParametre: string;
  valeurNormaleMin: number | null;
  valeurNormaleMax: number | null;
  unite: string;
  /** Champ UI seulement (non persisté côté microservice ParametreVital). */
  description: string;
  idResultatLaboratoire?: number | null;
  valeurMesuree?: number | null;
  etat?: string | null;
  poids?: number | null;
  taille?: number | null;
  age?: number | null;
  imc?: number | null;
  constanteVitaleId?: number | null;
}

export type VitalActiveView = 'tous' | 'parametres' | 'constantes' | 'indicateurs';

export type VitalTypePill = 'cardio' | 'renal' | 'resp' | 'bio' | 'metab' | 'autre';
export type VitalStatutPill = 'ok' | 'warn' | 'bad' | 'neutral';

export interface UnifiedVitalRow {
  kind: 'parametre' | 'constante' | 'indicateur';
  id: number;
  nom: string;
  unite: string;
  plage: string;
  typeLabel: string;
  typePill: VitalTypePill;
  statutLabel: string;
  statutPill: VitalStatutPill;
  outOfRange?: boolean;
}

export interface CroissResult {
  poidsPercentile: number; taillePercentile: number; imc: number;
  imcMin: number; imcMax: number; poidsMediane: number; tailleMediane: number;
  poidsLabel: string; tailleLabel: string; imcLabel: string;
  poidsPercentileColor: string; taillePercentileColor: string; imcColor: string;
  retardCroissance: boolean; retardTitre: string; retardTexte: string;
  retardSeverite: string; taillePct: number;
}

export interface ImmunoResult {
  doseCalculee: number; doseTotale: number; c0Cible: string;
  c0Status: string; c0Icon: string; c0Label: string;
  ajustement: string; ajustementLabel: string; recommandation: string;
  nefrotoxique: boolean;
}

export interface HydResult {
  besoinBase: number; majFievre: number; besoinAjuste: number;
  bilan: number; bilanColor: string; bilanLabel: string;
  diureseAlerte: boolean; diureseNiveau: string; diureseIcon: string;
  diureseAlerteTitre: string; diureseAlerteTexte: string; diuresePct: number;
}

export interface FragiliteCritere {
  icon: string; nom: string; valeur: string; pts: number; niveau: string;
}

export interface FragiliteResult {
  score: number; niveau: string; niveauLabel: string; pronostic: string;
  color: string; dashArray: string;
  criteres: FragiliteCritere[]; recommandations: string[];
}

@Component({
  selector: 'app-affiche-parametre-vital',
  standalone: false,
  templateUrl: './affiche-parametre-vital.html',
  styleUrl: './affiche-parametre-vital.css',
})
export class AfficheParametreVital implements OnInit {
  private readonly BASE_VITAL = '/vital/parametreVital';
  private readonly BASE_CONSTANTE = '/vital/constanteVitale';
  private readonly BASE_INDICATEUR = '/vital/indicateurVital';

  parametresVitaux: ParametreVital[] = [];
  constantesVitales: ConstanteVitale[] = [];
  indicateursVitaux: IndicateurVital[] = [];
  filteredUnified: UnifiedVitalRow[] = [];
  pagedUnified: UnifiedVitalRow[] = [];

  totalParametres = 0;
  totalConstantes = 0;
  totalIndicateurs = 0;
  activeView: VitalActiveView = 'tous';
  showNouveauMenu = false;
  previewRow: UnifiedVitalRow | null = null;
  searchTerm = '';
  sortOrder = 'recent';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  pagesArray: number[] = [];
  loading = false;
  errorDetail = '';
  showDeleteModal = false;
  itemToDelete: number | null = null;
  deleteTarget: 'parametre' | 'constante' | 'indicateur' = 'parametre';
  toastSuccess = false;
  toastError = false;
  toastMsg = '';
  doctor = { initials: 'DR' };

  showEditModal = false;
  editParametreId: number | null = null;
  editIsFetching = false;
  editIsLoading = false;
  editFormProgress = 0;
  editParametre: EditParametreForm = {
    nomParametre: '',
    valeurNormaleMin: null,
    valeurNormaleMax: null,
    unite: '',
    description: '',
    idResultatLaboratoire: null,
    valeurMesuree: null,
    etat: null,
    poids: null,
    taille: null,
    age: null,
    imc: null,
    constanteVitaleId: null,
  };

  showNephroModal = false;
  nephroTab: 'egfr' | 'ckd' | 'rejet' | 'croissance' | 'immuno' | 'pcr' | 'hydrique' | 'fragilite' = 'egfr';

  egfrAge: number | null = null;
  egfrTaille: number | null = null;
  egfrCreat: number | null = null;
  egfrSexe = 'M';
  egfrResult: number | null = null;
  egfrCkdStage = '';
  egfrCkdLabel = '';
  egfrCkdColor = '';
  egfrKdigoText = '';
  egfrBarPct = 0;

  ckdMesures: { date: string; egfr: number }[] = [];
  ckdNewDate = new Date().toISOString().split('T')[0];
  ckdNewEgfr: number | null = null;
  ckdDegradation = false;

  rejCreat: number | null = null;
  rejProteinurie: number | null = null;
  rejTension: number | null = null;
  rejDfg: number | null = null;
  rejDfgBase: number | null = null;
  rejFievre: number | null = null;
  rejectionScore: number | null = null;
  rejectionRiskLevel = 'faible';
  rejectionRiskLabel = '';
  rejectionRiskDetail = '';
  rejectionRecommandation = '';
  rejectionCriteria: { name: string; active: boolean; pts: number }[] = [];

  croissAge: number | null = null;
  croissTaille: number | null = null;
  croissPoids: number | null = null;
  croissanceSexe = 'M';
  croissCortico = 'non';
  croissAnciennete: number | null = null;
  croissResult: CroissResult | null = null;

  private omsData: Record<
    string,
    Record<
      number,
      {
        poids: number;
        taille: number;
        poidsP3: number;
        poidsP97: number;
        tailleP3: number;
        tailleP97: number;
      }
    >
  > = {
    M: {
      2: { poids: 12.2, taille: 87.8, poidsP3: 10.8, poidsP97: 14.3, tailleP3: 82.3, tailleP97: 93.4 },
      3: { poids: 14.3, taille: 96.1, poidsP3: 12.5, poidsP97: 17.0, tailleP3: 89.9, tailleP97: 102.6 },
      4: { poids: 16.3, taille: 103.3, poidsP3: 14.1, poidsP97: 19.9, tailleP3: 96.1, tailleP97: 110.7 },
      5: { poids: 18.3, taille: 110.0, poidsP3: 15.7, poidsP97: 23.2, tailleP3: 101.5, tailleP97: 117.9 },
      6: { poids: 20.5, taille: 116.0, poidsP3: 17.3, poidsP97: 26.8, tailleP3: 107.4, tailleP97: 124.5 },
      7: { poids: 22.9, taille: 121.7, poidsP3: 19.0, poidsP97: 31.3, tailleP3: 112.0, tailleP97: 130.7 },
      8: { poids: 25.6, taille: 127.3, poidsP3: 20.9, poidsP97: 36.9, tailleP3: 116.9, tailleP97: 137.2 },
      9: { poids: 28.6, taille: 132.6, poidsP3: 23.0, poidsP97: 43.6, tailleP3: 121.4, tailleP97: 143.2 },
      10: { poids: 31.9, taille: 137.8, poidsP3: 25.3, poidsP97: 51.5, tailleP3: 125.8, tailleP97: 149.6 },
      11: { poids: 35.6, taille: 143.0, poidsP3: 27.9, poidsP97: 60.4, tailleP3: 130.2, tailleP97: 155.9 },
      12: { poids: 39.7, taille: 148.8, poidsP3: 31.1, poidsP97: 69.9, tailleP3: 135.1, tailleP97: 162.5 },
      13: { poids: 44.0, taille: 155.3, poidsP3: 35.0, poidsP97: 78.4, tailleP3: 141.4, tailleP97: 169.2 },
      14: { poids: 48.8, taille: 161.5, poidsP3: 39.0, poidsP97: 86.3, tailleP3: 147.4, tailleP97: 174.5 },
      15: { poids: 53.7, taille: 166.2, poidsP3: 43.0, poidsP97: 93.3, tailleP3: 152.6, tailleP97: 178.4 },
      16: { poids: 57.8, taille: 169.0, poidsP3: 46.5, poidsP97: 99.0, tailleP3: 156.3, tailleP97: 181.0 },
      17: { poids: 61.0, taille: 170.6, poidsP3: 49.2, poidsP97: 103.2, tailleP3: 158.5, tailleP97: 182.7 },
      18: { poids: 63.2, taille: 171.5, poidsP3: 50.9, poidsP97: 106.0, tailleP3: 159.8, tailleP97: 183.8 },
    },
    F: {
      2: { poids: 11.5, taille: 86.4, poidsP3: 10.2, poidsP97: 13.7, tailleP3: 80.9, tailleP97: 92.1 },
      3: { poids: 13.9, taille: 95.1, poidsP3: 12.0, poidsP97: 16.7, tailleP3: 88.6, tailleP97: 101.8 },
      4: { poids: 16.1, taille: 102.7, poidsP3: 13.7, poidsP97: 20.0, tailleP3: 95.0, tailleP97: 110.4 },
      5: { poids: 18.2, taille: 109.4, poidsP3: 15.3, poidsP97: 23.9, tailleP3: 100.6, tailleP97: 118.0 },
      6: { poids: 20.2, taille: 115.6, poidsP3: 16.8, poidsP97: 28.4, tailleP3: 105.9, tailleP97: 125.2 },
      7: { poids: 22.4, taille: 121.6, poidsP3: 18.4, poidsP97: 33.7, tailleP3: 111.1, tailleP97: 132.1 },
      8: { poids: 25.0, taille: 127.3, poidsP3: 20.3, poidsP97: 40.3, tailleP3: 116.1, tailleP97: 138.5 },
      9: { poids: 28.1, taille: 132.9, poidsP3: 22.6, poidsP97: 48.2, tailleP3: 121.0, tailleP97: 145.0 },
      10: { poids: 31.9, taille: 138.6, poidsP3: 25.5, poidsP97: 57.5, tailleP3: 126.2, tailleP97: 151.8 },
      11: { poids: 36.2, taille: 144.8, poidsP3: 28.9, poidsP97: 67.3, tailleP3: 131.7, tailleP97: 158.5 },
      12: { poids: 40.7, taille: 151.5, poidsP3: 32.8, poidsP97: 76.8, tailleP3: 138.0, tailleP97: 164.8 },
      13: { poids: 45.1, taille: 156.7, poidsP3: 36.8, poidsP97: 84.8, tailleP3: 143.4, tailleP97: 170.0 },
      14: { poids: 48.5, taille: 159.8, poidsP3: 39.8, poidsP97: 91.0, tailleP3: 146.7, tailleP97: 173.2 },
      15: { poids: 51.4, taille: 161.8, poidsP3: 42.4, poidsP97: 96.0, tailleP3: 149.2, tailleP97: 175.4 },
      16: { poids: 53.0, taille: 162.5, poidsP3: 43.9, poidsP97: 99.2, tailleP3: 150.5, tailleP97: 176.5 },
      17: { poids: 54.0, taille: 163.0, poidsP3: 44.8, poidsP97: 101.2, tailleP3: 151.2, tailleP97: 177.1 },
      18: { poids: 54.7, taille: 163.3, poidsP3: 45.3, poidsP97: 102.5, tailleP3: 151.7, tailleP97: 177.5 },
    },
  };

  immunoMolecule = 'tacrolimus';
  immunoPoids: number | null = null;
  immunoAge: number | null = null;
  immunoCreat: number | null = null;
  immunoC0: number | null = null;
  immunoPhase = 'precoce';
  immunoResult: ImmunoResult | null = null;

  pcrProteines: number | null = null;
  pcrCreatinine: number | null = null;
  pcrResult: number | null = null;
  pcrLevel = '';
  pcrLevelIcon = '';
  pcrLevelLabel = '';
  pcrInterpretation = '';
  pcrBarPct = 0;
  pcrProteinurie24h = 0;

  hydPoids: number | null = null;
  hydDiurese: number | null = null;
  hydApports: number | null = null;
  hydFievre: number | null = null;
  hydResult: HydResult | null = null;

  fragiliteAge: number | null = null;
  fragiliteImc: number | null = null;
  fragiliteDfg: number | null = null;
  fragiliteAnciennete: number | null = null;
  fragiliteRejets: number | null = null;
  fragiliteObservance = 'bonne';
  fragiliteResult: FragiliteResult | null = null;

  showAnalyseModal = false;
  analyseLoading = false;
  analyseAlertes: Array<Record<string, unknown>> = [];
  analyseNbCritiques = 0;
  analyseNbModeres = 0;
  analyseNbNormaux = 0;
  analyseNomsParams: string[] = [];
  analyseSelectedParam = '';
  analyseGraphData: { valeur: number; refMin: number; refMax: number }[] = [];
  analyseRefMin = 0;
  analyseRefMax = 0;
  analyseGraphMin = 0;
  analyseGraphMax = 0;
  analyseGraphMoy = 0;
  analyseHorsNorme = 0;
  private readonly GRAPH_PAD = 40;
  private readonly GRAPH_W = 720;
  private readonly GRAPH_H = 220;
  analyseScoreGlobal = 0;
  analyseNiveauGlobal: 'faible' | 'modere' | 'eleve' = 'faible';
  analyseInterpretation = '';
  analyseCriteres: Array<Record<string, unknown>> = [];
  analyseScoresIndiv: Array<{
    nom: string;
    imc: number;
    age: number;
    horsNorme: boolean;
    score: number;
    niveau: string;
  }> = [];

  showEditConstanteModal = false;
  editConstanteId: number | null = null;
  editConstanteIsFetching = false;
  editConstanteIsLoading = false;
  editConstanteFormProgress = 0;
  editConstanteLoadingIndicateurs = false;
  indicateursList: IndicateurVital[] = [];

  private readonly _emptyEditConstante = {
    nomParametre: '',
    unite: '',
    valeurMinNormale: null as number | null,
    valeurMaxNormale: null as number | null,
    poidsMin: null as number | null,
    poidsMax: null as number | null,
    tailleMin: null as number | null,
    tailleMax: null as number | null,
    selectedIndicateurId: null as number | null,
    indicateurVital: null as { idIndicateurVital: number } | null,
  };

  editConstante = { ...this._emptyEditConstante };
  private _originalEditConstante = { ...this._emptyEditConstante };

  showEditIndicateurModal = false;
  editIndicateurId: number | null = null;
  editIndicateurIsFetching = false;
  editIndicateurIsLoading = false;
  editIndicateurFormProgress = 0;
  editIndicateur = {
    nomIndicateur: '',
    unite: '',
    description: '',
    actif: true,
  };
  private _originalEditIndicateur = { ...this.editIndicateur };

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAllVitaux();
  }

  openEditModal(id: number): void {
    this.editParametreId = id;
    this.showEditModal = true;
    this.editIsFetching = true;
    document.body.style.overflow = 'hidden';

    this.http.get<Record<string, unknown>>(`${this.BASE_VITAL}/retrieveParametreVital/${id}`).subscribe({
      next: (data) => {
        const cvRaw = data['constanteVitale'] as { idConstanteVitale?: number } | null | undefined;
        this.editParametre = {
          idParametreVital: data['idParametreVital'] as number,
          nomParametre: (data['nomParametre'] as string) || '',
          valeurNormaleMin: (data['referenceMin'] as number | null) ?? null,
          valeurNormaleMax: (data['referenceMax'] as number | null) ?? null,
          unite: (data['unite'] as string) || '',
          description: (data['description'] as string) || '',
          idResultatLaboratoire: (data['idResultatLaboratoire'] as number | null) ?? null,
          valeurMesuree: (data['valeurMesuree'] as number | null) ?? null,
          etat: (data['etat'] as string | null) ?? null,
          poids: (data['poids'] as number | null) ?? null,
          taille: (data['taille'] as number | null) ?? null,
          age: (data['age'] as number | null) ?? null,
          imc: (data['imc'] as number | null) ?? null,
          constanteVitaleId: cvRaw?.idConstanteVitale ?? null,
        };
        this.editIsFetching = false;
        this.calcEditProgress();
      },
      error: () => {
        const local = this.parametresVitaux.find((p) => p.idParametreVital === id);
        if (local) {
          this.editParametre = {
            idParametreVital: local.idParametreVital,
            nomParametre: local.nomParametre || '',
            valeurNormaleMin: local.referenceMin ?? null,
            valeurNormaleMax: local.referenceMax ?? null,
            unite: local.unite || '',
            description: '',
            idResultatLaboratoire: local.idResultatLaboratoire ?? null,
            valeurMesuree: local.valeurMesuree ?? null,
            etat: local.etat ?? null,
            poids: local.poids ?? null,
            taille: local.taille ?? null,
            age: local.age ?? null,
            imc: local.imc ?? null,
            constanteVitaleId: null,
          };
        }
        this.editIsFetching = false;
        this.calcEditProgress();
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editParametreId = null;
    document.body.style.overflow = '';
  }

  calcEditProgress(): void {
    let filled = 0;
    if ((this.editParametre.nomParametre?.trim().length ?? 0) >= 2) filled++;
    if (this.editParametre.unite?.trim()) filled++;
    if (this.editParametre.valeurNormaleMin !== null) filled++;
    if (this.editParametre.valeurNormaleMax !== null) filled++;
    this.editFormProgress = Math.round((filled / 4) * 100);
  }

  resetEditForm(): void {
    if (this.editParametreId) this.openEditModal(this.editParametreId);
  }

  saveEditParametre(): void {
    if (!this.editParametreId) return;
    this.editIsLoading = true;
    const p = this.editParametre;
    const payload = {
      idParametreVital: this.editParametreId,
      nomParametre: (p.nomParametre ?? '').trim(),
      unite: (p.unite ?? '').trim(),
      referenceMin: this.toFloatOrNull(p.valeurNormaleMin),
      referenceMax: this.toFloatOrNull(p.valeurNormaleMax),
      idResultatLaboratoire: p.idResultatLaboratoire ?? null,
      valeurMesuree: this.toFloatOrNull(p.valeurMesuree),
      etat: p.etat?.trim() || null,
      poids: this.toFloatOrNull(p.poids),
      taille: this.toFloatOrNull(p.taille),
      age: p.age != null && Number.isFinite(Number(p.age)) ? Number(p.age) : null,
      imc: this.toFloatOrNull(p.imc),
      constanteVitaleId: p.constanteVitaleId ?? null,
    };

    this.http.put(`${this.BASE_VITAL}/updateParametreVital/${this.editParametreId}`, payload).subscribe({
      next: () => {
        this.editIsLoading = false;
        this.closeEditModal();
        this.showToast('Paramètre mis à jour avec succès ✅', 'success');
        this.loadAllVitaux();
      },
      error: (err) => {
        console.error(err);
        this.editIsLoading = false;
        const msg = err?.error?.message ?? err?.message ?? 'Erreur lors de la mise à jour';
        this.showToast(`${msg} ❌`, 'error');
      },
    });
  }

  openNephroModal(tab: typeof this.nephroTab = 'egfr'): void {
    this.nephroTab = tab;
    this.showNephroModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeNephroModal(): void {
    this.showNephroModal = false;
    document.body.style.overflow = '';
  }

  calcEgfr(): void {
    if (!this.egfrAge || !this.egfrTaille || !this.egfrCreat || this.egfrCreat <= 0) {
      this.egfrResult = null;
      return;
    }
    const k = 0.413;
    this.egfrResult = Math.round(((k * this.egfrTaille) / this.egfrCreat) * 10) / 10;
    const g = this.egfrResult;
    if (g >= 90) {
      this.egfrCkdStage = 'G1';
      this.egfrCkdColor = 'vert';
      this.egfrCkdLabel = 'Fonction rénale normale ou élevée';
      this.egfrKdigoText = 'Surveillance annuelle — pas de restriction activité';
    } else if (g >= 60) {
      this.egfrCkdStage = 'G2';
      this.egfrCkdColor = 'vert';
      this.egfrCkdLabel = 'Légèrement diminuée';
      this.egfrKdigoText = 'Contrôle trimestriel — optimiser TA et protéinurie';
    } else if (g >= 45) {
      this.egfrCkdStage = 'G3a';
      this.egfrCkdColor = 'jaune';
      this.egfrCkdLabel = 'Légèrement à modérément diminuée';
      this.egfrKdigoText = 'Bilan phosphocalcique · Anémie à surveiller';
    } else if (g >= 30) {
      this.egfrCkdStage = 'G3b';
      this.egfrCkdColor = 'orange';
      this.egfrCkdLabel = 'Modérément à sévèrement diminuée';
      this.egfrKdigoText = 'Consultation nephro urgente · Préparer dialyse si chute';
    } else if (g >= 15) {
      this.egfrCkdStage = 'G4';
      this.egfrCkdColor = 'rouge';
      this.egfrCkdLabel = 'Sévèrement diminuée';
      this.egfrKdigoText = 'Préparation à la suppléance · Bilan pré-dialyse complet';
    } else {
      this.egfrCkdStage = 'G5';
      this.egfrCkdColor = 'critique';
      this.egfrCkdLabel = 'Insuffisance rénale terminale (IRT)';
      this.egfrKdigoText = '🚨 Dialyse / nouvelle transplantation à envisager';
    }
    this.egfrBarPct = Math.max(2, Math.min(96, 100 - (g / 120) * 100));
  }

  addCkdMesure(): void {
    if (!this.ckdNewEgfr || !this.ckdNewDate) return;
    this.ckdMesures.push({ date: this.ckdNewDate, egfr: this.ckdNewEgfr });
    this.ckdMesures.sort((a, b) => a.date.localeCompare(b.date));
    this.ckdNewEgfr = null;
    this.checkCkdDegradation();
  }
  removeCkdMesure(i: number): void {
    this.ckdMesures.splice(i, 1);
    this.checkCkdDegradation();
  }
  private checkCkdDegradation(): void {
    if (this.ckdMesures.length < 2) {
      this.ckdDegradation = false;
      return;
    }
    const first = this.ckdMesures[0].egfr;
    const last = this.ckdMesures[this.ckdMesures.length - 1].egfr;
    this.ckdDegradation = this.getCkdStageNum(last) > this.getCkdStageNum(first);
  }
  getCkdStage(egfr: number): string {
    if (egfr >= 90) return 'G1';
    if (egfr >= 60) return 'G2';
    if (egfr >= 45) return 'G3a';
    if (egfr >= 30) return 'G3b';
    if (egfr >= 15) return 'G4';
    return 'G5';
  }
  getCkdColor(egfr: number): string {
    if (egfr >= 60) return 'vert';
    if (egfr >= 45) return 'jaune';
    if (egfr >= 30) return 'orange';
    if (egfr >= 15) return 'rouge';
    return 'critique';
  }
  private getCkdStageNum(egfr: number): number {
    if (egfr >= 90) return 1;
    if (egfr >= 60) return 2;
    if (egfr >= 45) return 3;
    if (egfr >= 30) return 4;
    if (egfr >= 15) return 5;
    return 6;
  }

  calcRejet(): void {
    const vals = [this.rejCreat, this.rejProteinurie, this.rejTension, this.rejDfg];
    if (vals.filter((v) => v !== null).length < 2) {
      this.rejectionScore = null;
      return;
    }
    let score = 0;
    const crit: { name: string; active: boolean; pts: number }[] = [];
    const creatElev = (this.rejCreat ?? 0) > 1.0;
    crit.push({ name: 'Créatinine > 1.0 mg/dL', active: creatElev, pts: 20 });
    if (creatElev) score += 20;
    const protElev = (this.rejProteinurie ?? 0) > 150;
    crit.push({ name: 'Protéinurie > 150 mg/24h', active: protElev, pts: 20 });
    if (protElev) score += 20;
    const htaElev = (this.rejTension ?? 0) > 130;
    crit.push({ name: 'HTA > 130 mmHg', active: htaElev, pts: 15 });
    if (htaElev) score += 15;
    const dfgChute =
      this.rejDfg && this.rejDfgBase && this.rejDfgBase > 0
        ? (this.rejDfgBase - this.rejDfg) / this.rejDfgBase > 0.2
        : false;
    crit.push({ name: 'Chute DFG > 20% vs baseline', active: dfgChute, pts: 30 });
    if (dfgChute) score += 30;
    const dfgBas = (this.rejDfg ?? 999) < 45;
    crit.push({ name: 'DFG actuel < 45 mL/min/1.73m²', active: dfgBas, pts: 10 });
    if (dfgBas) score += 10;
    const fievre = (this.rejFievre ?? 0) > 38;
    crit.push({ name: 'Fièvre > 38°C (signe clinique)', active: fievre, pts: 5 });
    if (fievre) score += 5;
    this.rejectionCriteria = crit;
    this.rejectionScore = Math.min(100, score);
    if (score >= 60) {
      this.rejectionRiskLevel = 'critique';
      this.rejectionRiskLabel = '🚨 Risque ÉLEVÉ de rejet aigu';
      this.rejectionRiskDetail = 'Combinaison critique de biomarqueurs — intervention urgente requise';
      this.rejectionRecommandation =
        'Biopsy rénale en urgence · Bolus de méthylprednisolone IV · Hospitalisation · Ajuster immunosuppresseur';
    } else if (score >= 35) {
      this.rejectionRiskLevel = 'eleve';
      this.rejectionRiskLabel = '⚠️ Risque MODÉRÉ de rejet';
      this.rejectionRiskDetail = 'Plusieurs marqueurs anormaux — surveillance renforcée nécessaire';
      this.rejectionRecommandation =
        'Dosage tacrolimus/ciclosporine · Echo-doppler du greffon · Bilan biologique complet dans 48h';
    } else if (score >= 15) {
      this.rejectionRiskLevel = 'modere';
      this.rejectionRiskLabel = '🟡 Risque FAIBLE à surveiller';
      this.rejectionRiskDetail = 'Quelques anomalies biologiques isolées — suivi rapproché recommandé';
      this.rejectionRecommandation =
        'Contrôle biologique à 2 semaines · Optimisation TA · Vérification observance';
    } else {
      this.rejectionRiskLevel = 'faible';
      this.rejectionRiskLabel = '✅ Risque FAIBLE de rejet';
      this.rejectionRiskDetail = 'Biomarqueurs dans les limites acceptables post-transplantation';
      this.rejectionRecommandation = 'Surveillance trimestrielle standard · Continuer traitement en cours';
    }
  }

  calcCroissance(): void {
    if (!this.croissAge || !this.croissPoids || !this.croissTaille) {
      this.croissResult = null;
      return;
    }
    const age = Math.round(Math.min(18, Math.max(2, this.croissAge)));
    const ref = this.omsData[this.croissanceSexe][age];
    if (!ref) {
      this.croissResult = null;
      return;
    }
    const poids = this.croissPoids;
    const taille = this.croissTaille;
    const tailleM = taille / 100;
    const imc = poids / (tailleM * tailleM);
    const zPoids = (poids - ref.poids) / ((ref.poidsP97 - ref.poidsP3) / 4);
    const zTaille = (taille - ref.taille) / ((ref.tailleP97 - ref.tailleP3) / 4);
    const poidsPercentile = this.zToPercentile(zPoids);
    const taillePercentile = this.zToPercentile(zTaille);
    const imcMin = this.croissanceSexe === 'M' ? 14.0 : 13.5;
    const imcMax = this.croissanceSexe === 'M' ? 22.0 : 21.5;
    const poidsLabel =
      poidsPercentile < 3 ? 'Insuffisant' : poidsPercentile < 10 ? 'Limite bas' : poidsPercentile > 97 ? 'Élevé' : 'Normal';
    const tailleLabel =
      taillePercentile < 3
        ? 'Retard taille'
        : taillePercentile < 10
          ? 'Petite taille'
          : taillePercentile > 97
            ? 'Grande taille'
            : 'Normal';
    const poidsColor = poidsPercentile < 10 ? (poidsPercentile < 3 ? 'critique' : 'eleve') : 'normal';
    const tailleColor = taillePercentile < 10 ? (taillePercentile < 3 ? 'critique' : 'eleve') : 'normal';
    const imcColor = imc < imcMin ? 'bas' : imc > imcMax ? 'eleve' : 'normal';
    const imcLabel = imc < imcMin ? 'Insuffisance pondérale' : imc > imcMax ? 'Surpoids' : 'Normal';
    const retardCroissance = taillePercentile < 10 || poidsPercentile < 3;
    let retardTitre = '',
      retardTexte = '',
      retardSeverite = 'modere';
    if (retardCroissance) {
      if (taillePercentile < 3) {
        retardSeverite = 'critique';
        retardTitre = 'Retard statural sévère détecté';
        retardTexte =
          this.croissCortico === 'oui'
            ? `Taille au P${taillePercentile} — Probable retard de croissance cortico-induit.`
            : `Taille au P${taillePercentile} — Possible retard de croissance lié à la dysfonction du greffon.`;
      } else {
        retardTitre = 'Petite taille — surveillance requise';
        retardTexte = `Taille au P${taillePercentile}. Surveiller la vélocité de croissance.`;
      }
    }
    const taillePct = Math.max(3, Math.min(97, taillePercentile));
    this.croissResult = {
      poidsPercentile,
      taillePercentile,
      imc,
      imcMin,
      imcMax,
      poidsMediane: ref.poids,
      tailleMediane: ref.taille,
      poidsLabel,
      tailleLabel,
      imcLabel,
      poidsPercentileColor: poidsColor,
      taillePercentileColor: tailleColor,
      imcColor,
      retardCroissance,
      retardTitre,
      retardTexte,
      retardSeverite,
      taillePct,
    };
  }

  private zToPercentile(z: number): number {
    if (z <= -3) return 1;
    if (z <= -2) return 3;
    if (z <= -1.5) return 7;
    if (z <= -1) return 16;
    if (z <= -0.5) return 31;
    if (z <= 0) return 50;
    if (z <= 0.5) return 69;
    if (z <= 1) return 84;
    if (z <= 1.5) return 93;
    if (z <= 2) return 97;
    return 99;
  }

  calcImmuno(): void {
    if (!this.immunoPoids || !this.immunoAge) {
      this.immunoResult = null;
      return;
    }
    const isTacro = this.immunoMolecule === 'tacrolimus';
    let doseCalc: number;
    let c0Cible: string;
    let c0Min: number;
    let c0Max: number;
    if (isTacro) {
      doseCalc = this.immunoPhase === 'precoce' ? 0.15 : this.immunoPhase === 'intermediaire' ? 0.1 : 0.07;
      if (this.immunoPhase === 'precoce') {
        c0Cible = '8–12';
        c0Min = 8;
        c0Max = 12;
      } else if (this.immunoPhase === 'intermediaire') {
        c0Cible = '5–10';
        c0Min = 5;
        c0Max = 10;
      } else {
        c0Cible = '3–8';
        c0Min = 3;
        c0Max = 8;
      }
    } else {
      doseCalc = this.immunoPhase === 'precoce' ? 8 : this.immunoPhase === 'intermediaire' ? 5 : 3;
      if (this.immunoPhase === 'precoce') {
        c0Cible = '200–300';
        c0Min = 200;
        c0Max = 300;
      } else if (this.immunoPhase === 'intermediaire') {
        c0Cible = '120–200';
        c0Min = 120;
        c0Max = 200;
      } else {
        c0Cible = '80–120';
        c0Min = 80;
        c0Max = 120;
      }
    }
    if (this.immunoCreat && this.immunoCreat > 1.5) doseCalc *= 0.85;
    if (this.immunoCreat && this.immunoCreat > 2.0) doseCalc *= 0.75;
    const doseTotale = doseCalc * this.immunoPoids!;
    let c0Status = 'ok';
    let c0Icon = '✅';
    let c0Label = 'Dans la cible';
    let ajustement = 'maintenir';
    let ajustementLabel = '✅ Maintenir la dose actuelle';
    let recommandation = 'Taux résiduel dans la cible thérapeutique. Continuer le protocole en cours.';
    if (this.immunoC0 !== null) {
      if (this.immunoC0 < c0Min) {
        c0Status = 'bas';
        c0Icon = '⬇️';
        c0Label = 'Taux sous-thérapeutique';
        ajustement = 'augmenter';
        ajustementLabel = '⬆️ Augmenter la dose';
        recommandation = `C0 à ${this.immunoC0} ng/mL — Sous la cible (${c0Cible}). Augmenter la dose de 15–20%.`;
      } else if (this.immunoC0 > c0Max) {
        c0Status = 'eleve';
        c0Icon = '⬆️';
        c0Label = 'Taux supra-thérapeutique';
        ajustement = 'diminuer';
        ajustementLabel = '⬇️ Réduire la dose';
        recommandation = `C0 à ${this.immunoC0} ng/mL — Au-dessus de la cible (${c0Cible}). Réduire de 20–25%.`;
      }
    }
    const nefrotoxique = (this.immunoCreat ?? 0) > 1.5 && this.immunoC0 !== null && this.immunoC0 > c0Max;
    this.immunoResult = {
      doseCalculee: doseCalc,
      doseTotale,
      c0Cible,
      c0Status,
      c0Icon,
      c0Label,
      ajustement,
      ajustementLabel,
      recommandation,
      nefrotoxique,
    };
  }

  calcPcr(): void {
    if (!this.pcrProteines || !this.pcrCreatinine || this.pcrCreatinine <= 0) {
      this.pcrResult = null;
      return;
    }
    this.pcrResult = this.pcrProteines / this.pcrCreatinine;
    this.pcrProteinurie24h = this.pcrProteines * 1.5;
    const r = this.pcrResult;
    if (r < 20) {
      this.pcrLevel = 'normal';
      this.pcrLevelIcon = '✅';
      this.pcrLevelLabel = 'Normal';
      this.pcrInterpretation = 'Rapport PCR normal — fonction de filtration glomérulaire intacte.';
    } else if (r < 200) {
      this.pcrLevel = 'limite';
      this.pcrLevelIcon = '⚠️';
      this.pcrLevelLabel = 'Protéinurie limite';
      this.pcrInterpretation = 'Protéinurie modérée — surveillance rapprochée recommandée.';
    } else {
      this.pcrLevel = 'critique';
      this.pcrLevelIcon = '🚨';
      this.pcrLevelLabel = 'Seuil greffe dépassé';
      this.pcrInterpretation =
        'PCR > 200 mg/mmol — seuil critique post-transplantation atteint. Biopsie rénale à discuter.';
    }
    this.pcrBarPct = Math.min(95, Math.max(3, (r / 500) * 100));
  }

  calcHydrique(): void {
    if (!this.hydPoids) {
      this.hydResult = null;
      return;
    }
    const p = this.hydPoids;
    let besoinBase = 0;
    if (p <= 10) besoinBase = p * 100;
    else if (p <= 20) besoinBase = 1000 + (p - 10) * 50;
    else besoinBase = 1500 + (p - 20) * 20;
    let majFievre = 0;
    const fev = this.hydFievre ?? 37;
    if (fev > 37.5) majFievre = besoinBase * 0.1 * (fev - 37.5);
    const besoinAjuste = besoinBase + majFievre;
    const apports = this.hydApports ?? 0;
    const diurese = this.hydDiurese ?? 0;
    const bilan = apports - diurese;
    let bilanColor = 'normal';
    let bilanLabel = 'Équilibré';
    if (bilan < -300) {
      bilanColor = 'rouge';
      bilanLabel = 'Déficit hydrique';
    } else if (bilan > 500) {
      bilanColor = 'orange';
      bilanLabel = 'Surcharge hydrique';
    }
    const besoinAjusteVal = besoinAjuste;
    const diureseMin = besoinAjusteVal * 0.5;
    const diureseMax = besoinAjusteVal * 2.5;
    let diureseAlerte = false;
    let diureseNiveau = 'normal';
    let diureseIcon = '';
    let diureseAlerteTitre = '';
    let diureseAlerteTexte = '';
    if (this.hydDiurese !== null) {
      if (diurese < diureseMin) {
        diureseAlerte = true;
        diureseNiveau = 'critique';
        diureseIcon = '🚨';
        diureseAlerteTitre = 'Oligurie détectée';
        diureseAlerteTexte = `Diurèse à ${diurese} mL/24h — inférieure à 50% des besoins. Évaluation urgente.`;
      } else if (diurese > diureseMax) {
        diureseAlerte = true;
        diureseNiveau = 'orange';
        diureseIcon = '⬆️';
        diureseAlerteTitre = 'Polyurie détectée';
        diureseAlerteTexte = `Diurèse à ${diurese} mL/24h — supérieure à 250% des besoins.`;
      }
    }
    const diuresePct = this.hydDiurese ? Math.min(100, (diurese / besoinAjusteVal) * 100) : 0;
    this.hydResult = {
      besoinBase,
      majFievre,
      besoinAjuste: besoinAjusteVal,
      bilan,
      bilanColor,
      bilanLabel,
      diureseAlerte,
      diureseNiveau,
      diureseIcon,
      diureseAlerteTitre,
      diureseAlerteTexte,
      diuresePct,
    };
  }

  calcFragilite(): void {
    const vals = [this.fragiliteAge, this.fragiliteImc, this.fragiliteDfg];
    if (vals.filter((v) => v !== null).length < 2) {
      this.fragiliteResult = null;
      return;
    }
    let score = 0;
    const criteres: FragiliteCritere[] = [];
    const ageScore = (this.fragiliteAge ?? 10) < 6 ? 15 : (this.fragiliteAge ?? 10) < 10 ? 8 : 3;
    score += ageScore;
    criteres.push({
      icon: '🎂',
      nom: 'Âge',
      valeur: `${this.fragiliteAge ?? '?'} ans`,
      pts: ageScore,
      niveau: ageScore >= 15 ? 'rouge' : ageScore >= 8 ? 'orange' : 'vert',
    });
    const imc = this.fragiliteImc ?? 16;
    const imcScore = imc < 13 ? 20 : imc < 15 ? 12 : imc > 25 ? 10 : 0;
    score += imcScore;
    criteres.push({
      icon: '📐',
      nom: 'IMC',
      valeur: `${imc} kg/m²`,
      pts: imcScore,
      niveau: imcScore >= 20 ? 'rouge' : imcScore >= 12 ? 'orange' : 'vert',
    });
    const dfg = this.fragiliteDfg ?? 60;
    const dfgScore = dfg < 30 ? 25 : dfg < 45 ? 18 : dfg < 60 ? 10 : 0;
    score += dfgScore;
    criteres.push({
      icon: '🧮',
      nom: 'DFG estimé',
      valeur: `${dfg} mL/min`,
      pts: dfgScore,
      niveau: dfgScore >= 25 ? 'rouge' : dfgScore >= 18 ? 'orange' : 'vert',
    });
    const anc = this.fragiliteAnciennete ?? 12;
    const ancScore = anc < 6 ? 10 : anc < 12 ? 5 : 0;
    score += ancScore;
    criteres.push({
      icon: '📅',
      nom: 'Ancienneté greffon',
      valeur: `${anc} mois`,
      pts: ancScore,
      niveau: ancScore >= 10 ? 'orange' : ancScore > 0 ? 'jaune' : 'vert',
    });
    const rej = this.fragiliteRejets ?? 0;
    const rejScore = rej >= 3 ? 20 : rej >= 2 ? 14 : rej >= 1 ? 8 : 0;
    score += rejScore;
    criteres.push({
      icon: '🚨',
      nom: 'Épisodes de rejet',
      valeur: `${rej} rejet(s)`,
      pts: rejScore,
      niveau: rejScore >= 20 ? 'rouge' : rejScore >= 14 ? 'orange' : rejScore > 0 ? 'jaune' : 'vert',
    });
    const obsScore =
      this.fragiliteObservance === 'mauvaise' ? 20 : this.fragiliteObservance === 'partielle' ? 10 : 0;
    score += obsScore;
    criteres.push({
      icon: '💊',
      nom: 'Observance',
      valeur: this.fragiliteObservance,
      pts: obsScore,
      niveau: obsScore >= 20 ? 'rouge' : obsScore >= 10 ? 'orange' : 'vert',
    });
    score = Math.min(100, score);
    let niveau = '';
    let niveauLabel = '';
    let pronostic = '';
    let color = '';
    let recommandations: string[] = [];
    if (score >= 60) {
      niveau = 'critique';
      niveauLabel = '🚨 Fragilité SÉVÈRE';
      color = '#dc2626';
      pronostic = 'Risque très élevé de perte du greffon à 12 mois';
      recommandations = [
        'Suivi mensuel en consultation néphro-pédiatrique',
        'Bilan immunologique complet',
        'Programme éducatif renforcé',
        'Consultation nutrition pédiatrique',
      ];
    } else if (score >= 40) {
      niveau = 'eleve';
      niveauLabel = '⚠️ Fragilité MODÉRÉE À ÉLEVÉE';
      color = '#d97706';
      pronostic = 'Risque modéré — surveillance renforcée requise';
      recommandations = [
        'Consultation trimestrielle minimum',
        'Monitoring mensuel créatinine et PCR',
        "Soutien à l'observance",
      ];
    } else if (score >= 20) {
      niveau = 'modere';
      niveauLabel = '🟡 Fragilité LÉGÈRE';
      color = '#ca8a04';
      pronostic = 'Risque faible à modéré';
      recommandations = [
        'Contrôle biologique trimestriel',
        'Éducation patient/famille',
        'Suivi tensionnel',
      ];
    } else {
      niveau = 'faible';
      niveauLabel = '✅ Fragilité FAIBLE';
      color = '#16a34a';
      pronostic = 'Pronostic favorable à 12 mois';
      recommandations = [
        'Surveillance standard semestrielle',
        'Maintenir le protocole en cours',
        'Vaccinations à jour',
      ];
    }
    const filled = (score / 100) * (327 - 82);
    const dashArray = `${filled} ${327}`;
    this.fragiliteResult = { score, niveau, niveauLabel, pronostic, color, dashArray, criteres, recommandations };
  }

  loadCounts(): void {
    this.http.get<unknown[]>(`${this.BASE_VITAL}/retrieveParametresVitaux`).subscribe({
      next: (d) => (this.totalParametres = d.length),
      error: () => {},
    });
    this.http.get<unknown[]>(`${this.BASE_CONSTANTE}/retrieveConstantesVitales`).subscribe({
      next: (d) => (this.totalConstantes = d.length),
      error: () => {},
    });
    this.http.get<unknown[]>(`${this.BASE_INDICATEUR}/retrieveIndicateursVital`).subscribe({
      next: (d) => (this.totalIndicateurs = d.length),
      error: () => {},
    });
  }

  /** Charge paramètres + constantes + indicateurs en une fois (KPI + vues). */
  loadAllVitaux(): void {
    this.loading = true;
    forkJoin({
      p: this.http
        .get<ParametreVital[]>(`${this.BASE_VITAL}/retrieveParametresVitaux`)
        .pipe(catchError(() => of<ParametreVital[]>([]))),
      c: this.http
        .get<ConstanteVitale[]>(`${this.BASE_CONSTANTE}/retrieveConstantesVitales`)
        .pipe(catchError(() => of<ConstanteVitale[]>([]))),
      i: this.http
        .get<IndicateurVital[]>(`${this.BASE_INDICATEUR}/retrieveIndicateursVital`)
        .pipe(catchError(() => of<IndicateurVital[]>([]))),
    })
      .pipe(
        timeout(25000),
        catchError((err: unknown) => {
          const name =
            err && typeof err === 'object' && 'name' in err
              ? String((err as { name: string }).name)
              : '';
          if (name === 'TimeoutError') {
            this.showToast(
              'Délai dépassé : démarrez le service vitaux (port 8082) et utilisez ng serve avec le proxy.',
              'error',
            );
          } else {
            this.showToast('Impossible de charger les données vitales.', 'error');
          }
          return of({
            p: [] as ParametreVital[],
            c: [] as ConstanteVitale[],
            i: [] as IndicateurVital[],
          });
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: ({ p, c, i }) => {
          this.parametresVitaux = Array.isArray(p) ? p : [];
          this.constantesVitales = Array.isArray(c) ? c : [];
          this.indicateursVitaux = Array.isArray(i) ? i : [];
          this.totalParametres = this.parametresVitaux.length;
          this.totalConstantes = this.constantesVitales.length;
          this.totalIndicateurs = this.indicateursVitaux.length;
          try {
            this.filterItems();
          } catch (e) {
            console.error(e);
            this.showToast('Erreur lors du traitement des données.', 'error');
          }
        },
      });
  }

  setActiveView(v: VitalActiveView): void {
    this.activeView = v;
    this.currentPage = 1;
    this.filterItems();
  }

  loadParametresVitaux(): void {
    this.setActiveView('parametres');
  }

  loadConstantesVitales(): void {
    this.setActiveView('constantes');
  }

  loadIndicateursVitaux(): void {
    this.setActiveView('indicateurs');
  }

  inferCategoryFromNom(nom: string): { label: string; pill: VitalTypePill } {
    const n = nom.toLowerCase();
    if (/tension|pression|cardiaque|fréquence|rythme|pouls|artérielle|bpm|mmhg\s*syst/.test(n)) {
      return { label: 'Cardiovasculaire', pill: 'cardio' };
    }
    if (/créatin|urée|dfg|egfr|rein|protéin|urine|acide\s*urique|kali|natr/.test(n)) {
      return { label: 'Rénal', pill: 'renal' };
    }
    if (/température|saturation|o2|spirom|respiration/.test(n)) {
      return { label: 'Respiratoire', pill: 'resp' };
    }
    if (/glycémie|glucose|cholest|hba1c|lipid/.test(n)) {
      return { label: 'Métabolique', pill: 'metab' };
    }
    return { label: 'Clinique', pill: 'autre' };
  }

  private formatEtatLabel(etat: string): string {
    const e = String(etat ?? '');
    switch (e.toUpperCase()) {
      case 'NORMAL':
        return 'Normal';
      case 'ELEVE':
        return 'Élevé';
      case 'BAS':
        return 'Bas';
      case 'CRITIQUE':
        return 'Critique';
      default:
        return e || '—';
    }
  }

  private etatToStatutPill(etat: string): VitalStatutPill {
    switch (String(etat ?? '').toUpperCase()) {
      case 'NORMAL':
        return 'ok';
      case 'ELEVE':
      case 'BAS':
        return 'warn';
      case 'CRITIQUE':
        return 'bad';
      default:
        return 'neutral';
    }
  }

  private mapParametreToRow(p: ParametreVital): UnifiedVitalRow {
    const cat = this.inferCategoryFromNom(p.nomParametre || '');
    return {
      kind: 'parametre',
      id: p.idParametreVital,
      nom: p.nomParametre || '—',
      unite: p.unite || '—',
      plage: `${p.referenceMin} – ${p.referenceMax}`,
      typeLabel: cat.label,
      typePill: cat.pill,
      statutLabel: this.formatEtatLabel(p.etat),
      statutPill: this.etatToStatutPill(p.etat),
      outOfRange: this.isOutOfRange(p),
    };
  }

  private mapConstanteToRow(c: ConstanteVitale): UnifiedVitalRow {
    const cat = c.indicateurVital?.nomIndicateur
      ? { label: c.indicateurVital.nomIndicateur, pill: 'renal' as VitalTypePill }
      : this.inferCategoryFromNom(c.nomParametre || '');
    return {
      kind: 'constante',
      id: c.idConstanteVitale,
      nom: c.nomParametre || '—',
      unite: c.unite || '—',
      plage: `${c.valeurMinNormale ?? '—'} – ${c.valeurMaxNormale ?? '—'}`,
      typeLabel: cat.label,
      typePill: cat.pill,
      statutLabel: 'Actif',
      statutPill: 'ok',
    };
  }

  private mapIndicateurToRow(i: IndicateurVital): UnifiedVitalRow {
    return {
      kind: 'indicateur',
      id: i.idIndicateurVital,
      nom: i.nomIndicateur || '—',
      unite: i.unite || '—',
      plage: '—',
      typeLabel: 'Biomarqueur',
      typePill: 'bio',
      statutLabel: i.actif ? 'Actif' : 'Inactif',
      statutPill: i.actif ? 'ok' : 'neutral',
    };
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filterItems();
  }
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyPagination();
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const rows: UnifiedVitalRow[] = [];

    const pushParametres = () => {
      for (const p of this.parametresVitaux) {
        if (
          term &&
          !p.nomParametre?.toLowerCase().includes(term) &&
          !String(p.etat ?? '').toLowerCase().includes(term)
        ) {
          continue;
        }
        rows.push(this.mapParametreToRow(p));
      }
    };
    const pushConstantes = () => {
      for (const c of this.constantesVitales) {
        if (term && !c.nomParametre?.toLowerCase().includes(term)) continue;
        rows.push(this.mapConstanteToRow(c));
      }
    };
    const pushIndicateurs = () => {
      for (const i of this.indicateursVitaux) {
        if (
          term &&
          !i.nomIndicateur?.toLowerCase().includes(term) &&
          !i.description?.toLowerCase().includes(term)
        ) {
          continue;
        }
        rows.push(this.mapIndicateurToRow(i));
      }
    };

    if (this.activeView === 'tous') {
      pushParametres();
      pushConstantes();
      pushIndicateurs();
    } else if (this.activeView === 'parametres') {
      pushParametres();
    } else if (this.activeView === 'constantes') {
      pushConstantes();
    } else {
      pushIndicateurs();
    }

    rows.sort((a, b) =>
      this.sortOrder === 'az'
        ? a.nom.localeCompare(b.nom, 'fr')
        : b.id - a.id,
    );
    this.filteredUnified = rows;
    this.applyPagination();
  }

  applyPagination(): void {
    const total = this.filteredUnified.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    this.pagesArray = [];
    for (let i = start; i <= end; i++) this.pagesArray.push(i);
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize;
    this.pagedUnified = this.filteredUnified.slice(from, to);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.applyPagination();
  }

  getEtatClass(e: string): string {
    switch (e?.toUpperCase()) {
      case 'NORMAL':
        return 'badge-normal';
      case 'ELEVE':
        return 'badge-eleve';
      case 'BAS':
        return 'badge-bas';
      case 'CRITIQUE':
        return 'badge-critique';
      default:
        return 'badge-normal';
    }
  }
  getEtatIcon(e: string): string {
    switch (e?.toUpperCase()) {
      case 'NORMAL':
        return '✅';
      case 'ELEVE':
        return '⬆️';
      case 'BAS':
        return '⬇️';
      case 'CRITIQUE':
        return '🚨';
      default:
        return '❓';
    }
  }
  getIconClassForParametre(p: ParametreVital): string {
    const e = p.etat?.toUpperCase();
    if (e === 'NORMAL') return 'badge-normal';
    if (e === 'ELEVE') return 'badge-eleve';
    if (e === 'BAS') return 'badge-bas';
    if (e === 'CRITIQUE') return 'badge-critique';
    return 'badge-normal';
  }

  isOutOfRange(p: ParametreVital): boolean {
    return (
      p.valeurMesuree != null &&
      (p.valeurMesuree < p.referenceMin || p.valeurMesuree > p.referenceMax)
    );
  }

  viewRow(row: UnifiedVitalRow): void {
    this.previewRow = row;
    document.body.style.overflow = 'hidden';
  }

  closeRowPreview(): void {
    this.previewRow = null;
    document.body.style.overflow = '';
  }

  editRow(row: UnifiedVitalRow): void {
    this.closeRowPreview();
    if (row.kind === 'parametre') this.openEditModal(row.id);
    else if (row.kind === 'constante') this.openEditConstanteModal(row.id);
    else this.openEditIndicateurModal(row.id);
  }

  deleteRow(row: UnifiedVitalRow): void {
    if (row.kind === 'parametre') this.deleteParametre(row.id);
    else if (row.kind === 'constante') this.deleteConstante(row.id);
    else this.deleteIndicateur(row.id);
  }

  deleteParametre(id: number): void {
    this.itemToDelete = id;
    this.deleteTarget = 'parametre';
    this.showDeleteModal = true;
  }
  deleteConstante(id: number): void {
    this.itemToDelete = id;
    this.deleteTarget = 'constante';
    this.showDeleteModal = true;
  }
  deleteIndicateur(id: number): void {
    this.itemToDelete = id;
    this.deleteTarget = 'indicateur';
    this.showDeleteModal = true;
  }
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  confirmDelete(): void {
    if (this.itemToDelete === null) return;
    const id = this.itemToDelete;
    const url =
      this.deleteTarget === 'parametre'
        ? `${this.BASE_VITAL}/removeParametreVital/${id}`
        : this.deleteTarget === 'constante'
          ? `${this.BASE_CONSTANTE}/removeConstanteVitale/${id}`
          : `${this.BASE_INDICATEUR}/removeIndicateurVital/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        if (this.deleteTarget === 'parametre') {
          this.parametresVitaux = this.parametresVitaux.filter((p) => p.idParametreVital !== id);
          this.totalParametres = this.parametresVitaux.length;
        } else if (this.deleteTarget === 'constante') {
          this.constantesVitales = this.constantesVitales.filter((c) => c.idConstanteVitale !== id);
          this.totalConstantes = this.constantesVitales.length;
        } else {
          this.indicateursVitaux = this.indicateursVitaux.filter((i) => i.idIndicateurVital !== id);
          this.totalIndicateurs = this.indicateursVitaux.length;
        }
        this.filterItems();
        this.showToast(`Élément #${id} supprimé`, 'success');
        this.cancelDelete();
      },
      error: () => {
        this.showToast('Erreur suppression', 'error');
        this.cancelDelete();
      },
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg = msg;
    if (type === 'success') {
      this.toastSuccess = true;
      setTimeout(() => (this.toastSuccess = false), 3000);
    } else {
      this.toastError = true;
      setTimeout(() => (this.toastError = false), 3000);
    }
  }

  openEditConstanteModal(id: number): void {
    this.editConstanteId = id;
    this.showEditConstanteModal = true;
    this.editConstanteIsFetching = true;
    document.body.style.overflow = 'hidden';
    this.loadIndicateursForModal();

    this.http.get<Record<string, unknown>>(`${this.BASE_CONSTANTE}/retrieveConstanteVitale/${id}`).subscribe({
      next: (data) => {
        const iv = data['indicateurVital'] as { idIndicateurVital: number } | undefined;
        this.editConstante = {
          nomParametre: (data['nomParametre'] as string) || '',
          unite: (data['unite'] as string) || '',
          valeurMinNormale: (data['valeurMinNormale'] as number | null) ?? null,
          valeurMaxNormale: (data['valeurMaxNormale'] as number | null) ?? null,
          poidsMin: (data['poidsMin'] as number | null) ?? null,
          poidsMax: (data['poidsMax'] as number | null) ?? null,
          tailleMin: (data['tailleMin'] as number | null) ?? null,
          tailleMax: (data['tailleMax'] as number | null) ?? null,
          selectedIndicateurId: iv?.idIndicateurVital ?? null,
          indicateurVital: iv ? { idIndicateurVital: iv.idIndicateurVital } : null,
        };
        this._originalEditConstante = { ...this.editConstante };
        this.editConstanteIsFetching = false;
        this.calcEditConstanteProgress();
      },
      error: () => {
        const local = this.constantesVitales.find((c) => c.idConstanteVitale === id);
        if (local) {
          this.editConstante = {
            nomParametre: local.nomParametre || '',
            unite: local.unite || '',
            valeurMinNormale: local.valeurMinNormale ?? null,
            valeurMaxNormale: local.valeurMaxNormale ?? null,
            poidsMin: (local as ConstanteVitale & { poidsMin?: number }).poidsMin ?? null,
            poidsMax: (local as ConstanteVitale & { poidsMax?: number }).poidsMax ?? null,
            tailleMin: (local as ConstanteVitale & { tailleMin?: number }).tailleMin ?? null,
            tailleMax: (local as ConstanteVitale & { tailleMax?: number }).tailleMax ?? null,
            selectedIndicateurId: local.indicateurVital?.idIndicateurVital ?? null,
            indicateurVital: local.indicateurVital
              ? { idIndicateurVital: local.indicateurVital.idIndicateurVital }
              : null,
          };
          this._originalEditConstante = { ...this.editConstante };
        }
        this.editConstanteIsFetching = false;
        this.calcEditConstanteProgress();
      },
    });
  }

  private loadIndicateursForModal(): void {
    if (this.indicateursList.length > 0) return;
    this.editConstanteLoadingIndicateurs = true;
    this.http.get<IndicateurVital[]>(`${this.BASE_INDICATEUR}/retrieveIndicateursVital`).subscribe({
      next: (data) => {
        this.indicateursList = data;
        this.editConstanteLoadingIndicateurs = false;
      },
      error: () => {
        this.editConstanteLoadingIndicateurs = false;
      },
    });
  }

  closeEditConstanteModal(): void {
    this.showEditConstanteModal = false;
    this.editConstanteId = null;
    document.body.style.overflow = '';
  }

  calcEditConstanteProgress(): void {
    let filled = 0;
    if ((this.editConstante.nomParametre?.trim().length ?? 0) >= 2) filled++;
    if (this.editConstante.unite?.trim()) filled++;
    if (this.editConstante.valeurMinNormale !== null) filled++;
    if (this.editConstante.valeurMaxNormale !== null) filled++;
    this.editConstanteFormProgress = Math.round((filled / 4) * 100);
  }

  resetEditConstanteForm(): void {
    this.editConstante = { ...this._originalEditConstante };
    this.calcEditConstanteProgress();
  }

  onEditConstanteIndicateurChange(): void {
    const ind = this.getEditSelectedIndicateur();
    if (ind) {
      this.editConstante.nomParametre = ind.nomIndicateur;
      this.editConstante.unite = ind.unite;
    }
    this.editConstante.indicateurVital = this.editConstante.selectedIndicateurId
      ? { idIndicateurVital: this.editConstante.selectedIndicateurId }
      : null;
    this.calcEditConstanteProgress();
  }

  getEditSelectedIndicateur(): IndicateurVital | undefined {
    return this.indicateursList.find((i) => i.idIndicateurVital === this.editConstante.selectedIndicateurId);
  }

  /**
   * Normalise les champs numériques (évite chaîne vide → JSON invalide / 400 côté Spring).
   * Utilisé par les PUT constante / paramètre.
   */
  private toFloatOrNull(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  saveEditConstante(): void {
    if (!this.editConstanteId) return;
    this.editConstanteIsLoading = true;

    const payload = {
      idConstanteVitale: this.editConstanteId,
      nomParametre: (this.editConstante.nomParametre ?? '').trim(),
      unite: (this.editConstante.unite ?? '').trim(),
      valeurMinNormale: this.toFloatOrNull(this.editConstante.valeurMinNormale),
      valeurMaxNormale: this.toFloatOrNull(this.editConstante.valeurMaxNormale),
      poidsMin: this.toFloatOrNull(this.editConstante.poidsMin),
      poidsMax: this.toFloatOrNull(this.editConstante.poidsMax),
      tailleMin: this.toFloatOrNull(this.editConstante.tailleMin),
      tailleMax: this.toFloatOrNull(this.editConstante.tailleMax),
      idIndicateurVital: this.editConstante.selectedIndicateurId ?? null,
    };

    this.http.put(`${this.BASE_CONSTANTE}/updateConstanteVitale/${this.editConstanteId}`, payload).subscribe({
      next: () => {
        this.editConstanteIsLoading = false;
        this.closeEditConstanteModal();
        this.showToast('Constante mise à jour avec succès ✅', 'success');
        this.loadAllVitaux();
      },
      error: (err) => {
        console.error(err);
        this.editConstanteIsLoading = false;
        this.showToast('Erreur lors de la mise à jour ❌', 'error');
      },
    });
  }

  openEditIndicateurModal(id: number): void {
    this.editIndicateurId = id;
    this.showEditIndicateurModal = true;
    this.editIndicateurIsFetching = true;
    document.body.style.overflow = 'hidden';

    this.http.get<Record<string, unknown>>(`${this.BASE_INDICATEUR}/retrieveIndicateurVital/${id}`).subscribe({
      next: (data) => {
        this.editIndicateur = {
          nomIndicateur: (data['nomIndicateur'] as string) || '',
          unite: (data['unite'] as string) || '',
          description: (data['description'] as string) || '',
          actif: (data['actif'] as boolean) ?? true,
        };
        this._originalEditIndicateur = { ...this.editIndicateur };
        this.editIndicateurIsFetching = false;
        this.calcEditIndicateurProgress();
      },
      error: () => {
        const local = this.indicateursVitaux.find((i) => i.idIndicateurVital === id);
        if (local) {
          this.editIndicateur = {
            nomIndicateur: local.nomIndicateur || '',
            unite: local.unite || '',
            description: local.description || '',
            actif: local.actif ?? true,
          };
          this._originalEditIndicateur = { ...this.editIndicateur };
        }
        this.editIndicateurIsFetching = false;
        this.calcEditIndicateurProgress();
      },
    });
  }

  closeEditIndicateurModal(): void {
    this.showEditIndicateurModal = false;
    this.editIndicateurId = null;
    document.body.style.overflow = '';
  }

  calcEditIndicateurProgress(): void {
    let filled = 0;
    if ((this.editIndicateur.nomIndicateur?.length ?? 0) >= 2) filled++;
    if (this.editIndicateur.unite?.trim()) filled++;
    if (this.editIndicateur.actif !== null) filled++;
    this.editIndicateurFormProgress = Math.round((filled / 3) * 100);
  }

  resetEditIndicateurForm(): void {
    this.editIndicateur = { ...this._originalEditIndicateur };
    this.calcEditIndicateurProgress();
  }

  saveEditIndicateur(): void {
    if (!this.editIndicateurId) return;
    this.editIndicateurIsLoading = true;
    const dto = {
      nomIndicateur: (this.editIndicateur.nomIndicateur ?? '').trim(),
      unite: (this.editIndicateur.unite ?? '').trim(),
      description: (this.editIndicateur.description ?? '').trim(),
      actif: this.editIndicateur.actif !== false,
    };

    this.http.put(`${this.BASE_INDICATEUR}/updateIndicateurVital/${this.editIndicateurId}`, dto).subscribe({
      next: () => {
        this.editIndicateurIsLoading = false;
        this.closeEditIndicateurModal();
        this.showToast('Indicateur mis à jour avec succès ✅', 'success');
        this.loadAllVitaux();
      },
      error: (err) => {
        console.error(err);
        this.editIndicateurIsLoading = false;
        const msg = err?.error?.message ?? err?.message ?? 'Erreur lors de la mise à jour';
        this.showToast(`${msg} ❌`, 'error');
      },
    });
  }

  logout(): void {
    this.router.navigate(['/home']);
  }
}
