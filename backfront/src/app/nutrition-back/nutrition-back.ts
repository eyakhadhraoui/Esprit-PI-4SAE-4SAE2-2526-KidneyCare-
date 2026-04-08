import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { AlerteNutritionService, AlerteNutritionDTO } from '../services/alerte-nutrition.service';
import { EdamamService } from '../services/edamam.service';
import {
  NutritionMedecinService,
  Aliment,
  BesoinNutritionnel,
  RestrictionAlimentaire,
  AlerteNutrition,
  PatientDTO,
  PatientWeight,
  DernierBilan,
  PrescriptionDTO,
  PrescriptionItemDTO,
  CATEGORIE_LABELS,
  RAISON_RESTRICTION_LABELS,
  TYPE_ALERTE_LABELS,
} from '../services/nutrition.service';

@Component({
  selector: 'app-nutrition-back',
  standalone: false,
  templateUrl: './nutrition-back.html',
  styleUrls: ['./nutrition-back.css'],
})
export class NutritionBackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  patients: PatientDTO[] = [];
  patientId = 0;
  selectedPatient: PatientDTO | null = null;
  patientWeight: PatientWeight | null = null;
  dernierBilan: DernierBilan | null = null;
  allItems: PrescriptionItemDTO[] = [];

  activeTab = 'regime';
  loading = false;

  categorieLabels = CATEGORIE_LABELS;
  raisonLabels = RAISON_RESTRICTION_LABELS;
  alerteLabels = TYPE_ALERTE_LABELS;
  categories = Object.keys(CATEGORIE_LABELS);
  raisonsRestriction = Object.keys(RAISON_RESTRICTION_LABELS);

  aliments: Aliment[] = [];
  filteredAliments: Aliment[] = [];
  searchNom = '';
  selectedCategorie = '';
  showAlimentForm = false;
  editingAlimentId: number | null = null;
  alimentForm: Aliment = this.emptyAliment();
  alimentErrors: Record<string, string> = {};

  besoinActif: BesoinNutritionnel | null = null;
  showBesoinForm = false;
  editingBesoinId: number | null = null;
  besoinForm: BesoinNutritionnel = this.emptyBesoin();
  besoinErrors: Record<string, string> = {};

  restrictions: RestrictionAlimentaire[] = [];
  showRestrictionForm = false;
  restrictionForm: RestrictionAlimentaire = this.emptyRestriction();
  restrictionErrors: Record<string, string> = {};
  generatingAuto = false;

  alertes: AlerteNutrition[] = [];
  unreadCount = 0;

  alerteTab = 'liste';
  alertsPanelOpen = true;
  allAlertes: AlerteNutritionDTO[] = [];
  patientAlertes: AlerteNutritionDTO[] = [];
  unreadAlertes: AlerteNutritionDTO[] = [];
  recentAlertes: AlerteNutritionDTO[] = [];
  loadingAll = false;
  loadingPatient = false;
  loadingUnread = false;
  loadingRecent = false;
  loadingCreate = false;
  selectedPatientAlId = 0;
  recentHours = 24;
  showCreateModal = false;
  showPatientModal = false;
  newAlerte: AlerteNutritionDTO = { patientId: 0, type: 'INTERACTION_MEDICAMENT', message: '', lue: false };
  readonly typeOptions = Object.keys(TYPE_ALERTE_LABELS);

  toastSuccess = false;
  toastError = false;
  toastMsg = '';

  edamamLoading = false;
  edamamError = '';
  edamamOk = false;

  constructor(
    private nutritionService: NutritionMedecinService,
    private alerteService: AlerteNutritionService,
    private cdr: ChangeDetectorRef,
    private edamamService: EdamamService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  fetchFromEdamam(): void {
    if (!this.alimentForm.nom) return;
    this.edamamLoading = true;
    this.edamamError = '';
    this.edamamOk = false;
    this.edamamService.searchNutrients(this.alimentForm.nom).pipe(takeUntil(this.destroy$)).subscribe({
      next: (nutrients) => {
        if (nutrients.caloriesKcal != null) this.alimentForm.caloriesKcal = nutrients.caloriesKcal;
        if (nutrients.proteinesG != null) this.alimentForm.proteinesG = nutrients.proteinesG;
        if (nutrients.sucreG != null) this.alimentForm.sucreG = nutrients.sucreG;
        if (nutrients.sodiumMg != null) this.alimentForm.sodiumMg = nutrients.sodiumMg;
        if (nutrients.potassiumMg != null) this.alimentForm.potassiumMg = nutrients.potassiumMg;
        if (nutrients.phosphoreMg != null) this.alimentForm.phosphoreMg = nutrients.phosphoreMg;
        this.edamamLoading = false;
        this.edamamOk = Object.keys(nutrients).length > 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.edamamLoading = false;
        this.edamamError = 'Impossible de récupérer les données. Vérifiez la configuration API.';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const t = params['tab'];
      if (t && ['regime', 'aliments', 'restrictions', 'alertes'].includes(t)) {
        this.activeTab = t;
      }
    });
    this.loadPatients();
    this.loadAliments();
    this.loadAllAlertes();
    this.loadRecentAlertes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  validateBesoin(): boolean {
    this.besoinErrors = {};
    const f = this.besoinForm;
    if (!f.dateDebut) this.besoinErrors['dateDebut'] = 'La date de début est obligatoire';
    if (f.dateFin && f.dateDebut && f.dateFin < f.dateDebut) this.besoinErrors['dateFin'] = 'La date de fin doit être après la date de début';
    if (!f.caloriesJour || f.caloriesJour <= 0) this.besoinErrors['caloriesJour'] = 'Les calories doivent être supérieures à 0';
    if (f.potassiumMaxMg == null || f.potassiumMaxMg < 0) this.besoinErrors['potassiumMaxMg'] = 'La valeur ne peut pas être négative';
    if (f.sodiumMaxMg == null || f.sodiumMaxMg < 0) this.besoinErrors['sodiumMaxMg'] = 'La valeur ne peut pas être négative';
    if (f.phosphoreMaxMg == null || f.phosphoreMaxMg < 0) this.besoinErrors['phosphoreMaxMg'] = 'La valeur ne peut pas être négative';
    if (f.proteinesMaxG == null || f.proteinesMaxG < 0) this.besoinErrors['proteinesMaxG'] = 'La valeur ne peut pas être négative';
    if (f.sucreMaxG == null || f.sucreMaxG < 0) this.besoinErrors['sucreMaxG'] = 'La valeur ne peut pas être négative';
    if (f.poidsKg != null && f.poidsKg < 0) this.besoinErrors['poidsKg'] = 'Le poids ne peut pas être négatif';
    if (f.poidsKg != null && f.poidsKg > 300) this.besoinErrors['poidsKg'] = 'Le poids semble incorrect (max 300 kg)';
    if (f.ageMois != null && f.ageMois < 0) this.besoinErrors['ageMois'] = "L'âge ne peut pas être négatif";
    if (f.caloriesJour != null && f.caloriesJour > 5000) this.besoinErrors['caloriesJour'] = 'Les calories semblent trop élevées (max 5000)';
    return Object.keys(this.besoinErrors).length === 0;
  }

  validateAliment(): boolean {
    this.alimentErrors = {};
    const f = this.alimentForm;
    if (!f.nom || f.nom.trim().length === 0) this.alimentErrors['nom'] = "Le nom de l'aliment est obligatoire";
    if (f.nom && f.nom.trim().length < 2) this.alimentErrors['nom'] = 'Le nom doit contenir au moins 2 caractères';
    if (!f.categorie) this.alimentErrors['categorie'] = 'La catégorie est obligatoire';
    if (f.interactionTacrolimus && (!f.notes || f.notes.trim().length === 0))
      this.alimentErrors['notes'] = "Précisez l'interaction Tacrolimus dans les notes";
    return Object.keys(this.alimentErrors).length === 0;
  }

  validateRestriction(): boolean {
    this.restrictionErrors = {};
    const f = this.restrictionForm;
    if (!f.alimentId || f.alimentId === 0) this.restrictionErrors['alimentId'] = 'Veuillez sélectionner un aliment';
    if (!f.raison || f.raison.trim() === '') this.restrictionErrors['raison'] = 'Veuillez sélectionner une raison';
    if (!f.dateDebut) this.restrictionErrors['dateDebut'] = 'La date de début est obligatoire';
    const existeDeja = this.restrictions.some((r) => r.alimentId === f.alimentId && !r.dateFin);
    if (existeDeja) this.restrictionErrors['alimentId'] = 'Une restriction active existe déjà pour cet aliment';
    return Object.keys(this.restrictionErrors).length === 0;
  }

  loadPatients(): void {
    this.nutritionService.getAllPatients().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: PatientDTO[]) => {
        this.patients = data;
        if (data.length > 0) {
          this.patientId = data[0].idPatient;
          this.selectedPatient = data[0];
          this.loadPatientData();
        }
        this.cdr.detectChanges();
      },
      error: (err: { status?: number }) =>
        this.showError(
          err?.status === 0
            ? 'Service prescription injoignable (port 8086). Démarrez prescription-Service ou vérifiez le proxy /prescription.'
            : 'Erreur chargement patients',
        ),
    });
  }

  onPatientChange(): void {
    this.selectedPatient = this.patients.find((p) => p.idPatient === +this.patientId) ?? null;
    this.besoinActif = null;
    this.restrictions = [];
    this.alertes = [];
    this.unreadCount = 0;
    this.patientWeight = null;
    this.dernierBilan = null;
    this.allItems = [];
    this.loadPatientData();
  }

  loadPatientData(): void {
    this.loading = true;
    this.loadBesoinActif();
    this.loadRestrictions();
    this.loadAlertes();
    this.loadPatientWeight();
    this.loadMedications();
    this.loadDernierBilan();
  }

  loadPatientWeight(): void {
    this.nutritionService.getLatestWeight(this.patientId).pipe(takeUntil(this.destroy$), catchError(() => of(null))).subscribe((data) => {
      this.patientWeight = data;
      this.cdr.detectChanges();
    });
  }

  loadDernierBilan(): void {
    this.nutritionService.getDernierBilan(this.patientId).pipe(takeUntil(this.destroy$), catchError(() => of(null))).subscribe((data) => {
      this.dernierBilan = data;
      this.cdr.detectChanges();
    });
  }

  loadMedications(): void {
    this.nutritionService.getActivePrescriptions(this.patientId).pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe((prescriptions: PrescriptionDTO[]) => {
      this.allItems = [];
      if (!prescriptions?.length) {
        this.cdr.detectChanges();
        return;
      }
      prescriptions.forEach((p: PrescriptionDTO) => {
        const embedded = p.prescriptionItems?.length ? p.prescriptionItems : p.items;
        if (embedded?.length) {
          this.allItems = [...this.allItems, ...embedded];
        } else if (p.id) {
          this.nutritionService.getPrescriptionItems(p.id).pipe(catchError(() => of([]))).subscribe((items: PrescriptionItemDTO[]) => {
            this.allItems = [...this.allItems, ...items];
            this.cdr.detectChanges();
          });
        }
      });
      this.cdr.detectChanges();
    });
  }

  getPatientFullName(): string {
    if (!this.selectedPatient) return `Patient #${this.patientId}`;
    return `${this.selectedPatient.firstName ?? ''} ${this.selectedPatient.lastName ?? ''}`.trim() || `Patient #${this.patientId}`;
  }

  calculerCalories(poidsKg: number, ageMois: number): number {
    if (!poidsKg || poidsKg <= 0) return 0;
    const ageAns = ageMois / 12;
    const kcalParKg = ageAns < 3 ? 80 : ageAns < 6 ? 70 : ageAns < 12 ? 60 : 50;
    return Math.round(poidsKg * kcalParKg);
  }

  calculerRegimeAuto(): void {
    const poidsBilan = this.dernierBilan?.poids ?? null;
    const tailleBilan = this.dernierBilan?.taille ?? null;
    const poids = poidsBilan || this.patientWeight?.weightKg || this.besoinForm.poidsKg || 0;
    if (!poids || poids <= 0) {
      this.besoinErrors['poidsKg'] = 'Aucun poids disponible (bilan ou dossier patient)';
      this.cdr.detectChanges();
      return;
    }
    delete this.besoinErrors['poidsKg'];
    this.besoinForm.poidsKg = poids;
    if (tailleBilan) this.besoinForm.ageMois = this.besoinForm.ageMois || 0;
    const ageMois = this.besoinForm.ageMois || 0;
    const hasTacrolimus = this.allItems.some((i) => this.matchMed(i.medicationName || '', ['tacrolimus', 'prograf', 'advagraf']));
    const hasPrednisone = this.allItems.some((i) => this.matchMed(i.medicationName || '', ['prednisone', 'prednisolone', 'cortisone', 'methylprednisolone', 'solupred']));
    const k = this.dernierBilan?.potassium;
    const phos = this.dernierBilan?.phosphore;
    const dfg = this.dernierBilan?.dfg;
    const gly = this.dernierBilan?.glycemie;
    const calories = this.calculerCalories(poids, ageMois);
    this.besoinForm.potassiumMaxMg =
      k != null ? (k > 5.5 ? Math.round(poids * 30) : k > 5.0 ? Math.round(poids * 35) : Math.round(poids * 40)) : Math.round(poids * 40);
    this.besoinForm.sodiumMaxMg = Math.round(poids * 30);
    this.besoinForm.phosphoreMaxMg =
      phos != null ? (phos > 1.5 ? Math.round(poids * 15) : Math.round(poids * 20)) : Math.round(poids * 20);
    this.besoinForm.proteinesMaxG =
      dfg != null
        ? dfg < 30
          ? Math.round(poids * 0.8 * 10) / 10
          : dfg < 60
            ? Math.round(poids * 1.0 * 10) / 10
            : Math.round(poids * 1.5 * 10) / 10
        : Math.round(poids * 1.5 * 10) / 10;
    const sucreRestreint = hasPrednisone || (gly != null && gly > 126);
    this.besoinForm.sucreMaxG = sucreRestreint ? Math.round((calories * 0.05) / 4) : Math.round((calories * 0.1) / 4);
    this.besoinForm.caloriesJour = calories;
    this.besoinForm.traitementTacrolimus = hasTacrolimus;
    this.besoinForm.traitementPrednisone = hasPrednisone;
    const ageLabel = !ageMois ? '?' : ageMois < 12 ? `${ageMois} mois` : `${Math.floor(ageMois / 12)} ans`;
    const meds = [hasTacrolimus ? 'Tacrolimus' : '', hasPrednisone ? 'Prednisone' : ''].filter(Boolean).join(', ');
    const bilanInfo = this.dernierBilan
      ? ` | Bilan: K=${k ?? '?'} mmol/L, DFG=${dfg ?? '?'} mL/min, Phos=${phos ?? '?'} mmol/L`
      : ' | Aucun bilan disponible';
    this.besoinForm.raisonCalcul = `Calculé automatiquement — Poids: ${poids}kg, Âge: ${ageLabel}${meds ? ', Traitements: ' + meds : ''}${bilanInfo}`;
    this.showSuccess('✅ Régime calculé selon bilan + médicaments !');
    this.cdr.detectChanges();
  }

  private matchMed(name: string, keywords: string[]): boolean {
    const n = name.toLowerCase();
    return keywords.some((k) => n.includes(k));
  }

  async genererRestrictionsAuto(): Promise<void> {
    this.generatingAuto = true;
    let created = 0;
    let skipped = 0;
    const hasTacrolimus =
      this.allItems.some((i) => this.matchMed(i.medicationName || '', ['tacrolimus', 'prograf', 'advagraf'])) || !!this.besoinActif?.traitementTacrolimus;
    const hasCyclosporine = this.allItems.some((i) => this.matchMed(i.medicationName || '', ['cyclosporine', 'ciclosporine', 'sandimmun', 'neoral']));
    if (!hasTacrolimus && !hasCyclosporine) {
      this.generatingAuto = false;
      this.showError('Aucun traitement avec interaction alimentaire détecté.');
      return;
    }
    for (const aliment of this.aliments) {
      const needs =
        (hasTacrolimus && aliment.interactionTacrolimus) || (hasCyclosporine && aliment.interactionCyclosporine);
      if (!needs) continue;
      if (!aliment?.id) {
        skipped++;
        continue;
      }
      const existeDeja = this.restrictions.some((r) => r.alimentId === aliment.id && !r.dateFin);
      if (existeDeja) {
        skipped++;
        continue;
      }
      const raison =
        hasTacrolimus && aliment.interactionTacrolimus
          ? 'TACROLIMUS'
          : hasCyclosporine && aliment.interactionCyclosporine
            ? 'CYCLOSPORINE'
            : 'AUTRE';
      try {
        await firstValueFrom(
          this.nutritionService.createRestriction({
            patientId: this.patientId,
            alimentId: aliment.id,
            raison,
            creeAutomatiquement: true,
            dateDebut: new Date().toISOString().split('T')[0],
            notes: aliment.notes || '',
          }),
        );
        created++;
      } catch {
        skipped++;
      }
    }
    this.generatingAuto = false;
    this.loadRestrictions();
    if (created > 0) this.showSuccess(`⚡ ${created} restriction(s) créée(s) !`);
    else this.showSuccess('✅ Aucune nouvelle restriction nécessaire');
    this.cdr.detectChanges();
  }

  loadAliments(): void {
    this.nutritionService.getAllAliments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: Aliment[]) => {
        this.aliments = data;
        this.filteredAliments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.showError('Erreur chargement aliments');
      },
    });
  }

  filterAliments(): void {
    this.filteredAliments = this.aliments.filter(
      (a) =>
        a.nom.toLowerCase().includes(this.searchNom.toLowerCase()) &&
        (this.selectedCategorie ? a.categorie === this.selectedCategorie : true),
    );
  }

  resetAlimentFilters(): void {
    this.searchNom = '';
    this.selectedCategorie = '';
    this.filteredAliments = [...this.aliments];
  }

  openAlimentForm(aliment?: Aliment): void {
    this.alimentForm = aliment ? { ...aliment } : this.emptyAliment();
    this.editingAlimentId = aliment?.id ?? null;
    this.alimentErrors = {};
    this.edamamOk = false;
    this.edamamError = '';
    this.showAlimentForm = true;
  }

  closeAlimentForm(): void {
    this.showAlimentForm = false;
    this.alimentForm = this.emptyAliment();
    this.editingAlimentId = null;
    this.alimentErrors = {};
    this.edamamOk = false;
    this.edamamError = '';
  }

  saveAliment(): void {
    if (!this.validateAliment()) {
      this.showError('Veuillez corriger les erreurs avant de sauvegarder');
      this.cdr.detectChanges();
      return;
    }
    const obs = this.editingAlimentId
      ? this.nutritionService.updateAliment(this.editingAlimentId, this.alimentForm)
      : this.nutritionService.createAliment(this.alimentForm);
    obs.subscribe({
      next: () => {
        this.showSuccess(this.editingAlimentId ? 'Aliment mis à jour !' : 'Aliment créé !');
        this.closeAlimentForm();
        this.loadAliments();
      },
      error: () => this.showError('Erreur enregistrement aliment'),
    });
  }

  deleteAliment(id: number): void {
    if (!confirm('Supprimer cet aliment définitivement ?')) return;
    this.nutritionService.deleteAliment(id).subscribe({
      next: () => {
        this.showSuccess('Aliment supprimé !');
        this.loadAliments();
      },
      error: () => this.showError('Erreur suppression'),
    });
  }

  isRestricted(alimentId: number): boolean {
    return this.restrictions.some((r) => r.alimentId === alimentId && !r.dateFin);
  }

  addRestrictionFromAliment(aliment: Aliment): void {
    this.restrictionForm = this.emptyRestriction();
    this.restrictionForm.alimentId = aliment.id!;
    this.restrictionErrors = {};
    this.showRestrictionForm = true;
  }

  getCatStyle(categorie: string): Record<string, string> {
    const map: Record<string, { bg: string; color: string }> = {
      FRUIT: { bg: '#fed7d7', color: '#c53030' },
      LEGUME: { bg: '#c6f6d5', color: '#22543d' },
      VIANDE: { bg: '#feebc8', color: '#c05621' },
      PRODUIT_LAITIER: { bg: '#bee3f8', color: '#2c5282' },
      CEREALE: { bg: '#fef9c3', color: '#78350f' },
      AUTRE: { bg: '#e2e8f0', color: '#4a5568' },
    };
    const s = map[categorie] ?? { bg: '#e2e8f0', color: '#4a5568' };
    return { background: s.bg, color: s.color };
  }

  loadBesoinActif(): void {
    this.nutritionService.getActiveBesoinForPatient(this.patientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: BesoinNutritionnel | null) => {
        this.besoinActif = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.besoinActif = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openBesoinForm(edit = false): void {
    this.besoinErrors = {};
    if (edit && this.besoinActif) {
      this.besoinForm = { ...this.besoinActif };
      this.editingBesoinId = this.besoinActif.id!;
    } else {
      this.besoinForm = this.emptyBesoin();
      if (this.patientWeight?.weightKg) this.besoinForm.poidsKg = this.patientWeight.weightKg;
      this.editingBesoinId = null;
    }
    this.showBesoinForm = true;
  }

  closeBesoinForm(): void {
    this.showBesoinForm = false;
    this.besoinForm = this.emptyBesoin();
    this.editingBesoinId = null;
    this.besoinErrors = {};
  }

  saveBesoin(): void {
    if (!this.validateBesoin()) {
      this.showError('Veuillez corriger les erreurs avant de sauvegarder');
      this.cdr.detectChanges();
      return;
    }
    this.besoinForm.patientId = this.patientId;
    const obs = this.editingBesoinId
      ? this.nutritionService.updateBesoin(this.editingBesoinId, this.besoinForm)
      : this.nutritionService.createBesoin(this.besoinForm);
    obs.subscribe({
      next: () => {
        this.showSuccess(this.editingBesoinId ? 'Régime mis à jour !' : 'Régime créé !');
        this.closeBesoinForm();
        this.loadBesoinActif();
      },
      error: () => this.showError('Erreur enregistrement régime'),
    });
  }

  deleteBesoin(id: number): void {
    if (!confirm('Supprimer ce régime nutritionnel ?')) return;
    this.nutritionService.deleteBesoin(id).subscribe({
      next: () => {
        this.showSuccess('Régime supprimé !');
        this.besoinActif = null;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Erreur suppression'),
    });
  }

  loadRestrictions(): void {
    this.nutritionService.getActiveRestrictionsForPatient(this.patientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: RestrictionAlimentaire[]) => {
        this.restrictions = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.restrictions = [];
      },
    });
  }

  saveRestriction(): void {
    if (!this.validateRestriction()) {
      this.cdr.detectChanges();
      return;
    }
    this.restrictionForm.patientId = this.patientId;
    this.restrictionForm.creeAutomatiquement = false;
    this.nutritionService.createRestriction(this.restrictionForm).subscribe({
      next: () => {
        this.showSuccess('Restriction ajoutée !');
        this.showRestrictionForm = false;
        this.restrictionErrors = {};
        this.loadRestrictions();
      },
      error: () => this.showError('Erreur ajout restriction'),
    });
  }

  closeRestrictionForm(): void {
    this.showRestrictionForm = false;
    this.restrictionForm = this.emptyRestriction();
    this.restrictionErrors = {};
  }

  deleteRestriction(id: number): void {
    if (!confirm('Lever cette restriction alimentaire ?')) return;
    this.nutritionService.deleteRestriction(id).subscribe({
      next: () => {
        this.showSuccess('Restriction levée !');
        this.loadRestrictions();
      },
      error: () => this.showError('Erreur suppression'),
    });
  }

  getAlimentNom(alimentId: number): string {
    return this.aliments.find((a) => a.id === alimentId)?.nom ?? `Aliment #${alimentId}`;
  }

  loadAlertes(): void {
    this.nutritionService.getUnreadAlertesForPatient(this.patientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: AlerteNutrition[]) => {
        this.alertes = data;
        this.unreadCount = data.filter((a) => !a.lue).length;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertes = [];
      },
    });
  }

  markAlertRead(id: number | undefined): void {
    if (id == null) return;
    this.nutritionService.markAlerteAsRead(id).subscribe({
      next: () => {
        const a = this.alertes.find((x) => x.id === id);
        if (a) {
          a.lue = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.cdr.detectChanges();
      },
    });
  }

  markAllRead(): void {
    this.nutritionService.markAllAlertesAsRead(this.patientId).subscribe({
      next: () => {
        this.alertes.forEach((a) => (a.lue = true));
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
    });
  }

  setAlerteTab(tab: string): void {
    this.alerteTab = tab;
  }

  loadAllAlertes(): void {
    this.loadingAll = true;
    this.alerteService.getAllAlertes().pipe(catchError(() => of([]))).subscribe((data) => {
      this.allAlertes = data;
      this.loadingAll = false;
      this.cdr.detectChanges();
    });
  }

  loadPatientAlertesAdmin(): void {
    if (!this.selectedPatientAlId) return;
    this.loadingPatient = true;
    this.alerteService.getAlertesForPatient(this.selectedPatientAlId).pipe(catchError(() => of([]))).subscribe((data) => {
      this.patientAlertes = data;
      this.loadingPatient = false;
      this.cdr.detectChanges();
    });
    this.loadUnreadCountAdmin();
  }

  loadUnreadAlertesAdmin(): void {
    if (!this.selectedPatientAlId) return;
    this.loadingUnread = true;
    this.alerteService.getUnreadAlertesForPatient(this.selectedPatientAlId).pipe(catchError(() => of([]))).subscribe((data) => {
      this.unreadAlertes = data;
      this.loadingUnread = false;
      this.cdr.detectChanges();
    });
  }

  loadUnreadCountAdmin(): void {
    if (!this.selectedPatientAlId) return;
    this.alerteService.countUnreadAlertes(this.selectedPatientAlId).pipe(catchError(() => of(0))).subscribe((count) => {
      this.unreadCount = count;
      this.cdr.detectChanges();
    });
  }

  loadRecentAlertes(): void {
    this.loadingRecent = true;
    this.alerteService.getRecentAlertes(this.recentHours).pipe(catchError(() => of([]))).subscribe((data) => {
      this.recentAlertes = data;
      this.loadingRecent = false;
      this.cdr.detectChanges();
    });
  }

  markAlerteReadAdmin(id: number | undefined): void {
    if (id == null) return;
    this.alerteService.markAsRead(id).pipe(catchError(() => of(void 0))).subscribe(() => {
      this.showSuccess('Alerte marquée comme lue');
      this.loadAllAlertes();
      if (this.selectedPatientAlId) {
        this.loadPatientAlertesAdmin();
        this.loadUnreadAlertesAdmin();
      }
    });
  }

  markAllAlertesReadAdmin(): void {
    if (!this.selectedPatientAlId) return;
    this.alerteService.markAllAsReadForPatient(this.selectedPatientAlId).pipe(catchError(() => of(void 0))).subscribe(() => {
      this.showSuccess('Toutes les alertes marquées comme lues');
      this.loadPatientAlertesAdmin();
      this.loadUnreadAlertesAdmin();
    });
  }

  openCreateModal(): void {
    this.newAlerte = { patientId: 0, type: 'INTERACTION_MEDICAMENT', message: '', lue: false };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateAlerte(): void {
    if (!this.newAlerte.patientId || !this.newAlerte.message.trim()) {
      this.showError('Remplissez tous les champs obligatoires');
      return;
    }
    this.loadingCreate = true;
    this.newAlerte.dateAlerte = new Date().toISOString();
    this.alerteService.createAlerte(this.newAlerte).pipe(catchError(() => of(null))).subscribe((result) => {
      this.loadingCreate = false;
      if (result) {
        this.showSuccess('Alerte créée avec succès');
        this.showCreateModal = false;
        this.loadAllAlertes();
        this.loadRecentAlertes();
      } else {
        this.showError('Erreur lors de la création');
      }
    });
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      INTERACTION_MEDICAMENT: '💊',
      HYPERKALIEMIE: '🧂',
      HYPONATREMIE: '⚗️',
      DÉNUTRITION: '⚠️',
      AUTRE: '🔔',
    };
    return map[type] || '🔔';
  }

  getTypeClass(type: string): string {
    return type === 'INTERACTION_MEDICAMENT' ? 'danger' : 'warning';
  }

  emptyAliment(): Aliment {
    return {
      nom: '',
      categorie: '',
      potassiumMg: 0,
      sodiumMg: 0,
      phosphoreMg: 0,
      proteinesG: 0,
      sucreG: 0,
      caloriesKcal: 0,
      interactionTacrolimus: false,
      interactionCyclosporine: false,
      ageMinimumMois: 0,
      raisonRestrictionAge: '',
      notes: '',
    };
  }

  emptyBesoin(): BesoinNutritionnel {
    return {
      patientId: this.patientId,
      potassiumMaxMg: 0,
      sodiumMaxMg: 0,
      phosphoreMaxMg: 0,
      proteinesMaxG: 0,
      sucreMaxG: 0,
      caloriesJour: 0,
      poidsKg: 0,
      ageMois: 0,
      traitementTacrolimus: false,
      traitementPrednisone: false,
      dateDebut: new Date().toISOString().split('T')[0],
    };
  }

  emptyRestriction(): RestrictionAlimentaire {
    return {
      patientId: this.patientId,
      alimentId: 0,
      raison: '',
      creeAutomatiquement: false,
      dateDebut: new Date().toISOString().split('T')[0],
    };
  }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '—';
  }

  formatDateTime(date: string): string {
    return date ? new Date(date).toLocaleString('fr-FR') : '—';
  }

  showSuccess(msg: string): void {
    this.toastMsg = msg;
    this.toastSuccess = true;
    this.toastError = false;
    setTimeout(() => {
      this.toastSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  showError(msg: string): void {
    this.toastMsg = msg;
    this.toastError = true;
    this.toastSuccess = false;
    setTimeout(() => {
      this.toastError = false;
      this.cdr.detectChanges();
    }, 3500);
  }
}
