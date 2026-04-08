import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  ModuleLaboService,
  PrescriptionBilanDTO,
  AlerteLaboDTO,
  ResultatLabtestDTO,
} from '../services/module-labo.service';
import { MedecinService, Medecin } from '../services/medecin.service';
import { DossierService, DossierMedical } from '../services/dossier';
import { TestLaboratoireService, TestLaboratoire } from '../services/test-laboratoire';
import { PatientService, Patient } from '../services/patient.service';
import { ConfirmService } from '../services/confirm.service';
import { NotificationService } from '../services/notification.service';
import { ResultatLaboratoireService, ResultatLaboratoire } from '../services/resultat-laboratoire';
import { LabResultStoredPdfService } from '../services/lab-result-stored-pdf.service';

/** Courbe d’évolution : créatinine / urée (hausse = mauvais) ou DFG (baisse = mauvais). */
type TrendMode = 'upBad' | 'downBad';

interface EvolutionChartDef {
  key: 'creat' | 'uree' | 'dfg';
  title: string;
  unit: string;
  /** null = agrégation multi-LOINC pour le DFG */
  loinc: string | null;
  mode: TrendMode;
}

@Component({
  selector: 'app-labo-bilan',
  standalone: false,
  templateUrl: './labo-bilan.html',
  styleUrl: './labo-bilan.css',
})
export class LaboBilanComponent implements OnInit {
  currentYear = new Date().getFullYear();

  /** Médecin connecté */
  idMedecin: number | null = null;
  medecinConnecte: Medecin | null = null;
  errorMedecin: string | null = null;

  /** Annuaire idPatient → nom affichable (prénom + nom), sans utiliser l’id à l’écran. */
  private patientNameById = new Map<number, string>();

  /** Prescriptions du médecin */
  prescriptions: PrescriptionBilanDTO[] = [];
  loadingPrescriptions = true;
  errorPrescriptions: string | null = null;

  /** Dossiers du médecin pour créer une demande */
  dossiers: DossierMedical[] = [];
  loadingDossiers = false;
  errorDossiers: string | null = null;

  /** Catalogue des tests (pour sélectionner les examens LOINC) */
  testsCatalog: TestLaboratoire[] = [];
  loadingTestsCatalog = false;
  errorTestsCatalog: string | null = null;

  /** Formulaire demande de tests */
  selectedDossierIdForDemande: number | null = null;
  selectedTestIdsForDemande: number[] = [];
  urgenceForDemande = false;
  urgenceLevelForDemande: 'NORMAL' | 'URGENT' | 'STAT' = 'NORMAL';
  typeBilanForDemande: string = 'AUTRE';
  noteCliniqueForDemande: string = '';
  createDemandeError: string | null = null;
  createDemandeSubmitting = false;
  selectedCategorieForDemande: string = 'ALL';
  dateSouhaiteeForDemande: string = '';
  laboIdForDemande: number | null = 1;
  jeuneRequisForDemande = false;
  modePrelevementForDemande: 'VEINEUX' | 'CAPILLAIRE' | 'URINAIRE' = 'VEINEUX';

  /** Alertes labo non acquittées */
  alertes: AlerteLaboDTO[] = [];
  loadingAlertes = true;
  errorAlertes: string | null = null;

  /** Modifier une demande (popup) */
  showEditDemandePopup = false;
  editDemandeSubmitting = false;
  editDemandeError: string | null = null;
  editingDemande: PrescriptionBilanDTO | null = null;
  editTypeBilan = 'AUTRE';
  editNoteClinique = '';
  editUrgenceLevel: 'NORMAL' | 'URGENT' | 'STAT' = 'NORMAL';
  editSelectedTestIds: number[] = [];
  editSelectedCategorieForDemande = 'ALL';

  /** Définitions panels = codes catalogue NEPHRO + LOINC de secours. */
  private static readonly RENAL_PANEL_DEF: ReadonlyArray<{ code: string; loinc: string }> = [
    { code: 'CREATININEMIE', loinc: '2160-0' },
    { code: 'DFG_ESTIME_SCHWARTZ', loinc: '48642-3' },
    { code: 'UREE', loinc: '3094-0' },
    { code: 'ACIDE_URIQUE', loinc: '3084-1' },
    { code: 'CYSTATINE_C', loinc: '33914-3' },
    { code: 'DFG_CYSTATINE_C', loinc: '76633-7' },
  ];

  private static readonly IONOGRAMME_PANEL_DEF: ReadonlyArray<{ code: string; loinc: string }> = [
    { code: 'NATREMIE', loinc: '2951-2' },
    { code: 'KALIEMIE', loinc: '2823-3' },
    { code: 'CHLOREMIE', loinc: '2075-0' },
    { code: 'BICARBONATES', loinc: '1963-8' },
    { code: 'CALCEMIE', loinc: '2000-8' },
    { code: 'MAGNESEMIE', loinc: '2601-3' },
    { code: 'PHOSPHOREMIE', loinc: '2777-1' },
  ];

  private static readonly PROTEINURIE_PANEL_DEF: ReadonlyArray<{ code: string; loinc: string }> = [
    { code: 'PROTEINURIE', loinc: '2888-6' },
  ];

  private static readonly CREATININE_PANEL_DEF: ReadonlyArray<{ code: string; loinc: string }> = [
    { code: 'CREATININEMIE', loinc: '2160-0' },
  ];

  private static readonly LOINC_DFG_EVOLUTION = new Set([
    '48642-3',
    '33914-3',
    '62238-1',
    '77147-7',
    '50044-7',
    '76633-7',
  ]);

  private static readonly NFS_PANEL_DEF: ReadonlyArray<{ code: string; loinc?: string }> = [{ code: 'NFS' }];

  evolutionCharts: EvolutionChartDef[] = [
    { key: 'creat', title: 'Creatinine', unit: 'µmol/L', loinc: '2160-0', mode: 'upBad' },
    { key: 'uree', title: 'Urea', unit: 'mg/dL', loinc: '3094-0', mode: 'upBad' },
    { key: 'dfg', title: 'eGFR', unit: 'mL/min/1.73m²', loinc: null, mode: 'downBad' },
  ];

  dossierIdEvolution: number | null = null;
  evolutionResults: ResultatLabtestDTO[] = [];
  loadingEvolution = false;
  errorEvolution: string | null = null;

  constructor(
    private moduleLabo: ModuleLaboService,
    private medecinService: MedecinService,
    private dossierService: DossierService,
    private testLaboratoireService: TestLaboratoireService,
    private patientService: PatientService,
    private confirm: ConfirmService,
    private notification: NotificationService,
    private resultatLaboratoireService: ResultatLaboratoireService,
    private labResultStoredPdf: LabResultStoredPdfService,
    private cdr: ChangeDetectorRef,
  ) {}

  /**
   * Évite NG0100 (ExpressionChangedAfterItHasBeenCheckedError) quand un callback HTTP
   * met à jour l’état + toast + loading dans le même tour que la détection de changement.
   */
  private deferUiUpdate(fn: () => void): void {
    setTimeout(() => {
      fn();
      this.cdr.markForCheck();
    }, 0);
  }

  ngOnInit(): void {
    this.dateSouhaiteeForDemande = new Date().toISOString().slice(0, 10);
    this.medecinService.getMe().subscribe({
      next: (me) => {
        this.idMedecin = me.idMedecin;
        this.medecinConnecte = me;
        this.loadPrescriptions();
        this.loadDossiers();
        this.loadTestsCatalog();
        this.loadPatientDirectory();
      },
      error: (err) => {
        this.errorMedecin = err?.message ?? 'Unable to load physician profile.';
      },
    });
    this.loadAlertes();
  }

  loadPrescriptions(): void {
    if (this.idMedecin == null) return;
    this.loadingPrescriptions = true;
    this.errorPrescriptions = null;
    this.moduleLabo.getPrescriptionsByMedecin(this.idMedecin).subscribe({
      next: (list) => {
        this.prescriptions = list;
        this.loadingPrescriptions = false;
      },
      error: (err) => {
        this.errorPrescriptions = err?.error?.message ?? err?.message ?? 'Error loading prescriptions.';
        this.loadingPrescriptions = false;
        this.prescriptions = [];
      },
    });
  }

  /** Charge les patients pour résoudre prénom/nom lorsque le dossier n’a pas `patientNom`. */
  loadPatientDirectory(): void {
    this.patientService.getAll().subscribe({
      next: (list) => {
        this.patientNameById.clear();
        for (const pt of list || []) {
          const label = this.displayNameFromPatient(pt);
          if (label) this.patientNameById.set(pt.idPatient, label);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        /* annuaire optionnel */
      },
    });
  }

  private displayNameFromPatient(pt: Patient): string {
    const fn = (pt.firstName || '').trim();
    const ln = (pt.lastName || '').trim();
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    return (pt.username || '').trim();
  }

  loadDossiers(): void {
    if (this.idMedecin == null) return;
    this.loadingDossiers = true;
    this.errorDossiers = null;
    this.dossierService.getDossiersByMedecin(this.idMedecin).subscribe({
      next: (list) => {
        this.dossiers = list || [];
        this.loadingDossiers = false;
        if (this.dossierIdEvolution == null && this.dossiers.length > 0) {
          const first = this.dossiers[0].idDossierMedical;
          if (first != null) {
            this.dossierIdEvolution = first;
            this.loadEvolutionData();
          }
        }
      },
      error: (err) => {
        this.dossiers = [];
        this.loadingDossiers = false;
        this.errorDossiers = err?.error?.message ?? err?.message ?? 'Error loading patient records.';
      }
    });
  }

  loadTestsCatalog(): void {
    this.loadingTestsCatalog = true;
    this.errorTestsCatalog = null;
    this.testLaboratoireService.getAll().subscribe({
      next: (list) => {
        this.testsCatalog = list || [];
        this.loadingTestsCatalog = false;
        this.applyTestsForTypeBilan(this.typeBilanForDemande);
      },
      error: (err) => {
        this.testsCatalog = [];
        this.loadingTestsCatalog = false;
        this.errorTestsCatalog = err?.error?.message ?? err?.message ?? 'Error loading test catalogue.';
      }
    });
  }

  toggleTestForDemande(idTestLaboratoire: number): void {
    const i = this.selectedTestIdsForDemande.indexOf(idTestLaboratoire);
    if (i >= 0) this.selectedTestIdsForDemande.splice(i, 1);
    else this.selectedTestIdsForDemande.push(idTestLaboratoire);
  }

  /** Quand le type de bilan change : met à jour les cases cochées (sans autre clic). */
  onTypeBilanChange(value: string): void {
    this.typeBilanForDemande = value;
    this.applyTestsForTypeBilan(value);
  }

  /**
   * Coche automatiquement les examens du catalogue selon le type de bilan.
   * Ajuste la catégorie d’examens sur celle du premier test du panel (liste filtrée cohérente).
   */
  private applyTestsForTypeBilan(type: string): void {
    if (type === 'AUTRE') {
      this.selectedTestIdsForDemande = [];
      this.createDemandeError = null;
      this.cdr.detectChanges();
      return;
    }
    if (!this.testsCatalog?.length) return;

    let def: ReadonlyArray<{ code: string; loinc?: string }> | null = null;
    switch (type) {
      case 'RENAL_COMPLET':
        def = LaboBilanComponent.RENAL_PANEL_DEF;
        break;
      case 'IONOGRAMME':
        def = LaboBilanComponent.IONOGRAMME_PANEL_DEF;
        break;
      case 'PROTEINURIE':
        def = LaboBilanComponent.PROTEINURIE_PANEL_DEF;
        break;
      case 'NFS':
        def = LaboBilanComponent.NFS_PANEL_DEF;
        break;
      case 'CREATININE':
        def = LaboBilanComponent.CREATININE_PANEL_DEF;
        break;
      default:
        def = null;
    }

    if (def == null) {
      this.selectedTestIdsForDemande = [];
      this.cdr.detectChanges();
      return;
    }

    const ids = this.resolvePanelTestIds(def);
    this.selectedTestIdsForDemande = [...ids];
    this.createDemandeError = null;

    const idSet = new Set(ids);
    const firstPanel = (this.testsCatalog || []).find(
      (t) => t.idTestLaboratoire != null && idSet.has(t.idTestLaboratoire!),
    );
    const catFromCatalog = firstPanel?.categorie?.trim();
    if (catFromCatalog && (this.categoriesDemande || []).includes(catFromCatalog)) {
      this.selectedCategorieForDemande = catFromCatalog;
    }

    this.cdr.detectChanges();
  }

  /** Résout les id catalogue (code normalisé ou LOINC). */
  private resolvePanelTestIds(def: ReadonlyArray<{ code: string; loinc?: string }>): number[] {
    const catalog = this.testsCatalog || [];
    const norm = (s: string | undefined) => String(s ?? '').trim().toUpperCase();
    const byCode = new Map<string, TestLaboratoire>();
    const byLoinc = new Map<string, TestLaboratoire>();
    for (const t of catalog) {
      if (t.idTestLaboratoire == null) continue;
      const ct = norm(t.codeTest);
      if (ct && !byCode.has(ct)) byCode.set(ct, t);
      const lc = norm(t.codeLoinc);
      if (lc && !byLoinc.has(lc)) byLoinc.set(lc, t);
    }
    const ids: number[] = [];
    const seen = new Set<number>();
    for (const { code, loinc } of def) {
      let t = byCode.get(norm(code));
      if (!t && loinc) t = byLoinc.get(norm(loinc));
      if (!t && code) t = catalog.find((x) => norm(x.codeTest) === norm(code));
      if (!t && loinc) t = catalog.find((x) => norm(x.codeLoinc) === norm(loinc));
      const id = t?.idTestLaboratoire;
      if (id != null && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    return ids;
  }

  setUrgenceLevel(level: 'NORMAL' | 'URGENT' | 'STAT'): void {
    this.urgenceLevelForDemande = level;
    this.urgenceForDemande = level !== 'NORMAL';
  }

  get categoriesDemande(): string[] {
    const set = new Set<string>();
    for (const t of this.testsCatalog || []) {
      if (t.categorie && t.categorie.trim()) set.add(t.categorie.trim());
    }
    return ['ALL', ...Array.from(set)];
  }

  get testsCatalogFilteredForDemande(): TestLaboratoire[] {
    if (this.selectedCategorieForDemande === 'ALL') return this.testsCatalog || [];
    return (this.testsCatalog || []).filter(t => (t.categorie || '').trim() === this.selectedCategorieForDemande);
  }

  get testsCatalogFilteredEdit(): TestLaboratoire[] {
    if (this.editSelectedCategorieForDemande === 'ALL') return this.testsCatalog || [];
    return (this.testsCatalog || []).filter((t) => (t.categorie || '').trim() === this.editSelectedCategorieForDemande);
  }

  dossierLabel(id: number | null): string {
    if (id == null) return '—';
    const d = (this.dossiers || []).find(x => x.idDossierMedical === id);
    if (!d) return `Record #${id}`;
    return `${d.patientNom || 'Patient'} (Record #${d.idDossierMedical})`;
  }

  /**
   * Nom affiché du patient (jamais un identifiant numérique) :
   * 1) `patientNom` du dossier, 2) prénom + nom depuis l’annuaire patients, 3) tiret.
   */
  patientNomPourPrescription(p: PrescriptionBilanDTO): string {
    const d = (this.dossiers || []).find((x) => x.idDossierMedical === p.dossierId);
    if (d?.patientNom?.trim()) return d.patientNom.trim();
    const idPat = d?.idPatient;
    if (idPat != null) {
      const fromReg = this.patientNameById.get(idPat);
      if (fromReg?.trim()) return fromReg.trim();
    }
    return '—';
  }

  /** Libellé médecin prescripteur (nom/prénom), pas l’id. */
  get medecinPrescripteurLibelle(): string {
    const m = this.medecinConnecte;
    if (!m) return '';
    const nom = `${m.prenom || ''} ${m.nom || ''}`.trim();
    return nom ? `Dr. ${nom}` : '';
  }

  /** Tous les examens prescrits ont des résultats enregistrés (backend : COMPLET). */
  prescriptionComplete(p: PrescriptionBilanDTO): boolean {
    return String(p.statut ?? '').toUpperCase() === 'COMPLET';
  }

  /** PDF identique au rapport patient (« Mes résultats » → Report) pour la demande terminée. */
  downloadPrescriptionPdf(p: PrescriptionBilanDTO): void {
    if (!this.prescriptionComplete(p) || p.dossierId == null) return;
    this.resultatLaboratoireService.getByDossier(p.dossierId).subscribe({
      next: (list) => {
        const matches = this.resultatsMatchingPrescription(p, list || []);
        const dossier = (this.dossiers || []).find((d) => d.idDossierMedical === p.dossierId);
        if (matches.length === 0) {
          this.notification.info('No saved laboratory results found for this request yet.');
          return;
        }
        const latest = [...matches].sort((a, b) => this.timestampResultat(b) - this.timestampResultat(a))[0];
        this.labResultStoredPdf.generateFromStoredResult(latest, (dossier as DossierMedical) ?? null);
      },
      error: () => this.notification.error('Could not load laboratory results.'),
    });
  }

  private timestampResultat(r: ResultatLaboratoire): number {
    const raw = r as { dateRendu?: string; datePrelevement?: string };
    const d = raw.dateRendu ?? raw.datePrelevement ?? r.dateResultat;
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  private resultatsMatchingPrescription(
    p: PrescriptionBilanDTO,
    list: ResultatLaboratoire[],
  ): ResultatLaboratoire[] {
    const wanted = new Set(
      (p.examens || []).map((e) => String(e).trim().toUpperCase()).filter(Boolean),
    );
    if (wanted.size === 0) {
      return list;
    }
    const filtered = list.filter((r) => {
      const t = (this.testsCatalog || []).find((x) => x.idTestLaboratoire === r.idTestLaboratoire);
      const loinc = (t?.codeLoinc || '').trim().toUpperCase();
      return !!loinc && wanted.has(loinc);
    });
    return filtered.length > 0 ? filtered : list;
  }

  createDemande(): void {
    this.createDemandeError = null;
    if (this.idMedecin == null) {
      this.createDemandeError = 'Physician profile not loaded.';
      return;
    }
    if (this.selectedDossierIdForDemande == null) {
      this.createDemandeError = 'Select a patient record.';
      return;
    }
    if (this.selectedTestIdsForDemande.length === 0) {
      this.createDemandeError = 'Select at least one test.';
      return;
    }
    const selected = this.testsCatalog.filter(t => this.selectedTestIdsForDemande.includes(t.idTestLaboratoire!));
    const examens = selected.map(t => t.codeLoinc).filter((x): x is string => !!x && x.trim().length > 0);
    if (examens.length === 0) {
      this.createDemandeError = 'Selected tests have no LOINC code.';
      return;
    }

    this.urgenceForDemande = this.urgenceLevelForDemande !== 'NORMAL';
    this.createDemandeSubmitting = true;
    const noteFragments: string[] = [];
    if (this.noteCliniqueForDemande?.trim()) noteFragments.push(this.noteCliniqueForDemande.trim());
    if (this.dateSouhaiteeForDemande) noteFragments.push(`Preferred date: ${this.dateSouhaiteeForDemande}`);
    noteFragments.push(`Urgency: ${this.urgenceLevelForDemande}`);
    noteFragments.push(`Fasting: ${this.jeuneRequisForDemande ? 'Yes' : 'No'}`);
    noteFragments.push(`Collection mode: ${this.modePrelevementForDemande}`);

    const dto: PrescriptionBilanDTO = {
      dossierId: this.selectedDossierIdForDemande,
      medecinId: this.idMedecin,
      datePrescription: new Date().toISOString().slice(0, 19),
      typeBilan: this.typeBilanForDemande,
      examens,
      urgence: this.urgenceForDemande,
      laboId: this.laboIdForDemande ?? undefined,
      noteClinique: noteFragments.join(' | ') || undefined,
    };

    this.moduleLabo.createPrescription(dto).subscribe({
      next: () => {
        this.deferUiUpdate(() => {
          this.createDemandeSubmitting = false;
          this.notification.success('Lab request saved.');
          this.selectedDossierIdForDemande = null;
          this.selectedTestIdsForDemande = [];
          this.urgenceForDemande = false;
          this.urgenceLevelForDemande = 'NORMAL';
          this.noteCliniqueForDemande = '';
          this.typeBilanForDemande = 'AUTRE';
          this.selectedCategorieForDemande = 'ALL';
          this.dateSouhaiteeForDemande = new Date().toISOString().slice(0, 10);
          this.laboIdForDemande = 1;
          this.jeuneRequisForDemande = false;
          this.modePrelevementForDemande = 'VEINEUX';
          this.loadPrescriptions();
        });
      },
      error: (err) => {
        this.createDemandeSubmitting = false;
        const body = err?.error;
        let detail =
          (typeof body === 'string' ? body : null) ??
          body?.message ??
          (Array.isArray(body?.errors) ? body.errors.map((x: { defaultMessage?: string }) => x?.defaultMessage).filter(Boolean).join(' ') : null);
        this.createDemandeError = detail || err?.message || 'Could not create request.';
      }
    });
  }

  loadEvolutionData(): void {
    if (this.dossierIdEvolution == null) {
      this.evolutionResults = [];
      this.errorEvolution = null;
      return;
    }
    this.loadingEvolution = true;
    this.errorEvolution = null;
    this.moduleLabo.getResultatsByDossier(this.dossierIdEvolution).subscribe({
      next: (list) => {
        this.evolutionResults = list || [];
        this.loadingEvolution = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.evolutionResults = [];
        this.errorEvolution = err?.message ?? 'Could not load results for charts.';
        this.loadingEvolution = false;
      },
    });
  }

  /** Série chronologique pour un LOINC fixe. */
  private serieParLoinc(loinc: string): ResultatLabtestDTO[] {
    const n = (s: string | undefined) => String(s ?? '').trim().toUpperCase();
    const target = n(loinc);
    return (this.evolutionResults || [])
      .filter((r) => r.valeur != null && n(r.codeLoinc) === target)
      .sort((a, b) => this.tsResult(a) - this.tsResult(b));
  }

  /** DFG : plusieurs codes LOINC possibles (laboratoires différents). */
  private serieDfg(): ResultatLabtestDTO[] {
    const n = (s: string | undefined) => String(s ?? '').trim().toUpperCase();
    return (this.evolutionResults || [])
      .filter((r) => r.valeur != null && LaboBilanComponent.LOINC_DFG_EVOLUTION.has(n(r.codeLoinc)))
      .sort((a, b) => this.tsResult(a) - this.tsResult(b));
  }

  private tsResult(r: ResultatLabtestDTO): number {
    const d = r.dateRendu || r.datePrelevement;
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  serieForChart(ch: EvolutionChartDef): ResultatLabtestDTO[] {
    if (ch.key === 'dfg') return this.serieDfg();
    return ch.loinc ? this.serieParLoinc(ch.loinc) : [];
  }

  serieValuesForChart(ch: EvolutionChartDef): number[] {
    return this.serieForChart(ch)
      .map((r) => r.valeur as number)
      .filter((v) => v != null && Number.isFinite(v));
  }

  private trendThreeState(values: number[], mode: TrendMode): 'danger' | 'improve' | 'neutral' {
    if (values.length < 3) return 'neutral';
    const a = values[values.length - 3];
    const b = values[values.length - 2];
    const c = values[values.length - 1];
    if (mode === 'upBad') {
      if (a < b && b < c) return 'danger';
      if (a > b && b > c) return 'improve';
    } else {
      if (a > b && b > c) return 'danger';
      if (a < b && b < c) return 'improve';
    }
    return 'neutral';
  }

  trendHintLabel(ch: EvolutionChartDef): string {
    const v = this.serieValuesForChart(ch);
    const st = this.trendThreeState(v, ch.mode);
    if (v.length < 3) return 'At least 3 points are needed to assess a 3-measurement trend.';
    if (st === 'danger') {
      return ch.mode === 'upBad'
        ? '📈 Sustained rise over 3 measurements — correlate clinically (e.g. dehydration, nephrotoxic drugs).'
        : '📉 Sustained eGFR decline over 3 measurements — monitor renal function.';
    }
    if (st === 'improve') {
      return ch.mode === 'upBad'
        ? '📉 Improvement over the last three measurements (markers decreasing).'
        : '📈 Improvement over the last three measurements (eGFR rising).';
    }
    return 'Stable or non-monotonic trend over the last three points.';
  }

  trendHintClass(ch: EvolutionChartDef): string {
    const st = this.trendThreeState(this.serieValuesForChart(ch), ch.mode);
    if (st === 'danger') return 'hint-danger';
    if (st === 'improve') return 'hint-improve';
    return 'hint-neutral';
  }

  sparklinePath(values: number[]): string {
    const w = 300;
    const h = 90;
    const pad = 10;
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values
      .map((v, i) => {
        const x = pad + (values.length <= 1 ? (w - 2 * pad) / 2 : (i / (values.length - 1)) * (w - 2 * pad));
        const y = pad + (1 - (v - min) / span) * (h - 2 * pad);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  sparklineDots(
    values: number[],
    ch: EvolutionChartDef,
  ): { x: number; y: number; alert: boolean }[] {
    const w = 300;
    const h = 90;
    const pad = 10;
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const danger = this.trendThreeState(values, ch.mode) === 'danger';
    return values.map((v, i) => {
      const x = pad + (values.length <= 1 ? (w - 2 * pad) / 2 : (i / (values.length - 1)) * (w - 2 * pad));
      const y = pad + (1 - (v - min) / span) * (h - 2 * pad);
      const isLast3 = i >= values.length - 3;
      return { x, y, alert: danger && isLast3 && values.length >= 3 };
    });
  }

  loadAlertes(): void {
    this.loadingAlertes = true;
    this.errorAlertes = null;
    this.moduleLabo.getAlertesNonAcquittees().subscribe({
      next: (list) => {
        // Reporter après le cycle de détection (évite NG0100 ExpressionChangedAfterItHasBeenCheckedError).
        queueMicrotask(() => {
          this.alertes = list ?? [];
          this.loadingAlertes = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        queueMicrotask(() => {
          this.errorAlertes = err?.message ?? 'Error loading alerts.';
          this.loadingAlertes = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  acquitter(alerte: AlerteLaboDTO): void {
    if (this.idMedecin == null) return;
    this.moduleLabo.acquitterAlerte(alerte.id, this.idMedecin, 'Acknowledged').subscribe({
      next: () => this.scheduleReloadAlertes(),
      error: (err) => alert(err?.message ?? 'Acknowledgement failed'),
    });
  }

  /** Rechargement alertes après action utilisateur sans déclencher NG0100. */
  private scheduleReloadAlertes(): void {
    queueMicrotask(() => this.loadAlertes());
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'Pending',
      PARTIEL: 'Partial',
      COMPLET: 'Complete',
      ANNULE: 'Cancelled',
    };
    return map[statut] ?? statut;
  }

  /** Format date prescription pour affichage (évite le pipe date). */
  formatDatePrescription(date: string | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return date;
    }
  }

  openEditDemande(p: PrescriptionBilanDTO): void {
    if (p.id == null) return;
    this.editingDemande = p;
    this.editTypeBilan = (p.typeBilan as string) || 'AUTRE';
    this.editNoteClinique = p.noteClinique || '';
    this.editUrgenceLevel = p.urgence ? 'URGENT' : 'NORMAL';
    const ids: number[] = [];
    const norm = (s: string) => String(s ?? '').trim();
    for (const loinc of p.examens || []) {
      const t = (this.testsCatalog || []).find((x) => norm(x.codeLoinc || '') === norm(loinc));
      if (t?.idTestLaboratoire != null) ids.push(t.idTestLaboratoire);
    }
    this.editSelectedTestIds = ids;
    this.editSelectedCategorieForDemande = 'ALL';
    this.editDemandeError = null;
    this.showEditDemandePopup = true;
  }

  closeEditDemande(): void {
    this.showEditDemandePopup = false;
    this.editingDemande = null;
    this.editDemandeError = null;
  }

  toggleTestForEdit(idTestLaboratoire: number): void {
    const i = this.editSelectedTestIds.indexOf(idTestLaboratoire);
    if (i >= 0) this.editSelectedTestIds.splice(i, 1);
    else this.editSelectedTestIds.push(idTestLaboratoire);
  }

  onEditTypeBilanChange(value: string): void {
    this.editTypeBilan = value;
    this.applyEditTestsForTypeBilan(value);
  }

  private applyEditTestsForTypeBilan(type: string): void {
    if (type === 'AUTRE') {
      this.editSelectedTestIds = [];
      return;
    }
    if (!this.testsCatalog?.length) return;
    let def: ReadonlyArray<{ code: string; loinc?: string }> | null = null;
    switch (type) {
      case 'RENAL_COMPLET':
        def = LaboBilanComponent.RENAL_PANEL_DEF;
        break;
      case 'IONOGRAMME':
        def = LaboBilanComponent.IONOGRAMME_PANEL_DEF;
        break;
      case 'PROTEINURIE':
        def = LaboBilanComponent.PROTEINURIE_PANEL_DEF;
        break;
      case 'NFS':
        def = LaboBilanComponent.NFS_PANEL_DEF;
        break;
      case 'CREATININE':
        def = LaboBilanComponent.CREATININE_PANEL_DEF;
        break;
      default:
        def = null;
    }
    if (def == null) {
      this.editSelectedTestIds = [];
      return;
    }
    this.editSelectedTestIds = [...this.resolvePanelTestIds(def)];
  }

  setEditUrgenceLevel(level: 'NORMAL' | 'URGENT' | 'STAT'): void {
    this.editUrgenceLevel = level;
  }

  saveEditDemande(): void {
    const orig = this.editingDemande;
    if (!orig?.id || this.idMedecin == null) return;
    const selected = (this.testsCatalog || []).filter((t) => this.editSelectedTestIds.includes(t.idTestLaboratoire!));
    const examens = selected.map((t) => t.codeLoinc).filter((x): x is string => !!x && String(x).trim().length > 0);
    if (examens.length === 0) {
      this.editDemandeError = 'Select at least one test (LOINC code).';
      return;
    }
    this.editDemandeSubmitting = true;
    this.editDemandeError = null;
    const dto: PrescriptionBilanDTO = {
      id: orig.id,
      dossierId: orig.dossierId,
      medecinId: orig.medecinId,
      datePrescription: orig.datePrescription,
      typeBilan: this.editTypeBilan,
      examens,
      urgence: this.editUrgenceLevel !== 'NORMAL',
      laboId: orig.laboId,
      statut: orig.statut,
      noteClinique: this.editNoteClinique.trim() || undefined,
    };
    this.moduleLabo.updatePrescription(orig.id, dto).subscribe({
      next: () => {
        this.deferUiUpdate(() => {
          this.editDemandeSubmitting = false;
          this.closeEditDemande();
          this.notification.success('Request updated.');
          this.loadPrescriptions();
        });
      },
      error: (err: { message?: string }) => {
        this.editDemandeSubmitting = false;
        this.editDemandeError = err?.message ?? 'Update failed.';
      },
    });
  }

  async confirmDeleteDemande(p: PrescriptionBilanDTO): Promise<void> {
    if (p.id == null) return;
    const ok = await this.confirm.confirm(
      'Delete this request? Analysis results linked to this prescription will also be removed.',
      { title: 'Delete request', confirmLabel: 'Delete', cancelLabel: 'Cancel' },
    );
    if (!ok) return;
    this.moduleLabo.deletePrescription(p.id).subscribe({
      next: () => {
        this.deferUiUpdate(() => {
          this.notification.success('Request deleted.');
          this.loadPrescriptions();
          this.loadAlertes();
        });
      },
      error: (err: { message?: string }) =>
        this.notification.error(err?.message ?? 'Could not delete.'),
    });
  }
}
