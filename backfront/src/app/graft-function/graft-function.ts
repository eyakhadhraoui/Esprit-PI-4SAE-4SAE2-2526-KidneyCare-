import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthRoleService, PatientUser } from '../services/auth-role.service';
import {
  GraftFunctionService,
  GraftFunctionEntry,
  ReferenceValue,
  AlertThreshold,
  GraftSurvivalScore
} from '../services/graft-function.service';

export type ActiveTab = 'entries' | 'reference' | 'thresholds' | 'scores';

@Component({
  selector: 'app-graft-function',
  standalone: false,
  templateUrl: './graft-function.html',
  styleUrls: ['./graft-function.css']
})
export class GraftFunctionComponent implements OnInit {
  Math = Math;

  constructor(
    private svc: GraftFunctionService,
    private cdr: ChangeDetectorRef,
    public auth: AuthRoleService
  ) {}

  ngOnInit() {
    this.loadAll();
    if (this.auth.isMedecin()) {
      this.loadKeycloakPatients();
    }
  }

  keycloakPatients: PatientUser[] = [];

  get patients(): PatientUser[] {
    if (this.auth.isMedecin()) {
      return this.keycloakPatients;
    } else if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      return username ? [{ username, displayName: username }] : [];
    }
    return [];
  }

  loadKeycloakPatients() {
    this.auth.getPatientUsers().subscribe({
      next: (users: PatientUser[]) => {
        this.keycloakPatients = users;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const st = err?.status;
        if (st !== 401 && st !== 403) {
          console.warn('Chargement patients indisponible:', err);
        }
        this.keycloakPatients = [];
      }
    });
  }

  readonly collectionTypes = ['ROUTINE', 'URGENT', 'POST_BIOPSY'];
  readonly alertLevels     = ['WATCH', 'WARNING', 'CRITICAL'];
  readonly riskLevels      = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  entries:    GraftFunctionEntry[] = [];
  refs:       ReferenceValue[]     = [];
  thresholds: AlertThreshold[]     = [];
  scores:     GraftSurvivalScore[] = [];
  loading     = false;
  apiError    = '';

  activeTab: ActiveTab = 'entries';

  setTab(tab: ActiveTab) {
    this.activeTab = tab;
  }

  loadAll() {
    this.loading  = true;
    this.apiError = '';
    const markGraftUnavailable = () => {
      if (!this.apiError) {
        this.apiError =
          'API greffon indisponible (vérifiez le service sur le port 8095 et le proxy /graft-api).';
      }
      this.loading = false;
      this.cdr.detectChanges();
    };
    this.svc.getAllEntries().subscribe({
      next: d => { this.entries = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => {
        this.entries = [];
        markGraftUnavailable();
      }
    });
    this.svc.getAllRefs().subscribe({
      next: d => { this.refs = d; this.cdr.detectChanges(); },
      error: () => {
        this.refs = [];
        markGraftUnavailable();
      }
    });
    this.svc.getAllThresholds().subscribe({
      next: d => { this.thresholds = d; this.cdr.detectChanges(); },
      error: () => {
        this.thresholds = [];
        markGraftUnavailable();
      }
    });
    this.svc.getAllScores().subscribe({
      next: d => { this.scores = d; this.cdr.detectChanges(); },
      error: () => {
        this.scores = [];
        markGraftUnavailable();
      }
    });
  }

  deleteConfirm = { show: false, type: '', label: '', id: 0 };

  askDelete(type: string, id: number, label: string) {
    this.deleteConfirm = { show: true, type, label, id };
  }
  cancelDelete() { this.deleteConfirm = { show: false, type: '', label: '', id: 0 }; }

  confirmDelete() {
    const { type, id } = this.deleteConfirm;
    const call =
      type === 'entry'     ? this.svc.deleteEntry(id)     :
      type === 'ref'       ? this.svc.deleteRef(id)       :
      type === 'threshold' ? this.svc.deleteThreshold(id) :
                             this.svc.deleteScore(id);
    call.subscribe({ next: () => this.loadAll(), error: err => console.error(err) });
    this.cancelDelete();
  }

  private get effectivePatientFilter(): string | null {
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      return username ? username.trim().toLowerCase() : null;
    }
    return this.entryPatientFilter || '';
  }

  showAutoScoreModal  = false;
  autoScorePatientId  = '';
  autoScoreTouched    = false;

  openAutoScoreModal() {
    if (this.auth.isMedecin()) {
      this.loadKeycloakPatients();
      this.autoScorePatientId = '';
    } else {
      this.autoScorePatientId = this.auth.getUsername() || '';
    }
    this.autoScoreTouched   = false;
    this.showAutoScoreModal = true;
    this.setTab('scores');
  }

  closeAutoScoreModal() {
    this.showAutoScoreModal = false;
    this.autoScoreTouched   = false;
  }

  triggerAutoScore() {
    this.autoScoreTouched = true;
    const pid = this.auth.isPatient()
      ? (this.auth.getUsername() || '')
      : this.autoScorePatientId;

    if (!pid) return;
    this.closeAutoScoreModal();
    this.computeScoreFromEntries(pid);
  }

  getPatientEntryCount(patientId: string): number {
    if (!patientId) return 0;
    const pid = patientId.trim().toLowerCase();
    return this.entries.filter(e => e.patientId.trim().toLowerCase() === pid).length;
  }

  getPatientEGFRCount(patientId: string): number {
    if (!patientId) return 0;
    const pid = patientId.trim().toLowerCase();
    return this.entries.filter(
      e => e.patientId.trim().toLowerCase() === pid && e.eGFR !== null
    ).length;
  }

  showEntryForm  = false;
  editEntryMode  = false;
  editEntryId:   number | null = null;
  entryTouched:  Record<string, boolean> = {};
  newEntry: Partial<GraftFunctionEntry> = this.emptyEntry();

  private normalizePatientId(pid: unknown): string {
    return (pid ?? '').toString().trim().toLowerCase();
  }

  private optionalNumberError(
    raw: unknown,
    label: string,
    min: number,
    max: number
  ): string {
    if (raw === null || raw === undefined || raw === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return `${label} must be a valid number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return '';
  }

  private entryErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const patientId = this.normalizePatientId(this.newEntry.patientId);
    if (!patientId) errs['patientId'] = 'Patient is required.';

    const measurementDateRaw = (this.newEntry.measurementDate ?? '').toString().trim();
    if (!measurementDateRaw) errs['measurementDate'] = 'Measurement date is required.';
    else {
      const ts = Date.parse(measurementDateRaw);
      if (!Number.isFinite(ts)) errs['measurementDate'] = 'Measurement date is invalid.';
    }

    const cErr = this.optionalNumberError(this.newEntry.creatinine, 'Creatinine (mg/dL)', 0.1, 20);
    if (cErr) errs['creatinine'] = cErr;
    const gErr = this.optionalNumberError(this.newEntry.eGFR, 'eGFR (mL/min/1.73m²)', 0, 2000);
    if (gErr) errs['eGFR'] = gErr;
    const uErr = this.optionalNumberError(this.newEntry.urineOutput, 'Urine Output (mL/24h)', 0, 100000);
    if (uErr) errs['urineOutput'] = uErr;
    const tErr = this.optionalNumberError(this.newEntry.tacrolimusLevel, 'Tacrolimus Level (ng/mL)', 0, 50);
    if (tErr) errs['tacrolimusLevel'] = tErr;
    const wErr = this.optionalNumberError(this.newEntry.weight, 'Weight (kg)', 0.1, 300);
    if (wErr) errs['weight'] = wErr;
    const tempErr = this.optionalNumberError(this.newEntry.temperature, 'Temperature (°C)', 30, 45);
    if (tempErr) errs['temperature'] = tempErr;

    const sysErr = this.optionalNumberError(this.newEntry.systolicBP, 'Systolic BP (mmHg)', 60, 260);
    if (sysErr) errs['systolicBP'] = sysErr;
    const diaErr = this.optionalNumberError(this.newEntry.diastolicBP, 'Diastolic BP (mmHg)', 30, 170);
    if (diaErr) errs['diastolicBP'] = diaErr;

    const sysRaw: unknown = this.newEntry.systolicBP;
    const diaRaw: unknown = this.newEntry.diastolicBP;
    const sys = sysRaw === null || sysRaw === undefined || sysRaw === '' ? null : Number(sysRaw);
    const dia = diaRaw === null || diaRaw === undefined || diaRaw === '' ? null : Number(diaRaw);
    if (sys !== null && dia !== null && Number.isFinite(sys) && Number.isFinite(dia) && dia > sys) {
      errs['diastolicBP'] = 'Diastolic BP must be less than or equal to systolic BP.';
    }

    return errs;
  }

  emptyEntry(): Partial<GraftFunctionEntry> {
    return {
      patientId: '', measurementDate: '', creatinine: null, eGFR: null,
      urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null,
      weight: null, temperature: null, collectionType: 'ROUTINE', notes: ''
    };
  }

  openAddEntry() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editEntryMode = false;
    this.editEntryId = null;
    this.newEntry = this.emptyEntry();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newEntry.patientId = username;
    }
    this.entryTouched = {};
    this.showEntryForm = true;
  }

  closeEntryForm() { this.showEntryForm = false; this.entryTouched = {}; }
  touchEntry(f: string) { this.entryTouched[f] = true; }

  editEntry(e: GraftFunctionEntry) {
    this.editEntryMode = true; this.editEntryId = e.id;
    this.newEntry = { ...e }; this.entryTouched = {}; this.showEntryForm = true;
  }

  get entryPatientError() { return this.entryTouched['patientId'] ? (this.entryErrors()['patientId'] ?? '') : ''; }
  get entryDateError() { return this.entryTouched['measurementDate'] ? (this.entryErrors()['measurementDate'] ?? '') : ''; }
  get entryFormValid() { return Object.keys(this.entryErrors()).length === 0; }

  saveEntry() {
    [
      'patientId', 'measurementDate',
      'creatinine', 'eGFR', 'urineOutput', 'tacrolimusLevel',
      'systolicBP', 'diastolicBP', 'weight', 'temperature'
    ].forEach(f => this.touchEntry(f));
    if (Object.keys(this.entryErrors()).length > 0) return;
    const call = this.editEntryMode && this.editEntryId !== null
      ? this.svc.updateEntry(this.editEntryId, this.newEntry)
      : this.svc.createEntry(this.newEntry);
    call.subscribe({ next: () => { this.loadAll(); this.closeEntryForm(); }, error: err => console.error(err) });
  }

  entrySearch        = '';
  entryPatientFilter = '';
  entryDateFilter    = '';
  entryTypeFilter    = '';
  entrySortBy: 'measurementDate' | 'creatinine' | 'eGFR' = 'measurementDate';
  entrySortDir: 'asc' | 'desc' = 'desc';

  get filteredEntries(): GraftFunctionEntry[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];

    let r = [...this.entries];
    if (patFilter !== '') {
      r = r.filter(e => e.patientId.trim().toLowerCase() === patFilter);
    }
    if (this.entryDateFilter)  r = r.filter(e => e.measurementDate === this.entryDateFilter);
    if (this.entryTypeFilter)  r = r.filter(e => e.collectionType === this.entryTypeFilter);
    if (this.entrySearch)      r = r.filter(e => e.patientId.toLowerCase().includes(this.entrySearch.toLowerCase()) || (e.notes || '').toLowerCase().includes(this.entrySearch.toLowerCase()));
    r.sort((a, b) => {
      const va: number | string = (a[this.entrySortBy] ?? 0) as number | string;
      const vb: number | string = (b[this.entrySortBy] ?? 0) as number | string;
      return (va < vb ? -1 : va > vb ? 1 : 0) * (this.entrySortDir === 'asc' ? 1 : -1);
    });
    return r;
  }

  toggleEntrySort(f: 'measurementDate' | 'creatinine' | 'eGFR') {
    if (this.entrySortBy === f) this.entrySortDir = this.entrySortDir === 'asc' ? 'desc' : 'asc';
    else { this.entrySortBy = f; this.entrySortDir = 'asc'; }
  }
  clearEntryFilters() {
    this.entrySearch = this.entryPatientFilter = this.entryDateFilter = this.entryTypeFilter = '';
    this.entrySortBy = 'measurementDate'; this.entrySortDir = 'desc';
  }

  getEntryAlertLevel(entry: GraftFunctionEntry): { level: string; color: string; bg: string } | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    const thr = this.thresholds.find(t => t.patientId === entry.patientId);
    if (!ref || !thr) return null;
    if (entry.creatinine !== null && ref.baselineCreatinine) {
      const rise = ((entry.creatinine - ref.baselineCreatinine) / ref.baselineCreatinine) * 100;
      if (rise >= (thr.creatinineRisePercent ?? 25))
        return { level: thr.acuteDeclineLevel, color: this.alertColor(thr.acuteDeclineLevel), bg: this.alertBg(thr.acuteDeclineLevel) };
    }
    if (entry.eGFR !== null && ref.baselineEGFR) {
      const drop = ((ref.baselineEGFR - entry.eGFR) / ref.baselineEGFR) * 100;
      if (drop >= (thr.eGFRDropPercent ?? 20))
        return { level: thr.acuteDeclineLevel, color: this.alertColor(thr.acuteDeclineLevel), bg: this.alertBg(thr.acuteDeclineLevel) };
    }
    if (entry.tacrolimusLevel !== null) {
      if ((thr.tacrolimusMin && entry.tacrolimusLevel < thr.tacrolimusMin) ||
          (thr.tacrolimusMax && entry.tacrolimusLevel > thr.tacrolimusMax))
        return { level: 'WARNING', color: '#f59e0b', bg: '#fffbeb' };
    }
    return null;
  }

  alertColor(level: string): string {
    return level === 'CRITICAL' ? '#ef4444' : level === 'WARNING' ? '#f59e0b' : '#3b82f6';
  }
  alertBg(level: string): string {
    return level === 'CRITICAL' ? '#fef2f2' : level === 'WARNING' ? '#fffbeb' : '#eff6ff';
  }

  getCreatinineChange(entry: GraftFunctionEntry): number | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    if (!ref?.baselineCreatinine || entry.creatinine === null) return null;
    return Math.round(((entry.creatinine - ref.baselineCreatinine) / ref.baselineCreatinine) * 100);
  }

  getEGFRChange(entry: GraftFunctionEntry): number | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    if (!ref?.baselineEGFR || entry.eGFR === null) return null;
    return Math.round(((entry.eGFR - ref.baselineEGFR) / ref.baselineEGFR) * 100);
  }

  showRefForm  = false;
  editRefMode  = false;
  editRefId:   number | null = null;
  refTouched:  Record<string, boolean> = {};
  newRef: Partial<ReferenceValue> = this.emptyRef();

  emptyRef(): Partial<ReferenceValue> {
    return {
      patientId: '', establishedDate: '', baselineCreatinine: null,
      baselineEGFR: null, targetTacrolimusMin: null, targetTacrolimusMax: null,
      targetSystolicBP: null, targetDiastolicBP: null, setBy: '', notes: ''
    };
  }

  private currentUserKey(): string {
    const u = this.auth.getUsername();
    return (u ?? '').toString().trim().toLowerCase();
  }

  private refErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const pid = this.normalizePatientId(this.newRef.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const establishedDateRaw = (this.newRef.establishedDate ?? '').toString().trim();
    if (!establishedDateRaw) errs['establishedDate'] = 'Established date is required.';
    else {
      const ts = Date.parse(establishedDateRaw);
      if (!Number.isFinite(ts)) errs['establishedDate'] = 'Established date is invalid.';
    }

    if (pid) {
      const duplicate = this.refs.some(r => this.normalizePatientId(r.patientId) === pid && r.id !== this.editRefId);
      if (duplicate) errs['patientId'] = 'A reference value already exists for this patient.';
    }

    const bcErr = this.optionalNumberError(this.newRef.baselineCreatinine, 'Baseline Creatinine (mg/dL)', 0.1, 20);
    if (bcErr) errs['baselineCreatinine'] = bcErr;
    const beErr = this.optionalNumberError(this.newRef.baselineEGFR, 'Baseline eGFR (mL/min)', 0, 2000);
    if (beErr) errs['baselineEGFR'] = beErr;
    const tMinErr = this.optionalNumberError(this.newRef.targetTacrolimusMin, 'Tacrolimus Target Min (ng/mL)', 0, 50);
    if (tMinErr) errs['targetTacrolimusMin'] = tMinErr;
    const tMaxErr = this.optionalNumberError(this.newRef.targetTacrolimusMax, 'Tacrolimus Target Max (ng/mL)', 0, 50);
    if (tMaxErr) errs['targetTacrolimusMax'] = tMaxErr;
    const sysErr = this.optionalNumberError(this.newRef.targetSystolicBP, 'Target Systolic BP (mmHg)', 60, 260);
    if (sysErr) errs['targetSystolicBP'] = sysErr;
    const diaErr = this.optionalNumberError(this.newRef.targetDiastolicBP, 'Target Diastolic BP (mmHg)', 30, 170);
    if (diaErr) errs['targetDiastolicBP'] = diaErr;

    const tacMinRaw: unknown = this.newRef.targetTacrolimusMin;
    const tacMaxRaw: unknown = this.newRef.targetTacrolimusMax;
    const tacMin = tacMinRaw === null || tacMinRaw === undefined || tacMinRaw === '' ? null : Number(tacMinRaw);
    const tacMax = tacMaxRaw === null || tacMaxRaw === undefined || tacMaxRaw === '' ? null : Number(tacMaxRaw);
    if (tacMin !== null && tacMax !== null && Number.isFinite(tacMin) && Number.isFinite(tacMax) && tacMin > tacMax) {
      errs['targetTacrolimusMax'] = 'Tacrolimus Target Max must be greater than or equal to Target Min.';
    }

    const sysRaw2: unknown = this.newRef.targetSystolicBP;
    const diaRaw2: unknown = this.newRef.targetDiastolicBP;
    const sys = sysRaw2 === null || sysRaw2 === undefined || sysRaw2 === '' ? null : Number(sysRaw2);
    const dia = diaRaw2 === null || diaRaw2 === undefined || diaRaw2 === '' ? null : Number(diaRaw2);
    if (sys !== null && dia !== null && Number.isFinite(sys) && Number.isFinite(dia) && dia > sys) {
      errs['targetDiastolicBP'] = 'Target Diastolic BP must be less than or equal to Target Systolic BP.';
    }

    return errs;
  }

  openAddRef() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editRefMode = false;
    this.editRefId = null;
    this.newRef = this.emptyRef();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newRef.patientId = username;
    }
    this.refTouched = {};
    this.showRefForm = true;
  }

  closeRefForm() { this.showRefForm = false; this.refTouched = {}; }
  touchRef(f: string) { this.refTouched[f] = true; }

  editRef(r: ReferenceValue) {
    this.editRefMode = true; this.editRefId = r.id;
    this.newRef = { ...r }; this.refTouched = {}; this.showRefForm = true;
  }

  get refPatientError() { return this.refTouched['patientId'] ? (this.refErrors()['patientId'] ?? '') : ''; }
  get refDateError() { return this.refTouched['establishedDate'] ? (this.refErrors()['establishedDate'] ?? '') : ''; }
  get refBaselineCreatinineError() { return this.refTouched['baselineCreatinine'] ? (this.refErrors()['baselineCreatinine'] ?? '') : ''; }
  get refBaselineEGFRError() { return this.refTouched['baselineEGFR'] ? (this.refErrors()['baselineEGFR'] ?? '') : ''; }
  get refTacMinError() { return this.refTouched['targetTacrolimusMin'] ? (this.refErrors()['targetTacrolimusMin'] ?? '') : ''; }
  get refTacMaxError() { return this.refTouched['targetTacrolimusMax'] ? (this.refErrors()['targetTacrolimusMax'] ?? '') : ''; }
  get refTargetSysBPError() { return this.refTouched['targetSystolicBP'] ? (this.refErrors()['targetSystolicBP'] ?? '') : ''; }
  get refTargetDiaBPError() { return this.refTouched['targetDiastolicBP'] ? (this.refErrors()['targetDiastolicBP'] ?? '') : ''; }

  get refFormValid() { return Object.keys(this.refErrors()).length === 0; }

  saveRef() {
    [
      'patientId', 'establishedDate',
      'baselineCreatinine', 'baselineEGFR',
      'targetTacrolimusMin', 'targetTacrolimusMax',
      'targetSystolicBP', 'targetDiastolicBP'
    ].forEach(f => this.touchRef(f));
    if (Object.keys(this.refErrors()).length > 0) return;
    const call = this.editRefMode && this.editRefId !== null
      ? this.svc.updateRef(this.editRefId, this.newRef)
      : this.svc.createRef(this.newRef);
    call.subscribe({ next: () => { this.loadAll(); this.closeRefForm(); }, error: err => console.error(err) });
  }

  refPatientFilter = '';
  get filteredRefs(): ReferenceValue[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.refs];
    if (patFilter !== '') r = r.filter(x => x.patientId.trim().toLowerCase() === patFilter);
    return r;
  }

  showThrForm  = false;
  editThrMode  = false;
  editThrId:   number | null = null;
  thrTouched:  Record<string, boolean> = {};
  newThreshold: Partial<AlertThreshold> = this.emptyThreshold();

  emptyThreshold(): Partial<AlertThreshold> {
    return {
      patientId: '', creatinineRisePercent: 25, eGFRDropPercent: 20,
      creatinineAbsoluteMax: 3.0, eGFRCriticalMin: 20,
      tacrolimusMin: 5, tacrolimusMax: 15,
      acuteDeclineLevel: 'WARNING', chronicDeclineLevel: 'WATCH',
      configuredBy: ''
    };
  }

  private thresholdErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const pid = this.normalizePatientId(this.newThreshold.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const userKey = this.currentUserKey();

    if (pid && userKey) {
      const duplicate = this.thresholds.some(t =>
        this.normalizePatientId(t.patientId) === pid &&
        (t.configuredBy ?? '').toString().trim().toLowerCase() === userKey &&
        t.id !== this.editThrId
      );
      if (duplicate) errs['patientId'] = 'A threshold already exists for this patient under your account.';
    }

    const cRiseErr = this.optionalNumberError(this.newThreshold.creatinineRisePercent, 'Creatinine Rise Alert (%)', 0, 200);
    if (cRiseErr) errs['creatinineRisePercent'] = cRiseErr;
    const gDropErr = this.optionalNumberError(this.newThreshold.eGFRDropPercent, 'eGFR Drop Alert (%)', 0, 200);
    if (gDropErr) errs['eGFRDropPercent'] = gDropErr;
    const cMaxErr = this.optionalNumberError(this.newThreshold.creatinineAbsoluteMax, 'Creatinine Absolute Max (mg/dL)', 0.1, 20);
    if (cMaxErr) errs['creatinineAbsoluteMax'] = cMaxErr;
    const gMinErr = this.optionalNumberError(this.newThreshold.eGFRCriticalMin, 'eGFR Critical Min (mL/min)', 0, 2000);
    if (gMinErr) errs['eGFRCriticalMin'] = gMinErr;
    const tacMinErr = this.optionalNumberError(this.newThreshold.tacrolimusMin, 'Tacrolimus Min (ng/mL)', 0, 50);
    if (tacMinErr) errs['tacrolimusMin'] = tacMinErr;
    const tacMaxErr = this.optionalNumberError(this.newThreshold.tacrolimusMax, 'Tacrolimus Max (ng/mL)', 0, 50);
    if (tacMaxErr) errs['tacrolimusMax'] = tacMaxErr;

    const tacMinRaw: unknown = this.newThreshold.tacrolimusMin;
    const tacMaxRaw: unknown = this.newThreshold.tacrolimusMax;
    const tacMin = tacMinRaw === null || tacMinRaw === undefined || tacMinRaw === '' ? null : Number(tacMinRaw);
    const tacMax = tacMaxRaw === null || tacMaxRaw === undefined || tacMaxRaw === '' ? null : Number(tacMaxRaw);
    if (tacMin !== null && tacMax !== null && Number.isFinite(tacMin) && Number.isFinite(tacMax) && tacMin > tacMax) {
      errs['tacrolimusMax'] = 'Tacrolimus Max must be greater than or equal to Tacrolimus Min.';
    }

    if (this.newThreshold.configuredBy === null || this.newThreshold.configuredBy === undefined || this.newThreshold.configuredBy === '') {
      errs['configuredBy'] = 'Configured By is required.';
    }

    return errs;
  }

  openAddThreshold() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editThrMode = false;
    this.editThrId = null;
    this.newThreshold = this.emptyThreshold();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newThreshold.patientId = username;
    }
    const userKey = this.currentUserKey();
    if (userKey) this.newThreshold.configuredBy = userKey;
    this.thrTouched = {};
    this.showThrForm = true;
  }

  closeThrForm() { this.showThrForm = false; this.thrTouched = {}; }
  touchThr(f: string) { this.thrTouched[f] = true; }

  editThreshold(t: AlertThreshold) {
    this.editThrMode = true; this.editThrId = t.id;
    this.newThreshold = { ...t }; this.thrTouched = {}; this.showThrForm = true;
  }

  get thrPatientError() { return this.thrTouched['patientId'] ? (this.thresholdErrors()['patientId'] ?? '') : ''; }
  get thrConfiguredByError() { return this.thrTouched['configuredBy'] ? (this.thresholdErrors()['configuredBy'] ?? '') : ''; }
  get thrCreatinineRisePercentError() { return this.thrTouched['creatinineRisePercent'] ? (this.thresholdErrors()['creatinineRisePercent'] ?? '') : ''; }
  get thrEGFRDropPercentError() { return this.thrTouched['eGFRDropPercent'] ? (this.thresholdErrors()['eGFRDropPercent'] ?? '') : ''; }
  get thrCreatinineAbsoluteMaxError() { return this.thrTouched['creatinineAbsoluteMax'] ? (this.thresholdErrors()['creatinineAbsoluteMax'] ?? '') : ''; }
  get thrEGFRCriticalMinError() { return this.thrTouched['eGFRCriticalMin'] ? (this.thresholdErrors()['eGFRCriticalMin'] ?? '') : ''; }
  get thrTacMinError() { return this.thrTouched['tacrolimusMin'] ? (this.thresholdErrors()['tacrolimusMin'] ?? '') : ''; }
  get thrTacMaxError() { return this.thrTouched['tacrolimusMax'] ? (this.thresholdErrors()['tacrolimusMax'] ?? '') : ''; }

  get thrFormValid() { return Object.keys(this.thresholdErrors()).length === 0; }

  saveThreshold() {
    [
      'patientId', 'configuredBy',
      'creatinineRisePercent', 'eGFRDropPercent',
      'creatinineAbsoluteMax', 'eGFRCriticalMin',
      'tacrolimusMin', 'tacrolimusMax'
    ].forEach(f => this.touchThr(f));
    if (Object.keys(this.thresholdErrors()).length > 0) return;
    const call = this.editThrMode && this.editThrId !== null
      ? this.svc.updateThreshold(this.editThrId, this.newThreshold)
      : this.svc.createThreshold(this.newThreshold);
    call.subscribe({ next: () => { this.loadAll(); this.closeThrForm(); }, error: err => console.error(err) });
  }

  thrPatientFilter = '';
  get filteredThresholds(): AlertThreshold[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.thresholds];
    if (patFilter !== '') r = r.filter(x => x.patientId.trim().toLowerCase() === patFilter);
    return r;
  }

  showScoreForm  = false;
  editScoreMode  = false;
  editScoreId:   number | null = null;
  scoreTouched:  Record<string, boolean> = {};
  newScore: Partial<GraftSurvivalScore> = this.emptyScore();

  emptyScore(): Partial<GraftSurvivalScore> {
    return {
      patientId: '', survivalProbability1Year: null, survivalProbability3Year: null,
      survivalProbability5Year: null, riskLevel: 'LOW',
      eGFRSlope: null, creatinineSlope: null, rejectionEpisodeCount: 0,
      hasChronicDecline: false, hasAcuteDecline: false,
      tacrolimusVariability: null, calculationModel: 'MANUAL', notes: ''
    };
  }

  private scoreErrors(): Record<string, string> {
    const errs: Record<string, string> = {};
    const pid = this.normalizePatientId(this.newScore.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const validateProb = (raw: unknown, label: string): string => {
      if (raw === null || raw === undefined || raw === '') return `${label} is required.`;
      const n = Number(raw);
      if (!Number.isFinite(n)) return `${label} must be a valid number.`;
      if (n < 0 || n > 1) return `${label} must be between 0 and 1.`;
      return '';
    };

    const p1Err = validateProb(this.newScore.survivalProbability1Year, '1-Year Survival (0–1)');
    if (p1Err) errs['survivalProbability1Year'] = p1Err;
    const p3Err = validateProb(this.newScore.survivalProbability3Year, '3-Year Survival (0–1)');
    if (p3Err) errs['survivalProbability3Year'] = p3Err;
    const p5Err = validateProb(this.newScore.survivalProbability5Year, '5-Year Survival (0–1)');
    if (p5Err) errs['survivalProbability5Year'] = p5Err;

    const rcRaw = this.newScore.rejectionEpisodeCount;
    const rc = Number(rcRaw);
    if (!Number.isFinite(rcRaw as number)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes is required.';
    } else if (!Number.isFinite(rc)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be a valid number.';
    } else if (rc < 0) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be >= 0.';
    } else if (!Number.isInteger(rc)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be an integer.';
    }

    const egfrSlopeErr = this.optionalNumberError(this.newScore.eGFRSlope, 'eGFR Slope', -50, 50);
    if (egfrSlopeErr) errs['eGFRSlope'] = egfrSlopeErr;
    const creatSlopeErr = this.optionalNumberError(this.newScore.creatinineSlope, 'Creatinine Slope', -50, 50);
    if (creatSlopeErr) errs['creatinineSlope'] = creatSlopeErr;
    const tacVarErr = this.optionalNumberError(this.newScore.tacrolimusVariability, 'Tacrolimus Variability (CV)', 0, 100);
    if (tacVarErr) errs['tacrolimusVariability'] = tacVarErr;

    return errs;
  }

  openAddScore() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editScoreMode = false;
    this.editScoreId = null;
    this.newScore = this.emptyScore();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newScore.patientId = username;
    }
    this.scoreTouched = {};
    this.showScoreForm = true;
  }

  closeScoreForm() { this.showScoreForm = false; this.scoreTouched = {}; }
  touchScore(f: string) { this.scoreTouched[f] = true; }

  editScore(s: GraftSurvivalScore) {
    this.editScoreMode = true; this.editScoreId = s.id;
    this.newScore = { ...s }; this.scoreTouched = {}; this.showScoreForm = true;
  }

  get scorePatientError() { return this.scoreTouched['patientId'] ? (this.scoreErrors()['patientId'] ?? '') : ''; }
  get scoreP1Error() { return this.scoreTouched['survivalProbability1Year'] ? (this.scoreErrors()['survivalProbability1Year'] ?? '') : ''; }
  get scoreP3Error() { return this.scoreTouched['survivalProbability3Year'] ? (this.scoreErrors()['survivalProbability3Year'] ?? '') : ''; }
  get scoreP5Error() { return this.scoreTouched['survivalProbability5Year'] ? (this.scoreErrors()['survivalProbability5Year'] ?? '') : ''; }
  get scoreRejectionEpisodesError() { return this.scoreTouched['rejectionEpisodeCount'] ? (this.scoreErrors()['rejectionEpisodeCount'] ?? '') : ''; }
  get scoreEGFROrror() { return this.scoreTouched['eGFRSlope'] ? (this.scoreErrors()['eGFRSlope'] ?? '') : ''; }
  get scoreCreatinineSlopeError() { return this.scoreTouched['creatinineSlope'] ? (this.scoreErrors()['creatinineSlope'] ?? '') : ''; }
  get scoreTacrolimusVariabilityError() { return this.scoreTouched['tacrolimusVariability'] ? (this.scoreErrors()['tacrolimusVariability'] ?? '') : ''; }

  get scoreFormValid() { return Object.keys(this.scoreErrors()).length === 0; }

  saveScore() {
    [
      'patientId',
      'survivalProbability1Year', 'survivalProbability3Year', 'survivalProbability5Year',
      'eGFRSlope', 'creatinineSlope', 'rejectionEpisodeCount', 'tacrolimusVariability'
    ].forEach(f => this.touchScore(f));
    if (Object.keys(this.scoreErrors()).length > 0) return;
    const call = this.editScoreMode && this.editScoreId !== null
      ? this.svc.updateScore(this.editScoreId, this.newScore)
      : this.svc.createScore(this.newScore);
    call.subscribe({ next: () => { this.loadAll(); this.closeScoreForm(); }, error: err => console.error(err) });
  }

  scorePatientFilter = '';
  scoreRiskFilter    = '';

  get filteredScores(): GraftSurvivalScore[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.scores];
    if (patFilter !== '') r = r.filter(s => s.patientId.trim().toLowerCase() === patFilter);
    if (this.scoreRiskFilter) r = r.filter(s => s.riskLevel === this.scoreRiskFilter);
    return r.sort((a, b) =>
      new Date(b.calculatedAt || '').getTime() - new Date(a.calculatedAt || '').getTime()
    );
  }

  getRiskColour(risk: string): { color: string; bg: string; border: string } {
    if (risk === 'CRITICAL') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' };
    if (risk === 'HIGH')     return { color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' };
    if (risk === 'MODERATE') return { color: '#92400e', bg: '#fffbeb', border: '#fcd34d' };
    return                          { color: '#166534', bg: '#f0fdf4', border: '#86efac' };
  }

  getProbabilityBar(val: number | null): number {
    if (val === null) return 0;
    return Math.round(val * 100);
  }

  getProbabilityColor(val: number | null): string {
    const pct = val !== null ? val * 100 : 0;
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#84cc16';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  computeScoreFromEntries(patientId: string) {
    const patientEntries = this.entries
      .filter(e => e.patientId === patientId && e.eGFR !== null)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());
    const ref = this.refs.find(r => r.patientId === patientId);
    if (patientEntries.length < 2) return;
    const recent = patientEntries.slice(-6);
    const n      = recent.length;
    const xMean  = (n - 1) / 2;
    const yMean  = recent.reduce((s, e) => s + (e.eGFR ?? 0), 0) / n;
    let num = 0, den = 0;
    recent.forEach((e, i) => {
      num += (i - xMean) * ((e.eGFR ?? 0) - yMean);
      den += (i - xMean) * (i - xMean);
    });
    const slope      = den !== 0 ? num / den : 0;
    const latestEGFR = recent[n - 1].eGFR ?? 0;
    const baselineEGFR = ref?.baselineEGFR ?? latestEGFR;
    const pctDrop    = baselineEGFR > 0 ? ((baselineEGFR - latestEGFR) / baselineEGFR) * 100 : 0;
    const base1y = Math.max(0, Math.min(1, 1 - pctDrop / 150));
    const base3y = Math.max(0, Math.min(1, base1y - Math.abs(slope) * 0.05));
    const base5y = Math.max(0, Math.min(1, base3y - Math.abs(slope) * 0.08));
    const risk   = base1y >= 0.8 ? 'LOW' : base1y >= 0.6 ? 'MODERATE' : base1y >= 0.4 ? 'HIGH' : 'CRITICAL';
    this.newScore = {
      patientId,
      survivalProbability1Year: Math.round(base1y * 100) / 100,
      survivalProbability3Year: Math.round(base3y * 100) / 100,
      survivalProbability5Year: Math.round(base5y * 100) / 100,
      riskLevel: risk,
      eGFRSlope: Math.round(slope * 100) / 100,
      creatinineSlope: null, rejectionEpisodeCount: 0,
      hasAcuteDecline:   pctDrop > 25,
      hasChronicDecline: pctDrop > 10,
      tacrolimusVariability: null,
      calculationModel: 'AUTO_EGFR_SLOPE',
      notes: `Auto-computed from ${n} eGFR readings. eGFR slope: ${slope.toFixed(2)} mL/min/measurement.`
    };
    this.showScoreForm = true;
    this.editScoreMode = false;
    this.editScoreId   = null;
    this.scoreTouched  = {};
  }

  get thresholdSuggestions(): { creatinineRisePercent: number | null; eGFRDropPercent: number | null; reason: string } {
    const pid = this.normalizePatientId(this.newThreshold.patientId);
    if (!pid) return { creatinineRisePercent: null, eGFRDropPercent: null, reason: 'Select a patient to see suggestions.' };

    const ref = this.refs.find(r => this.normalizePatientId(r.patientId) === pid);
    if (!ref) return { creatinineRisePercent: null, eGFRDropPercent: null, reason: 'No baseline reference values found for this patient.' };

    const patientEntries = this.entries
      .filter(e => this.normalizePatientId(e.patientId) === pid)
      .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime())
      .slice(0, 6);

    let cRise: number | null = null;
    if (ref.baselineCreatinine && ref.baselineCreatinine > 0) {
      const rises = patientEntries
        .filter(e => e.creatinine !== null && e.creatinine !== undefined)
        .map(e => ((Number(e.creatinine) - ref.baselineCreatinine!) / ref.baselineCreatinine!) * 100)
        .filter(p => Number.isFinite(p));
      cRise = rises.length ? Math.max(5, Math.min(150, Math.round(Math.max(...rises)))) : null;
    }

    let gDrop: number | null = null;
    if (ref.baselineEGFR && ref.baselineEGFR > 0) {
      const drops = patientEntries
        .filter(e => e.eGFR !== null && e.eGFR !== undefined)
        .map(e => ((ref.baselineEGFR! - Number(e.eGFR)) / ref.baselineEGFR!) * 100)
        .filter(p => Number.isFinite(p));
      gDrop = drops.length ? Math.max(5, Math.min(150, Math.round(Math.max(...drops)))) : null;
    }

    return {
      creatinineRisePercent: cRise,
      eGFRDropPercent: gDrop,
      reason: `Suggestions computed from the latest ${patientEntries.length} entries compared to baseline.`
    };
  }

  applyThresholdSuggestions() {
    const s = this.thresholdSuggestions;
    if (s.creatinineRisePercent !== null) this.newThreshold.creatinineRisePercent = s.creatinineRisePercent;
    if (s.eGFRDropPercent !== null) this.newThreshold.eGFRDropPercent = s.eGFRDropPercent;
    this.touchThr('creatinineRisePercent');
    this.touchThr('eGFRDropPercent');
  }

  get todayIso(): string { return new Date().toISOString().split('T')[0]; }

  private csvEscape(v: unknown): string {
    const s = (v ?? '').toString();
    if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
    return s;
  }

  downloadFilteredEntriesCsv() {
    const header = [
      'patientId', 'measurementDate', 'collectionType', 'creatinine', 'eGFR',
      'urineOutput', 'tacrolimusLevel', 'systolicBP', 'diastolicBP',
      'weight', 'temperature', 'alertLevel', 'notes'
    ];
    const rows = this.filteredEntries.map(e => {
      const alertLevel = this.getEntryAlertLevel(e)?.level ?? '';
      return [
        this.normalizePatientId(e.patientId), e.measurementDate, e.collectionType ?? '',
        e.creatinine ?? '', e.eGFR ?? '', e.urineOutput ?? '', e.tacrolimusLevel ?? '',
        e.systolicBP ?? '', e.diastolicBP ?? '', e.weight ?? '', e.temperature ?? '',
        alertLevel, e.notes ?? ''
      ].map(v => this.csvEscape(v)).join(',');
    });
    const csv  = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `graft_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  fmtDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  collectionBadge(type: string): { color: string; bg: string } {
    if (type === 'URGENT')      return { color: '#991b1b', bg: '#fef2f2' };
    if (type === 'POST_BIOPSY') return { color: '#5b21b6', bg: '#ede9fe' };
    return                             { color: '#1565a8', bg: '#e8f4fd' };
  }

  showProfileMenu = false;

  logout() { this.auth.logout(); }

  get groupedEntries(): { patientId: string; entries: GraftFunctionEntry[] }[] {
    const map = new Map<string, GraftFunctionEntry[]>();
    this.filteredEntries.forEach(e => {
      if (!map.has(e.patientId)) map.set(e.patientId, []);
      map.get(e.patientId)!.push(e);
    });
    return Array.from(map.entries()).map(([patientId, entries]) => ({
      patientId,
      entries: entries.sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime())
    }));
  }

  expandedPatients: Record<string, boolean> = {};

  togglePatient(patientId: string) {
    this.expandedPatients[patientId] = !this.expandedPatients[patientId];
  }
}
