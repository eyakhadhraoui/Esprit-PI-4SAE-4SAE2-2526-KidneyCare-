import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import jsPDF from 'jspdf';
import {
  NutritionService,
  Aliment,
  BesoinNutritionnel,
  RestrictionAlimentaire,
  AlerteNutrition,
  CATEGORIE_LABELS,
  TYPE_ALERTE_LABELS,
  RAISON_RESTRICTION_LABELS,
  MenuJournalierDTO,
  ResultatLaboDTO,
  DossierMedicalDTO
} from '../services/nutrition.service';
import { AlerteNutritionService, AlerteNutritionDTO } from '../services/alerte-nutrition.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-nutrition-patient',
  standalone: false,
  templateUrl: './nutrition-patient.html',
  styleUrls: ['./nutrition-patient.css']
})
export class NutritionPatientComponent implements OnInit {

  patientId : number | null = null;
  loading   = true;

  // Données principales
  besoin          : BesoinNutritionnel | null = null;
  restrictions    : RestrictionAlimentaire[]  = [];
  alertesNonLues  : AlerteNutrition[]         = [];
  toutesAlertes   : AlerteNutritionDTO[]      = [];
  aliments        : Aliment[]                 = [];
  alimentsFiltres : Aliment[]                 = [];

  // Labels
  categorieLabels = CATEGORIE_LABELS;
  alerteLabels    = TYPE_ALERTE_LABELS;
  raisonLabels    = RAISON_RESTRICTION_LABELS;
  categories      = Object.keys(CATEGORIE_LABELS);

  // UI
  activeTab        = 'regime';
  searchAliment    = '';
  selectedCat      = '';
  alerteFilter     = 'all';   // 'all' | 'unread' | 'read'
  loadingAlertes   = false;
  get completedMenusCount(): number {
    return this.joursList.filter(j => this.menuChoisi[j] !== undefined).length;
  }


  // Suggestion menus semaine
  showMenus          = false;
  menusLoading       = false;
  menusError         = '';
  semaine            : { [jour: string]: MenuJournalierDTO[] } = {};
  joursList          : string[] = [];
  menuChoisi         : { [jour: string]: number } = {};   // index 0-2 choisi par jour
  activeJour         = '';
  menuCardVisible    = false;   // pour déclencher l'animation d'entrée
  /** Aliments cochés « à la maison » (localStorage) — sert à pré-sélectionner les menus. */
  maisonAlimentIds   = new Set<number>();

  readonly repasIcons: Record<string, string> = {
    PETIT_DEJEUNER : '☀️',
    DEJEUNER       : '🍽️',
    DINER          : '🌙',
    COLLATION      : '🍎'
  };
  readonly repasLabels: Record<string, string> = {
    PETIT_DEJEUNER : 'Petit-déjeuner',
    DEJEUNER       : 'Déjeuner',
    DINER          : 'Dîner',
    COLLATION      : 'Collation'
  };

  // Analyse plat par photo (LogMeal API)
  showMealAnalysis      = false;
  mealPhotoPreview      = '';
  mealAnalysisLoading   = false;
  mealAnalysisError     = '';
  mealAnalysisResult  : {
    foods       : { name: string; confidence: number }[];
    ingredients : string[];
    kcal        : number;
    proteines   : number;
    glucides    : number;
    lipides     : number;
    verdict     : 'ok' | 'warn' | 'danger';
    warnings    : string[];
  } | null = null;


  // Valeurs de référence adulte standard (pour les barres indicatives)
  readonly standard = {
    potassium : 4700,
    sodium    : 2300,
    phosphore : 700,
    proteines : 56,
    sucre     : 50,
    calories  : 2000
  };

  constructor(
    private nutritionService : NutritionService,
    private alerteService    : AlerteNutritionService,
    private auth             : AuthService,
    private cdr              : ChangeDetectorRef,
    private http             : HttpClient
  ) {}

  ngOnInit(): void { this.resolvePatientId(); }

  // ── Résolution patientId ──────────────────────────────────────────────────
  private resolvePatientId(): void {
    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = Number(stored);
      if (!isNaN(n) && n > 0) { this.patientId = n; this.loadData(); return; }
    }
    try {
      const token = (this.auth as any).getToken?.() || localStorage.getItem('access_token') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const pid = payload?.idPatient ?? payload?.patientId ?? payload?.patient_id;
        if (pid != null && !isNaN(Number(pid)) && Number(pid) > 0) {
          this.patientId = Number(pid);
          localStorage.setItem('patientId', String(this.patientId));
          this.loadData(); return;
        }
        const username = payload?.preferred_username || payload?.sub;
        if (username) {
          this.nutritionService.getAllPatients().pipe(catchError(() => of([]))).subscribe(patients => {
            const found = patients.find(p =>
              p.firstName?.toLowerCase() === username.toLowerCase() ||
              `${p.firstName} ${p.lastName}`.toLowerCase().includes(username.toLowerCase())
            );
            if (found) {
              this.patientId = found.idPatient;
              localStorage.setItem('patientId', String(this.patientId));
            }
            this.loadData();
          });
          return;
        }
      }
    } catch {}
    this.loading = false;
  }

  // ── Chargement des données ────────────────────────────────────────────────
  loadData(): void {
    if (!this.patientId) { this.loading = false; return; }
    this.refreshMaisonCache();

    this.nutritionService.getActiveBesoinForPatient(this.patientId)
      .pipe(catchError(() => of(null))).subscribe(d => {
        this.besoin = d; this.cdr.detectChanges();
      });

    this.nutritionService.getActiveRestrictionsForPatient(this.patientId)
      .pipe(catchError(() => of([]))).subscribe(d => {
        this.restrictions = d; this.filterAliments();
        this.reappliquerSelectionMenusSiSemaineChargee();
        this.cdr.detectChanges();
      });

    this.nutritionService.getUnreadAlertesForPatient(this.patientId)
      .pipe(catchError(() => of([]))).subscribe(d => {
        this.alertesNonLues = d; this.loading = false; this.cdr.detectChanges();
      });

    this.nutritionService.getAllAliments()
      .pipe(catchError(() => of([]))).subscribe(d => {
        this.aliments = d; this.filterAliments();
        this.reappliquerSelectionMenusSiSemaineChargee();
        this.cdr.detectChanges();
      });

    this.loadAllAlertes();
  }

  loadAllAlertes(): void {
    if (!this.patientId) return;
    this.loadingAlertes = true;
    this.alerteService.getAlertesForPatient(this.patientId)
      .pipe(catchError(() => of([]))).subscribe(d => {
        this.toutesAlertes = d; this.loadingAlertes = false; this.cdr.detectChanges();
      });
  }

  // ── Filtrage aliments ─────────────────────────────────────────────────────
  filterAliments(): void {
    const restrictedIds = this.restrictions.map(r => r.alimentId);
    this.alimentsFiltres = this.aliments.filter(a =>
      !restrictedIds.includes(a.id!) &&
      a.nom.toLowerCase().includes(this.searchAliment.toLowerCase()) &&
      (this.selectedCat ? a.categorie === this.selectedCat : true)
    );
  }

  // ── Alertes filtrées selon filtre actif ───────────────────────────────────
  get alertesFiltrees(): AlerteNutritionDTO[] {
    if (this.alerteFilter === 'unread') return this.toutesAlertes.filter(a => !a.lue);
    if (this.alerteFilter === 'read')   return this.toutesAlertes.filter(a => a.lue);
    return this.toutesAlertes;
  }

  get unreadCount(): number {
    return this.toutesAlertes.filter(a => !a.lue).length;
  }

  // ── Actions alertes ───────────────────────────────────────────────────────
  markAlertRead(id: number): void {
    this.alerteService.markAsRead(id).pipe(catchError(() => of(void 0))).subscribe(() => {
      const a = this.toutesAlertes.find(x => x.id === id);
      if (a) a.lue = true;
      this.alertesNonLues = this.alertesNonLues.filter(x => x.id !== id);
      this.cdr.detectChanges();
    });
  }

  markAllAlertsRead(): void {
    if (!this.patientId) return;
    this.alerteService.markAllAsReadForPatient(this.patientId)
      .pipe(catchError(() => of(void 0))).subscribe(() => {
        this.toutesAlertes.forEach(a => a.lue = true);
        this.alertesNonLues = [];
        this.cdr.detectChanges();
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getAlimentNom(id: number): string {
    return this.aliments.find(a => a.id === id)?.nom ?? `Aliment #${id}`;
  }

  getAliment(id: number): Aliment | undefined {
    return this.aliments.find(a => a.id === id);
  }

  /** Pourcentage de la limite du patient par rapport à la valeur adulte standard */
  getLimitPercent(value: number | undefined, standard: number): number {
    if (!value || standard === 0) return 0;
    return Math.min(100, Math.round((value / standard) * 100));
  }

  /** Couleur barre : vert si limite proche standard, orange si réduit, rouge si très réduit */
  getLimitBarColor(value: number | undefined, standard: number): string {
    const pct = this.getLimitPercent(value, standard);
    if (pct >= 75) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      INTERACTION_MEDICAMENT : '💊',
      HYPERKALIEMIE          : '🧂',
      HYPONATREMIE           : '⚗️',
      'DÉNUTRITION'          : '⚠️',
      AUTRE                  : '🔔'
    };
    return map[type] || '🔔';
  }

  getTypeColor(type: string): string {
    if (type === 'INTERACTION_MEDICAMENT') return '#dc2626';
    if (type === 'HYPERKALIEMIE')          return '#d97706';
    if (type === 'HYPONATREMIE')           return '#2563eb';
    return '#6b7280';
  }

  getTypeBg(type: string): string {
    if (type === 'INTERACTION_MEDICAMENT') return '#fef2f2';
    if (type === 'HYPERKALIEMIE')          return '#fefce8';
    if (type === 'HYPONATREMIE')           return '#eff6ff';
    return '#f9fafb';
  }

  getCatIcon(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '🍎', LEGUME: '🥦', VIANDE: '🥩',
      PRODUIT_LAITIER: '🥛', CEREALE: '🌾', AUTRE: '🍽️'
    };
    return map[cat] || '🍽️';
  }

  getCatBg(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '#fef2f2', LEGUME: '#f0fdf4', VIANDE: '#fff7ed',
      PRODUIT_LAITIER: '#eff6ff', CEREALE: '#fefce8', AUTRE: '#f9fafb'
    };
    return map[cat] || '#f9fafb';
  }

  getCatColor(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '#ef4444', LEGUME: '#22c55e', VIANDE: '#f97316',
      PRODUIT_LAITIER: '#3b82f6', CEREALE: '#f59e0b', AUTRE: '#6b7280'
    };
    return map[cat] || '#6b7280';
  }

  getRaisonBg(raison: string): string {
    if (raison?.includes('MEDICAMENT')) return '#fef2f2';
    if (raison?.includes('KALI') || raison?.includes('SODIUM') || raison?.includes('PHOSPHORE')) return '#fefce8';
    return '#f0fdf4';
  }

  getRaisonColor(raison: string): string {
    if (raison?.includes('MEDICAMENT')) return '#dc2626';
    if (raison?.includes('KALI') || raison?.includes('SODIUM') || raison?.includes('PHOSPHORE')) return '#d97706';
    return '#16a34a';
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  }

  formatDateTime(d: string): string {
    return d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  }

  setTab(tab: string): void { this.activeTab = tab; }


  // ── Lab-Nutrition (OpenFeign) ─────────────────────────────────────────────
  showLabPanel       = false;
  labDossierId       : number | null = null;
  labDossierInput    = '';
  labResults         : ResultatLaboDTO[] = [];
  labLoading         = false;
  labError           = '';
  labAdaptLoading    = false;
  labAdaptSuccess    = false;
  labAdaptError      = '';

  // Dossiers du patient (chargés automatiquement)
  mesDossiers        : DossierMedicalDTO[] = [];
  dossiersLoading    = false;

  openLabPanel(): void {
    this.showLabPanel    = true;
    this.labResults      = [];
    this.labError        = '';
    this.labAdaptSuccess = false;
    this.labAdaptError   = '';
    this.loadMesDossiers();
  }

  closeLabPanel(): void { this.showLabPanel = false; }

  /** Charge automatiquement les dossiers du patient connecté depuis NEPHRO. */
  loadMesDossiers(): void {
    this.dossiersLoading = true;
    this.labError        = '';

    // Essai 1 : /api/dossiers-medicaux/mes-dossiers (JWT → username → dossiers)
    this.nutritionService.getMesDossiers()
      .pipe(catchError(() => of([])))
      .subscribe(dossiers => {
        if (dossiers.length > 0) {
          this.mesDossiers     = dossiers;
          this.dossiersLoading = false;
          if (dossiers.length === 1) {
            this.selectDossier(dossiers[0]);
          }
          this.cdr.detectChanges();
          return;
        }

        // Essai 2 : fallback par idPatient numérique (si patientId est un Long en base)
        if (this.patientId) {
          this.nutritionService.getDossiersByPatient(this.patientId)
            .pipe(catchError(() => of([])))
            .subscribe((dossiers2: DossierMedicalDTO[]) => {
              this.mesDossiers     = dossiers2;
              this.dossiersLoading = false;
              if (dossiers2.length === 1) {
                this.selectDossier(dossiers2[0]);
              } else if (dossiers2.length === 0) {
                this.labError = 'Aucun dossier médical trouvé pour votre compte.';
              }
              this.cdr.detectChanges();
            });
        } else {
          this.dossiersLoading = false;
          this.labError = 'Aucun dossier médical trouvé pour votre compte.';
          this.cdr.detectChanges();
        }
      });
  }

  /** Sélectionne un dossier et charge ses résultats de labo. */
  selectDossier(dossier: DossierMedicalDTO): void {
    if (!dossier.idDossierMedical) return;
    this.labDossierId    = dossier.idDossierMedical;
    this.labLoading      = true;
    this.labError        = '';
    this.labResults      = [];
    this.labAdaptSuccess = false;
    this.nutritionService.getLabResultsForDossier(dossier.idDossierMedical)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.labResults = data;
        this.labLoading = false;
        if (!data.length) this.labError = 'Aucun résultat de laboratoire trouvé pour ce dossier.';
        this.cdr.detectChanges();
      });
  }

  adaptNutritionFromLab(): void {
    if (!this.patientId || !this.labDossierId || !this.labResults.length) return;
    if (!this.besoin) {
      this.labAdaptError = 'Adaptation impossible — aucun besoin nutritionnel actif trouvé pour ce patient.';
      return;
    }

    this.labAdaptLoading = true;
    this.labAdaptSuccess = false;
    this.labAdaptError   = '';

    // Appliquer les règles métier directement côté Angular sur le besoin existant
    const updated = { ...this.besoin };
    const raisons: string[] = [];

    for (const r of this.labResults) {
      const code  = (r.codeTest  || '').toUpperCase();
      const nom   = (r.nomTest   || '').toUpperCase();
      const interp = (r.interpretation || '').toUpperCase();
      const val   = r.valeurNumerique ?? 0;
      const unite = r.unite || '';

      const isCreatinine = code.includes('CREAT') || nom.includes('CRÉATININE') || nom.includes('CREATININE');
      const isPotassium  = code === 'K' || code.includes('KALI') || nom.includes('POTASSIUM');
      const isPhosphore  = code.includes('PHOS') || nom.includes('PHOSPHORE');

      if (isCreatinine && (interp.includes('ELEVE') || interp.includes('CRITIQUE'))) {
        updated.proteinesMaxG = Math.max(20, updated.proteinesMaxG * 0.80);
        raisons.push(`Créatinine ${interp} (${val} ${unite}) → protéines −20%`);
      }
      if (isPotassium && (interp.includes('ELEVE') || interp.includes('CRITIQUE_HAUT'))) {
        updated.potassiumMaxMg = Math.max(500, updated.potassiumMaxMg - 200);
        raisons.push(`Potassium élevé (${val} ${unite}) → potassium max −200 mg`);
      }
      if (isPotassium && interp.includes('BAS')) {
        updated.potassiumMaxMg = updated.potassiumMaxMg + 200;
        raisons.push(`Potassium bas (${val} ${unite}) → potassium max +200 mg`);
      }
      if (isPhosphore && (interp.includes('ELEVE') || interp.includes('CRITIQUE'))) {
        updated.phosphoreMaxMg = Math.max(300, updated.phosphoreMaxMg - 100);
        raisons.push(`Phosphore élevé (${val} ${unite}) → phosphore max −100 mg`);
      }
    }

    if (raisons.length === 0) {
      this.labAdaptLoading = false;
      this.labAdaptError   = 'Aucune valeur anormale détectée — régime inchangé.';
      this.cdr.detectChanges();
      return;
    }

    updated.raisonCalcul = (updated.raisonCalcul || '') + ' [Adapté labo: ' + raisons.join('; ') + ']';

    // Sauvegarder via Nutrition_Service (pas de Feign, pas de 500)
    this.nutritionService.updateBesoin(updated.id!, updated)
      .pipe(catchError(() => of(null)))
      .subscribe(saved => {
        this.labAdaptLoading = false;
        if (saved) {
          this.besoin          = saved;
          this.labAdaptSuccess = true;
        } else {
          this.labAdaptError = 'Erreur lors de la sauvegarde — réessayez.';
        }
        this.cdr.detectChanges();
      });
  }

  getInterpretationColor(interp: string | undefined): string {
    if (!interp) return '#6b7280';
    const i = interp.toUpperCase();
    if (i.includes('CRITIQUE')) return '#dc2626';
    if (i.includes('ELEVE'))    return '#f59e0b';
    if (i.includes('BAS'))      return '#3b82f6';
    return '#16a34a';
  }

  getInterpretationBg(interp: string | undefined): string {
    if (!interp) return '#f9fafb';
    const i = interp.toUpperCase();
    if (i.includes('CRITIQUE')) return '#fef2f2';
    if (i.includes('ELEVE'))    return '#fffbeb';
    if (i.includes('BAS'))      return '#eff6ff';
    return '#f0fdf4';
  }

  getInterpretationIcon(interp: string | undefined): string {
    if (!interp) return '⚪';
    const i = interp.toUpperCase();
    if (i.includes('CRITIQUE')) return '🚨';
    if (i.includes('ELEVE'))    return '⬆️';
    if (i.includes('BAS'))      return '⬇️';
    return '✅';
  }

  // ── Motivation enfant ─────────────────────────────────────────────────────
  private get motivStorageKey(): string {
    return `motiv_${this.patientId}_${new Date().toISOString().split('T')[0]}`;
  }

  get repasCocheAujourdhui(): boolean[] {
    try { return JSON.parse(localStorage.getItem(this.motivStorageKey) || '[false,false,false]'); }
    catch { return [false, false, false]; }
  }

  get totalCoche(): number { return this.repasCocheAujourdhui.filter(Boolean).length; }

  toggleRepas(i: number): void {
    const state = this.repasCocheAujourdhui;
    state[i] = !state[i];
    localStorage.setItem(this.motivStorageKey, JSON.stringify(state));
    this.cdr.detectChanges();
  }

  // ── Suggestion menus semaine ──────────────────────────────────────────────
  openMenus(): void {
    this.showMenus  = true;
    this.menusError = '';
    // Force reload if no valid day is loaded yet, or if the cached list contains
    // unexpected keys (e.g. from a previous malformed API response).
    const hasValidDays = this.joursList.some(j => this.ordreJoursSemaine.includes(j));
    if (!hasValidDays) {
      this.joursList = [];
      this.semaine   = {};
      this.loadMenusSemaine();
    } else {
      this.refreshMaisonCache();
      this.cdr.detectChanges();
    }
  }

  closeMenus(): void { this.showMenus = false; }

  loadMenusSemaine(): void {
    if (!this.patientId) return;
    this.menusLoading    = true;
    this.menusError      = '';
    this.menuCardVisible = false;
    this.nutritionService.getMenusSemaine(this.patientId)
      .pipe(catchError(() => of({})))
      .subscribe(data => {
        this.semaine      = data;
        this.joursList    = this.trierJoursSemaine(Object.keys(data));
        this.menuChoisi   = {};
        this.joursList.forEach(j => this.menuChoisi[j] = 0);
        this.appliquerSelectionMenusSelonAliments();
        this.activeJour   = this.joursList[0] ?? '';
        this.menusLoading = false;
        if (!this.joursList.length) {
          this.menusError = 'Aucun menu disponible. Vérifiez que des aliments sont enregistrés.';
        }
        setTimeout(() => { this.menuCardVisible = true; this.cdr.detectChanges(); }, 50);
        this.cdr.detectChanges();
      });
  }

  regenererMenus(): void {
    this.joursList = [];
    this.semaine   = {};
    this.loadMenusSemaine();
  }

  setActiveJour(jour: string): void {
    this.menuCardVisible = false;
    this.activeJour      = jour;
    this.cdr.detectChanges();
    setTimeout(() => { this.menuCardVisible = true; this.cdr.detectChanges(); }, 80);
  }

  choisirMenu(jour: string, index: number): void {
    this.menuChoisi[jour] = index;
    this.cdr.detectChanges();
  }

  private maisonStorageKey(): string {
    return `np_maison_${this.patientId ?? 0}`;
  }

  /** Recharge le cache des aliments « à la maison » depuis le stockage local. */
  refreshMaisonCache(): void {
    this.maisonAlimentIds = this.lireIdsAlimentsMaisonDepuisStockage();
  }

  private lireIdsAlimentsMaisonDepuisStockage(): Set<number> {
    if (!this.patientId) return new Set();
    try {
      const raw = localStorage.getItem(this.maisonStorageKey());
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((n): n is number => typeof n === 'number' && n > 0));
    } catch {
      return new Set();
    }
  }

  /** Indique si l’aliment est marqué comme disponible à la maison (affichage 🏠). */
  estAlimentMaison(id: number | undefined | null): boolean {
    if (id == null) return false;
    return this.maisonAlimentIds.has(id);
  }

  toggleAlimentMaison(id: number | undefined, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.patientId || id == null) return;
    const s = this.lireIdsAlimentsMaisonDepuisStockage();
    if (s.has(id)) s.delete(id);
    else s.add(id);
    localStorage.setItem(this.maisonStorageKey(), JSON.stringify([...s]));
    this.refreshMaisonCache();
    if (this.joursList.length > 0) this.appliquerSelectionMenusSelonAliments();
    this.cdr.detectChanges();
  }

  private readonly ordreJoursSemaine = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

  /** Clés renvoyées par l’API dans l’ordre Lundi → Dimanche (7 jours).
   *  Seuls les noms de jours valides sont conservés — toute clé inattendue
   *  (ex. "menus", erreur backend) est ignorée pour éviter un onglet unique
   *  avec tous les menus empilés.
   */
  private trierJoursSemaine(keys: string[]): string[] {
    const set = new Set(keys);
    return this.ordreJoursSemaine.filter(j => set.has(j));
  }

  /** Tous les aliments autorisés (non restreints) — base du scoring par défaut pour les 7 jours. */
  private getIdsAlimentsAutorisesPatient(): Set<number> {
    const interdits = new Set(this.restrictions.map(r => r.alimentId));
    const out = new Set<number>();
    for (const a of this.aliments) {
      const id = a.id;
      if (id != null && !interdits.has(id)) out.add(id);
    }
    return out;
  }

  /**
   * IDs pour choisir le menu : 🏠 en priorité, sinon filtre conseillés,
   * sinon tous les aliments autorisés (sélection auto sur les 7 jours sans action manuelle).
   */
  private getIdsPourScoringMenus(): Set<number> {
    if (this.maisonAlimentIds.size > 0) return new Set(this.maisonAlimentIds);
    if (this.searchAliment.trim().length > 0 || !!this.selectedCat) {
      const ids = this.alimentsFiltres.map(a => a.id).filter((x): x is number => x != null);
      return new Set(ids);
    }
    return this.getIdsAlimentsAutorisesPatient();
  }

  /** Si les menus sont déjà en mémoire, recalcule le meilleur choix par jour (ex. après chargement catalogue). */
  private reappliquerSelectionMenusSiSemaineChargee(): void {
    if (this.joursList.length === 0) return;
    this.joursList.forEach(j => {
      if (this.menuChoisi[j] === undefined) this.menuChoisi[j] = 0;
    });
    this.appliquerSelectionMenusSelonAliments();
  }

  private scoreMenuCorrespondance(menu: MenuJournalierDTO, pref: Set<number>): number {
    if (pref.size === 0) return 0;
    let score = 0;
    for (const repas of menu.repas ?? []) {
      for (const al of repas.aliments ?? []) {
        if (pref.has(al.alimentId)) score += al.portionG ?? 0;
      }
    }
    return score;
  }

  /** Pour chaque jour des 7, choisit le menu (0–2) qui maximise les portions d’aliments ciblés. */
  private appliquerSelectionMenusSelonAliments(): void {
    const pref = this.getIdsPourScoringMenus();
    if (pref.size === 0) return;
    for (const jour of this.joursList) {
      const menus = this.semaine[jour] ?? [];
      if (menus.length === 0) continue;
      let bestIdx = 0;
      let bestScore = -1;
      for (let i = 0; i < menus.length; i++) {
        const sc = this.scoreMenuCorrespondance(menus[i], pref);
        if (sc > bestScore) {
          bestScore = sc;
          bestIdx = i;
        }
      }
      this.menuChoisi[jour] = bestIdx;
    }
  }

  get menusJourActif(): MenuJournalierDTO[] {
    return this.semaine[this.activeJour] ?? [];
  }

  getRepasIcon(type: string): string  { return this.repasIcons[type]  ?? '🍽️'; }
  getRepasLabel(type: string): string { return this.repasLabels[type] ?? type; }

  formatJour(jour: string): string {
    const map: Record<string, string> = {
      LUNDI:'Lundi', MARDI:'Mardi', MERCREDI:'Mercredi',
      JEUDI:'Jeudi', VENDREDI:'Vendredi', SAMEDI:'Samedi', DIMANCHE:'Dimanche'
    };
    return map[jour] ?? jour;
  }

  getMenuChoisiIndex(jour: string): number { return this.menuChoisi[jour] ?? 0; }

  // ── Génération PDF menus ─────────────────────────────────────────────────

  private buildMenuPdfPage(doc: jsPDF, jour: string, pageW: number, margin: number): void {
    const menu = (this.semaine[jour] ?? [])[this.menuChoisi[jour] ?? 0];
    if (!menu) return;

    const jourFr = this.formatJour(jour);
    const colors = {
      orange : [255, 140, 0]  as [number,number,number],
      green  : [34,  197, 94] as [number,number,number],
      purple : [139, 92,  246] as [number,number,number],
      blue   : [59,  130, 246] as [number,number,number],
      yellow : [250, 204, 21]  as [number,number,number],
      pink   : [236, 72,  153] as [number,number,number],
      white  : [255, 255, 255] as [number,number,number],
      dark   : [30,  41,  59]  as [number,number,number],
    };

    let y = 0;

    // ── Bandeau titre ──
    doc.setFillColor(...colors.orange);
    doc.roundedRect(margin, y + 8, pageW - margin * 2, 18, 4, 4, 'F');
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(`Mon Menu - ${jourFr}`, pageW / 2, y + 20, { align: 'center' });
    y += 32;

    // ── À gauche : menus + todo list ──
    const colLeft = margin;
    const colRight = pageW / 2 + 4;
    const colW = pageW / 2 - margin - 4;

    // Repas
    const repasColors: [number,number,number][] = [colors.blue, colors.green, colors.purple, colors.pink];
    const repasLabels: Record<string,string> = {
      PETIT_DEJEUNER:'Petit dejeuner', DEJEUNER:'Dejeuner',
      COLLATION:'Collation', DINER:'Diner',
      PETIT_DÉJEUNER:'Petit dejeuner', DÉJEUNER:'Dejeuner', DÎNER:'Diner'
    };
    let yL = y;
    (menu.repas ?? []).forEach((repas: any, ri: number) => {
      const rc = repasColors[ri % repasColors.length];
      doc.setFillColor(...rc);
      doc.roundedRect(colLeft, yL, colW, 8, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      const rType = String(repas?.type ?? '');
      doc.text(repasLabels[rType] ?? rType, colLeft + 3, yL + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`${Math.round(Number(repas?.totalCalories ?? 0))} kcal`, colLeft + colW - 3, yL + 5.5, { align: 'right' });
      yL += 10;
      const rAliments: any[] = Array.isArray(repas?.aliments) ? repas.aliments : [];
      rAliments.forEach((a: any) => {
        doc.setTextColor(...colors.dark);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text(`- ${a.nom}`, colLeft + 4, yL);
        doc.text(a.portionG != null ? `${Math.round(a.portionG)}g` : '', colLeft + colW - 3, yL, { align: 'right' });
        yL += 5;
      });
      yL += 3;
    });

    // ── Todo list nutritionnelle ──
    yL += 4;
    doc.setFillColor(...colors.yellow);
    doc.roundedRect(colLeft, yL, colW, 7, 2, 2, 'F');
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('Mes objectifs du jour', colLeft + 3, yL + 5);
    yL += 10;
    const todos = [
      { label: 'Calories max', val: `${this.besoin?.caloriesJour ?? '?'} kcal`, done: Math.round(Number(menu.totalCalories ?? 0)) <= (this.besoin?.caloriesJour ?? 9999) },
      { label: 'Proteines max', val: `${this.besoin?.proteinesMaxG ?? '?'} g`, done: Math.round(Number(menu.totalProteines ?? 0)) <= (this.besoin?.proteinesMaxG ?? 9999) },
      { label: 'Potassium max', val: `${this.besoin?.potassiumMaxMg ?? '?'} mg`, done: Math.round(Number(menu.totalPotassium ?? 0)) <= (this.besoin?.potassiumMaxMg ?? 9999) },
    ];
    todos.forEach(t => {
      doc.setFillColor(t.done ? 220 : 254, t.done ? 252 : 202, t.done ? 231 : 202);
      doc.roundedRect(colLeft, yL, colW, 7, 1, 1, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.setTextColor(...colors.dark);
      doc.text(`${t.done ? '[OK]' : '[ ]'} ${t.label} : ${t.val}`, colLeft + 3, yL + 5);
      yL += 9;
    });

    // ── À droite : dessin à colorier ──
    let yR = y;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(colRight, yR, colW, 90, 4, 4, 'F');
    doc.setDrawColor(...colors.orange); doc.setLineWidth(1.5);
    doc.roundedRect(colRight, yR, colW, 90, 4, 4, 'S');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(...colors.orange);
    doc.text('Colorie ton repas !', colRight + colW / 2, yR + 7, { align: 'center' });
    yR += 12;

    // Soleil
    doc.setDrawColor(...colors.yellow); doc.setLineWidth(1.2);
    doc.circle(colRight + 15, yR + 8, 6, 'S');
    for (let a = 0; a < 8; a++) {
      const rad = (a * 45) * Math.PI / 180;
      doc.line(colRight + 15 + 7 * Math.cos(rad), yR + 8 + 7 * Math.sin(rad),
               colRight + 15 + 10 * Math.cos(rad), yR + 8 + 10 * Math.sin(rad));
    }
    // Assiette
    doc.setDrawColor(...colors.blue);
    doc.ellipse(colRight + colW / 2, yR + 30, 22, 14, 'S');
    doc.ellipse(colRight + colW / 2, yR + 30, 16, 10, 'S');
    // Fourchette
    doc.setDrawColor(...colors.dark); doc.setLineWidth(0.8);
    doc.line(colRight + colW / 2 - 28, yR + 18, colRight + colW / 2 - 28, yR + 44);
    doc.line(colRight + colW / 2 - 30, yR + 18, colRight + colW / 2 - 30, yR + 28);
    doc.line(colRight + colW / 2 - 26, yR + 18, colRight + colW / 2 - 26, yR + 28);
    // Couteau
    doc.line(colRight + colW / 2 + 28, yR + 18, colRight + colW / 2 + 28, yR + 44);
    // Aliments sur l'assiette (cercles déco)
    doc.setDrawColor(...colors.green);
    doc.circle(colRight + colW / 2 - 8, yR + 28, 4, 'S');
    doc.setDrawColor(...colors.orange);
    doc.circle(colRight + colW / 2 + 5, yR + 32, 5, 'S');
    doc.setDrawColor(...colors.pink);
    doc.circle(colRight + colW / 2 - 3, yR + 35, 3, 'S');

    // Numéros à colorier
    yR += 54;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('1=Jaune  2=Bleu  3=Vert  4=Orange  5=Rose', colRight + colW / 2, yR, { align: 'center' });

    // Numéros sur les formes
    doc.setFontSize(6); doc.setTextColor(...colors.dark);
    doc.text('1', colRight + 15 - 1, yR - 42);
    doc.text('2', colRight + colW / 2 - 1, yR - 22);
    doc.text('3', colRight + colW / 2 - 9, yR - 24);
    doc.text('4', colRight + colW / 2 + 4, yR - 20);
    doc.text('5', colRight + colW / 2 - 4, yR - 17);

    // Totaux en bas
    yR += 8;
    doc.setFillColor(...colors.green);
    doc.roundedRect(colRight, yR, colW, 18, 3, 3, 'F');
    doc.setTextColor(...colors.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(`${Math.round(Number(menu.totalCalories ?? 0))} kcal`, colRight + colW / 2, yR + 6, { align: 'center' });
    doc.text(`${Math.round(Number(menu.totalProteines ?? 0))}g prot  |  ${Math.round(Number(menu.totalPotassium ?? 0))}mg K+`, colRight + colW / 2, yR + 13, { align: 'center' });
  }

  genererPdfGroceries(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const mL = 14;
    const colW = W - mL * 2;

    // ── Collecter tous les aliments uniques (A→Z) ──────────────────────────
    const map = new Map<string, { nom: string; portionG: number; calories: number; count: number; daysCount: number; repas: string }>();
    this.joursList.forEach(jour => {
      const menu = (this.semaine[jour] ?? [])[this.menuChoisi[jour] ?? 0];
      if (!menu) return;
      const jourItems = new Set<string>();
      menu.repas?.forEach((repas: any) => {
        (repas.aliments ?? []).forEach((a: any) => {
          const key = (a.nom ?? '').toLowerCase().trim();
          if (!key) return;
          if (map.has(key)) {
            const e = map.get(key)!;
            e.portionG += a.portionG ?? 0;
            e.calories  += a.calories  ?? 0;
            e.count++;
            if (!jourItems.has(key)) { e.daysCount++; jourItems.add(key); }
          } else {
            map.set(key, { nom: a.nom ?? '', portionG: a.portionG ?? 0, calories: a.calories ?? 0, count: 1, daysCount: 1, repas: repas.type });
            jourItems.add(key);
          }
        });
      });
    });

    // Tri A→Z
    const allItems = Array.from(map.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));

    // ── En-tête page ────────────────────────────────────────────────────────
    doc.setFillColor(22, 163, 74); doc.rect(0, 0, W, 28, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('Weekly Groceries List', W / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(187, 247, 208);
    const today2 = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Semaine du ${today2}`, W / 2, 22, { align: 'center' });

    // Stat rapide
    const joursOk = this.joursList.filter(j => !!(this.semaine[j] ?? [])[this.menuChoisi[j] ?? 0]).length;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${allItems.length} articles  •  ${joursOk} jours`, W / 2, 26, { align: 'center' });

    // ── Entête colonnes du tableau ──────────────────────────────────────────
    let y = 36;
    doc.setFillColor(240, 253, 244); doc.rect(mL, y, colW, 7, 'F');
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.4);
    doc.rect(mL, y, colW, 7, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(22, 163, 74);
    doc.text('Item', mL + 12, y + 5);
    doc.text('Portion/day', W - mL - 36, y + 5, { align: 'right' });
    doc.text('Kcal/portion', W - mL - 2, y + 5, { align: 'right' });
    y += 7;

    // ── Lignes ─────────────────────────────────────────────────────────────
    allItems.forEach((item, idx) => {
      const rowH = 7;

      // Page break
      if (y + rowH + 4 > H - 14) {
        doc.addPage();
        doc.setFillColor(22, 163, 74); doc.rect(0, 0, W, 14, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Weekly Groceries List (cont.)', W / 2, 9, { align: 'center' });
        y = 20;
        doc.setFillColor(240, 253, 244); doc.rect(mL, y, colW, 7, 'F');
        doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.4); doc.rect(mL, y, colW, 7, 'S');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(22, 163, 74);
        doc.text('Item', mL + 12, y + 5);
        doc.text('Portion/day', W - mL - 36, y + 5, { align: 'right' });
        doc.text('Kcal/portion', W - mL - 2, y + 5, { align: 'right' });
        y += 7;
      }

      // Ligne alternée
      const rowBg = idx % 2 === 0 ? [255,255,255] : [248,252,248];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.rect(mL, y, colW, rowH, 'F');
      doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2);
      doc.line(mL, y + rowH, mL + colW, y + rowH);

      // Checkbox
      doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.6);
      doc.rect(mL + 2, y + 1.5, 4.5, 4.5, 'S');

      // Nom aliment
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text(item.nom, mL + 12, y + 5, { maxWidth: colW - 60 });

      // Portion/jour (vert) — divisé par nombre de jours distincts, pas d'occurrences
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setTextColor(22, 163, 74);
      doc.text(`${Math.round(item.portionG / item.daysCount)} g`, W - mL - 36, y + 5, { align: 'right' });

      // Calories (orange) — par portion (par occurrence)
      doc.setTextColor(180, 80, 0);
      doc.text(`${Math.round(item.calories / item.count)} kcal`, W - mL - 2, y + 5, { align: 'right' });

      y += rowH;
    });

    // ── Pied de page ────────────────────────────────────────────────────────
    const totalP = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalP; p++) {
      doc.setPage(p);
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
      doc.line(mL, H - 10, W - mL, H - 10);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(160, 160, 160);
      doc.text('Liste de courses — usage personnel', mL, H - 6);
      doc.text(`${p} / ${totalP}`, W / 2, H - 6, { align: 'center' });
    }

    doc.save(`groceries-list-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  genererPdfJour(jour: string): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.buildMenuPdfPage(doc, jour, 210, 14);
    doc.save(`menu-${this.formatJour(jour).toLowerCase()}.pdf`);
  }

  genererPdfSemaine(): void {
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = 210, H = 297;
    const mL   = 10, mT = 10;
    const cols = 3;
    const colW = (W - mL * 2) / cols;   // ~63mm
    const repasLabelsShort: Record<string, string> = {
      PETIT_DEJEUNER:'Breakfast', PETIT_DÉJEUNER:'Breakfast',
      DEJEUNER:'Lunch', DÉJEUNER:'Lunch',
      DINER:'Dinner',   DÎNER:'Dinner',
      COLLATION:'Snack'
    };

    // ── Titre ──────────────────────────────────────────────────────────────
    doc.setFont('times', 'bolditalic'); doc.setFontSize(34);
    doc.setTextColor(20, 20, 20);
    doc.text('Meal Planner', W / 2, mT + 14, { align: 'center' });
    // Soulignement décoratif
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(1.2);
    doc.line(W / 2 - 38, mT + 17, W / 2 + 38, mT + 17);

    // ── Grille ─────────────────────────────────────────────────────────────
    // Utilise les vraies clés de l'API
    const jours = this.joursList.slice(0, 7);
    const joursEn: Record<string, string> = {
      LUNDI:'Monday',    MARDI:'Tuesday',  MERCREDI:'Wednesday',
      JEUDI:'Thursday',  VENDREDI:'Friday', SAMEDI:'Saturday', DIMANCHE:'Sunday',
      lundi:'Monday',    mardi:'Tuesday',  mercredi:'Wednesday',
      jeudi:'Thursday',  vendredi:'Friday', samedi:'Saturday', dimanche:'Sunday',
      MONDAY:'Monday',   TUESDAY:'Tuesday', WEDNESDAY:'Wednesday',
      THURSDAY:'Thursday', FRIDAY:'Friday', SATURDAY:'Saturday', SUNDAY:'Sunday'
    };

    const gridTop  = mT + 24;
    const gridH    = H - gridTop - mT;
    const rowH     = gridH / 3;            // 3 lignes

    // Hauteur d'une cellule repas dans chaque jour
    // Chaque jour a: entête + 3 repas → splittons equitablement
    const dayHeaderH = 7;

    const drawDayCell = (jour: string, cx: number, cy: number, cellW: number, cellH: number) => {
      const menu = (this.semaine[jour] ?? [])[this.menuChoisi[jour] ?? 0];

      // Bordure extérieure
      doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.5);
      doc.rect(cx, cy, cellW, cellH);

      // En-tête jour
      doc.setFont('times', 'bolditalic'); doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(joursEn[jour] ?? this.formatJour(jour), cx + cellW / 2, cy - 1.5, { align: 'center' });

      if (!menu) return;

      // Repas
      const repasList = (menu.repas ?? []).filter((r: any) =>
        ['PETIT_DEJEUNER','PETIT_DÉJEUNER','DEJEUNER','DÉJEUNER','DINER','DÎNER'].includes(String(r?.type ?? ''))
      ).slice(0, 3);

      let ry = cy;
      repasList.forEach((repas: any, ri: number) => {
        if (ri > 0) {
          doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
          doc.line(cx, ry, cx + cellW, ry);
        }
        const rh = cellH / 3;

        // Header repas + calories total repas
        const repasType = String(repas?.type ?? '');
        const repasCalories = Number(repas?.totalCalories ?? 0);
        const repasAliments: any[] = Array.isArray(repas?.aliments) ? repas.aliments : [];
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(repasLabelsShort[repasType] ?? repasType, cx + 2, ry + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
        doc.setTextColor(160, 80, 0);
        doc.text(`${Math.round(repasCalories)} kcal`, cx + cellW - 2, ry + 5, { align: 'right' });

        // Aliments avec checkbox + portion + calories
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
        doc.setTextColor(20, 20, 20);
        repasAliments.slice(0, 3).forEach((a: any, ai: number) => {
          const ay = ry + 9 + ai * 5;
          // Checkbox à cocher (petit carré)
          doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.4);
          doc.rect(cx + 2, ay - 3, 3, 3, 'S');
          // Nom aliment
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
          doc.setTextColor(20, 20, 20);
          doc.text(a.nom ?? '', cx + 7, ay, { maxWidth: cellW - 30 });
          // Portion
          doc.setTextColor(60, 100, 60);
          doc.text(`${Math.round(a.portionG ?? 0)}g`, cx + cellW - 15, ay, { align: 'right' });
          // Calories
          doc.setTextColor(160, 80, 0);
          doc.text(`${Math.round(a.calories ?? 0)}kc`, cx + cellW - 2, ay, { align: 'right' });
        });
        ry += rh;
      });
    };

    const drawNotesCell = (cx: number, cy: number, cellW: number, cellH: number) => {
      doc.setFont('times', 'bolditalic'); doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text('Restrictions:', cx + 2, cy - 1.5);
      doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.5);
      doc.rect(cx, cy, cellW, cellH);

      // Liste des restrictions
      const restr = (this.restrictions ?? []);
      if (restr.length === 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('No restrictions recorded.', cx + 4, cy + 10);
      } else {
        let ty = cy + 8;
        restr.forEach((r: any) => {
          if (ty > cy + cellH - 4) return;
          const nom   = this.getAlimentNom(r.alimentId) ?? r.alimentId ?? '';
          const raison = r.raison ? ` - ${r.raison}` : '';
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
          doc.setTextColor(200, 80, 0);
          doc.text(`* ${nom}`, cx + 4, ty, { maxWidth: cellW / 2 - 6 });
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
          doc.setTextColor(60, 60, 60);
          doc.text(raison, cx + 4 + cellW / 2, ty, { maxWidth: cellW / 2 - 6 });
          ty += 7;
        });
      }
    };

    // Lignes 0 et 1 : 3 jours chacune
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const jIdx = row * 3 + col;
        const jour  = jours[jIdx];
        const cx    = mL + col * colW;
        const cy    = gridTop + row * rowH + dayHeaderH;
        drawDayCell(jour, cx, cy, colW, rowH - dayHeaderH);
      }
    }

    // Ligne 2 : Dimanche + Notes (2/3 largeur)
    const row2y  = gridTop + 2 * rowH;
    const notesW = colW * 2;
    drawDayCell(jours[6], mL, row2y + dayHeaderH, colW, rowH - dayHeaderH);
    drawNotesCell(mL + colW, row2y + dayHeaderH, notesW, rowH - dayHeaderH);

    // ── Page TODO — Liste de contrôle ──────────────────────────────────────
    doc.addPage();
    doc.setFont('times', 'bolditalic'); doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text('Liste de contr\u00f4le', W / 2, mT + 10, { align: 'center' });
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.8);
    doc.line(W / 2 - 35, mT + 13, W / 2 + 35, mT + 13);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Cochez chaque aliment au moment de la pr\u00e9paration ou de la prise', W / 2, mT + 18, { align: 'center' });

    let todoY = mT + 26;
    const colCount = 2;
    const todoColW = (W - mL * 2 - 4) / colCount;
    let colIndex = 0;

    const joursSelectionnes = jours.filter(j => {
      const m = (this.semaine[j] ?? [])[this.menuChoisi[j] ?? 0];
      return !!m;
    });

    joursSelectionnes.forEach(jour => {
      const menu = (this.semaine[jour] ?? [])[this.menuChoisi[jour] ?? 0];
      const repasList2 = (menu?.repas ?? []).filter((r: any) =>
        ['PETIT_DEJEUNER','PETIT_DÉJEUNER','DEJEUNER','DÉJEUNER','DINER','DÎNER'].includes(String(r?.type ?? ''))
      ).slice(0, 3);

      repasList2.forEach((repas: any) => {
        const aliments2: any[] = Array.isArray(repas?.aliments) ? repas.aliments : [];
        const blocH = 7 + aliments2.length * 6 + 3;
        if (todoY + blocH > H - mT - 10) {
          if (colIndex === 0) {
            colIndex = 1;
            todoY = mT + 26;
          } else {
            doc.addPage();
            colIndex = 0;
            todoY = mT + 26;
            doc.setFont('times', 'bolditalic'); doc.setFontSize(14);
            doc.setTextColor(20, 20, 20);
            doc.text('Liste de contr\u00f4le (suite)', W / 2, mT + 8, { align: 'center' });
          }
        }

        const cx3 = mL + colIndex * (todoColW + 4);

        // En-tête jour + repas
        doc.setFillColor(230, 230, 240);
        doc.rect(cx3, todoY, todoColW, 6, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 100);
        doc.text(`${joursEn[jour] ?? jour}  —  ${repasLabelsShort[repas.type] ?? repas.type}`, cx3 + 2, todoY + 4.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
        doc.setTextColor(160, 80, 0);
        doc.text(`${Math.round(repas.totalCalories)} kcal`, cx3 + todoColW - 2, todoY + 4.5, { align: 'right' });
        todoY += 6;

        // Aliments
        aliments2.forEach((a: any, ai: number) => {
          const ay2 = todoY + 1;
          const rowBg = ai % 2 === 0 ? [255,255,255] : [248,248,252];
          doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
          doc.rect(cx3, ay2, todoColW, 6, 'F');

          // Checkbox
          doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
          doc.rect(cx3 + 2, ay2 + 1, 4, 4, 'S');

          // Nom
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
          doc.setTextColor(20, 20, 20);
          doc.text(a.nom ?? '', cx3 + 8, ay2 + 4.5, { maxWidth: todoColW - 35 });

          // Portion (vert)
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
          doc.setTextColor(40, 120, 40);
          doc.text(`${Math.round(a.portionG ?? 0)}g`, cx3 + todoColW - 19, ay2 + 4.5, { align: 'right' });

          // Calories (orange)
          doc.setTextColor(180, 80, 0);
          doc.text(`${Math.round(a.calories ?? 0)}kcal`, cx3 + todoColW - 2, ay2 + 4.5, { align: 'right' });

          todoY += 6;
        });

        todoY += 3;
      });
    });

    doc.save('meal-planner-semaine.pdf');
  }

  // ── Analyse plat par photo (Clarifai → Open Food Facts) ─────────────────
  getScanNutrientPct(value: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(100, Math.round((value / limit) * 100));
  }

  openMealAnalysis(): void  { this.showMealAnalysis = true; this.resetMealAnalysis(); }
  closeMealAnalysis(): void { this.showMealAnalysis = false; }

  resetMealAnalysis(): void {
    this.mealPhotoPreview    = '';
    this.mealAnalysisLoading = false;
    this.mealAnalysisError   = '';
    this.mealAnalysisResult  = null;
  }

  onMealPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input?.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = e => { this.mealPhotoPreview = e.target?.result as string; this.cdr.detectChanges(); };
    reader.readAsDataURL(file);

    this.mealAnalysisLoading = true;
    this.mealAnalysisError   = '';
    this.mealAnalysisResult  = null;
    this.cdr.detectChanges();

    // Valeurs nutritionnelles de fallback (pour 100g)
    const nutritionFallback: Record<string, { kcal: number; proteines: number; glucides: number; lipides: number }> = {
      'pizza':         { kcal: 266, proteines: 11, glucides: 6,  lipides: 10 },
      'pasta':         { kcal: 157, proteines: 6,  glucides: 3,  lipides: 1  },
      'carbonara':     { kcal: 280, proteines: 12, glucides: 4,  lipides: 17 },
      'hamburger':     { kcal: 295, proteines: 17, glucides: 24, lipides: 14 },
      'sandwich':      { kcal: 250, proteines: 12, glucides: 30, lipides: 8  },
      'chicken':       { kcal: 165, proteines: 31, glucides: 0,  lipides: 4  },
      'beef':          { kcal: 250, proteines: 26, glucides: 0,  lipides: 15 },
      'steak':         { kcal: 271, proteines: 26, glucides: 0,  lipides: 18 },
      'salmon':        { kcal: 208, proteines: 20, glucides: 0,  lipides: 13 },
      'fish':          { kcal: 136, proteines: 20, glucides: 0,  lipides: 5  },
      'rice':          { kcal: 130, proteines: 3,  glucides: 28, lipides: 0  },
      'bread':         { kcal: 265, proteines: 9,  glucides: 49, lipides: 3  },
      'egg':           { kcal: 155, proteines: 13, glucides: 1,  lipides: 11 },
      'cheese':        { kcal: 402, proteines: 25, glucides: 1,  lipides: 33 },
      'milk':          { kcal: 61,  proteines: 3,  glucides: 5,  lipides: 3  },
      'yogurt':        { kcal: 59,  proteines: 10, glucides: 3,  lipides: 1  },
      'banana':        { kcal: 89,  proteines: 1,  glucides: 23, lipides: 0  },
      'apple':         { kcal: 52,  proteines: 0,  glucides: 14, lipides: 0  },
      'salad':         { kcal: 20,  proteines: 2,  glucides: 3,  lipides: 0  },
      'soup':          { kcal: 62,  proteines: 3,  glucides: 8,  lipides: 2  },
      'sushi':         { kcal: 150, proteines: 6,  glucides: 28, lipides: 1  },
      'chocolate':     { kcal: 546, proteines: 5,  glucides: 60, lipides: 31 },
      'cake':          { kcal: 347, proteines: 5,  glucides: 53, lipides: 13 },
      'french fries':  { kcal: 312, proteines: 3,  glucides: 41, lipides: 15 },
      'potato':        { kcal: 77,  proteines: 2,  glucides: 17, lipides: 0  },
      'cucumber':      { kcal: 15,  proteines: 1,  glucides: 4,  lipides: 0  },
      'tomato':        { kcal: 18,  proteines: 1,  glucides: 4,  lipides: 0  },
      'broccoli':      { kcal: 34,  proteines: 3,  glucides: 7,  lipides: 0  },
      'carrot':        { kcal: 41,  proteines: 1,  glucides: 10, lipides: 0  },
      'eggnog':        { kcal: 88,  proteines: 5,  glucides: 8,  lipides: 4  },
    };

    const getNutritionFallback = (label: string) => {
      const lower = label.toLowerCase().replace(/_/g, ' ');
      for (const [key, val] of Object.entries(nutritionFallback)) {
        if (lower.includes(key)) return val;
      }
      return null;
    };

    // ── HuggingFace food classification (appel direct — CORS supporté) ───────
    // Modèles food-101 en cascade : si le premier est indisponible, on essaie le suivant
    const HF_TOKEN  = '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';
    const HF_MODELS = [
      '/hf/models/nateraw/food',
      '/hf/models/Kaludi/food-category-classification-v2.0',
      '/hf/models/eslamxm/vit-base-food101',
    ];

    const resizeToBlob = (f: File): Promise<Blob> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(f);
        img.onload = () => {
          const MAX = 512;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('blob null')), 'image/jpeg', 0.85);
        };
        img.onerror = reject;
        img.src = url;
      });

    // Essaie chaque modèle en cascade — retry 503 (cold start) une fois par modèle
    const callHF = (blob: Blob, modelIdx = 0, attempt = 0): Promise<{ label: string; score: number }[] | null> =>
      new Promise(resolve => {
        const url = HF_MODELS[modelIdx];
        this.http.post<any>(url, blob, {
          headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'image/jpeg' }
        }).subscribe({
          next: r => {
            const arr: { label: string; score: number }[] = Array.isArray(r) ? r : [];
            if (arr.length > 0) {
              resolve(arr.map((c: any) => ({ label: c.label ?? c.name ?? '', score: c.score ?? c.confidence ?? 0 })));
            } else if (modelIdx + 1 < HF_MODELS.length) {
              // réponse vide → essaie modèle suivant
              callHF(blob, modelIdx + 1, 0).then(resolve);
            } else {
              this.mealAnalysisError = '❌ Aucun aliment reconnu. Essayez une photo plus nette du plat.';
              this.mealAnalysisLoading = false;
              this.cdr.detectChanges();
              resolve(null);
            }
          },
          error: (err: any) => {
            if (err?.status === 503 && attempt === 0) {
              // Modèle en veille → attend 12s et réessaie le même
              this.mealAnalysisError = `⏳ Modèle en chargement (${modelIdx + 1}/${HF_MODELS.length}), réessai…`;
              this.cdr.detectChanges();
              setTimeout(() => callHF(blob, modelIdx, 1).then(resolve), 12000);
              return;
            }
            if (err?.status === 503 && attempt > 0 && modelIdx + 1 < HF_MODELS.length) {
              // Toujours en veille après retry → modèle suivant
              callHF(blob, modelIdx + 1, 0).then(resolve);
              return;
            }
            if (err?.status === 401) {
              this.mealAnalysisError = '🔑 Token HuggingFace invalide ou expiré.';
              this.mealAnalysisLoading = false;
              this.cdr.detectChanges();
              resolve(null);
              return;
            }
            if (err?.status === 404 && modelIdx + 1 < HF_MODELS.length) {
              // Modèle introuvable → essaie le suivant immédiatement
              callHF(blob, modelIdx + 1, 0).then(resolve);
              return;
            }
            this.mealAnalysisError = `❌ Erreur ${err?.status ?? 'réseau'} — vérifiez votre connexion.`;
            this.mealAnalysisLoading = false;
            this.cdr.detectChanges();
            resolve(null);
          }
        });
      });

    resizeToBlob(file).then((blob: Blob) => callHF(blob, 0, 0)).then((res: { label: string; score: number }[] | null) => {
      let concepts: { label: string; score: number }[] = [];
      let ingredients: string[] = [];

      if (Array.isArray(res) && res.length > 0) {
        concepts    = res.filter(c => (c.score ?? 0) >= 0.05).slice(0, 4);
        // HF retourne un classement de catégories alimentaires
        ingredients = res.filter(c => (c.score ?? 0) >= 0.04).slice(0, 10).map(c => c.label);
      }

      if (!concepts.length) {
        if (!this.mealAnalysisError) {
          this.mealAnalysisError = '❌ Aucun aliment reconnu dans cette photo. Essayez un autre plat.';
        }
        this.mealAnalysisLoading = false;
        this.cdr.detectChanges(); return;
      }
      this.mealAnalysisError = '';

      const labelFr: Record<string, string> = {
        'eggnog': 'Lait de poule', 'milk': 'Lait', 'cheese': 'Fromage', 'butter': 'Beurre',
        'pizza': 'Pizza', 'hamburger': 'Hamburger', 'hot dog': 'Hot-dog', 'sandwich': 'Sandwich',
        'banana': 'Banane', 'apple': 'Pomme', 'orange': 'Orange', 'strawberry': 'Fraise',
        'broccoli': 'Brocoli', 'carrot': 'Carotte', 'corn': 'Maïs', 'mushroom': 'Champignon',
        'chicken': 'Poulet', 'beef': 'Bœuf', 'pork': 'Porc', 'fish': 'Poisson',
        'salmon': 'Saumon', 'shrimp': 'Crevettes', 'egg': 'Œuf', 'rice': 'Riz',
        'pasta': 'Pâtes', 'bread': 'Pain', 'soup': 'Soupe', 'salad': 'Salade',
        'cake': 'Gâteau', 'chocolate': 'Chocolat', 'ice cream': 'Glace', 'cookie': 'Biscuit',
        'coffee': 'Café', 'tea': 'Thé', 'juice': 'Jus', 'yogurt': 'Yaourt',
        'sushi': 'Sushi', 'steak': 'Steak', 'tomato': 'Tomate', 'potato': 'Pomme de terre',
        'french fries': 'Frites', 'waffle': 'Gaufre', 'pancake': 'Crêpe',
        'carbonara': 'Carbonara', 'cucumber': 'Concombre'
      };

      const ingredientFr: Record<string, string> = {
        'tomato': 'Tomate', 'cheese': 'Fromage', 'flour': 'Farine', 'egg': 'Œuf',
        'milk': 'Lait', 'butter': 'Beurre', 'oil': 'Huile', 'onion': 'Oignon',
        'garlic': 'Ail', 'salt': 'Sel', 'sugar': 'Sucre', 'pepper': 'Poivre',
        'chicken': 'Poulet', 'beef': 'Bœuf', 'pork': 'Porc', 'fish': 'Poisson',
        'rice': 'Riz', 'pasta': 'Pâtes', 'bread': 'Pain', 'lettuce': 'Laitue',
        'carrot': 'Carotte', 'potato': 'Pomme de terre', 'cream': 'Crème',
        'bacon': 'Lardons', 'mushroom': 'Champignon', 'spinach': 'Épinards',
        'lemon': 'Citron', 'orange': 'Orange', 'apple': 'Pomme', 'banana': 'Banane',
        'chocolate': 'Chocolat', 'vanilla': 'Vanille', 'cinnamon': 'Cannelle',
        'mayonnaise': 'Mayonnaise', 'ketchup': 'Ketchup', 'mustard': 'Moutarde',
        'vinegar': 'Vinaigre', 'soy sauce': 'Sauce soja', 'ginger': 'Gingembre',
        'sesame': 'Sésame', 'avocado': 'Avocat', 'cucumber': 'Concombre',
        'salmon': 'Saumon', 'shrimp': 'Crevettes', 'tuna': 'Thon'
      };

      const translateFr = (raw: string, dict: Record<string, string>): string => {
        const lower = raw.toLowerCase().trim();
        for (const [en, fr] of Object.entries(dict)) {
          if (lower.includes(en)) return fr;
        }
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      };

      const nonFood = ['lotion', 'soap', 'plastic', 'fabric', 'cup', 'pot', 'pan', 'plate', 'bowl', 'spoon', 'fork', 'knife'];
      const filtered = concepts
        .filter(c => Math.round((c.score ?? 0) * 100) >= 5 && !nonFood.some(w => (c.label ?? '').toLowerCase().includes(w)))
        .slice(0, 3);

      if (!filtered.length) {
        this.mealAnalysisError   = '❌ Aucun aliment reconnu. Essayez une photo plus nette.';
        this.mealAnalysisLoading = false;
        this.cdr.detectChanges(); return;
      }

      const foods: { name: string; confidence: number }[] = filtered.map(c => ({
        name      : translateFr(c.label ?? '', labelFr),
        confidence: Math.round((c.score ?? 0) * 100)
      })).filter(f => f.name.length > 0);

      const ingredientsFr = ingredients.map(i => translateFr(i, ingredientFr)).slice(0, 8);

      const fallback = getNutritionFallback(filtered[0].label ?? '');
      const query  = filtered[0].label?.replace(/_/g, ' ') ?? '';
      const params = `search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1&fields=nutriments`;

      this.http.get<any>(`/openfoodfacts/cgi/search.pl?${params}`).pipe(
        catchError(() => of(null))
      ).subscribe(offRes => {
        const n         = offRes?.products?.[0]?.nutriments ?? {};
        const kcal      = n['energy-kcal_100g'] != null ? Math.round(n['energy-kcal_100g']) : (fallback?.kcal      ?? 0);
        const proteines = n['proteins_100g']    != null ? Math.round(n['proteins_100g'])    : (fallback?.proteines ?? 0);
        const glucides  = n['sugars_100g']      != null ? Math.round(n['sugars_100g'])      : (fallback?.glucides  ?? 0);
        const lipides   = n['fat_100g']         != null ? Math.round(n['fat_100g'])         : (fallback?.lipides   ?? 0);

        const warnings: string[] = [];
        let danger = false;
        const nameLow = foods.map(f => f.name.toLowerCase()).join(' ') + ' ' + ingredientsFr.join(' ').toLowerCase();

        if (this.besoin) {
          if (this.besoin.traitementTacrolimus &&
              (nameLow.includes('pamplemousse') || nameLow.includes('pomelo') || nameLow.includes('grapefruit'))) {
            warnings.push('❌ Interaction Tacrolimus — pamplemousse détecté'); danger = true;
          }
          const calJour = this.besoin.caloriesJour ?? 0;
          if (kcal > 0 && calJour > 0) {
            const pct = Math.round((kcal / calJour) * 100);
            if (pct > 60) { warnings.push(`🔥 Ce repas = ${pct}% de l'apport calorique journalier`); if (pct > 80) danger = true; }
          }
          const protMax = this.besoin.proteinesMaxG ?? 0;
          if (proteines > 0 && protMax > 0) {
            const pct = Math.round((proteines / protMax) * 100);
            if (pct > 70) { warnings.push(`🥩 Protéines élevées : ${proteines}g (${pct}% de la limite)`); if (pct > 90) danger = true; }
          }
          const sucreMax = this.besoin.sucreMaxG ?? 0;
          if (glucides > 0 && sucreMax > 0) {
            const pct = Math.round((glucides / sucreMax) * 100);
            if (pct > 80) { warnings.push(`🍬 Sucres élevés : ${glucides}g`); if (pct > 100) danger = true; }
          }
        }

        for (const r of this.restrictions) {
          const aid = r.alimentId ?? 0;
          const rNom = this.getAlimentNom(aid).toLowerCase();
          if (rNom.length >= 4 && nameLow.includes(rNom.substring(0, Math.min(6, rNom.length)))) {
            warnings.push(`🚫 Aliment restreint : "${this.getAlimentNom(aid)}"`); danger = true;
          }
        }

        this.mealAnalysisResult = {
          foods, ingredients: ingredientsFr, kcal, proteines, glucides, lipides,
          verdict : danger ? 'danger' : warnings.length > 0 ? 'warn' : 'ok',
          warnings
        };
        this.mealAnalysisLoading = false;
        input.value = '';
        this.cdr.detectChanges();
      });
    }).catch(() => {
      this.mealAnalysisError   = '❌ Impossible de lire la photo.';
      this.mealAnalysisLoading = false;
      this.cdr.detectChanges();
    });
  }
}
