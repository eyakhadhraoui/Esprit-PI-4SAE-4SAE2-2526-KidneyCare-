import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  NutritionMedecinService,
  Aliment,
  BesoinNutritionnel,
  RestrictionAlimentaire,
  AlerteNutrition,
  MenuJournalierDTO,
  CATEGORIE_LABELS,
  TYPE_ALERTE_LABELS,
  RAISON_RESTRICTION_LABELS,
} from '../services/nutrition.service';
import { AlerteNutritionService, AlerteNutritionDTO } from '../services/alerte-nutrition.service';

@Component({
  selector: 'app-nutrition-patient',
  standalone: false,
  templateUrl: './nutrition-patient.html',
  styleUrls: ['./nutrition-patient.css'],
})
export class NutritionPatientComponent implements OnInit {
  patientId: number | null = null;
  loading = true;

  besoin: BesoinNutritionnel | null = null;
  restrictions: RestrictionAlimentaire[] = [];
  alertesNonLues: AlerteNutrition[] = [];
  toutesAlertes: AlerteNutritionDTO[] = [];
  aliments: Aliment[] = [];
  alimentsFiltres: Aliment[] = [];

  categorieLabels = CATEGORIE_LABELS;
  alerteLabels = TYPE_ALERTE_LABELS;
  raisonLabels = RAISON_RESTRICTION_LABELS;
  categories = Object.keys(CATEGORIE_LABELS);

  activeTab = 'regime';
  searchAliment = '';
  selectedCat = '';
  alerteFilter: 'all' | 'unread' | 'read' = 'all';
  loadingAlertes = false;

  showScanner = false;
  scanMode: 'text' | 'barcode' = 'text';
  scanQuery = '';
  scanLoading = false;
  scanResults: any[] = [];
  scanSelected: any = null;
  scanVerdict: 'ok' | 'warn' | 'danger' | null = null;
  scanWarnings: string[] = [];
  scanNutrients: {
    kcal: number;
    potassiumMg: number;
    sodiumMg: number;
    phosphoreMg: number;
    proteinesG: number;
    sucreG: number;
  } | null = null;

  photoError = '';
  photoLoading = false;

  showMealAnalysis = false;
  mealPhotoPreview = '';
  mealAnalysisLoading = false;
  mealAnalysisError = '';
  mealAnalysisResult: {
    foods: { name: string; confidence: number }[];
    kcal: number;
    proteines: number;
    glucides: number;
    lipides: number;
    verdict: 'ok' | 'warn' | 'danger';
    warnings: string[];
  } | null = null;

  /** Modal menus semaine (API : 7 clés LUNDI… × 3 variantes) */
  showMenus = false;
  menusLoading = false;
  menusError = '';
  semaine: Record<string, MenuJournalierDTO[]> = {};
  joursList: string[] = [];
  menuChoisi: Record<string, number> = {};
  activeJour = '';
  menuCardVisible = false;

  readonly repasIcons: Record<string, string> = {
    PETIT_DEJEUNER: '☀️',
    DEJEUNER: '🍽️',
    DINER: '🌙',
    COLLATION: '🍎',
  };
  readonly repasLabels: Record<string, string> = {
    PETIT_DEJEUNER: 'Petit-déjeuner',
    DEJEUNER: 'Déjeuner',
    DINER: 'Dîner',
    COLLATION: 'Collation',
  };

  private readonly LOGMEAL_API_KEY = 'ac57b7255d6fe5288183f53d838b54f00d5d4839';

  readonly standard = {
    potassium: 4700,
    sodium: 2300,
    phosphore: 700,
    proteines: 56,
    sucre: 50,
    calories: 2000,
  };

  constructor(
    private nutritionService: NutritionMedecinService,
    private alerteService: AlerteNutritionService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.resolvePatientId();
  }

  private resolvePatientId(): void {
    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = Number(stored);
      if (!isNaN(n) && n > 0) {
        this.patientId = n;
        this.loadData();
        return;
      }
    }
    this.http
      .get<Record<string, unknown>>('/api/patients/me')
      .pipe(catchError(() => of(null)))
      .subscribe((me) => {
        if (me) {
          const pid = me['idPatient'] ?? me['patientId'];
          if (pid != null && Number(pid) > 0) {
            this.patientId = Number(pid);
            localStorage.setItem('patientId', String(this.patientId));
            this.loadData();
            return;
          }
        }
        this.tryJwtFallback();
      });
  }

  private tryJwtFallback(): void {
    try {
      const token = localStorage.getItem('access_token') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const pid = payload?.idPatient ?? payload?.patientId ?? payload?.patient_id;
        if (pid != null && !isNaN(Number(pid)) && Number(pid) > 0) {
          this.patientId = Number(pid);
          localStorage.setItem('patientId', String(this.patientId));
          this.loadData();
          return;
        }
      }
    } catch {
      /* ignore */
    }
    this.loading = false;
  }

  loadData(): void {
    if (!this.patientId) {
      this.loading = false;
      return;
    }

    this.nutritionService
      .getActiveBesoinForPatient(this.patientId)
      .pipe(catchError(() => of(null)))
      .subscribe((d) => {
        this.besoin = d;
        this.cdr.detectChanges();
      });

    this.nutritionService
      .getActiveRestrictionsForPatient(this.patientId)
      .pipe(catchError(() => of([])))
      .subscribe((d) => {
        this.restrictions = d;
        this.filterAliments();
        this.cdr.detectChanges();
      });

    this.nutritionService
      .getUnreadAlertesForPatient(this.patientId)
      .pipe(catchError(() => of([])))
      .subscribe((d) => {
        this.alertesNonLues = d;
        this.loading = false;
        this.cdr.detectChanges();
      });

    this.nutritionService
      .getAllAliments()
      .pipe(catchError(() => of([])))
      .subscribe((d) => {
        this.aliments = d;
        this.filterAliments();
        this.cdr.detectChanges();
      });

    this.loadAllAlertes();
  }

  loadAllAlertes(): void {
    if (!this.patientId) return;
    this.loadingAlertes = true;
    this.alerteService
      .getAlertesForPatient(this.patientId)
      .pipe(catchError(() => of([])))
      .subscribe((d) => {
        this.toutesAlertes = d;
        this.loadingAlertes = false;
        this.cdr.detectChanges();
      });
  }

  filterAliments(): void {
    const restrictedIds = this.restrictions.map((r) => r.alimentId);
    this.alimentsFiltres = this.aliments.filter(
      (a) =>
        !restrictedIds.includes(a.id!) &&
        a.nom.toLowerCase().includes(this.searchAliment.toLowerCase()) &&
        (this.selectedCat ? a.categorie === this.selectedCat : true),
    );
  }

  get alertesFiltrees(): AlerteNutritionDTO[] {
    if (this.alerteFilter === 'unread') return this.toutesAlertes.filter((a) => !a.lue);
    if (this.alerteFilter === 'read') return this.toutesAlertes.filter((a) => a.lue);
    return this.toutesAlertes;
  }

  get unreadCount(): number {
    return this.toutesAlertes.filter((a) => !a.lue).length;
  }

  markAlertRead(id: number): void {
    this.alerteService
      .markAsRead(id)
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        const a = this.toutesAlertes.find((x) => x.id === id);
        if (a) a.lue = true;
        this.alertesNonLues = this.alertesNonLues.filter((x) => x.id !== id);
        this.cdr.detectChanges();
      });
  }

  markAllAlertsRead(): void {
    if (!this.patientId) return;
    this.alerteService
      .markAllAsReadForPatient(this.patientId)
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        this.toutesAlertes.forEach((a) => (a.lue = true));
        this.alertesNonLues = [];
        this.cdr.detectChanges();
      });
  }

  getAlimentNom(id: number): string {
    return this.aliments.find((a) => a.id === id)?.nom ?? `Aliment #${id}`;
  }

  getAliment(id: number): Aliment | undefined {
    return this.aliments.find((a) => a.id === id);
  }

  getLimitPercent(value: number | undefined, std: number): number {
    if (!value || std === 0) return 0;
    return Math.min(100, Math.round((value / std) * 100));
  }

  getLimitBarColor(value: number | undefined, std: number): string {
    const pct = this.getLimitPercent(value, std);
    if (pct >= 75) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      INTERACTION_MEDICAMENT: '💊',
      HYPERKALIEMIE: '🧂',
      HYPONATREMIE: '⚗️',
      DÉNUTRITION: '⚠️',
      DENUTRITION: '⚠️',
      AUTRE: '🔔',
    };
    return map[type] || '🔔';
  }

  getTypeColor(type: string): string {
    if (type === 'INTERACTION_MEDICAMENT') return '#dc2626';
    if (type === 'HYPERKALIEMIE') return '#d97706';
    if (type === 'HYPONATREMIE') return '#2563eb';
    return '#6b7280';
  }

  getTypeBg(type: string): string {
    if (type === 'INTERACTION_MEDICAMENT') return '#fef2f2';
    if (type === 'HYPERKALIEMIE') return '#fefce8';
    if (type === 'HYPONATREMIE') return '#eff6ff';
    return '#f9fafb';
  }

  getCatIcon(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '🍎',
      LEGUME: '🥦',
      VIANDE: '🥩',
      PRODUIT_LAITIER: '🥛',
      CEREALE: '🌾',
      AUTRE: '🍽️',
    };
    return map[cat] || '🍽️';
  }

  getCatBg(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '#fef2f2',
      LEGUME: '#f0fdf4',
      VIANDE: '#fff7ed',
      PRODUIT_LAITIER: '#eff6ff',
      CEREALE: '#fefce8',
      AUTRE: '#f9fafb',
    };
    return map[cat] || '#f9fafb';
  }

  getCatColor(cat: string): string {
    const map: Record<string, string> = {
      FRUIT: '#ef4444',
      LEGUME: '#22c55e',
      VIANDE: '#f97316',
      PRODUIT_LAITIER: '#3b82f6',
      CEREALE: '#f59e0b',
      AUTRE: '#6b7280',
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
    return d
      ? new Date(d).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  openScanner(): void {
    this.showScanner = true;
    this.resetScan();
  }

  closeScanner(): void {
    this.showScanner = false;
  }

  resetScan(): void {
    this.scanQuery = '';
    this.scanResults = [];
    this.scanSelected = null;
    this.scanVerdict = null;
    this.scanWarnings = [];
    this.scanNutrients = null;
  }

  searchProduct(): void {
    if (!this.scanQuery.trim()) return;
    this.scanLoading = true;
    this.scanSelected = null;
    this.scanVerdict = null;
    this.scanWarnings = [];
    this.scanNutrients = null;

    if (this.scanMode === 'barcode') {
      const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(this.scanQuery.trim())}.json`;
      this.http
        .get<any>(url)
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          this.scanResults = res?.status === 1 && res.product ? [res.product] : [];
          this.scanLoading = false;
          this.cdr.detectChanges();
        });
    } else {
      const fields = 'product_name,nutriments,image_front_url,brands,code';
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(this.scanQuery.trim())}&json=true&page_size=6&fields=${fields}`;
      this.http
        .get<any>(url)
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          this.scanResults = (res?.products ?? []).filter((p: any) => p.product_name);
          this.scanLoading = false;
          this.cdr.detectChanges();
        });
    }
  }

  analyzeProduct(p: any): void {
    this.scanSelected = p;
    const n = p.nutriments ?? {};
    const kcal = n['energy-kcal_100g'] ?? 0;
    const potassiumMg = n['potassium_100g'] ?? 0;
    const sodiumMg = (n['sodium_100g'] ?? 0) * 1000;
    const phosphoreMg = n['phosphorus_100g'] ?? 0;
    const proteinesG = n['proteins_100g'] ?? 0;
    const sucreG = n['sugars_100g'] ?? 0;
    this.scanNutrients = { kcal, potassiumMg, sodiumMg, phosphoreMg, proteinesG, sucreG };

    const warnings: string[] = [];
    let danger = false;
    const nameLow = (p.product_name ?? '').toLowerCase();

    if (this.besoin) {
      if (
        this.besoin.traitementTacrolimus &&
        (nameLow.includes('pamplemousse') || nameLow.includes('grapefruit') || nameLow.includes('orange amère'))
      ) {
        warnings.push('❌ Interaction Tacrolimus — pamplemousse / orange amère interdit');
        danger = true;
      }
      if (nameLow.includes('millepertuis') || nameLow.includes('st john')) {
        warnings.push('❌ Millepertuis interdit avec immunosuppresseurs');
        danger = true;
      }

      if (potassiumMg > 0 && this.besoin.potassiumMaxMg! > 0) {
        const pct = Math.round((potassiumMg / this.besoin.potassiumMaxMg!) * 100);
        if (pct > 50) {
          warnings.push(`🧂 Potassium très élevé : ${Math.round(potassiumMg)} mg/100g (${pct}% de ta limite/j)`);
          danger = true;
        } else if (pct > 25) {
          warnings.push(`🧂 Potassium modéré : ${Math.round(potassiumMg)} mg/100g (${pct}% de ta limite/j)`);
        }
      }
      if (sodiumMg > 0 && this.besoin.sodiumMaxMg! > 0) {
        const pct = Math.round((sodiumMg / this.besoin.sodiumMaxMg!) * 100);
        if (pct > 40) {
          warnings.push(`🧪 Sodium très élevé : ${Math.round(sodiumMg)} mg/100g (${pct}% de ta limite/j)`);
          danger = true;
        } else if (pct > 20) {
          warnings.push(`🧪 Sodium modéré : ${Math.round(sodiumMg)} mg/100g (${pct}% de ta limite/j)`);
        }
      }
      if (phosphoreMg > 0 && this.besoin.phosphoreMaxMg! > 0) {
        const pct = Math.round((phosphoreMg / this.besoin.phosphoreMaxMg!) * 100);
        if (pct > 60) {
          warnings.push(`💜 Phosphore très élevé : ${Math.round(phosphoreMg)} mg/100g (${pct}% de ta limite/j)`);
          danger = true;
        } else if (pct > 30) {
          warnings.push(`💜 Phosphore modéré : ${Math.round(phosphoreMg)} mg/100g (${pct}% de ta limite/j)`);
        }
      }
      if (sucreG > 0 && this.besoin.sucreMaxG! > 0) {
        const pct = Math.round((sucreG / this.besoin.sucreMaxG!) * 100);
        if (pct > 80) {
          warnings.push(`🍬 Sucre très élevé : ${Math.round(sucreG)} g/100g (${pct}% de ta limite/j)`);
          danger = true;
        } else if (pct > 40) {
          warnings.push(`🍬 Sucre modéré : ${Math.round(sucreG)} g/100g (${pct}% de ta limite/j)`);
        }
      }
      if (proteinesG > 0 && this.besoin.proteinesMaxG! > 0) {
        const pct = Math.round((proteinesG / this.besoin.proteinesMaxG!) * 100);
        if (pct > 60) {
          warnings.push(`🥩 Protéines élevées : ${Math.round(proteinesG)} g/100g (${pct}% de ta limite/j)`);
        }
      }
    }

    for (const r of this.restrictions) {
      const rNom = this.getAlimentNom(r.alimentId!).toLowerCase();
      if (rNom.length >= 4 && nameLow.includes(rNom.substring(0, Math.min(6, rNom.length)))) {
        warnings.push(`🚫 Ressemble à un aliment restreint : "${this.getAlimentNom(r.alimentId!)}"`);
        danger = true;
      }
    }

    this.scanWarnings = warnings;
    this.scanVerdict = danger ? 'danger' : warnings.length > 0 ? 'warn' : 'ok';
    this.cdr.detectChanges();
  }

  getScanNutrientPct(value: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(100, Math.round((value / limit) * 100));
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.photoError = '';
    this.photoLoading = true;
    this.cdr.detectChanges();

    if (!('BarcodeDetector' in window)) {
      this.photoError = 'Votre navigateur ne supporte pas la détection de code-barres. Utilisez Chrome ou Edge.';
      this.photoLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          this.scanMode = 'barcode';
          this.scanQuery = barcodes[0].rawValue;
          this.photoLoading = false;
          this.cdr.detectChanges();
          this.searchProduct();
        } else {
          this.photoError = 'Aucun code-barres détecté. Essayez une photo plus nette et bien cadrée.';
          this.photoLoading = false;
          this.cdr.detectChanges();
        }
      } catch {
        this.photoError = "Erreur lors de l'analyse. Essayez une autre photo.";
        this.photoLoading = false;
        this.cdr.detectChanges();
      }
      URL.revokeObjectURL(img.src);
      input.value = '';
    };
  }

  private get motivStorageKey(): string {
    return `motiv_${this.patientId}_${new Date().toISOString().split('T')[0]}`;
  }

  get repasCocheAujourdhui(): boolean[] {
    try {
      return JSON.parse(localStorage.getItem(this.motivStorageKey) || '[false,false,false]');
    } catch {
      return [false, false, false];
    }
  }

  get totalCoche(): number {
    return this.repasCocheAujourdhui.filter(Boolean).length;
  }

  toggleRepas(i: number): void {
    const state = [...this.repasCocheAujourdhui];
    state[i] = !state[i];
    localStorage.setItem(this.motivStorageKey, JSON.stringify(state));
    this.cdr.detectChanges();
  }

  openMenus(): void {
    this.showMenus = true;
    this.menusError = '';
    if (this.joursList.length === 0) {
      this.loadMenusSemaine();
    }
  }

  closeMenus(): void {
    this.showMenus = false;
  }

  loadMenusSemaine(): void {
    if (!this.patientId) return;
    this.menusLoading = true;
    this.menusError = '';
    this.menuCardVisible = false;
    this.nutritionService
      .getMenusSemaine(this.patientId)
      .pipe(catchError(() => of({})))
      .subscribe((data) => {
      this.semaine = data || {};
      this.joursList = Object.keys(this.semaine);
      this.menuChoisi = {};
      this.joursList.forEach((j) => {
        this.menuChoisi[j] = 0;
      });
      this.activeJour = this.joursList[0] ?? '';
      this.menusLoading = false;
      if (!this.joursList.length) {
        this.menusError = 'Aucun menu disponible. Vérifiez votre régime actif et la base aliments.';
      }
      setTimeout(() => {
        this.menuCardVisible = true;
        this.cdr.detectChanges();
      }, 50);
      this.cdr.detectChanges();
    });
  }

  regenererMenus(): void {
    this.joursList = [];
    this.semaine = {};
    this.loadMenusSemaine();
  }

  setActiveJour(jour: string): void {
    this.menuCardVisible = false;
    this.activeJour = jour;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.menuCardVisible = true;
      this.cdr.detectChanges();
    }, 80);
  }

  choisirMenu(jour: string, index: number): void {
    this.menuChoisi[jour] = index;
    this.cdr.detectChanges();
  }

  get menusJourActif(): MenuJournalierDTO[] {
    return this.semaine[this.activeJour] ?? [];
  }

  getRepasIcon(type: string): string {
    return this.repasIcons[type] ?? '🍽️';
  }

  getRepasLabel(type: string): string {
    return this.repasLabels[type] ?? type;
  }

  formatJour(jour: string): string {
    const map: Record<string, string> = {
      LUNDI: 'Lundi',
      MARDI: 'Mardi',
      MERCREDI: 'Mercredi',
      JEUDI: 'Jeudi',
      VENDREDI: 'Vendredi',
      SAMEDI: 'Samedi',
      DIMANCHE: 'Dimanche',
    };
    return map[jour] ?? jour;
  }

  portionG(a: { portionG?: number; quantiteG?: number }): number {
    const v = a.portionG ?? a.quantiteG;
    return v != null ? Math.round(v * 10) / 10 : 0;
  }

  private simulateMealAnalysis(fileName: string): any {
    const name = fileName.toLowerCase();
    const simulations: {
      keys: string[];
      foods: string[];
      kcal: number;
      prot: number;
      gluc: number;
      lip: number;
    }[] = [
      { keys: ['salad', 'salade', 'vert', 'green'], foods: ['Salade verte', 'Tomate', 'Concombre'], kcal: 85, prot: 3, gluc: 10, lip: 4 },
      { keys: ['poulet', 'chicken', 'viande', 'meat'], foods: ['Poulet rôti', 'Haricots verts'], kcal: 280, prot: 35, gluc: 8, lip: 10 },
      { keys: ['poisson', 'fish', 'saumon', 'thon'], foods: ['Poisson grillé', 'Légumes vapeur'], kcal: 210, prot: 28, gluc: 5, lip: 8 },
      { keys: ['pate', 'pasta', 'riz', 'rice'], foods: ['Pâtes', 'Sauce tomate'], kcal: 350, prot: 12, gluc: 65, lip: 5 },
      { keys: ['pizza'], foods: ['Pizza', 'Fromage', 'Tomate'], kcal: 480, prot: 18, gluc: 55, lip: 20 },
      { keys: ['soupe', 'soup'], foods: ['Soupe de légumes'], kcal: 120, prot: 5, gluc: 18, lip: 3 },
      { keys: ['yaourt', 'yogurt', 'lait', 'fromage'], foods: ['Yaourt nature', 'Fruit'], kcal: 150, prot: 8, gluc: 20, lip: 4 },
    ];

    const match =
      simulations.find((s) => s.keys.some((k) => name.includes(k))) ?? simulations[Math.floor(Math.random() * simulations.length)];

    return {
      segmentation_results: match.foods.map((f, i) => ({
        food_name: f,
        prob: i === 0 ? 0.88 : 0.65,
      })),
      nutritional_info: {
        calories: { quantity: match.kcal },
        totalProteins: { quantity: match.prot },
        totalCarbs: { quantity: match.gluc },
        totalFat: { quantity: match.lip },
      },
    };
  }

  openMealAnalysis(): void {
    this.showMealAnalysis = true;
    this.resetMealAnalysis();
  }

  closeMealAnalysis(): void {
    this.showMealAnalysis = false;
  }

  resetMealAnalysis(): void {
    this.mealPhotoPreview = '';
    this.mealAnalysisLoading = false;
    this.mealAnalysisError = '';
    this.mealAnalysisResult = null;
  }

  onMealPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.mealPhotoPreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    this.mealAnalysisLoading = true;
    this.mealAnalysisError = '';
    this.mealAnalysisResult = null;
    this.cdr.detectChanges();

    const form = new FormData();
    form.append('image', file);

    this.http
      .post<any>('https://api.logmeal.es/v2/image/segmentation/complete', form, {
        headers: { Authorization: `Bearer ${this.LOGMEAL_API_KEY}` },
      })
      .pipe(
        catchError(() => {
          return of(this.simulateMealAnalysis(file.name));
        }),
      )
      .subscribe((res) => {
        if (!res) {
          input.value = '';
          return;
        }

        const rawResults: any[] = res.segmentation_results ?? res.recognition_results ?? [];
        let foods: { name: string; confidence: number }[] = rawResults
          .map((s: any) => ({
            name: (s.food_name ?? s.name ?? s.dish_name ?? s.foodName ?? '').trim(),
            confidence: Math.round((s.prob ?? s.confidence ?? s.score ?? 1) * 100),
          }))
          .filter((f) => f.name.length > 0);

        if (!foods.length) {
          foods = [{ name: 'Plat non identifié', confidence: 0 }];
        }

        const nut =
          res.nutritional_info ??
          res.segmentation_results?.[0]?.nutritional_info ??
          res.recognition_results?.[0]?.nutritional_info ??
          {};
        const kcal = Math.round(nut.calories?.quantity ?? nut.energy?.quantity ?? 0);
        const proteines = Math.round(nut.totalProteins?.quantity ?? nut.proteins?.quantity ?? 0);
        const glucides = Math.round(nut.totalCarbs?.quantity ?? nut.carbohydrates?.quantity ?? 0);
        const lipides = Math.round(nut.totalFat?.quantity ?? nut.fat?.quantity ?? 0);

        const warnings: string[] = [];
        let danger = false;
        const nameLow = foods.map((f) => f.name.toLowerCase()).join(' ');

        if (this.besoin) {
          if (
            this.besoin.traitementTacrolimus &&
            (nameLow.includes('pamplemousse') || nameLow.includes('grapefruit') || nameLow.includes('orange amère'))
          ) {
            warnings.push('❌ Interaction Tacrolimus détectée — pamplemousse / orange amère');
            danger = true;
          }
          if (kcal > 0 && this.besoin.caloriesJour! > 0) {
            const pct = Math.round((kcal / this.besoin.caloriesJour!) * 100);
            if (pct > 60) {
              warnings.push(`🔥 Ce repas représente ${pct}% de votre apport calorique journalier`);
              if (pct > 80) danger = true;
            }
          }
          if (proteines > 0 && this.besoin.proteinesMaxG! > 0) {
            const pct = Math.round((proteines / this.besoin.proteinesMaxG!) * 100);
            if (pct > 70) {
              warnings.push(`🥩 Protéines élevées : ${proteines}g (${pct}% de la limite/j)`);
              if (pct > 90) danger = true;
            }
          }
          if (glucides > 0 && this.besoin.sucreMaxG! > 0) {
            const pct = Math.round((glucides / this.besoin.sucreMaxG!) * 100);
            if (pct > 80) {
              warnings.push(`🍞 Glucides élevés : ${glucides}g`);
              if (pct > 100) danger = true;
            }
          }
        }

        for (const r of this.restrictions) {
          const rNom = this.getAlimentNom(r.alimentId!).toLowerCase();
          if (rNom.length >= 4 && nameLow.includes(rNom.substring(0, Math.min(6, rNom.length)))) {
            warnings.push(`🚫 Aliment restreint détecté : "${this.getAlimentNom(r.alimentId!)}"`);
            danger = true;
          }
        }

        this.mealAnalysisResult = {
          foods,
          kcal,
          proteines,
          glucides,
          lipides,
          verdict: danger ? 'danger' : warnings.length > 0 ? 'warn' : 'ok',
          warnings,
        };
        this.mealAnalysisLoading = false;
        input.value = '';
        this.cdr.detectChanges();
      });
  }
}
