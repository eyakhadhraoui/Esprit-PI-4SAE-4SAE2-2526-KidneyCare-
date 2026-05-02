import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { MenuJournalierDTO } from '../services/nutrition.service';

interface BesoinNutritionnel {
  caloriesJour: number;
  potassiumMaxMg: number;
  sodiumMaxMg: number;
  proteinesMaxG: number;
  sucreMaxG: number;
  phosphoreMaxMg: number;
  traitementTacrolimus: boolean;
  traitementPrednisone: boolean;
  dateDebut: string;
  raisonCalcul: string;
}

interface Alerte {
  id?: number;
  type: string;
  message: string;
  lue: boolean;
  dateAlerte?: string;
  detailsTechniques?: string;
}

interface Aliment {
  id?: number;
  nom: string;
  categorie: string;
  caloriesKcal?: number;
  potassiumMg?: number;
  sodiumMg?: number;
  proteinesG?: number;
  phosphoreMg?: number;
  sucreG?: number;
  ageMinimumMois?: number;
  notes?: string;
  interactionTacrolimus?: boolean;
  interactionCyclosporine?: boolean;
}

interface Restriction {
  alimentId: number;
  raison: string;
  dateDebut?: string;
  notes?: string;
  valeurBilanDeclencheur?: string;
  creeAutomatiquement?: boolean;
}

interface LabResult {
  idTestLaboratoire?: number;
  nomTest?: string;
  codeTest?: string;
  dateResultat?: string;
  datePrelevement?: string;
  statutResultat?: string;
  interpretation?: string;
  valeurNumerique?: number;
  valeurTexte?: string;
  unite?: string;
  conclusion?: string;
}

interface MealAnalysisResult {
  foods: { name: string; confidence: number }[];
  ingredients: string[];
  warnings: string[];
  verdict: 'ok' | 'warn' | 'danger';
}

interface Dossier {
  idDossierMedical: number;
  patientNom?: string;
  diagnostic?: string;
  dateCreation?: string;
}

@Component({
  selector: 'app-nutrition-patient',
  standalone: false,
  templateUrl: './nutrition-patient.html',
  styleUrl: './nutrition-patient.css',
})
export class NutritionPatientComponent implements OnInit {
  loading = false;
  patientId: string | null = null;
  besoin: BesoinNutritionnel | null = null;
  toutesAlertes: Alerte[] = [];
  alertesNonLues: Alerte[] = [];
  alertesFiltrees: Alerte[] = [];
  alerteFilter = 'all';
  unreadCount = 0;
  loadingAlertes = false;
  restrictions: Restriction[] = [];
  alimentsFiltres: Aliment[] = [];
  categories: string[] = [];
  searchAliment = '';
  selectedCat = '';
  maisonAlimentIds = new Set<number>();
  activeTab = 'regime';
  raisonLabels: Record<string, string> = {};
  categorieLabels: Record<string, string> = {};
  alerteLabels: Record<string, string> = {};

  standard = { calories: 2000, potassium: 3500, sodium: 2300, phosphore: 700, proteines: 50, sucre: 50 };

  dossiersLoading = false;
  mesDossiers: Dossier[] = [];
  labDossierId: number | null = null;
  labError: string | null = null;
  labLoading = false;
  labResults: LabResult[] = [];
  labAdaptLoading = false;
  labAdaptSuccess = false;
  labAdaptError: string | null = null;

  showMenus = false;
  showMealAnalysis = false;
  mealAnalysisLoading = false;
  mealAnalysisResult: MealAnalysisResult | null = null;
  mealAnalysisError: string | null = null;
  mealPhotoPreview: string | null = null;
  completedMenusCount = 0;
  semaine: Record<string, MenuJournalierDTO[]> = {};
  menuChoisi: Record<string, number> = {};
  menuChoisiChange: unknown = null;
  menuCardVisible: unknown = null;
  menusLoading = false;
  menusError: string | null = null;
  activeJour = '';
  menusJourActif: MenuJournalierDTO[] = [];
  joursList: string[] = [];
  repasCocheAujourdhui: boolean[] = [false, false, false];
  totalCalories = 0;
  totalPotassium = 0;
  totalProteines = 0;
  totalCoche = 0;

  private allAliments: Aliment[] = [];

  private readonly BASE = '/nutrition';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.patientId = (this.auth.getProfile()?.['sub'] as string) ?? (this.auth.getProfile()?.username as string) ?? null;
    if (this.patientId) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.http.get<BesoinNutritionnel>(`${this.BASE}/besoin/${this.patientId}`)
      .subscribe({ next: (b) => { this.besoin = b; this.loading = false; }, error: () => { this.loading = false; } });
    this.http.get<Alerte[]>(`${this.BASE}/alertes/${this.patientId}`)
      .subscribe({ next: (a) => this.setAlertes(a), error: () => {} });
    this.http.get<Aliment[]>(`${this.BASE}/aliments/${this.patientId}`)
      .subscribe({ next: (a) => { this.allAliments = a; this.filterAliments(); }, error: () => {} });
    this.http.get<Restriction[]>(`${this.BASE}/restrictions/${this.patientId}`)
      .subscribe({ next: (r) => { this.restrictions = r; }, error: () => {} });
  }

  private setAlertes(alertes: Alerte[]): void {
    this.toutesAlertes = alertes;
    this.alertesNonLues = alertes.filter(a => !a.lue);
    this.unreadCount = this.alertesNonLues.length;
    this.alertesFiltrees = alertes;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'alertes') {
      this.alerteFilter = 'all';
      this.alertesFiltrees = this.toutesAlertes;
    }
  }

  markAllAlertsRead(): void {
    this.toutesAlertes.forEach(a => { a.lue = true; });
    this.unreadCount = 0;
    this.alertesNonLues = [];
    this.alertesFiltrees = this.toutesAlertes;
  }

  markAlertRead(id: number): void {
    const a = this.toutesAlertes.find(x => x.id === id);
    if (a) { a.lue = true; }
    this.unreadCount = this.toutesAlertes.filter(x => !x.lue).length;
    this.alertesNonLues = this.toutesAlertes.filter(x => !x.lue);
  }

  filterAliments(): void {
    const term = this.searchAliment.toLowerCase();
    const cats = new Set<string>();
    this.alimentsFiltres = this.allAliments.filter(a => {
      const matchTerm = !term || (a.nom || '').toLowerCase().includes(term);
      const matchCat = !this.selectedCat || a.categorie === this.selectedCat;
      if (a.categorie) cats.add(a.categorie);
      return matchTerm && matchCat;
    });
    this.categories = Array.from(cats);
  }

  estAlimentMaison(id: number): boolean { return this.maisonAlimentIds.has(id); }
  toggleAlimentMaison(id: number, event: Event): void {
    event.stopPropagation();
    this.maisonAlimentIds.has(id) ? this.maisonAlimentIds.delete(id) : this.maisonAlimentIds.add(id);
  }

  getAliment(id: number): Aliment | undefined { return this.allAliments.find(a => a.id === id); }
  getAlimentNom(id: number): string { return this.allAliments.find(a => a.id === id)?.nom ?? `#${id}`; }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-FR');
  }

  getLimitPercent(value: number, ref: number): number {
    if (!ref) return 0;
    return Math.min(100, Math.round((value / ref) * 100));
  }

  getLimitBarColor(value: number, ref: number): string {
    const pct = this.getLimitPercent(value, ref);
    if (pct >= 80) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getTypeBg(type: string | undefined): string {
    const map: Record<string, string> = { DANGER: '#fef2f2', AVERTISSEMENT: '#fffbeb', INFO: '#eff6ff' };
    return map[type ?? ''] ?? '#f8fafc';
  }

  getTypeColor(type: string | undefined): string {
    const map: Record<string, string> = { DANGER: '#dc2626', AVERTISSEMENT: '#d97706', INFO: '#2563eb' };
    return map[type ?? ''] ?? '#64748b';
  }

  getTypeIcon(type: string | undefined): string {
    const map: Record<string, string> = { DANGER: '🚨', AVERTISSEMENT: '⚠️', INFO: 'ℹ️' };
    return map[type ?? ''] ?? '🔔';
  }

  getCatColor(cat: string | undefined): string {
    const map: Record<string, string> = { LEGUMES: '#16a34a', FRUITS: '#d97706', VIANDES: '#dc2626', CEREALES: '#ca8a04', LAITAGES: '#2563eb', POISSONS: '#0891b2' };
    return map[cat ?? ''] ?? '#64748b';
  }

  getCatBg(cat: string | undefined): string {
    const map: Record<string, string> = { LEGUMES: '#f0fdf4', FRUITS: '#fffbeb', VIANDES: '#fef2f2', CEREALES: '#fefce8', LAITAGES: '#eff6ff', POISSONS: '#ecfeff' };
    return map[cat ?? ''] ?? '#f8fafc';
  }

  getCatIcon(cat: string | undefined): string {
    const map: Record<string, string> = { LEGUMES: '🥦', FRUITS: '🍎', VIANDES: '🥩', CEREALES: '🌾', LAITAGES: '🥛', POISSONS: '🐟' };
    return map[cat ?? ''] ?? '🍽️';
  }

  getRaisonBg(raison: string | undefined): string {
    return raison === 'INTERACTION' ? '#fef2f2' : raison === 'EXCES' ? '#fffbeb' : '#f8fafc';
  }

  getRaisonColor(raison: string | undefined): string {
    return raison === 'INTERACTION' ? '#dc2626' : raison === 'EXCES' ? '#d97706' : '#64748b';
  }

  getInterpretationColor(interp: string | undefined): string {
    const map: Record<string, string> = { NORMAL: '#86efac', ELEVE: '#fca5a5', BAS: '#fda4af', CRITIQUE: '#f87171' };
    return map[interp ?? ''] ?? '#e2e8f0';
  }

  getInterpretationBg(interp: string | undefined): string {
    const map: Record<string, string> = { NORMAL: '#f0fdf4', ELEVE: '#fef2f2', BAS: '#fef2f2', CRITIQUE: '#fef2f2' };
    return map[interp ?? ''] ?? 'white';
  }

  getInterpretationIcon(interp: string | undefined): string {
    const map: Record<string, string> = { NORMAL: '✅', ELEVE: '⬆️', BAS: '⬇️', CRITIQUE: '🚨' };
    return map[interp ?? ''] ?? '—';
  }

  selectDossier(d: Dossier): void {
    this.labDossierId = d.idDossierMedical;
    this.loadLabResults();
  }

  private loadLabResults(): void {
    if (!this.labDossierId) return;
    this.labLoading = true;
    this.http.get<LabResult[]>(`${this.BASE}/lab/${this.labDossierId}`)
      .subscribe({ next: (r) => { this.labResults = r; this.labLoading = false; }, error: () => { this.labLoading = false; this.labError = 'Erreur chargement résultats'; } });
  }

  adaptNutritionFromLab(): void {
    if (!this.patientId) return;
    this.labAdaptLoading = true;
    this.http.post(`${this.BASE}/adapt/${this.patientId}`, { dossierId: this.labDossierId })
      .subscribe({ next: () => { this.labAdaptLoading = false; this.labAdaptSuccess = true; this.loadData(); }, error: () => { this.labAdaptLoading = false; this.labAdaptError = 'Erreur adaptation'; } });
  }

  openMenus(): void { this.showMenus = true; }
  closeMenus(): void { this.showMenus = false; }
  openMealAnalysis(): void { this.showMealAnalysis = true; }
  closeMealAnalysis(): void { this.showMealAnalysis = false; this.mealAnalysisResult = null; this.mealPhotoPreview = null; }
  resetMealAnalysis(): void { this.mealAnalysisResult = null; this.mealPhotoPreview = null; this.mealAnalysisError = null; }
  openLabPanel(): void { this.activeTab = 'labo'; }

  onMealPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.mealPhotoPreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  setActiveJour(jour: string): void {
    this.activeJour = jour;
    this.menusJourActif = this.semaine[jour] ?? [];
  }

  formatJour(jour: string): string {
    const map: Record<string, string> = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche' };
    return map[jour] ?? jour;
  }

  regenererMenus(): void {
    this.menusLoading = true;
    this.http.post(`${this.BASE}/menus/regenerer/${this.patientId}`, {})
      .subscribe({ next: () => { this.menusLoading = false; }, error: () => { this.menusLoading = false; this.menusError = 'Erreur génération menus'; } });
  }

  toggleRepas(index: number): void {
    this.repasCocheAujourdhui[index] = !this.repasCocheAujourdhui[index];
    this.totalCoche = this.repasCocheAujourdhui.filter(Boolean).length;
  }

  choisirMenu(jour: string, index: number): void { this.menuChoisi = { ...this.menuChoisi, [jour]: index }; }

  genererPdfSemaine(): void {}
  genererPdfGroceries(): void {}

  getRepasIcon(repas: string): string {
    const map: Record<string, string> = { PETIT_DEJEUNER: '🌅', DEJEUNER: '☀️', DINER: '🌙' };
    return map[repas] ?? '🍽️';
  }

  getRepasLabel(repas: string): string {
    const map: Record<string, string> = { PETIT_DEJEUNER: 'Petit-déjeuner', DEJEUNER: 'Déjeuner', DINER: 'Dîner' };
    return map[repas] ?? repas;
  }
}
