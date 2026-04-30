import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';
import { DossierService, DossierMedical } from '../services/dossier';
import { SuiviService, Suivi } from '../services/suivi';
import { ImageMedicaleService, ImageMedicale } from '../services/image-medicale';
import { TestLaboratoireService, TestLaboratoire } from '../services/test-laboratoire';
import {
  ResultatLaboratoireService,
  ResultatLaboratoire,
  formatValeurResultat,
  formatValeurResultatCard,
  InterpretationResultat,
} from '../services/resultat-laboratoire';
import { RapportBiService, RapportBi } from '../services/rapport-bi';
import { LabAnalysisPayload, LabAnalysisResponse, ModuleLaboService, PrescriptionBilanDTO, StatutPrescription } from '../services/module-labo.service';
import { AlerteService, Alerte } from '../services/alerte';
import { MessageService, Message, TypeExpediteur } from '../services/message.service';
import { NephroChatbotService, ChatMessage } from '../services/nephro-chatbot.service';
import { NotificationService } from '../services/notification.service';
import { ConfirmService } from '../services/confirm.service';
import { AppointmentModalService } from '../services/appointment-modal.service';
import { PrescriptionModalService } from '../services/prescription-modal.service';
import { PrescriptionService, getPrescriptionPatientId } from '../services/prescription.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { LabResultStoredPdfService } from '../services/lab-result-stored-pdf.service';
import { NgForm } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import jsPDF from 'jspdf';

/* ── Prescription interfaces ─────────────────────────── */
export interface PrescriptionItemDTO {
  id?:                   number;
  medicationId?:         number;
  medicationName?:       string;
  dosage?:               string;
  category?:             string;
  dosageInstructions?:   string;
  frequency?:            string;
  administrationRoute?:  string;
  duration?:             number;
  startDate?:            string;
  endDate?:              string;
  isPriority?:           boolean;
  isImmunosuppressor?:   boolean;
  specialInstructions?:  string;
  schedules?:            any[];
}

export interface PrescriptionDTO {
  id?:                number;
  patientId:          number;
  prescriptionDate:   string;
  notes?:             string;
  prescriptionItems?: PrescriptionItemDTO[];
}

/** Constante vitale (liste déroulante modal paramètres vitaux home) */
interface ConstanteVitaleLite {
  idConstanteVitale: number;
  nomParametre: string;
  unite: string;
  valeurMinNormale: number | null;
  valeurMaxNormale: number | null;
}

interface VitalHomeFormData {
  idConstanteVitale: number | null;
  nomParametre: string;
  valeurMesuree: number | null;
  unite: string;
  etat: string;
  referenceMin: number | null;
  referenceMax: number | null;
  poids: number | null;
  taille: number | null;
  age: number | null;
  imc: number | null;
}

/* ── Timeline interfaces ─────────────────────────────── */
export type TimelineEventType  = 'suivi' | 'hospitalisation' | 'image' | 'bilan';
export type TimelineEventState = 'improvement' | 'stagnation' | 'deterioration';

export interface TimelineEvent {
  type:    TimelineEventType;
  date:    string;
  label:   string;
  state:   TimelineEventState;
  payload: { id?: number; [key: string]: unknown };
  raw?:    Suivi | ImageMedicale | ResultatLaboratoire;
}

interface LabInterpretationRow {
  code: string;
  label: string;
  value: number | null;
  unit: string;
  reference: string;
  status: 'Low' | 'Normal' | 'High' | 'Not reported';
}

interface LabInterpretation {
  rows: LabInterpretationRow[];
  analysisLines: string[];
  conclusion: string;
  recommendations: string[];
  riskLevel: 'faible' | 'modere' | 'eleve';
  generatedAt: string;
  /** Texte IA (Gemini / Anthropic) si le backend renvoie ai_conclusion. */
  aiConclusion?: string;
  aiProvider?: string;
  aiConclusionError?: string;
}

@Component({
  selector:    'app-home',
  standalone:  false,
  templateUrl: './home.html',
  styleUrls:   ['./home.css']
})
export class Home implements OnInit, OnDestroy {

  private readonly apiUrl = '/api';
  private notifSub?: Subscription;

  /* ── Auth / patient ──────────────────────────────── */
  loadingUser = true;
  patientId   = 0;
  today       = new Date();

  /* ── Dossiers ────────────────────────────────────── */
  dossiers: DossierMedical[] = [];
  loading  = false;
  error    = '';

  /* ── Données par dossier ─────────────────────────── */
  dossierSuivis:    { [id: number]: Suivi[]               } = {};
  loadingSuivis:    { [id: number]: boolean               } = {};
  dossierImages:    { [id: number]: ImageMedicale[]        } = {};
  dossierResultats: { [id: number]: ResultatLaboratoire[] } = {};
  loadingResultats: { [id: number]: boolean               } = {};
  expandedPatients: { [id: number]: boolean               } = {};
  labInterpretationByDossier: { [id: number]: LabInterpretation | null } = {};
  /** Pendant l’appel POST /api/lab-analysis (agent Python). */
  labAnalysisLoading: { [id: number]: boolean } = {};

  /* ── Timeline ────────────────────────────────────── */
  timelineFilters:  { [id: number]: { suivi: boolean; image: boolean; bilan: boolean } } = {};
  showAddEventModal = false;
  addEventDate      = '';
  addEventType: 'suivi' | 'hospitalisation' | 'image' | 'bilan' = 'suivi';
  addEventDossier:  DossierMedical | null = null;
  showSuiviFormPopup = false;
  suiviFormDossier:  DossierMedical | null = null;
  suiviFormDate      = '';
  suiviFormNotes     = '';
  suiviFormObjectif  = '';
  suiviFormResultat  = 'STABLE';
  suiviSubmitting    = false;
  suiviFormError     = '';
  dragSourceDate     = '';
  timelineDragOver:  { [id: number]: boolean } = {};

  /* ── Alertes ─────────────────────────────────────── */
  alertes:        Alerte[] = [];
  loadingAlertes  = false;
  alerteJours     = 90;

  /* ── Messagerie ──────────────────────────────────── */
  messagesByDossierId:        { [id: number]: Message[] } = {};
  newMessageTextByDossier:    { [id: number]: string    } = {};
  loadingMessagesByDossier:   { [id: number]: boolean   } = {};
  sendingMessageByDossier:    { [id: number]: boolean   } = {};

  /* ── Tests labo ──────────────────────────────────── */
  testsCatalog:              TestLaboratoire[] = [];
  loadingTestsCatalog        = false;
  showResultatFormPopup      = false;
  selectedDossierForResultat: DossierMedical | null = null;
  resultatFormError          = '';
  resultatSubmitting         = false;
  selectedIdTestInForm:       number | null = null;
  resultatDefaultDate        = '';
  resultatWizardStep         = 1;
  selectedTestsForWizard: number[] = [];
  /** Assistant conclusion étape 3 (POST /api/lab-analysis + IA si configurée). */
  resultatWizardAiConclusionLoading = false;
  private wizardAiConclusionTimer: ReturnType<typeof setTimeout> | null = null;
  private lastWizardAiFingerprint = '';
  resultatFormModel = {
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: 'MASCULIN',
    cin: '',
    telephone: '',
    medecin: '',
    specialite: 'Médecine générale',
    datePrescription: '',
    dateResultat: '',
    valeurResultat: '',
    etat: '',
    conclusion: '',
    hb: '',
    gb: '',
    plaquettes: '',
    ht: '',
    glycemieJeun: '',
    cholesterolTotal: '',
    ldl: '',
    hdl: '',
    triglycerides: '',
    tsh: '',
    creatinine: '',
    uree: '',
    sodium: '',
    potassium: '',
    chlore: '',
    bicarbonates: '',
    // NFS — formule complète
    globulesRouges: '',
    neutrophiles: '',
    lymphocytes: '',
    monocytes: '',
    eosinophiles: '',
    basophiles: '',
    // Bilan rénal (panel dédié)
    acideUrique: '',
    cystatineC: '',
    dfgEstime: '',
    dfgCystatineC: '',
    // Protéinurie
    proteinesUrine: '',
    albuminurie: '',
    rapportAlbumineCreatinine: '',
    volumeUrinaire24h: '',
    creatinineUrinaire: '',
    // Ionogramme — Ca, Mg, P (distincts du métabolisme osseux)
    calciumIono: '',
    magnesiumIono: '',
    phosphoreIono: '',
    // Métabolisme osseux
    calciumOsseux: '',
    phosphoreOsseux: '',
    vitamineD: '',
    parathormone: '',
    phosphatasesAlcalines: '',
    // Immunosuppresseurs
    nomMedicament: '',
    tauxResiduel: '',
    datePriseMedicament: '',
    datePrelevement: '',
    dose: '',
    unite: '',
    // DFG / clairance (greffe / 24h)
    dfgClairance: '',
    methodeCalcul: '',
    creatinineSanguine: '',
    creatinineUrinaireClairance: '',
    volumeUrine24h: '',
    surfaceCorporelle: '',
    poids: '',
    taille: '',
  };

  /* ── Demandes labo (créées par le médecin) ─────── */
  dossierDemandes: { [id: number]: PrescriptionBilanDTO[] } = {};
  loadingDemandes: { [id: number]: boolean } = {};
  loadingDemandeOptionsForResultat = false;
  testsCatalogForResultatForm: TestLaboratoire[] = [];
  /** Sélection libre dans tout le catalogue (aucune prescription EN_ATTENTE / PARTIEL). */
  resultatFormFreeCatalog = false;
  /** Message d’information (mode catalogue libre), distinct de resultatFormError. */
  resultatFormInfoMessage = '';
  /** Contexte wizard saisie labo : prescriptions EN_ATTENTE/PARTIEL + résultats (filtrage date comme le backend). */
  private wizardPendingPrescs: PrescriptionBilanDTO[] = [];
  private wizardLastResults: ResultatLaboratoire[] = [];
  activeLabTabByDossier: { [id: number]: 'demandes' | 'resultats' } = {};

  valeurSuggestions = ['Normal','Élevé','Bas','À surveiller','Négatif','Positif','Dans la norme','Anormal','14.2 g/L','120 mg/L','0.5 mmol/L','Hors norme','À contrôler'];
  etatChoices       = ['Normal','À surveiller','Élevé','Bas','Dans la norme','Anormal','Hors norme','À contrôler','Stable','Amélioration','Détérioration'];

  /* ── Bilans / Rapports ───────────────────────────── */
  showAffichagePopup:          boolean                    = false;
  selectedResultatAffichage:   ResultatLaboratoire | null = null;
  showBilanPopup:              boolean                    = false;
  selectedBilan:               ResultatLaboratoire | null = null;
  selectedDossierForBilan:     DossierMedical      | null = null;
  rapportsForBilan:            RapportBi[]                = [];
  rapportsByResultatId:        { [id: number]: RapportBi[] } = {};
  loadingRapports              = false;

  /* ══════════════════════════════════════════════════
     ✅ PRESCRIPTIONS — intégrées depuis home-presc.ts
  ══════════════════════════════════════════════════ */
  prescriptions:          PrescriptionDTO[] = [];
  isPrescLoading          = false;
  showDocumentsModal      = false;
  selectedFolder:         string | null     = null;
  showOrdonnancesModal    = false;
  showPrescriptionDetail  = false;
  selectedPrescription:   PrescriptionDTO | null = null;

  /* ── Formulaires modaux ──────────────────────────── */
  showAppointmentForm   = false;
  showEmergencyForm     = false;
  showMedicalReportForm = false;
  showLabResultForm     = false;
  showTreatmentForm     = false;

  /** Modal Paramètres vitaux (home) */
  constantesList: ConstanteVitaleLite[] = [];
  vitalData: VitalHomeFormData = {
    idConstanteVitale: null,
    nomParametre: '',
    valeurMesuree: null,
    unite: '',
    etat: '',
    referenceMin: null,
    referenceMax: null,
    poids: null,
    taille: null,
    age: null,
    imc: null,
  };
  vitalFormProgress = 0;
  vitalIsLoading = false;
  private readonly vitalApiBase = '/vital';

  /* ── Notifications ───────────────────────────────── */
  showNotifications    = false;
  unreadNotifications  = 3;
  notifications = [
    { icon: '💊', title: 'Medication Reminder',  time: '10 min ago'  },
    { icon: '📅', title: 'Appointment Tomorrow', time: '2 hours ago' },
    { icon: '🧪', title: 'Lab Results Ready',    time: '1 day ago'   }
  ];
  showProfile = false;

  /* ── Chatbot ─────────────────────────────────────── */
  chatOpen      = false;
  chatMessages:  ChatMessage[] = [];
  chatUserInput  = '';

  constructor(
    private http:               HttpClient,
    private router:             Router,
    private cdr:                ChangeDetectorRef,
    public  auth:               AuthService,
    private dossierService:     DossierService,
    private suiviService:       SuiviService,
    private imageMedicaleService:       ImageMedicaleService,
    private testLaboratoireService:     TestLaboratoireService,
    private resultatLaboratoireService: ResultatLaboratoireService,
    private rapportBiService:   RapportBiService,
    private alerteService:      AlerteService,
    private messageService:     MessageService,
    private nephroChatbot:      NephroChatbotService,
    private notification:       NotificationService,
    private confirmService:     ConfirmService,
    private appointmentModal:   AppointmentModalService,
    private prescriptionModal:  PrescriptionModalService,
    private prescriptionService: PrescriptionService,
    private notificationWs:     NotificationWebSocketService,
    private moduleLabo:        ModuleLaboService,
    private labResultStoredPdf: LabResultStoredPdfService,
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
    this.loadAlertes();
    this.initChatbot();
    this.subscribeToImageNotifications();

    this.testLaboratoireService.getAll().subscribe({
      next:  list => { this.testsCatalog = list || []; this.cdr.detectChanges(); },
      error: ()   => { this.testsCatalog = []; }
    });

    this.resolvePatientIdAndLoadPrescriptions();
  }

  /** Résout patientId (et patientName) puis charge les prescriptions */
  private async resolvePatientIdAndLoadPrescriptions(): Promise<void> {
    // 1) /api/patients/me — endpoint dédié patient connecté
    try {
      const me = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/patients/me'));
      const pid = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
      if (pid != null && !isNaN(Number(pid)) && Number(pid) > 0) {
        this.patientId = Number(pid);
        const fn = String(me?.['firstName'] ?? '').trim();
        const ln = String(me?.['lastName'] ?? '').trim();
        const pn = [fn, ln].filter(Boolean).join(' ').trim() || String(me?.['patientNom'] ?? me?.['nom'] ?? '').trim();
        if (pn) localStorage.setItem('patientName', pn);
        localStorage.setItem('patientId', String(this.patientId));
        this.loadPrescriptions();
        this.cdr.detectChanges();
        return;
      }
    } catch {
      /* continue */
    }

    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n > 0) {
        this.patientId = n;
        this.loadPrescriptions();
        return;
      }
    }

    const token = this.auth.getToken();
    if (!token) {
      this.cdr.detectChanges();
      return;
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      this.cdr.detectChanges();
      return;
    }

    const pidDirect = (payload?.['idPatient'] ?? payload?.['patientId'] ?? payload?.['patient_id']) as number | string | null | undefined;
    if (pidDirect != null && !isNaN(Number(pidDirect)) && Number(pidDirect) > 0) {
      this.patientId = Number(pidDirect);
      localStorage.setItem('patientId', String(this.patientId));
      this.loadPrescriptions();
      this.cdr.detectChanges();
      return;
    }

    const username = (payload?.['preferred_username'] ?? payload?.['sub'] ?? payload?.['email']) as string | null | undefined;
    if (!username) {
      this.cdr.detectChanges();
      return;
    }

    try {
      const patients = await firstValueFrom(this.http.get<unknown[]>('/api/patients'));
      const found = Array.isArray(patients)
        ? (patients.find((x: unknown) => {
            const o = x as Record<string, unknown>;
            return o?.['username'] === username || o?.['email'] === username || o?.['login'] === username;
          }) as Record<string, unknown> | undefined)
        : null;
      if (found) {
        const pid = found['idPatient'] ?? found['id'] ?? found['patientId'];
        if (pid != null && !isNaN(Number(pid))) {
          this.patientId = Number(pid);
          const fn = String(found['firstName'] ?? found['prenom'] ?? '').trim();
          const ln = String(found['lastName'] ?? found['nom'] ?? '').trim();
          const pn = [fn, ln].filter(Boolean).join(' ').trim() || String(found['patientNom'] ?? found['username'] ?? '').trim();
          if (pn) localStorage.setItem('patientName', pn);
          localStorage.setItem('patientId', String(this.patientId));
          this.loadPrescriptions();
        }
      }
    } catch {
      /* ignore */
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.clearWizardAiConclusionDebounce();
    this.notifSub?.unsubscribe();
  }

  /** S'abonne aux notifications WebSocket (IMAGE_MEDICALE) pour rafraîchir les images. */
  private subscribeToImageNotifications(): void {
    this.notifSub = this.notificationWs.notifications$.subscribe((items) => {
      const last = items[items.length - 1];
      if (last?.type === 'IMAGE_MEDICALE' && last.idDossierMedical != null) {
        this.loadImagesByDossier(last.idDossierMedical);
      }
    });
  }

  /* ══════════════════════════════════════════════════
     PRESCRIPTIONS
  ══════════════════════════════════════════════════ */

  /** Charge les prescriptions actives du patient (PrescriptionService → port 8086) */
  loadPrescriptions(): void {
    if (!this.patientId) return;
    this.isPrescLoading = true;
    this.prescriptionService.getActiveByPatient(this.patientId).subscribe({
      next: (data) => {
        const list = (data || []).filter(p => getPrescriptionPatientId(p) === this.patientId);
        this.prescriptions = list.sort((a, b) =>
          new Date(b.prescriptionDate).getTime() -
          new Date(a.prescriptionDate).getTime()
        );
        this.isPrescLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.prescriptions = [];
        this.isPrescLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Ouvre la modal Prescriptions (navbar) */
  openPrescriptionsModal(): void {
    this.prescriptionModal.open();
  }

  /* ── Modaux Documents ────────────────────────────── */
  openDocuments(): void {
    this.selectedFolder     = null;
    this.showDocumentsModal = true;
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
    this.selectedFolder     = null;
  }

  openFolder(folder: string | unknown): void {
    const f = typeof folder === 'string' ? folder : '';
    this.selectedFolder     = f;
    this.showDocumentsModal = true;
    if (f === 'ordonnances' && this.prescriptions.length === 0) {
      this.loadPrescriptions();
    }
  }

  openOrdonnances(): void {
    this.showOrdonnancesModal = true;
    this.showDocumentsModal   = false;
    if (this.prescriptions.length === 0) this.loadPrescriptions();
  }

  closeOrdonnances(): void {
    this.showOrdonnancesModal = false;
  }

  selectOrdonnance(prescription: PrescriptionDTO): void {
    this.selectedPrescription   = prescription;
    this.showOrdonnancesModal   = false;
    this.showDocumentsModal     = false;
    this.selectedFolder         = null;
    this.showPrescriptionDetail = true;
  }

  openPrescriptionDetail(prescription: PrescriptionDTO | unknown): void {
    const presc = prescription as PrescriptionDTO;
    if (presc && (presc.patientId != null || presc.prescriptionDate != null)) {
      this.selectedPrescription   = presc;
      this.showDocumentsModal     = false;
      this.showOrdonnancesModal   = false;
      this.selectedFolder         = null;
      this.showPrescriptionDetail = true;
    }
  }

  closePrescriptionDetail(): void {
    this.showPrescriptionDetail = false;
    this.selectedPrescription   = null;
  }

  /* ── Print ordonnance ────────────────────────────── */
  printPrescription(presc?: PrescriptionDTO): void {
    if (!presc) return;
    const dateStr   = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dateShort = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR');

    const itemsHtml = (presc.prescriptionItems ?? []).map((item, i) => `
      <div class="med-item">
        <div class="med-num">${i + 1}</div>
        <div class="med-body">
          <div class="med-top">
            <span class="med-name">${item.medicationName ?? `Médicament ${i + 1}`}</span>
            ${item.dosage             ? `<span class="badge-dose">${item.dosage}</span>`   : ''}
            ${item.isPriority         ? `<span class="badge-prio">★ Prioritaire</span>`   : ''}
            ${item.isImmunosuppressor ? `<span class="badge-immuno">Immunosupp.</span>`   : ''}
          </div>
          ${item.category ? `<div class="med-cat">${item.category}</div>` : ''}
          <div class="med-details">
            ${item.frequency           ? `<span><b>Fréquence :</b> ${item.frequency}</span>`                                                   : ''}
            ${item.administrationRoute ? `<span><b>Voie :</b> ${item.administrationRoute}</span>`                                              : ''}
            ${item.duration            ? `<span><b>Durée :</b> ${item.duration} jour(s)</span>`                                                : ''}
            ${item.dosageInstructions  ? `<span><b>Posologie :</b> ${item.dosageInstructions}</span>`                                          : ''}
            ${item.startDate           ? `<span><b>Début :</b> ${new Date(item.startDate).toLocaleDateString('fr-FR')}</span>`                 : ''}
            ${item.endDate             ? `<span><b>Fin :</b> ${new Date(item.endDate).toLocaleDateString('fr-FR')}</span>`                     : ''}
          </div>
          ${item.specialInstructions ? `<div class="med-special">${item.specialInstructions}</div>` : ''}
        </div>
      </div>
    `).join('');

    const noteHtml = presc.notes
      ? `<div class="note-box">
           <div class="note-label">NOTE CLINIQUE</div>
           <div class="note-text">${presc.notes}</div>
         </div>`
      : '';

    const win = window.open('', '_blank', 'width=860,height=1000');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Ordonnance #${presc.id}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { font-family:'Segoe UI',Arial,sans-serif; background:white; color:#1f2937 }
  .header { background:#1e3a8a; padding:22px 36px; display:flex; justify-content:space-between; align-items:flex-start }
  .clinic-name { color:white; font-size:22px; font-weight:900; margin-bottom:4px }
  .clinic-sub { color:rgba(255,255,255,0.75); font-size:11px }
  .doc-meta { text-align:right }
  .doc-title { color:rgba(255,255,255,0.7); font-size:9px; letter-spacing:3px; text-transform:uppercase; margin-bottom:3px }
  .doc-num { color:white; font-size:20px; font-weight:900; font-family:'Courier New',monospace }
  .doc-date { color:rgba(255,255,255,0.7); font-size:11px; margin-top:3px }
  .rule { height:3px; background:linear-gradient(90deg,#1e3a8a,#3b82f6,#bfdbfe) }
  .body { padding:28px 36px }
  .info-row { display:flex; border:1.5px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:22px }
  .info-cell { flex:1; padding:10px 16px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:3px }
  .info-cell:last-child { border-right:none }
  .info-lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px }
  .info-val { font-size:14px; font-weight:700; color:#1e293b }
  .note-box { background:#fffbeb; border:1px solid #fde68a; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; padding:10px 14px; margin-bottom:20px }
  .note-label { font-size:9px; font-weight:800; color:#92400e; text-transform:uppercase; margin-bottom:3px }
  .note-text { font-size:13px; color:#78350f; font-style:italic }
  .rp-row { display:flex; align-items:center; gap:12px; margin-bottom:16px }
  .rp-sym { font-size:28px; font-weight:900; color:#1e3a8a; font-family:Georgia,serif; font-style:italic }
  .rp-line { flex:1; height:1.5px; background:#1e3a8a; opacity:0.2 }
  .med-item { display:flex; border:1.5px solid #e2e8f0; border-radius:9px; overflow:hidden; margin-bottom:10px }
  .med-num { width:38px; background:#1e3a8a; color:white; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; flex-shrink:0 }
  .med-body { padding:12px 15px; flex:1 }
  .med-top { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:4px }
  .med-name { font-size:15px; font-weight:800; color:#0f172a }
  .badge-dose { background:#dbeafe; color:#1e40af; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .badge-prio { background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .badge-immuno { background:#fce7f3; color:#9d174d; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .med-cat { font-size:11px; color:#64748b; font-style:italic; margin-bottom:7px }
  .med-details { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:12px; color:#475569 }
  .med-details b { color:#334155 }
  .med-special { margin-top:7px; font-size:12px; color:#1e40af; background:#eff6ff; border-left:3px solid #3b82f6; padding:5px 10px; border-radius:0 6px 6px 0 }
  .footer-rule { border:none; border-top:1.5px dashed #cbd5e1; margin:28px 0 16px }
  .footer-row { display:flex; justify-content:space-between; align-items:flex-end }
  .sig-line { width:160px; height:1px; background:#334155; margin-bottom:5px }
  .sig-label { font-size:11px; color:#64748b }
  .footer-right { text-align:right }
  .footer-brand { font-size:12px; font-weight:800; color:#1e3a8a }
  .footer-gen { font-size:10px; color:#94a3b8; margin-top:2px }
  .footer-valid { font-size:10px; color:#94a3b8; font-style:italic }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact } }
</style></head><body>
<div class="header">
  <div>
    <div class="clinic-name">KidneyCare</div>
    <div class="clinic-sub">Centre de Néphrologie Pédiatrique · Tunis · +216 70 000 000</div>
  </div>
  <div class="doc-meta">
    <div class="doc-title">Ordonnance</div>
    <div class="doc-num">N° ${presc.id}</div>
    <div class="doc-date">${dateStr}</div>
  </div>
</div>
<div class="rule"></div>
<div class="body">
  <div class="info-row">
    <div class="info-cell"><span class="info-lbl">Patient</span><span class="info-val">#${presc.patientId}</span></div>
    <div class="info-cell"><span class="info-lbl">Date</span><span class="info-val">${dateShort}</span></div>
    <div class="info-cell"><span class="info-lbl">Médicaments</span><span class="info-val">${presc.prescriptionItems?.length ?? 0}</span></div>
  </div>
  ${noteHtml}
  <div class="rp-row"><span class="rp-sym">Rp</span><div class="rp-line"></div></div>
  ${itemsHtml || '<p style="color:#94a3b8;font-style:italic">Aucun médicament prescrit.</p>'}
  <hr class="footer-rule">
  <div class="footer-row">
    <div><div class="sig-line"></div><div class="sig-label">Signature &amp; Cachet du médecin</div></div>
    <div class="footer-right">
      <div class="footer-brand">KidneyCare · Parent Portal</div>
      <div class="footer-gen">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
      <div class="footer-valid">Valable 3 mois à compter de la prescription</div>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  /* ── PDF download ────────────────────────────────── */
  downloadPrescriptionPDF(presc?: PrescriptionDTO): void {
    if (!presc) return;
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, margin = 20;
    let y = 20;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('KidneyCare', margin, 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Centre de Néphrologie Pédiatrique · Tunis · +216 70 000 000', margin, 20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('ORDONNANCE', pageW - margin, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`N° ${presc.id ?? '—'}`, pageW - margin, 18, { align: 'right' });
    doc.text(
      new Date(presc.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      pageW - margin, 24, { align: 'right' }
    );

    y = 34;
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.2);
    doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PATIENT', margin, y); doc.text('DATE', 90, y); doc.text('MÉDICAMENTS', 140, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); y += 5;
    doc.text(`#${presc.patientId}`, margin, y);
    doc.text(new Date(presc.prescriptionDate).toLocaleDateString('fr-FR'), 90, y);
    doc.text(`${presc.prescriptionItems?.length ?? 0}`, 140, y); y += 10;

    if (presc.notes) {
      doc.setFillColor(255, 251, 235); doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'FD');
      doc.setTextColor(120, 53, 15);
      doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(9);
      doc.text('Note clinique :', margin + 4, y + 5);
      doc.setFont('helvetica', 'italic');
      doc.text(presc.notes, margin + 4, y + 11, { maxWidth: pageW - margin * 2 - 8 });
      y += 20;
    }

    doc.setTextColor(30, 58, 138);
    doc.setFont('times', 'bolditalic'); doc.setFontSize(18);
    doc.text('Rp', margin, y + 6);
    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.4);
    doc.line(margin + 12, y + 3, pageW - margin, y + 3); y += 14;

    const items = presc.prescriptionItems ?? [];
    if (!items.length) {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
      doc.text('Aucun médicament prescrit.', margin, y); y += 10;
    }

    items.forEach((item, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y - 1, 7, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`${i + 1}`, margin + 3.5, y + 5.5, { align: 'center' });
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(item.medicationName ?? `Médicament ${i + 1}`, margin + 10, y + 6);
      if (item.dosage) {
        doc.setFillColor(219, 234, 254); doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        const dw = doc.getTextWidth(item.dosage) + 6;
        doc.roundedRect(pageW - margin - dw, y + 1, dw, 6, 1, 1, 'F');
        doc.text(item.dosage, pageW - margin - dw / 2, y + 5.5, { align: 'center' });
      }
      y += 11;
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const details: string[] = [];
      if (item.frequency)           details.push(`Fréquence : ${item.frequency}`);
      if (item.administrationRoute) details.push(`Voie : ${item.administrationRoute}`);
      if (item.duration)            details.push(`Durée : ${item.duration} jour(s)`);
      if (item.dosageInstructions)  details.push(`Posologie : ${item.dosageInstructions}`);
      if (item.startDate)           details.push(`Début : ${new Date(item.startDate).toLocaleDateString('fr-FR')}`);
      if (item.endDate)             details.push(`Fin : ${new Date(item.endDate).toLocaleDateString('fr-FR')}`);
      if (details.length) { doc.text(details.join('   ·   '), margin + 10, y, { maxWidth: pageW - margin * 2 - 10 }); y += 6; }
      if (item.specialInstructions) {
        doc.setFillColor(239, 246, 255); doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5);
        doc.roundedRect(margin + 10, y, pageW - margin * 2 - 10, 8, 1, 1, 'F');
        doc.text(item.specialInstructions, margin + 13, y + 5.5); y += 11;
      }
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y); y += 6;
    });

    y = Math.max(y + 10, 240);
    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setDrawColor(51, 65, 85); doc.setLineWidth(0.5);
    doc.line(margin, y + 14, margin + 50, y + 14);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Signature & Cachet du médecin', margin, y + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); doc.setFontSize(10);
    doc.text('KidneyCare · Parent Portal', pageW - margin, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageW - margin, y + 14, { align: 'right' });
    doc.text('Valable 3 mois à compter de la prescription', pageW - margin, y + 19, { align: 'right' });

    const dateStr2 = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`Ordonnance_${presc.id}_${dateStr2}.pdf`);
  }

  /* ══════════════════════════════════════════════════
     DOSSIERS
  ══════════════════════════════════════════════════ */
  loadDossiers(): void {
    this.loading = true;
    this.error   = '';
    const isPatient = this.auth.hasRole([KEYCLOAK_ROLES.patient]);
    const obs = isPatient
      ? this.dossierService.getMesDossiers()
      : this.dossierService.getAllDossiers();
    obs.subscribe({
      next: (data) => {
        this.dossiers = data || [];
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error   = err?.message || 'Error loading records.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePatient(idDossier: number): void {
    this.expandedPatients[idDossier] = !this.expandedPatients[idDossier];
    if (this.expandedPatients[idDossier]) {
      if (!this.dossierSuivis[idDossier])    this.loadSuivisForDossier(idDossier);
      if (!this.dossierResultats[idDossier]) this.loadResultatsForDossier(idDossier);
      if (!this.dossierDemandes[idDossier]) this.loadDemandesForDossier(idDossier);
      if (!this.messagesByDossierId[idDossier]) this.loadMessagesForDossier(idDossier);
    }
  }

  loadMessagesForDossier(id: number): void {
    this.loadingMessagesByDossier[id] = true;
    this.messageService.getByDossier(id).subscribe({
      next: list => {
        this.messagesByDossierId[id] = list || [];
        this.loadingMessagesByDossier[id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messagesByDossierId[id] = [];
        this.loadingMessagesByDossier[id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  sendMessagePatient(dossier: DossierMedical): void {
    const id   = dossier.idDossierMedical!;
    const text = (this.newMessageTextByDossier[id] || '').trim();
    if (!text) return;
    this.sendingMessageByDossier[id] = true;
    this.messageService.send({
      idDossierMedical: id,
      typeExpediteur:   'PATIENT' as TypeExpediteur,
      contenu:          text
    }).subscribe({
      next: () => {
        this.newMessageTextByDossier[id] = '';
        this.loadMessagesForDossier(id);
        this.sendingMessageByDossier[id] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sendingMessageByDossier[id] = false;
        this.notification.error(err?.message || 'Send error');
        this.cdr.detectChanges();
      }
    });
  }

  loadSuivisForDossier(idDossier: number): void {
    this.loadingSuivis[idDossier] = true;
    this.suiviService.getSuivisByDossier(idDossier).subscribe({
      next: (data) => {
        this.dossierSuivis[idDossier] = Array.isArray(data) ? data : (data ? [data] : []);
        this.loadImagesByDossier(idDossier);
        this.loadingSuivis[idDossier] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.dossierSuivis[idDossier] = [];
        this.loadingSuivis[idDossier] = false;
      }
    });
  }

  loadImagesByDossier(idDossier: number): void {
    this.imageMedicaleService.getImagesByDossier(idDossier).subscribe({
      next: data  => { this.dossierImages[idDossier] = data; this.cdr.detectChanges(); },
      error: ()   => { this.dossierImages[idDossier] = []; }
    });
  }

  loadResultatsForDossier(idDossier: number): void {
    this.loadingResultats[idDossier] = true;
    this.resultatLaboratoireService.getByDossier(idDossier).subscribe({
      next: (data) => {
        this.dossierResultats[idDossier] = data || [];
        this.loadingResultats[idDossier] = false;
        (this.dossierResultats[idDossier] || []).forEach(r => {
          if (r.idResultatLaboratoire) {
            this.rapportBiService.getByBilan(r.idResultatLaboratoire).subscribe({
              next: rapports => {
                this.rapportsByResultatId[r.idResultatLaboratoire!] = rapports || [];
                this.cdr.detectChanges();
              },
              error: () => { this.rapportsByResultatId[r.idResultatLaboratoire!] = []; }
            });
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.dossierResultats[idDossier] = [];
        this.loadingResultats[idDossier] = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDemandesForDossier(idDossier: number): void {
    this.loadingDemandes[idDossier] = true;
    this.moduleLabo.getPrescriptionsByDossier(idDossier).subscribe({
      next: (list) => {
        const raw = list || [];
        // « Mes demandes » = uniquement en attente de prélèvement. Dès qu’il y a des résultats (PARTIEL/COMPLET) ou annulation, ce n’est plus listé ici — voir « Mes résultats ».
        this.dossierDemandes[idDossier] = raw.filter((p) => {
          const s = (p.statut ?? 'EN_ATTENTE') as StatutPrescription;
          return s === 'EN_ATTENTE';
        });
        this.loadingDemandes[idDossier] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.dossierDemandes[idDossier] = [];
        this.loadingDemandes[idDossier] = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAlertes(): void {
    this.loadingAlertes = true;
    this.alerteService.getAlertes(this.alerteJours).subscribe({
      next:  data => { this.alertes = data || []; this.loadingAlertes = false; this.cdr.detectChanges(); },
      error: ()   => { this.alertes = [];          this.loadingAlertes = false; this.cdr.detectChanges(); }
    });
  }

  openDossierFromAlerte(a: Alerte): void {
    const d = this.dossiers.find(x => x.idDossierMedical === a.idDossierMedical);
    if (d) {
      this.expandedPatients[d.idDossierMedical!] = true;
      this.loadSuivisForDossier(d.idDossierMedical!);
      this.loadResultatsForDossier(d.idDossierMedical!);
      this.cdr.detectChanges();
    }
  }

  /* ── Images ──────────────────────────────────────── */
  private readonly placeholderImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgaW5kaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';

  getImageUrl(cheminImage: string): string {
    if (!cheminImage) return this.placeholderImageUrl;
    if (cheminImage.startsWith('http')) return cheminImage;
    let path = cheminImage.startsWith('/') ? cheminImage : '/' + cheminImage;
    if (!path.startsWith('/uploads/')) path = '/uploads/' + cheminImage.replace(/^\//, '');
    return `http://localhost:8089${path}`;
  }
  viewImage(image: ImageMedicale): void { window.open(this.getImageUrl(image.cheminImage || ''), '_blank'); }
  onImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    if (img?.src !== this.placeholderImageUrl) img.src = this.placeholderImageUrl;
  }
  getImageTypeLabel(typeImage: string): string {
    const types: { [key: string]: string } = {
      'ECHOGRAPHIE_RENALE':'Renal ultrasound','ECHOGRAPHIE_VESICALE':'Bladder ultrasound',
      'ECHOGRAPHIE_DOPPLER_RENAL':'Renal Doppler','SCANNER_ABDOMINAL':'Abdominal CT',
      'SCANNER_RENAL':'Renal CT','URO_SCANNER':'Uro-CT','IRM_RENALE':'Renal MRI',
      'IRM_ABDOMINALE':'Abdominal MRI','URO_IRM':'Uro-MRI',
      'RADIOGRAPHIE_ABDOMINALE':'Abdominal X-ray','SCINTIGRAPHIE_RENALE_STATIQUE':'Renal scintigraphy (DMSA)',
      'SCINTIGRAPHIE_RENALE_DYNAMIQUE':'Dynamic renal scintigraphy',
      'CYSTOGRAPHIE_RETRO_MICTIONNELLE':'Cystography','PHOTO_CLINIQUE':'Clinical photo','AUTRE':'Other'
    };
    return types[typeImage] || typeImage;
  }

  /* ── Formatage dates ─────────────────────────────── */
  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }
  /** Valeur affichable d'un résultat (numérique+unité, texte ou ancienne valeur). */
  formatValeur(r: ResultatLaboratoire): string {
    return formatValeurResultat(r);
  }

  /** Affichage carte « Mes résultats » (tronqué + tooltip). */
  formatValeurCard(r: ResultatLaboratoire): string {
    return formatValeurResultatCard(r, 140);
  }

  private normKey(v: string): string {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private metricDefinitions() {
    return [
      { key: 'calcemie corrigee', label: 'Calcémie corrigée', unit: 'mmol/L', min: 2.15, max: 2.55, ref: '2.15–2.55' },
      { key: 'glycemie a jeun', label: 'Glycémie à jeun', unit: 'mmol/L', min: 3.9, max: 6.1, ref: '3.9–6.1' },
      { key: 'cholesterol total', label: 'Cholestérol total', unit: 'mmol/L', max: 5.2, ref: '<5.2' },
      { key: 'ldl', label: 'LDL', unit: 'mmol/L', max: 3.4, ref: '<3.4' },
      { key: 'hdl', label: 'HDL', unit: 'mmol/L', min: 1.2, ref: '>1.2' },
      { key: 'triglycerides', label: 'Triglycérides', unit: 'mmol/L', max: 1.7, ref: '<1.7' },
      { key: 'tsh', label: 'TSH', unit: 'mUI/L', min: 0.4, max: 4.0, ref: '0.4–4.0' },
      { key: 'creatinine', label: 'Créatinine', unit: 'µmol/L', min: 53, max: 97, ref: '53–97' },
    ];
  }

  /** Même logique que le parseur labo (séparateurs « | » puis « ; », puis clé=valeur). */
  private parseMetricsFromValue(valeur: string | undefined | null): Record<string, number> {
    const out: Record<string, number> = {};
    const raw = String(valeur || '');
    const segments = raw.split('|');
    for (const seg of segments) {
      for (const part of seg.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const left = part.slice(0, idx).trim();
        const right = part.slice(idx + 1).trim();
        const k = this.normKey(left);
        const m = String(right).match(/-?\d+(?:[.,]\d+)?/);
        if (!m) continue;
        const n = Number(m[0].replace(',', '.'));
        if (Number.isFinite(n)) out[k] = n;
      }
    }
    return out;
  }

  analyzeLaboForDossier(dossier: DossierMedical): void {
    const id = dossier.idDossierMedical;
    if (!id) return;
    const payload = this.buildLabAnalysisPayload(dossier);
    const hasValues = Object.keys(payload.values || {}).length > 0;
    if (!hasValues) {
      this.notification.info('No usable laboratory values for this record.');
      return;
    }

    this.labAnalysisLoading[id] = true;
    this.cdr.detectChanges();
    this.moduleLabo
      .analyzeLab(payload, true)
      .pipe(
        finalize(() => {
          this.labAnalysisLoading[id] = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.labInterpretationByDossier[id] = this.mapLabAnalysisResponse(res);
          this.loadDemandesForDossier(id);
          this.notification.success('Automatic analysis completed.');
        },
        error: (err) => {
          this.notification.error(err?.message ?? 'Automatic analysis failed.');
        },
      });
  }

  clearLabInterpretation(dossier: DossierMedical): void {
    const id = dossier.idDossierMedical;
    if (!id) return;
    this.labInterpretationByDossier[id] = null;
    this.cdr.detectChanges();
  }

  getLabRiskClass(level: 'faible' | 'modere' | 'eleve' | undefined): string {
    if (level === 'eleve') return 'tone-bad';
    if (level === 'modere') return 'tone-warn';
    return 'tone-ok';
  }

  getLabRiskLabelEn(level: 'faible' | 'modere' | 'eleve' | undefined): string {
    if (level === 'eleve') return 'High';
    if (level === 'modere') return 'Moderate';
    return 'Low';
  }

  getLabRowStatusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s.includes('low') || s.includes('high') || s.includes('elev') || s.includes('bas') || s.includes('élev') || s.includes('eleve')) {
      return 'lab-row-warn';
    }
    if (s.includes('normal')) return 'lab-row-ok';
    return '';
  }

  private buildLabAnalysisPayload(dossier: DossierMedical): LabAnalysisPayload {
    const idDossier = dossier.idDossierMedical;
    const mergedValues: Record<string, number> = {};
    for (const r of this.dossierResultats[idDossier || 0] || []) {
      const values = this.parseMetricsFromValue(r.valeurResultat);
      for (const [key, value] of Object.entries(values)) {
        const mapped = this.mapMetricKeyForLabAgent(key);
        if (mapped) mergedValues[mapped] = value;
      }
      if (Object.keys(values).length === 0 && r.valeurNumerique != null && Number.isFinite(r.valeurNumerique)) {
        const fromTest = this.mapMetricKeyFromResultatTest(r);
        if (fromTest) mergedValues[fromTest] = r.valeurNumerique;
      }
    }

    const patientNomComplet = (dossier.patientNom || '').trim();
    const split = patientNomComplet ? patientNomComplet.split(/\s+/) : [];
    const nom = split.length > 0 ? split[0] : '';
    const prenom = split.length > 1 ? split.slice(1).join(' ') : '';

    return {
      patient: {
        id: dossier.idPatient != null ? String(dossier.idPatient) : undefined,
        nom: nom || undefined,
        prenom: prenom || undefined,
      },
      values: mergedValues,
    };
  }

  private mapMetricKeyForLabAgent(key: string): string | null {
    const k = this.normKey(key);
    const map: Record<string, string> = {
      hb: 'hb',
      gb: 'gb',
      plaquettes: 'plaquettes',
      ht: 'ht',
      neutrophiles: 'neutrophiles',
      lymphocytes: 'lymphocytes',
      crp: 'crp',
      potassium: 'potassium',
      k: 'potassium',
      'glycemie a jeun': 'glycemie_jeun',
      'glycemie jeun': 'glycemie_jeun',
      'cholesterol total': 'cholesterol_total',
      ldl: 'ldl',
      hdl: 'hdl',
      triglycerides: 'triglycerides',
      tsh: 'tsh',
      creatinine: 'creatinine',
      creatininemie: 'creatinine',
      uree: 'uree',
      alat: 'alat',
      asat: 'asat',
    };
    return map[k] ?? null;
  }

  /** Si le texte du résultat n’a pas de « clé=valeur », on déduit le paramètre depuis le test lié. */
  private mapMetricKeyFromResultatTest(r: ResultatLaboratoire): string | null {
    const code = this.normKey(r.codeTest || '');
    const nom = this.normKey(r.nomTest || '');
    const hay = `${code} ${nom}`;
    if (hay.includes('creatinin') || hay.includes('creatininemie')) return 'creatinine';
    if (hay.includes('uree') && !hay.includes('acide')) return 'uree';
    if (hay.includes('hemoglob') || hay === 'hb') return 'hb';
    if (hay.includes('hematocrit') || hay.includes('ht ')) return 'ht';
    if (hay.includes('leucocyt') || hay.includes('gb ') || hay.includes('nfs')) return 'gb';
    if (hay.includes('plaquet')) return 'plaquettes';
    if (hay.includes('tsh')) return 'tsh';
    if (hay.includes('glycem') || hay.includes('glucose')) return 'glycemie_jeun';
    return null;
  }

  private mapLabAnalysisResponse(res: LabAnalysisResponse): LabInterpretation {
    const rows: LabInterpretationRow[] = (res.rows || []).map(r => ({
      code: r.code,
      label: r.analyse,
      value: typeof r.resultat === 'number' ? r.resultat : null,
      unit: r.unite,
      reference: r.reference,
      status: this.normalizeLabStatus(r.statut),
    }));
    const riskLevel = this.normalizeRiskLevel(res.risk_level);
    const analysisLines = String(res.analysis_text || '')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
    return {
      rows,
      analysisLines,
      conclusion: String(res.conclusion || 'Conclusion not available.'),
      recommendations: Array.isArray(res.recommendations) ? res.recommendations : [],
      riskLevel,
      generatedAt: new Date().toISOString(),
      aiConclusion: res.ai_conclusion?.trim() || undefined,
      aiProvider: res.ai_provider?.trim() || undefined,
      aiConclusionError: res.ai_conclusion_error?.trim() || undefined,
    };
  }

  private normalizeLabStatus(value: string | undefined): 'Low' | 'Normal' | 'High' | 'Not reported' {
    const v = String(value || '').toLowerCase();
    if (v.includes('bas') || v.includes('low')) return 'Low';
    if (v.includes('eleve') || v.includes('élev') || v.includes('high')) return 'High';
    if (v.includes('normal')) return 'Normal';
    return 'Not reported';
  }

  private normalizeRiskLevel(value: string | undefined): 'faible' | 'modere' | 'eleve' {
    const v = String(value || '').toLowerCase();
    if (v === 'eleve' || v === 'high') return 'eleve';
    if (v === 'modere' || v === 'moderate') return 'modere';
    return 'faible';
  }

  getResultatMetrics(r: ResultatLaboratoire): Array<{ label: string; value: string; unit: string; ref: string; status: string; tone: string; width: number }> {
    const defs = this.metricDefinitions();
    const values = this.parseMetricsFromValue(r.valeurResultat);
    return defs.map(d => {
      const v = values[d.key];
      if (v == null) {
        return { label: d.label, value: '--', unit: d.unit, ref: d.ref, status: '—', tone: 'muted', width: 0 };
      }
      let status = 'Normal';
      let tone = 'ok';
      if (d.min != null && v < d.min) { status = 'Low'; tone = 'bad'; }
      if (d.max != null && v > d.max) { status = 'High'; tone = 'bad'; }
      if (d.min == null && d.max != null && v > d.max) { status = 'High'; tone = 'warn'; }
      if (d.max == null && d.min != null && v < d.min) { status = 'Low'; tone = 'warn'; }
      const width = d.max ? Math.max(6, Math.min(100, (v / d.max) * 100)) : 50;
      return { label: d.label, value: `${v}`, unit: d.unit, ref: d.ref, status, tone, width };
    });
  }

  getResultatCardSummary(r: ResultatLaboratoire): { text: string; tone: string } {
    const metrics = this.getResultatMetrics(r).filter(m => m.status !== '—');
    const anomalies = metrics.filter(m => m.status !== 'Normal').length;
    if (anomalies === 0) return { text: 'All normal', tone: 'ok' };
    if (anomalies === 1) return { text: 'One abnormal value', tone: 'warn' };
    return { text: `${anomalies} abnormal values`, tone: 'bad' };
  }
  /** Date du résultat (dateRendu ou datePrelevement ou dateResultat). */
  formatDateResultat(r: ResultatLaboratoire): string {
    if (!r) return '—';
    const d = (r as any).dateRendu ?? (r as any).datePrelevement ?? r.dateResultat;
    return this.formatDate(d);
  }
  formatDateFull(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }
  formatDateShort(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  /* ── Statuts ─────────────────────────────────────── */
  getStatusClass(resultat: string): string {
    const m: { [k: string]: string } = {
      'GUERISON':'status-success','REMISSION':'status-success','AMELIORATION':'status-success',
      'STABLE':'status-info','EN_COURS':'status-info','SOUS_SURVEILLANCE':'status-warning',
      'DETERIORATION':'status-danger','RECHUTE':'status-danger','URGENCE':'status-danger'
    };
    return m[resultat] || 'status-info';
  }
  getStatusIcon(resultat: string): string {
    const m: { [k: string]: string } = {
      'GUERISON':'✅','REMISSION':'🎉','AMELIORATION':'📈','STABLE':'➡️',
      'EN_COURS':'⏳','SOUS_SURVEILLANCE':'👁️','DETERIORATION':'📉','RECHUTE':'🔄','URGENCE':'🚨'
    };
    return m[resultat] || '📝';
  }
  getStatusLabel(resultat: string): string {
    const m: { [k: string]: string } = {
      'EN_COURS':'In progress','STABLE':'Stable','AMELIORATION':'Improvement',
      'DETERIORATION':'Deterioration','REMISSION':'Remission','RECHUTE':'Relapse',
      'GUERISON':'Cured','SOUS_SURVEILLANCE':'Under surveillance','URGENCE':'Emergency'
    };
    return m[resultat] || resultat;
  }

  statutDemandeLabel(statut?: StatutPrescription | string): string {
    const s = (statut || '').toString();
    const map: Record<string, string> = {
      EN_ATTENTE: 'Pending',
      PARTIEL: 'Partial',
      COMPLET: 'Complete',
      ANNULE: 'Cancelled',
    };
    return map[s] || s || '—';
  }

  /* ── Tests ───────────────────────────────────────── */
  get selectedTestForWizard(): TestLaboratoire | null {
    const id = this.selectedTestsForWizard[0];
    if (!id) return null;
    return (
      this.testsCatalogForResultatForm.find((t) => t.idTestLaboratoire === id) ||
      this.testsCatalog.find((t) => t.idTestLaboratoire === id) ||
      null
    );
  }

  /** Tests correspondant aux id cochés (formulaire résultat wizard). */
  private wizardSelectedTestObjects(): TestLaboratoire[] {
    const out: TestLaboratoire[] = [];
    const formCat = this.testsCatalogForResultatForm;
    const global = this.testsCatalog;
    for (const id of this.selectedTestsForWizard) {
      const t = formCat.find((x) => x.idTestLaboratoire === id) ?? global.find((x) => x.idTestLaboratoire === id);
      if (t) out.push(t);
    }
    return out;
  }

  /** Libellés courts pour l’en-tête étape 3 (plusieurs analyses). */
  wizardSelectedTestsCodesSummary(): string {
    return this.wizardSelectedTestObjects()
      .map((t) => t.codeTest)
      .filter(Boolean)
      .join(', ');
  }

  /** Coche toutes les analyses encore demandées (ionogramme, panel rénal, etc.). */
  private autoSelectAllPendingWizardTests(): void {
    const ids = (this.testsCatalogForResultatForm || [])
      .map((t) => t.idTestLaboratoire)
      .filter((id): id is number => id != null);
    this.selectedTestsForWizard = [...ids];
    this.selectedIdTestInForm = ids[0] ?? null;
  }

  isHemogramWizardTest(): boolean {
    return this.wizardSelectedTestObjects().some((t) => {
      const hay = `${t.codeTest || ''} ${t.nomTest || ''} ${t.codeLoinc || ''}`.toUpperCase();
      return hay.includes('NFS') || hay.includes('HEMO') || hay.includes('HEMATO') || hay.includes('HEMOGR');
    });
  }

  hasHemogramValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.hb || '').trim() ||
      String(m.gb || '').trim() ||
      String(m.plaquettes || '').trim() ||
      String(m.ht || '').trim() ||
      String(m.globulesRouges || '').trim() ||
      String(m.neutrophiles || '').trim() ||
      String(m.lymphocytes || '').trim() ||
      String(m.monocytes || '').trim() ||
      String(m.eosinophiles || '').trim() ||
      String(m.basophiles || '').trim()
    );
  }

  hasExtendedBioValues(): boolean {
    return !!(
      String(this.resultatFormModel.glycemieJeun || '').trim() ||
      String(this.resultatFormModel.cholesterolTotal || '').trim() ||
      String(this.resultatFormModel.ldl || '').trim() ||
      String(this.resultatFormModel.hdl || '').trim() ||
      String(this.resultatFormModel.triglycerides || '').trim() ||
      String(this.resultatFormModel.tsh || '').trim()
    );
  }

  isIonogramWizardTest(): boolean {
    return this.wizardSelectedTestObjects().some((t) => {
      const c = (t.codeTest || '').toUpperCase();
      if (
        [
          'NATREMIE',
          'KALIEMIE',
          'CHLOREMIE',
          'BICARBONATES',
          'CALCEMIE',
          'CALCEMIE_CORRIGEE',
          'PHOSPHOREMIE',
          'MAGNESEMIE',
        ].includes(c)
      )
        return true;
      const hay = `${t.codeTest || ''} ${t.nomTest || ''} ${t.codeLoinc || ''}`.toUpperCase();
      return hay.includes('IONOG') || hay.includes('ELECTRO') || hay.includes('ELECTROLY');
    });
  }

  hasIonogramValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.sodium || '').trim() ||
      String(m.potassium || '').trim() ||
      String(m.chlore || '').trim() ||
      String(m.bicarbonates || '').trim() ||
      String(m.calciumIono || '').trim() ||
      String(m.magnesiumIono || '').trim() ||
      String(m.phosphoreIono || '').trim()
    );
  }

  buildIonogramSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.sodium || '').trim()) parts.push(`Na=${String(m.sodium).trim()} mmol/L`);
    if (String(m.potassium || '').trim()) parts.push(`K=${String(m.potassium).trim()} mmol/L`);
    if (String(m.chlore || '').trim()) parts.push(`Cl=${String(m.chlore).trim()} mmol/L`);
    if (String(m.bicarbonates || '').trim()) parts.push(`HCO3=${String(m.bicarbonates).trim()} mmol/L`);
    if (String(m.calciumIono || '').trim()) parts.push(`Ca=${String(m.calciumIono).trim()} mmol/L`);
    if (String(m.magnesiumIono || '').trim()) parts.push(`Mg=${String(m.magnesiumIono).trim()} mmol/L`);
    if (String(m.phosphoreIono || '').trim()) parts.push(`P=${String(m.phosphoreIono).trim()} mmol/L`);
    return parts.join(' ; ');
  }

  buildHemogramSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.hb || '').trim()) parts.push(`Hb=${String(m.hb).trim()} g/dL`);
    if (String(m.ht || '').trim()) parts.push(`Ht=${String(m.ht).trim()} %`);
    if (String(m.globulesRouges || '').trim()) parts.push(`RBC=${String(m.globulesRouges).trim()} T/L`);
    if (String(m.gb || '').trim()) parts.push(`GB=${String(m.gb).trim()} x10³/µL`);
    if (String(m.neutrophiles || '').trim()) parts.push(`Neutrophiles=${String(m.neutrophiles).trim()} %`);
    if (String(m.lymphocytes || '').trim()) parts.push(`Lymphocytes=${String(m.lymphocytes).trim()} %`);
    if (String(m.monocytes || '').trim()) parts.push(`Monocytes=${String(m.monocytes).trim()} %`);
    if (String(m.eosinophiles || '').trim()) parts.push(`Éosinophiles=${String(m.eosinophiles).trim()} %`);
    if (String(m.basophiles || '').trim()) parts.push(`Basophiles=${String(m.basophiles).trim()} %`);
    if (String(m.plaquettes || '').trim()) parts.push(`Plaquettes=${String(m.plaquettes).trim()} x10³/µL`);
    return parts.join(' ; ');
  }

  get wizardUsesStructuredPanelOnly(): boolean {
    return (
      this.isHemogramWizardTest() ||
      this.isIonogramWizardTest() ||
      this.isRenalBilanWizardTest() ||
      this.isProteinurieWizardTest() ||
      this.isOsseuxWizardTest() ||
      this.isImmunosuppresseursWizardTest() ||
      this.isDfgClairanceWizardTest()
    );
  }

  isRenalBilanWizardTest(): boolean {
    const renal = ['CREATININEMIE', 'UREE', 'ACIDE_URIQUE', 'CYSTATINE_C', 'DFG_ESTIME_SCHWARTZ', 'DFG_CYSTATINE_C'];
    return this.wizardSelectedTestObjects().some((t) => renal.includes(t.codeTest || ''));
  }

  hasRenalBilanValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.creatinine || '').trim() ||
      String(m.uree || '').trim() ||
      String(m.acideUrique || '').trim() ||
      String(m.cystatineC || '').trim() ||
      String(m.dfgEstime || '').trim() ||
      String(m.dfgCystatineC || '').trim()
    );
  }

  buildRenalBilanSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.creatinine || '').trim()) parts.push(`Créatininémie=${String(m.creatinine).trim()} µmol/L`);
    if (String(m.uree || '').trim()) parts.push(`Urée=${String(m.uree).trim()} mmol/L`);
    if (String(m.acideUrique || '').trim()) parts.push(`Acide urique=${String(m.acideUrique).trim()} µmol/L`);
    if (String(m.cystatineC || '').trim()) parts.push(`Cystatine C=${String(m.cystatineC).trim()} mg/L`);
    if (String(m.dfgEstime || '').trim()) parts.push(`DFG estimé=${String(m.dfgEstime).trim()} mL/min/1,73m²`);
    if (String(m.dfgCystatineC || '').trim()) parts.push(`DFG cystatine C=${String(m.dfgCystatineC).trim()} mL/min/1,73m²`);
    return parts.join(' ; ');
  }

  /** Chaque champ rénal affiché doit être rempli si l’analyse correspondante est dans la sélection. */
  private renalPanelAllRequiredFilled(): boolean {
    if (!this.isRenalBilanWizardTest()) return true;
    const codes = new Set(this.wizardSelectedTestObjects().map((t) => t.codeTest || ''));
    const m = this.resultatFormModel;
    const checks: boolean[] = [];
    if (codes.has('CREATININEMIE')) checks.push(!!String(m.creatinine ?? '').trim());
    if (codes.has('UREE')) checks.push(!!String(m.uree ?? '').trim());
    if (codes.has('ACIDE_URIQUE')) checks.push(!!String(m.acideUrique ?? '').trim());
    if (codes.has('CYSTATINE_C')) checks.push(!!String(m.cystatineC ?? '').trim());
    if (codes.has('DFG_ESTIME_SCHWARTZ')) checks.push(!!String(m.dfgEstime ?? '').trim());
    if (codes.has('DFG_CYSTATINE_C')) checks.push(!!String(m.dfgCystatineC ?? '').trim());
    if (checks.length === 0) {
      return [m.creatinine, m.uree, m.acideUrique, m.cystatineC, m.dfgEstime, m.dfgCystatineC].every((x) => !!String(x ?? '').trim());
    }
    return checks.every(Boolean);
  }

  private ionogramAllSevenFilled(): boolean {
    const m = this.resultatFormModel;
    return [
      m.sodium,
      m.potassium,
      m.chlore,
      m.bicarbonates,
      m.calciumIono,
      m.magnesiumIono,
      m.phosphoreIono,
    ].every((x) => !!String(x ?? '').trim());
  }

  /** Ionogramme : uniquement les champs correspondant aux codes cochés (CALCEMIE + CALCEMIE_CORRIGEE → un seul Ca). */
  private ionogramPanelRequiredFilled(): boolean {
    if (!this.isIonogramWizardTest()) return true;
    const codes = new Set(this.wizardSelectedTestObjects().map((t) => String(t.codeTest || '').toUpperCase()));
    const ionoCodes = [
      'NATREMIE',
      'KALIEMIE',
      'CHLOREMIE',
      'BICARBONATES',
      'CALCEMIE',
      'CALCEMIE_CORRIGEE',
      'PHOSPHOREMIE',
      'MAGNESEMIE',
    ];
    const anyKnown = ionoCodes.some((c) => codes.has(c));
    if (!anyKnown) return this.ionogramAllSevenFilled();
    const m = this.resultatFormModel;
    const need = (selected: boolean, val: string | undefined) => !selected || !!String(val ?? '').trim();
    return (
      need(codes.has('NATREMIE'), m.sodium) &&
      need(codes.has('KALIEMIE'), m.potassium) &&
      need(codes.has('CHLOREMIE'), m.chlore) &&
      need(codes.has('BICARBONATES'), m.bicarbonates) &&
      need(codes.has('CALCEMIE') || codes.has('CALCEMIE_CORRIGEE'), m.calciumIono) &&
      need(codes.has('MAGNESEMIE'), m.magnesiumIono) &&
      need(codes.has('PHOSPHOREMIE'), m.phosphoreIono)
    );
  }

  private hemogramCoreFourFilled(): boolean {
    const m = this.resultatFormModel;
    return !!(String(m.hb ?? '').trim() && String(m.gb ?? '').trim() && String(m.plaquettes ?? '').trim() && String(m.ht ?? '').trim());
  }

  /** Prêt pour déclencher l’IA sans clic (date + panneaux actifs remplis selon règles minimales). */
  wizardCompositePanelsCompleteForAi(): boolean {
    if (!String(this.resultatFormModel.dateResultat || '').trim()) return false;
    if (this.isRenalBilanWizardTest() && !this.renalPanelAllRequiredFilled()) return false;
    if (this.isIonogramWizardTest() && !this.ionogramPanelRequiredFilled()) return false;
    if (this.isHemogramWizardTest() && !this.hemogramCoreFourFilled()) return false;
    if (this.isProteinurieWizardTest() && !this.hasProteinurieValues()) return false;
    if (this.isOsseuxWizardTest() && !this.hasOsseuxValues()) return false;
    if (this.isImmunosuppresseursWizardTest() && !this.hasImmunosuppresseursValues()) return false;
    if (this.isDfgClairanceWizardTest() && !this.hasDfgClairanceValues()) return false;
    return true;
  }

  /** Payload aligné sur l’agent Python + `submitted_values` côté serveur pour l’IA. */
  private buildWizardLabAnalysisPayload(): LabAnalysisPayload | null {
    const dossier = this.selectedDossierForResultat;
    if (!dossier) return null;
    const m = this.resultatFormModel;
    const values: Record<string, number> = {};
    const add = (key: string, raw: string | undefined) => {
      const n = this.parseFirstNumberFromString(String(raw ?? ''));
      if (n !== undefined && Number.isFinite(n)) values[key] = n;
    };
    if (this.isHemogramWizardTest()) {
      add('hb', m.hb);
      add('ht', m.ht);
      add('gb', m.gb);
      add('plaquettes', m.plaquettes);
      add('neutrophiles', m.neutrophiles);
      add('lymphocytes', m.lymphocytes);
      add('monocytes', m.monocytes);
      add('eosinophiles', m.eosinophiles);
      add('basophiles', m.basophiles);
      add('globules_rouges', m.globulesRouges);
    }
    if (this.isRenalBilanWizardTest()) {
      const rc = new Set(this.wizardSelectedTestObjects().map((t) => t.codeTest || ''));
      if (rc.has('CREATININEMIE')) add('creatinine', m.creatinine);
      if (rc.has('UREE')) add('uree', m.uree);
      if (rc.has('ACIDE_URIQUE')) add('acide_urique', m.acideUrique);
      if (rc.has('CYSTATINE_C')) add('cystatine_c', m.cystatineC);
      if (rc.has('DFG_ESTIME_SCHWARTZ')) add('dfg_estime', m.dfgEstime);
      if (rc.has('DFG_CYSTATINE_C')) add('dfg_cystatine_c', m.dfgCystatineC);
    }
    if (this.isIonogramWizardTest()) {
      add('sodium', m.sodium);
      add('potassium', m.potassium);
      add('chlore', m.chlore);
      add('bicarbonates', m.bicarbonates);
      add('calcium', m.calciumIono);
      add('magnesium', m.magnesiumIono);
      add('phosphate', m.phosphoreIono);
    }
    if (this.isProteinurieWizardTest()) {
      add('proteines_urine', m.proteinesUrine);
      add('albuminurie', m.albuminurie);
      add('rapport_albumine_creatinine', m.rapportAlbumineCreatinine);
      add('volume_urinaire_24h', m.volumeUrinaire24h);
      add('creatinine_urinaire', m.creatinineUrinaire);
    }
    if (this.isOsseuxWizardTest()) {
      add('calcium_osseux', m.calciumOsseux);
      add('phosphore_osseux', m.phosphoreOsseux);
      add('vitamine_d', m.vitamineD);
      add('pth', m.parathormone);
      add('phosphatases_alcalines', m.phosphatasesAlcalines);
    }
    if (this.isImmunosuppresseursWizardTest()) {
      add('taux_residuel_ng_ml', m.tauxResiduel);
      add('dose', m.dose);
    }
    if (this.isDfgClairanceWizardTest()) {
      add('dfg_clairance', m.dfgClairance);
      add('creatinine_sanguine', m.creatinineSanguine);
      add('creatinine_urinaire_clairance', m.creatinineUrinaireClairance);
      add('volume_urine_24h', m.volumeUrine24h);
      add('surface_corporelle', m.surfaceCorporelle);
      add('poids', m.poids);
      add('taille', m.taille);
    }
    if (!this.wizardUsesStructuredPanelOnly && this.hasExtendedBioValues()) {
      add('glycemie_jeun', m.glycemieJeun);
      add('cholesterol_total', m.cholesterolTotal);
      add('ldl', m.ldl);
      add('hdl', m.hdl);
      add('triglycerides', m.triglycerides);
      add('tsh', m.tsh);
    }
    if (Object.keys(values).length === 0) return null;
    return {
      patient: {
        id: dossier.idPatient != null ? String(dossier.idPatient) : undefined,
        nom: String(m.nom || '').trim() || undefined,
        prenom: String(m.prenom || '').trim() || undefined,
        date_naissance: String(m.dateNaissance || '').trim() || undefined,
        sexe: m.sexe === 'FEMININ' ? 'F' : m.sexe === 'MASCULIN' ? 'M' : undefined,
      },
      values,
    };
  }

  private clearWizardAiConclusionDebounce(): void {
    if (this.wizardAiConclusionTimer != null) {
      clearTimeout(this.wizardAiConclusionTimer);
      this.wizardAiConclusionTimer = null;
    }
  }

  /** Appelé depuis les champs de l’étape 3 (debounce) pour remplir la conclusion. */
  scheduleWizardAutoConclusionAi(): void {
    this.clearWizardAiConclusionDebounce();
    this.wizardAiConclusionTimer = setTimeout(() => {
      this.wizardAiConclusionTimer = null;
      this.cdr.detectChanges();
      this.runWizardLabAnalysisForConclusion(false);
    }, 400);
  }

  /** Bouton « Générer (IA) » : relance même si le jeu de valeurs est inchangé. */
  generateWizardConclusionIaManual(): void {
    this.lastWizardAiFingerprint = '';
    this.runWizardLabAnalysisForConclusion(true);
  }

  private applyLabAnalysisToWizardConclusion(res: LabAnalysisResponse): void {
    const ai = (res.ai_conclusion || '').trim();
    const base = (res.conclusion || '').trim();
    const text = (ai || base).slice(0, 1000);
    if (text) this.resultatFormModel.conclusion = text;
  }

  /**
   * @param force si false : uniquement si panneaux complets + empreinte différente (évite les appels en boucle).
   */
  private runWizardLabAnalysisForConclusion(force: boolean): void {
    if (!this.showResultatFormPopup || this.resultatWizardStep !== 3) return;
    if (this.resultatWizardAiConclusionLoading) return;
    if (!force && !this.wizardCompositePanelsCompleteForAi()) return;
    const payload = this.buildWizardLabAnalysisPayload();
    if (!payload || Object.keys(payload.values).length === 0) {
      if (force) this.notification.info('Aucune valeur numérique exploitable pour la conclusion IA.');
      return;
    }
    const fp = JSON.stringify({ v: payload.values, p: payload.patient });
    if (!force && fp === this.lastWizardAiFingerprint) return;
    this.lastWizardAiFingerprint = fp;
    this.resultatWizardAiConclusionLoading = true;
    this.moduleLabo
      .analyzeLab(payload, true)
      .pipe(
        finalize(() => {
          this.resultatWizardAiConclusionLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.applyLabAnalysisToWizardConclusion(res);
          if (res.ai_conclusion_error && !res.ai_conclusion?.trim()) {
            this.notification.info(`Conclusion Python enregistrée. IA indisponible : ${res.ai_conclusion_error}`);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.lastWizardAiFingerprint = '';
          this.notification.error(err?.message ?? 'Analyse laboratoire indisponible.');
        },
      });
  }

  isProteinurieWizardTest(): boolean {
    return this.wizardSelectedTestObjects().some((t) => (t.codeTest || '') === 'PROTEINURIE');
  }

  hasProteinurieValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.proteinesUrine || '').trim() ||
      String(m.albuminurie || '').trim() ||
      String(m.rapportAlbumineCreatinine || '').trim() ||
      String(m.volumeUrinaire24h || '').trim() ||
      String(m.creatinineUrinaire || '').trim()
    );
  }

  buildProteinurieSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.proteinesUrine || '').trim()) parts.push(`Protéines urine=${String(m.proteinesUrine).trim()} mg/L`);
    if (String(m.albuminurie || '').trim()) parts.push(`Albuminurie=${String(m.albuminurie).trim()}`);
    if (String(m.rapportAlbumineCreatinine || '').trim()) parts.push(`Rapport Alb/Créat=${String(m.rapportAlbumineCreatinine).trim()}`);
    if (String(m.volumeUrinaire24h || '').trim()) parts.push(`Vol. urinaire 24h=${String(m.volumeUrinaire24h).trim()} mL`);
    if (String(m.creatinineUrinaire || '').trim()) parts.push(`Créatinine urinaire=${String(m.creatinineUrinaire).trim()}`);
    return parts.join(' ; ');
  }

  isOsseuxWizardTest(): boolean {
    const codes = ['PTH', 'VITAMINE_D_25OH', 'VITAMINE_D_1_25OH', 'FGF23'];
    return this.wizardSelectedTestObjects().some((t) => codes.includes(t.codeTest || ''));
  }

  hasOsseuxValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.calciumOsseux || '').trim() ||
      String(m.phosphoreOsseux || '').trim() ||
      String(m.vitamineD || '').trim() ||
      String(m.parathormone || '').trim() ||
      String(m.phosphatasesAlcalines || '').trim()
    );
  }

  buildOsseuxSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.calciumOsseux || '').trim()) parts.push(`Ca=${String(m.calciumOsseux).trim()} mmol/L`);
    if (String(m.phosphoreOsseux || '').trim()) parts.push(`P=${String(m.phosphoreOsseux).trim()} mmol/L`);
    if (String(m.vitamineD || '').trim()) parts.push(`Vit. D=${String(m.vitamineD).trim()}`);
    if (String(m.parathormone || '').trim()) parts.push(`PTH=${String(m.parathormone).trim()} pg/mL`);
    if (String(m.phosphatasesAlcalines || '').trim()) parts.push(`PAL=${String(m.phosphatasesAlcalines).trim()} UI/L`);
    return parts.join(' ; ');
  }

  isImmunosuppresseursWizardTest(): boolean {
    return this.wizardSelectedTestObjects().some((t) => {
      const c = (t.codeTest || '').toUpperCase();
      if (
        ['TACROLIMUS', 'CICLOSPORINE', 'CICLOSPORIN', 'SIROLIMUS', 'EVEROLIMUS'].includes(c) ||
        c.includes('IMMUNOSUPP')
      ) {
        return true;
      }
      const h = `${t.codeTest || ''} ${t.nomTest || ''}`.toUpperCase();
      return (
        h.includes('TACROLIMUS') ||
        h.includes('CICLOSPORIN') ||
        h.includes('CICLOSPORINE') ||
        h.includes('SIROLIMUS') ||
        h.includes('EVEROLIMUS') ||
        h.includes('IMMUNOSUPPRESSEUR')
      );
    });
  }

  hasImmunosuppresseursValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.nomMedicament || '').trim() ||
      String(m.tauxResiduel || '').trim() ||
      String(m.datePriseMedicament || '').trim() ||
      String(m.datePrelevement || '').trim() ||
      String(m.dose || '').trim() ||
      String(m.unite || '').trim()
    );
  }

  buildImmunosuppresseursSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.nomMedicament || '').trim()) parts.push(`Médicament=${String(m.nomMedicament).trim()}`);
    if (String(m.tauxResiduel || '').trim()) parts.push(`Taux résiduel=${String(m.tauxResiduel).trim()} ng/mL`);
    if (String(m.datePriseMedicament || '').trim()) parts.push(`Date prise=${String(m.datePriseMedicament).trim()}`);
    if (String(m.datePrelevement || '').trim()) parts.push(`Date prélèvement=${String(m.datePrelevement).trim()}`);
    if (String(m.dose || '').trim()) parts.push(`Dose=${String(m.dose).trim()}${String(m.unite || '').trim() ? ' ' + String(m.unite).trim() : ''}`);
    return parts.join(' ; ');
  }

  isDfgClairanceWizardTest(): boolean {
    return this.wizardSelectedTestObjects().some((t) => {
      const n = (t.nomTest || '').toLowerCase();
      const c = (t.codeTest || '').toUpperCase();
      if (['DFG_ESTIME_SCHWARTZ', 'DFG_CYSTATINE_C'].includes(c)) return false;
      return n.includes('clairance') || n.includes('clearance') || c.includes('CLAIRANCE');
    });
  }

  hasDfgClairanceValues(): boolean {
    const m = this.resultatFormModel;
    return !!(
      String(m.dfgClairance || '').trim() ||
      String(m.methodeCalcul || '').trim() ||
      String(m.creatinineSanguine || '').trim() ||
      String(m.creatinineUrinaireClairance || '').trim() ||
      String(m.volumeUrine24h || '').trim() ||
      String(m.surfaceCorporelle || '').trim() ||
      String(m.poids || '').trim() ||
      String(m.taille || '').trim()
    );
  }

  buildDfgClairanceSummary(): string {
    const m = this.resultatFormModel;
    const parts: string[] = [];
    if (String(m.dfgClairance || '').trim()) parts.push(`DFG=${String(m.dfgClairance).trim()} mL/min/1,73m²`);
    if (String(m.methodeCalcul || '').trim()) parts.push(`Méthode=${String(m.methodeCalcul).trim()}`);
    if (String(m.creatinineSanguine || '').trim()) parts.push(`Créat. sanguine=${String(m.creatinineSanguine).trim()} µmol/L`);
    if (String(m.creatinineUrinaireClairance || '').trim()) parts.push(`Créat. urinaire=${String(m.creatinineUrinaireClairance).trim()}`);
    if (String(m.volumeUrine24h || '').trim()) parts.push(`Vol. urine 24h=${String(m.volumeUrine24h).trim()} mL`);
    if (String(m.surfaceCorporelle || '').trim()) parts.push(`SC=${String(m.surfaceCorporelle).trim()} m²`);
    if (String(m.poids || '').trim()) parts.push(`Poids=${String(m.poids).trim()} kg`);
    if (String(m.taille || '').trim()) parts.push(`Taille=${String(m.taille).trim()} cm`);
    return parts.join(' ; ');
  }

  buildExtendedBioSummary(): string {
    const parts: string[] = [];
    if (String(this.resultatFormModel.glycemieJeun || '').trim()) parts.push(`Glycemie a jeun=${String(this.resultatFormModel.glycemieJeun).trim()} mmol/L`);
    if (String(this.resultatFormModel.cholesterolTotal || '').trim()) parts.push(`Cholesterol total=${String(this.resultatFormModel.cholesterolTotal).trim()} mmol/L`);
    if (String(this.resultatFormModel.ldl || '').trim()) parts.push(`LDL=${String(this.resultatFormModel.ldl).trim()} mmol/L`);
    if (String(this.resultatFormModel.hdl || '').trim()) parts.push(`HDL=${String(this.resultatFormModel.hdl).trim()} mmol/L`);
    if (String(this.resultatFormModel.triglycerides || '').trim()) parts.push(`Triglycerides=${String(this.resultatFormModel.triglycerides).trim()} mmol/L`);
    if (String(this.resultatFormModel.tsh || '').trim()) parts.push(`TSH=${String(this.resultatFormModel.tsh).trim()} mUI/L`);
    return parts.join(' ; ');
  }

  /**
   * Texte agrégé pour PDF / enregistrement : plusieurs panneaux composites peuvent être
   * combinés (ex. NFS + ionogramme + bilan rénal) ; chaque bloc est joint par « | ».
   */
  computeWizardValeurFinale(): string {
    const raw = String(this.resultatFormModel.valeurResultat || '').trim();
    const blocks: string[] = [];
    if (this.isHemogramWizardTest() && this.hasHemogramValues()) blocks.push(this.buildHemogramSummary());
    if (this.isRenalBilanWizardTest() && this.hasRenalBilanValues()) blocks.push(this.buildRenalBilanSummary());
    if (this.isProteinurieWizardTest() && this.hasProteinurieValues()) blocks.push(this.buildProteinurieSummary());
    if (this.isIonogramWizardTest() && this.hasIonogramValues()) blocks.push(this.buildIonogramSummary());
    if (this.isOsseuxWizardTest() && this.hasOsseuxValues()) blocks.push(this.buildOsseuxSummary());
    if (this.isImmunosuppresseursWizardTest() && this.hasImmunosuppresseursValues()) {
      blocks.push(this.buildImmunosuppresseursSummary());
    }
    if (this.isDfgClairanceWizardTest() && this.hasDfgClairanceValues()) {
      blocks.push(this.buildDfgClairanceSummary());
    }
    if (!this.wizardUsesStructuredPanelOnly && this.hasExtendedBioValues()) {
      blocks.push(this.buildExtendedBioSummary());
    }
    const structured = blocks.filter(Boolean).join(' | ');
    if (structured && raw) return `${structured} | ${raw}`;
    if (structured) return structured;
    return raw;
  }

  private parseFirstNumberFromString(s: string): number | undefined {
    const m = String(s || '').match(/(-?\d+(?:[.,]\d+)?)/);
    if (!m) return undefined;
    const n = Number(m[1].replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }

  /** Aligné sur les enums backend `InterpretationResultat`. */
  private mapEtatToInterpretation(etat: string | undefined): InterpretationResultat | undefined {
    if (!etat) return undefined;
    const u = etat.trim().toLowerCase();
    if (u.includes('élev') || u.includes('elev')) return 'ELEVE';
    if (u === 'bas' || /^bas\b/.test(u)) return 'BAS';
    if (u.includes('norme') || u === 'normal' || u.includes('positif') || u.includes('négatif') || u.includes('negatif'))
      return 'NORMAL';
    return undefined;
  }

  setResultatWizardStep(step: number): void {
    if (step < 1 || step > 4) return;
    this.resultatWizardStep = step;
    if (
      step === 2 &&
      this.selectedTestsForWizard.length === 0 &&
      this.testsCatalogForResultatForm.length > 0 &&
      !this.loadingDemandeOptionsForResultat &&
      !this.resultatFormFreeCatalog
    ) {
      this.autoSelectAllPendingWizardTests();
    }
    if (step === 3) {
      this.scheduleWizardAutoConclusionAi();
    }
  }

  toggleTestSelectionForWizard(idTest: number): void {
    const i = this.selectedTestsForWizard.indexOf(idTest);
    if (i >= 0) {
      this.selectedTestsForWizard = this.selectedTestsForWizard.filter((x) => x !== idTest);
    } else {
      this.selectedTestsForWizard = [...this.selectedTestsForWizard, idTest];
    }
    this.selectedIdTestInForm = this.selectedTestsForWizard[0] ?? null;
  }

  nextResultatWizardStep(): void {
    if (this.resultatWizardStep === 2 && this.selectedTestsForWizard.length === 0) {
      this.resultatFormError = 'Sélectionnez au moins un test demandé.';
      return;
    }
    if (this.resultatWizardStep === 3) {
      const hasRawValue = !!String(this.resultatFormModel.valeurResultat || '').trim();
      const hasHemogram = this.isHemogramWizardTest() && this.hasHemogramValues();
      const hasIonogram = this.isIonogramWizardTest() && this.hasIonogramValues();
      const hasRenal = this.isRenalBilanWizardTest() && this.hasRenalBilanValues();
      const hasProt = this.isProteinurieWizardTest() && this.hasProteinurieValues();
      const hasOsseux = this.isOsseuxWizardTest() && this.hasOsseuxValues();
      const hasImmuno = this.isImmunosuppresseursWizardTest() && this.hasImmunosuppresseursValues();
      const hasDfgC = this.isDfgClairanceWizardTest() && this.hasDfgClairanceValues();
      const hasExtended = !this.wizardUsesStructuredPanelOnly && this.hasExtendedBioValues();
      const hasStructured =
        hasHemogram || hasIonogram || hasRenal || hasProt || hasOsseux || hasImmuno || hasDfgC;
      if (!this.resultatFormModel.dateResultat || (!hasRawValue && !hasStructured && !hasExtended)) {
        this.resultatFormError = 'Renseignez la date et la valeur du résultat.';
        return;
      }
    }
    this.resultatFormError = '';
    this.resultatWizardStep = Math.min(4, this.resultatWizardStep + 1);
    if (
      this.resultatWizardStep === 2 &&
      this.selectedTestsForWizard.length === 0 &&
      this.testsCatalogForResultatForm.length > 0 &&
      !this.loadingDemandeOptionsForResultat &&
      !this.resultatFormFreeCatalog
    ) {
      this.autoSelectAllPendingWizardTests();
    }
    if (this.resultatWizardStep === 3) {
      this.scheduleWizardAutoConclusionAi();
    }
  }

  prevResultatWizardStep(): void {
    this.resultatFormError = '';
    this.resultatWizardStep = Math.max(1, this.resultatWizardStep - 1);
  }

  get selectedTestCodeInForm(): string {
    const t = this.testsCatalog.find(x => x.idTestLaboratoire === this.selectedIdTestInForm);
    return t?.codeTest ?? t?.nomTest ?? '';
  }
  getTestClass(nomTest: string | undefined | null): string {
    if (!nomTest) return 'status-info';
    const m: { [k: string]: string } = {
      'CREATININEMIE':'status-danger','NFS':'status-info','PHOSPHOREMIE':'status-warning',
      'CALCEMIE':'status-warning','ELECTROPHORESE_PROTEINES':'status-info','UREE':'status-warning',
      'IONOGRAMME_SANGUIN':'status-info','BILAN_HEPATIQUE':'status-info','GLYCEMIE':'status-warning',
      'CRP':'status-warning','HEMOGLOBINE':'status-info','ALBUMINEMIE':'status-warning',
      'PROTEINURIE':'status-danger','HEMATURIE':'status-danger','CULTURE_URINE':'status-info','AUTRE':'status-info'
    };
    return m[String(nomTest)] || 'status-info';
  }

  formatExamensDemandes(examens?: string[], maxItems: number = 4): string {
    const list = (examens || []).filter(Boolean);
    if (list.length === 0) return '—';

    const mapped = list.slice(0, maxItems).map((code) => this.libelleExamenDemande(code));

    const remaining = list.length - mapped.length;
    return remaining > 0 ? `${mapped.join(', ')} +${remaining}` : mapped.join(', ');
  }

  getActiveLabTab(idDossier: number): 'demandes' | 'resultats' {
    return this.activeLabTabByDossier[idDossier] || 'demandes';
  }

  setActiveLabTab(idDossier: number, tab: 'demandes' | 'resultats'): void {
    this.activeLabTabByDossier[idDossier] = tab;
  }

  getExamensLabels(examens?: string[]): string[] {
    return (examens || []).map(code => {
      const t = this.testsCatalog.find(x => x.codeLoinc === code);
      return t?.codeTest || code;
    });
  }

  /** Nom d’affichage du test (catalogue) avec repli sur le code LOINC. */
  libelleExamenDemande(loinc: string | undefined): string {
    const c = String(loinc ?? '').trim();
    if (!c) return '—';
    const up = c.toUpperCase();
    const t = this.testsCatalog.find(
      (x) => String(x.codeLoinc ?? '').trim().toUpperCase() === up
    );
    const nom = (t?.nomTest || t?.codeTest || '').trim();
    return nom || c;
  }

  /** Short date for patient lab request cards (e.g. 05/04/2026). */
  formatDemandeDateEn(date: string | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  }

  getDemandeReference(p: PrescriptionBilanDTO): string {
    const year = p?.datePrescription ? new Date(p.datePrescription).getFullYear() : new Date().getFullYear();
    const id = p?.id ?? 0;
    return `REQ-${year}-${String(id).padStart(3, '0')}`;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getWizardReportDateTime(): string {
    const now = new Date();
    const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${d} — ${t}`;
  }

  /** Référence affichée dans l’en-tête du modal (ex. LAB-2026-1). */
  getWizardLabRef(): string {
    const y = new Date().getFullYear();
    const id = this.selectedDossierForResultat?.idDossierMedical ?? 0;
    return `LAB-${y}-${id}`;
  }

  /** Libellé test principal pour l’étape 3 (bannière bleue). */
  getWizardTestTitleLabel(): string {
    const n = this.selectedTestsForWizard.length;
    if (n === 0) return '—';
    if (n === 1) {
      const t = this.selectedTestForWizard;
      if (!t) return '—';
      const code = (t.codeTest || '').trim();
      const nom = (t.nomTest || '').trim();
      if (code && nom) return `${code} — ${nom}`;
      return code || nom || '—';
    }
    const sum = this.wizardSelectedTestsCodesSummary();
    return `${n} tests: ${sum || '—'}`;
  }

  printWizardReport(): void {
    window.print();
  }

  generatePatientLabReportPdf(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 12;
    const contentW = pageW - margin * 2;
    let y = 14;

    const patientName = `${this.resultatFormModel.nom || ''} ${this.resultatFormModel.prenom || ''}`.trim() || (this.selectedDossierForResultat?.patientNom || 'PATIENT');
    const patientShort = patientName.toUpperCase().slice(0, 10);
    const ref = `LAB-${new Date().getFullYear()}-${String(this.selectedDossierForResultat?.idDossierMedical || 0).padStart(4, '0')}`;

    const parse = (v: string): number | null => {
      const n = Number(String(v || '').replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    const fmt = (v: string): string => String(v || '').trim();
    const statusBetween = (val: number | null, min: number, max: number) =>
      val == null ? '—' : val < min ? 'Low ↓' : val > max ? 'High ↑' : 'Normal';
    const statusLt = (val: number | null, max: number) =>
      val == null ? '—' : val <= max ? 'Normal' : 'High ↑';
    const statusGt = (val: number | null, min: number) =>
      val == null ? '—' : val >= min ? 'Normal' : 'Low ↓';
    const statusNumericQual = (val: number | null, min: number, max: number) =>
      val == null ? '—' : statusBetween(val, min, max);

    type Row = { a: string; r: string; u: string; ref: string; s: string; p: string };
    const nfsRows: Row[] = [];
    if (fmt(this.resultatFormModel.hb)) nfsRows.push({ a: 'Hemoglobin (Hb)', r: fmt(this.resultatFormModel.hb), u: 'g/dL', ref: '12.0–16.0', s: statusBetween(parse(this.resultatFormModel.hb), 12, 16), p: patientShort });
    if (fmt(this.resultatFormModel.gb)) nfsRows.push({ a: 'White blood cells (WBC)', r: fmt(this.resultatFormModel.gb), u: '×10³/µL', ref: '4.0–10.0', s: statusBetween(parse(this.resultatFormModel.gb), 4, 10), p: patientShort });
    if (fmt(this.resultatFormModel.plaquettes)) nfsRows.push({ a: 'Platelets', r: fmt(this.resultatFormModel.plaquettes), u: '×10³/µL', ref: '150–400', s: statusBetween(parse(this.resultatFormModel.plaquettes), 150, 400), p: patientShort });
    if (fmt(this.resultatFormModel.ht)) nfsRows.push({ a: 'Hematocrit (Hct)', r: fmt(this.resultatFormModel.ht), u: '%', ref: '36–46', s: statusBetween(parse(this.resultatFormModel.ht), 36, 46), p: patientShort });
    if (fmt(this.resultatFormModel.globulesRouges)) nfsRows.push({ a: 'Red blood cells (RBC)', r: fmt(this.resultatFormModel.globulesRouges), u: 'T/L', ref: '4.5–5.9', s: statusNumericQual(parse(this.resultatFormModel.globulesRouges), 4.5, 5.9), p: patientShort });
    if (fmt(this.resultatFormModel.neutrophiles)) nfsRows.push({ a: 'Neutrophils', r: fmt(this.resultatFormModel.neutrophiles), u: '%', ref: '40–70', s: statusNumericQual(parse(this.resultatFormModel.neutrophiles), 40, 70), p: patientShort });
    if (fmt(this.resultatFormModel.lymphocytes)) nfsRows.push({ a: 'Lymphocytes', r: fmt(this.resultatFormModel.lymphocytes), u: '%', ref: '20–45', s: statusNumericQual(parse(this.resultatFormModel.lymphocytes), 20, 45), p: patientShort });
    if (fmt(this.resultatFormModel.monocytes)) nfsRows.push({ a: 'Monocytes', r: fmt(this.resultatFormModel.monocytes), u: '%', ref: '2–10', s: statusNumericQual(parse(this.resultatFormModel.monocytes), 2, 10), p: patientShort });
    if (fmt(this.resultatFormModel.eosinophiles)) nfsRows.push({ a: 'Eosinophils', r: fmt(this.resultatFormModel.eosinophiles), u: '%', ref: '0–7', s: statusNumericQual(parse(this.resultatFormModel.eosinophiles), 0, 7), p: patientShort });
    if (fmt(this.resultatFormModel.basophiles)) nfsRows.push({ a: 'Basophils', r: fmt(this.resultatFormModel.basophiles), u: '%', ref: '0–2', s: statusNumericQual(parse(this.resultatFormModel.basophiles), 0, 2), p: patientShort });

    const bioRows: Row[] = [];
    if (fmt(this.resultatFormModel.glycemieJeun)) bioRows.push({ a: 'Fasting glucose', r: fmt(this.resultatFormModel.glycemieJeun), u: 'mmol/L', ref: '3.9–6.1', s: statusBetween(parse(this.resultatFormModel.glycemieJeun), 3.9, 6.1), p: patientShort });
    if (fmt(this.resultatFormModel.cholesterolTotal)) bioRows.push({ a: 'Total cholesterol', r: fmt(this.resultatFormModel.cholesterolTotal), u: 'mmol/L', ref: '<5.2', s: statusLt(parse(this.resultatFormModel.cholesterolTotal), 5.2), p: patientShort });
    if (fmt(this.resultatFormModel.ldl)) bioRows.push({ a: 'LDL cholesterol', r: fmt(this.resultatFormModel.ldl), u: 'mmol/L', ref: '<3.4', s: statusLt(parse(this.resultatFormModel.ldl), 3.4), p: patientShort });
    if (fmt(this.resultatFormModel.hdl)) bioRows.push({ a: 'HDL cholesterol', r: fmt(this.resultatFormModel.hdl), u: 'mmol/L', ref: '≥1.2', s: statusGt(parse(this.resultatFormModel.hdl), 1.2), p: patientShort });
    if (fmt(this.resultatFormModel.triglycerides)) bioRows.push({ a: 'Triglycerides', r: fmt(this.resultatFormModel.triglycerides), u: 'mmol/L', ref: '<1.7', s: statusLt(parse(this.resultatFormModel.triglycerides), 1.7), p: patientShort });

    const thyrRenalRows: Row[] = [];
    if (fmt(this.resultatFormModel.tsh)) thyrRenalRows.push({ a: 'TSH', r: fmt(this.resultatFormModel.tsh), u: 'mIU/L', ref: '0.4–4.0', s: statusBetween(parse(this.resultatFormModel.tsh), 0.4, 4.0), p: patientShort });
    if (fmt(this.resultatFormModel.creatinine)) thyrRenalRows.push({ a: 'Creatinine', r: fmt(this.resultatFormModel.creatinine), u: 'µmol/L', ref: '53–97', s: statusBetween(parse(this.resultatFormModel.creatinine), 53, 97), p: patientShort });
    if (fmt(this.resultatFormModel.uree)) thyrRenalRows.push({ a: 'Urea', r: fmt(this.resultatFormModel.uree), u: 'mmol/L', ref: '2.5–7.5', s: statusBetween(parse(this.resultatFormModel.uree), 2.5, 7.5), p: patientShort });

    const ionoRows: Row[] = [];
    if (fmt(this.resultatFormModel.sodium)) ionoRows.push({ a: 'Sodium (Na⁺)', r: fmt(this.resultatFormModel.sodium), u: 'mmol/L', ref: '136–145', s: statusBetween(parse(this.resultatFormModel.sodium), 136, 145), p: patientShort });
    if (fmt(this.resultatFormModel.potassium)) ionoRows.push({ a: 'Potassium (K⁺)', r: fmt(this.resultatFormModel.potassium), u: 'mmol/L', ref: '3.5–5.1', s: statusBetween(parse(this.resultatFormModel.potassium), 3.5, 5.1), p: patientShort });
    if (fmt(this.resultatFormModel.chlore)) ionoRows.push({ a: 'Chloride (Cl⁻)', r: fmt(this.resultatFormModel.chlore), u: 'mmol/L', ref: '98–107', s: statusBetween(parse(this.resultatFormModel.chlore), 98, 107), p: patientShort });
    if (fmt(this.resultatFormModel.bicarbonates)) ionoRows.push({ a: 'Bicarbonate (HCO₃⁻)', r: fmt(this.resultatFormModel.bicarbonates), u: 'mmol/L', ref: '22–29', s: statusBetween(parse(this.resultatFormModel.bicarbonates), 22, 29), p: patientShort });
    if (fmt(this.resultatFormModel.calciumIono)) ionoRows.push({ a: 'Calcium (adjusted)', r: fmt(this.resultatFormModel.calciumIono), u: 'mmol/L', ref: '2.15–2.55', s: statusBetween(parse(this.resultatFormModel.calciumIono), 2.15, 2.55), p: patientShort });
    if (fmt(this.resultatFormModel.magnesiumIono)) ionoRows.push({ a: 'Magnesium', r: fmt(this.resultatFormModel.magnesiumIono), u: 'mmol/L', ref: '0.75–1.00', s: statusBetween(parse(this.resultatFormModel.magnesiumIono), 0.75, 1.0), p: patientShort });
    if (fmt(this.resultatFormModel.phosphoreIono)) ionoRows.push({ a: 'Phosphate', r: fmt(this.resultatFormModel.phosphoreIono), u: 'mmol/L', ref: '0.81–1.45', s: statusBetween(parse(this.resultatFormModel.phosphoreIono), 0.81, 1.45), p: patientShort });

    const renalExtRows: Row[] = [];
    if (fmt(this.resultatFormModel.acideUrique)) renalExtRows.push({ a: 'Uric acid', r: fmt(this.resultatFormModel.acideUrique), u: 'µmol/L', ref: '150–420', s: statusBetween(parse(this.resultatFormModel.acideUrique), 150, 420), p: patientShort });
    if (fmt(this.resultatFormModel.cystatineC)) renalExtRows.push({ a: 'Cystatin C', r: fmt(this.resultatFormModel.cystatineC), u: 'mg/L', ref: '0.53–1.02', s: statusBetween(parse(this.resultatFormModel.cystatineC), 0.53, 1.02), p: patientShort });
    if (fmt(this.resultatFormModel.dfgEstime)) renalExtRows.push({ a: 'eGFR (estimated)', r: fmt(this.resultatFormModel.dfgEstime), u: 'mL/min/1.73m²', ref: '≥60', s: statusGt(parse(this.resultatFormModel.dfgEstime), 60), p: patientShort });
    if (fmt(this.resultatFormModel.dfgCystatineC)) renalExtRows.push({ a: 'eGFR (Cystatin C)', r: fmt(this.resultatFormModel.dfgCystatineC), u: 'mL/min/1.73m²', ref: '≥60', s: statusGt(parse(this.resultatFormModel.dfgCystatineC), 60), p: patientShort });

    const protRows: Row[] = [];
    if (fmt(this.resultatFormModel.proteinesUrine)) protRows.push({ a: 'Urine protein', r: fmt(this.resultatFormModel.proteinesUrine), u: 'mg/L', ref: '<150', s: statusLt(parse(this.resultatFormModel.proteinesUrine), 150), p: patientShort });
    if (fmt(this.resultatFormModel.albuminurie)) protRows.push({ a: 'Albuminuria', r: fmt(this.resultatFormModel.albuminurie), u: 'mg/L', ref: '<30', s: statusLt(parse(this.resultatFormModel.albuminurie), 30), p: patientShort });
    if (fmt(this.resultatFormModel.rapportAlbumineCreatinine)) protRows.push({ a: 'Albumin/creatinine ratio', r: fmt(this.resultatFormModel.rapportAlbumineCreatinine), u: 'mg/g', ref: '<30', s: statusLt(parse(this.resultatFormModel.rapportAlbumineCreatinine), 30), p: patientShort });
    if (fmt(this.resultatFormModel.volumeUrinaire24h)) protRows.push({ a: '24h urine volume', r: fmt(this.resultatFormModel.volumeUrinaire24h), u: 'mL', ref: '800–2000', s: statusBetween(parse(this.resultatFormModel.volumeUrinaire24h), 800, 2000), p: patientShort });
    if (fmt(this.resultatFormModel.creatinineUrinaire)) protRows.push({ a: 'Urine creatinine', r: fmt(this.resultatFormModel.creatinineUrinaire), u: 'µmol/L', ref: 'variable', s: '—', p: patientShort });

    const osseuxRows: Row[] = [];
    if (fmt(this.resultatFormModel.calciumOsseux)) osseuxRows.push({ a: 'Calcium (bone panel)', r: fmt(this.resultatFormModel.calciumOsseux), u: 'mmol/L', ref: '2.15–2.55', s: statusBetween(parse(this.resultatFormModel.calciumOsseux), 2.15, 2.55), p: patientShort });
    if (fmt(this.resultatFormModel.phosphoreOsseux)) osseuxRows.push({ a: 'Phosphate (bone panel)', r: fmt(this.resultatFormModel.phosphoreOsseux), u: 'mmol/L', ref: '0.81–1.45', s: statusBetween(parse(this.resultatFormModel.phosphoreOsseux), 0.81, 1.45), p: patientShort });
    if (fmt(this.resultatFormModel.vitamineD)) osseuxRows.push({ a: 'Vitamin D (25-OH)', r: fmt(this.resultatFormModel.vitamineD), u: 'ng/mL', ref: '30–100', s: statusBetween(parse(this.resultatFormModel.vitamineD), 30, 100), p: patientShort });
    if (fmt(this.resultatFormModel.parathormone)) osseuxRows.push({ a: 'PTH', r: fmt(this.resultatFormModel.parathormone), u: 'pg/mL', ref: '10–65', s: statusBetween(parse(this.resultatFormModel.parathormone), 10, 65), p: patientShort });
    if (fmt(this.resultatFormModel.phosphatasesAlcalines)) osseuxRows.push({ a: 'Alkaline phosphatase', r: fmt(this.resultatFormModel.phosphatasesAlcalines), u: 'U/L', ref: '44–147', s: statusBetween(parse(this.resultatFormModel.phosphatasesAlcalines), 44, 147), p: patientShort });

    const immunoRows: Row[] = [];
    if (fmt(this.resultatFormModel.nomMedicament)) immunoRows.push({ a: 'Immunosuppressant', r: fmt(this.resultatFormModel.nomMedicament), u: '—', ref: 'per protocol', s: '—', p: patientShort });
    if (fmt(this.resultatFormModel.tauxResiduel)) immunoRows.push({ a: 'Trough level', r: fmt(this.resultatFormModel.tauxResiduel), u: 'ng/mL', ref: '5–15 (Tx)', s: statusBetween(parse(this.resultatFormModel.tauxResiduel), 5, 15), p: patientShort });
    if (fmt(this.resultatFormModel.dose)) immunoRows.push({ a: 'Dose', r: fmt(this.resultatFormModel.dose), u: fmt(this.resultatFormModel.unite) || '—', ref: 'per protocol', s: '—', p: patientShort });

    const dfgClRows: Row[] = [];
    if (fmt(this.resultatFormModel.dfgClairance)) dfgClRows.push({ a: 'eGFR / clearance', r: fmt(this.resultatFormModel.dfgClairance), u: 'mL/min/1.73m²', ref: '≥60', s: statusGt(parse(this.resultatFormModel.dfgClairance), 60), p: patientShort });
    if (fmt(this.resultatFormModel.methodeCalcul)) dfgClRows.push({ a: 'Method', r: fmt(this.resultatFormModel.methodeCalcul), u: '—', ref: '—', s: '—', p: patientShort });
    if (fmt(this.resultatFormModel.creatinineSanguine)) dfgClRows.push({ a: 'Serum creatinine (clearance)', r: fmt(this.resultatFormModel.creatinineSanguine), u: 'µmol/L', ref: '53–97', s: statusBetween(parse(this.resultatFormModel.creatinineSanguine), 53, 97), p: patientShort });
    if (fmt(this.resultatFormModel.creatinineUrinaireClairance)) dfgClRows.push({ a: 'Urine creatinine', r: fmt(this.resultatFormModel.creatinineUrinaireClairance), u: 'mmol/L', ref: 'variable', s: '—', p: patientShort });
    if (fmt(this.resultatFormModel.volumeUrine24h)) dfgClRows.push({ a: '24h urine volume', r: fmt(this.resultatFormModel.volumeUrine24h), u: 'mL', ref: '800–2000', s: statusBetween(parse(this.resultatFormModel.volumeUrine24h), 800, 2000), p: patientShort });

    const ensureSpace = (need: number) => {
      if (y + need <= pageH - 18) return;
      doc.addPage();
      y = 14;
    };

    const drawTableHeader = () => {
      const cols = ['Test', 'Result', 'Unit', 'Reference interval', 'Flag', 'Patient'];
      const widths = [62, 24, 19, 32, 23, 26];
      let x = margin;
      doc.setFillColor(55, 65, 81);
      doc.rect(margin, y, contentW, 11, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      cols.forEach((c, i) => {
        doc.text(c, x + widths[i] / 2, y + 7, { align: 'center' });
        x += widths[i];
      });
      y += 11;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      let xx = margin;
      widths.forEach(w => { doc.line(xx, y, xx, y - 11); xx += w; });
      doc.line(margin + contentW, y, margin + contentW, y - 11);
    };

    const drawRow = (row: Row, index: number) => {
      const widths = [62, 24, 19, 32, 23, 26];
      const values = [row.a, row.r, row.u, row.ref, row.s, row.p];
      const h = 10;
      let x = margin;
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, contentW, h, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentW, h, 'S');
      values.forEach((v, i) => {
        doc.setFont('helvetica', i === 0 ? 'normal' : 'bold');
        if (i === 4) {
          if (v.includes('High')) doc.setTextColor(220, 38, 38);
          else if (v.includes('Low')) doc.setTextColor(217, 119, 6);
          else doc.setTextColor(5, 150, 105);
        } else if (i === 1) {
          doc.setTextColor(5, 150, 105);
        } else {
          doc.setTextColor(75, 85, 99);
        }
        doc.setFontSize(9.5);
        doc.text(v, x + (i === 0 ? 3 : widths[i] / 2), y + 6.3, { align: i === 0 ? 'left' : 'center', maxWidth: widths[i] - 4 });
        x += widths[i];
      });
      y += h;
    };

    const drawSection = (title: string, rows: Row[]) => {
      if (!rows.length) return;
      ensureSpace(20);
      doc.setFillColor(229, 236, 247);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`■ ${title}`, margin + 3, y + 5.6);
      y += 8;
      drawTableHeader();
      rows.forEach((r, idx) => {
        ensureSpace(12);
        drawRow(r, idx);
      });
      y += 3;
    };

    const drawParagraphSection = (title: string, body: string) => {
      const t = body.trim();
      if (!t) return;
      ensureSpace(16);
      doc.setFillColor(229, 236, 247);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`■ ${title}`, margin + 3, y + 5.6);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      const plines = doc.splitTextToSize(t, contentW - 4);
      plines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, margin + 2, y);
        y += 4;
      });
      y += 4;
    };

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentW, 30, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text('Central Medical Laboratory', margin + 22, y + 11);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('12 Ibn Khaldoun St — Tunis 1002 · Tel: +216 71 000 000', margin + 22, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(ref, pageW - margin - 2, y + 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageW - margin - 2, y + 19, { align: 'right' });
    y += 36;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('NAME', margin, y);
    doc.text('DATE OF BIRTH', margin + 54, y);
    doc.text('SEX', margin + 103, y);
    doc.text('ID', margin + 128, y);
    doc.text('PHYSICIAN', margin + 150, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(patientName || '—', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(this.resultatFormModel.dateNaissance || '—', margin + 54, y);
    doc.text(this.resultatFormModel.sexe === 'FEMININ' ? 'Female' : 'Male', margin + 103, y);
    doc.text(this.resultatFormModel.cin || '—', margin + 128, y);
    doc.text(this.resultatFormModel.medecin || '—', margin + 150, y);
    y += 8;

    drawSection('Hematology — CBC', nfsRows);
    drawSection('Biochemistry — Glucose & lipids', bioRows);
    drawSection('Thyroid & renal function', thyrRenalRows);
    drawSection('Electrolytes', ionoRows);
    drawSection('Extended renal panel', renalExtRows);
    drawSection('Proteinuria', protRows);
    drawSection('Bone metabolism', osseuxRows);
    drawSection('Immunosuppressants', immunoRows);
    drawSection('eGFR / clearance (24h)', dfgClRows);

    const valeurFinalePdf = this.computeWizardValeurFinale();
    const conclPdf = (this.resultatFormModel.conclusion || '').trim();
    drawParagraphSection(
      'Summary (stored text)',
      [valeurFinalePdf, conclPdf ? `Conclusion: ${conclPdf}` : ''].filter(Boolean).join('\n\n'),
    );

    const anomalies = [
      ...nfsRows,
      ...bioRows,
      ...thyrRenalRows,
      ...ionoRows,
      ...renalExtRows,
      ...protRows,
      ...osseuxRows,
      ...immunoRows,
      ...dfgClRows,
    ].filter((r) => r.s.includes('Low') || r.s.includes('High'));
    ensureSpace(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('Laboratory comment:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const comment = anomalies.length
      ? `${anomalies.length} abnormal value(s). Clinical follow-up is recommended.`
      : 'No significant abnormality detected on automated flagging.';
    const lines = doc.splitTextToSize(comment, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 8;

    ensureSpace(20);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + 50, y);
    doc.line(pageW - margin - 50, y, pageW - margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(this.resultatFormModel.medecin || 'Referring physician', margin, y);
    doc.text('Dr. MEKNI Sana', pageW - margin, y, { align: 'right' });
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('General practice', margin, y);
    doc.text('Clinical biologist — Lic. 7821', pageW - margin, y, { align: 'right' });
    y += 8;
    doc.setFontSize(7.5);
    doc.text(`Generated ${new Date().toLocaleString('en-GB')} · Ref: ${ref} · Central Medical Laboratory`, margin, y);

    const fileDate = new Date().toISOString().slice(0, 10);
    doc.save(`Lab_Report_${ref}_${fileDate}.pdf`);
  }

  /**
   * PDF à partir d’un résultat déjà stocké (évite d’afficher un chemin serveur ou un rapport vide).
   * Utilisé depuis « Mes résultats » → Rapport (même logique que l’écran médecin /labo).
   */
  generateResultatLaboratoirePdf(r: ResultatLaboratoire, dossier?: DossierMedical | null): void {
    this.labResultStoredPdf.generateFromStoredResult(r, dossier ?? null);
  }

  /* ── Timeline ────────────────────────────────────── */
  getDefaultTimelineFilters(idDossier: number): { suivi: boolean; image: boolean; bilan: boolean } {
    if (!this.timelineFilters[idDossier]) {
      this.timelineFilters[idDossier] = { suivi: true, image: true, bilan: true };
    }
    return this.timelineFilters[idDossier];
  }
  toggleTimelineFilter(idDossier: number, key: 'suivi' | 'image' | 'bilan'): void {
    const f = this.getDefaultTimelineFilters(idDossier);
    f[key] = !f[key];
    this.cdr.detectChanges();
  }
  getTimelineEvents(dossier: DossierMedical): TimelineEvent[] {
    const id       = dossier.idDossierMedical!;
    const suivis   = this.dossierSuivis[id]    ?? [];
    const images   = this.dossierImages[id]    ?? [];
    const resultats = this.dossierResultats[id] ?? [];
    const filters  = this.getDefaultTimelineFilters(id);
    const events:  TimelineEvent[] = [];

    const stateFrom = (r: string): TimelineEventState => {
      const u = (r || '').toUpperCase();
      if (['AMELIORATION','REMISSION','GUERISON','COMPLIANCE_BONNE'].includes(u)) return 'improvement';
      if (['DETERIORATION','RECHUTE','URGENCE','HOSPITALISATION_REQUISE'].includes(u)) return 'deterioration';
      return 'stagnation';
    };

    suivis.forEach(s => {
      if (filters.suivi && (s.resultat || '').toUpperCase() !== 'HOSPITALISATION_REQUISE') {
        events.push({ type:'suivi', date: s.dateSuivi||'',
          label: this.getStatusLabel(s.resultat||'') + (s.notes ? ' — ' + s.notes.slice(0,60) + (s.notes.length>60?'…':'') : ''),
          state: stateFrom(s.resultat||''), payload:{ id: s.idSuivi }, raw: s });
      }
    });
    if (filters.image) {
      images.forEach(img => {
        events.push({ type:'image', date: img.dateCapture||'',
          label: this.getImageTypeLabel(img.typeImage) + (img.description ? ' — '+img.description.slice(0,50)+(img.description.length>50?'…':'') : ''),
          state: 'stagnation', payload:{ id: img.idImage }, raw: img });
      });
    }
    if (filters.bilan) {
      resultats.forEach(r => {
        events.push({ type:'bilan', date: r.dateResultat||'',
          label: (r.nomTest||r.codeTest||'Bilan') + ' — ' + formatValeurResultat(r),
          state: 'stagnation', payload:{ id: r.idResultatLaboratoire }, raw: r });
      });
    }
    events.sort((a, b) => (b.date||'').localeCompare(a.date||''));
    return events;
  }
  getTimelineStateClass(state: TimelineEventState): string {
    return { improvement:'timeline-state-amelioration', stagnation:'timeline-state-stagnation', deterioration:'timeline-state-deterioration' }[state] || 'timeline-state-stagnation';
  }
  getTimelineEventIcon(type: TimelineEventType): string {
    return { suivi:'📋', hospitalisation:'🏥', image:'📷', bilan:'🧪' }[type] || '•';
  }
  getImageUrlFromEvent(ev: TimelineEvent): string {
    if (ev.type !== 'image' || !ev.raw || !('cheminImage' in ev.raw)) return this.placeholderImageUrl;
    return this.getImageUrl((ev.raw as ImageMedicale).cheminImage || '');
  }
  viewImageFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'image' && ev.raw && 'cheminImage' in ev.raw) this.viewImage(ev.raw as ImageMedicale);
  }
  openAffichageFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'bilan' && ev.raw && 'valeurResultat' in ev.raw) this.openAffichagePopup(ev.raw as ResultatLaboratoire);
  }
  openBilanFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'bilan' && ev.raw && 'valeurResultat' in ev.raw) this.openBilanPopup(ev.raw as ResultatLaboratoire);
  }
  openAddEventModal(dossier: DossierMedical, date?: string): void {
    this.addEventDossier = dossier;
    this.addEventDate    = date || new Date().toISOString().slice(0,10);
    this.addEventType    = 'suivi';
    this.showAddEventModal = true;
  }
  closeAddEventModal(): void { this.showAddEventModal = false; this.addEventDossier = null; }
  confirmAddEvent(): void {
    const d = this.addEventDossier;
    if (!d) return;
    if (this.addEventType === 'suivi' || this.addEventType === 'hospitalisation') {
      this.suiviFormDossier  = d;
      this.suiviFormDate     = this.addEventDate;
      this.suiviFormNotes    = '';
      this.suiviFormObjectif = '';
      this.suiviFormResultat = this.addEventType === 'hospitalisation' ? 'HOSPITALISATION_REQUISE' : 'STABLE';
      this.suiviFormError    = '';
      this.showSuiviFormPopup = true;
      this.closeAddEventModal();
    } else if (this.addEventType === 'bilan') {
      this.closeAddEventModal();
      this.openResultatForm(d, this.addEventDate);
    } else {
      this.closeAddEventModal();
      this.notification.info('To add an image: use the Medical images section.');
    }
    this.cdr.detectChanges();
  }
  onTimelineDrop(dossier: DossierMedical, event: DragEvent): void {
    event.preventDefault();
    this.timelineDragOver[dossier.idDossierMedical!] = false;
    const date = event.dataTransfer?.getData('text/plain');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) this.openAddEventModal(dossier, date);
    else this.openAddEventModal(dossier);
  }
  onTimelineDragOver(dossier: DossierMedical, event: DragEvent): void {
    event.preventDefault();
    this.timelineDragOver[dossier.idDossierMedical!] = true;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }
  onTimelineDragLeave(dossier: DossierMedical): void { this.timelineDragOver[dossier.idDossierMedical!] = false; }
  onDragStartDate(event: DragEvent, dossier: DossierMedical): void {
    const date = this.dragSourceDate || new Date().toISOString().slice(0,10);
    if (event.dataTransfer) { event.dataTransfer.setData('text/plain', date); event.dataTransfer.effectAllowed = 'copy'; }
  }
  openSuiviFormFromTimeline(dossier: DossierMedical): void { this.openAddEventModal(dossier); }
  closeSuiviFormPopup(): void { this.showSuiviFormPopup = false; this.suiviFormDossier = null; this.suiviFormError = ''; }
  submitSuiviForm(): void {
    const d = this.suiviFormDossier;
    if (!d?.idDossierMedical) return;
    this.suiviFormError  = '';
    this.suiviSubmitting = true;
    const suivi: Suivi = {
      idDossierMedical: d.idDossierMedical,
      dateSuivi: this.suiviFormDate,
      notes:     this.suiviFormNotes   || undefined,
      objectif:  this.suiviFormObjectif || undefined,
      resultat:  this.suiviFormResultat || 'STABLE'
    };
    this.suiviService.createSuivi(d.idDossierMedical, suivi).subscribe({
      next: () => {
        this.suiviSubmitting = false;
        this.loadSuivisForDossier(d.idDossierMedical!);
        this.closeSuiviFormPopup();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.suiviSubmitting = false;
        this.suiviFormError  = err?.message ?? 'Error saving.';
        this.cdr.detectChanges();
      }
    });
  }

  /* ── Tests labo ──────────────────────────────────── */
  /**
   * @param eventDate Date du bilan (ex. depuis la timeline), défaut aujourd’hui.
   */
  openResultatForm(dossier: DossierMedical, eventDate?: string): void {
    this.selectedDossierForResultat = dossier;
    this.resultatDefaultDate        = (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate))
      ? eventDate
      : new Date().toISOString().slice(0, 10);
    this.selectedIdTestInForm       = null;
    this.resultatFormError          = '';
    this.resultatWizardStep         = 1;
    this.selectedTestsForWizard     = [];
    this.resultatFormModel = {
      nom: String(dossier?.patientNom || '').split(' ')[0] || '',
      prenom: String(dossier?.patientNom || '').split(' ').slice(1).join(' ') || '',
      dateNaissance: '',
      sexe: 'MASCULIN',
      cin: '',
      telephone: '',
      medecin: 'Dr. prescripteur',
      specialite: 'Médecine générale',
      datePrescription: new Date().toISOString().slice(0,10),
      dateResultat: this.resultatDefaultDate,
      valeurResultat: '',
      etat: '',
      conclusion: '',
      hb: '',
      gb: '',
      plaquettes: '',
      ht: '',
      glycemieJeun: '',
      cholesterolTotal: '',
      ldl: '',
      hdl: '',
      triglycerides: '',
      tsh: '',
      creatinine: '',
      uree: '',
      sodium: '',
      potassium: '',
      chlore: '',
      bicarbonates: '',
      globulesRouges: '',
      neutrophiles: '',
      lymphocytes: '',
      monocytes: '',
      eosinophiles: '',
      basophiles: '',
      acideUrique: '',
      cystatineC: '',
      dfgEstime: '',
      dfgCystatineC: '',
      proteinesUrine: '',
      albuminurie: '',
      rapportAlbumineCreatinine: '',
      volumeUrinaire24h: '',
      creatinineUrinaire: '',
      calciumIono: '',
      magnesiumIono: '',
      phosphoreIono: '',
      calciumOsseux: '',
      phosphoreOsseux: '',
      vitamineD: '',
      parathormone: '',
      phosphatasesAlcalines: '',
      nomMedicament: '',
      tauxResiduel: '',
      datePriseMedicament: '',
      datePrelevement: '',
      dose: '',
      unite: '',
      dfgClairance: '',
      methodeCalcul: '',
      creatinineSanguine: '',
      creatinineUrinaireClairance: '',
      volumeUrine24h: '',
      surfaceCorporelle: '',
      poids: '',
      taille: '',
    };
    this.resultatFormFreeCatalog = false;
    this.resultatFormInfoMessage = '';
    this.clearWizardAiConclusionDebounce();
    this.lastWizardAiFingerprint = '';
    this.resultatWizardAiConclusionLoading = false;
    this.showResultatFormPopup      = true;
    this.testsCatalogForResultatForm = [];
    this.loadingDemandeOptionsForResultat = true;
    this.loadDemandeOptionsForResultat(dossier.idDossierMedical!);
  }

  /**
   * Même règle que {@code PrescriptionBilanService.aResultatPatientApresPrescription} :
   * un résultat antérieur à la prescription ne « compte » pas pour la demande en cours.
   */
  private resultatPosteriorAuPrescription(
    r: ResultatLaboratoire,
    datePrescription?: string | null,
  ): boolean {
    if (!datePrescription || String(datePrescription).trim() === '') {
      return true;
    }
    const presc = new Date(datePrescription);
    if (Number.isNaN(presc.getTime())) {
      return true;
    }
    const parseInstant = (s?: string | null): Date | null => {
      if (!s || !String(s).trim()) return null;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const dr = parseInstant(r.dateRendu);
    const dp = parseInstant(r.datePrelevement);
    if (dr !== null) {
      return dr.getTime() >= presc.getTime();
    }
    if (dp !== null) {
      return dp.getTime() >= presc.getTime();
    }
    const day = String(r.dateResultat ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const rDay = new Date(day + 'T12:00:00');
      const prescDay = new Date(presc.getFullYear(), presc.getMonth(), presc.getDate());
      return rDay.getTime() >= prescDay.getTime();
    }
    return false;
  }

  /** false = ce test est encore à saisir pour au moins une prescription active (ou mode catalogue libre). */
  private idTestEncoreDemandeNonCouvert(idTest: number): boolean {
    const results = this.wizardLastResults || [];
    if (this.resultatFormFreeCatalog) {
      return !results.some((r) => r.idTestLaboratoire === idTest);
    }
    const cat = (this.testsCatalog || []).find((x) => x.idTestLaboratoire === idTest);
    if (!cat?.codeLoinc || cat.idTestLaboratoire == null) return true;
    const normLoinc = (c: string | undefined) => String(c ?? '').trim().toUpperCase();
    const n = normLoinc(cat.codeLoinc);
    const prescs = this.wizardPendingPrescs.filter((p) =>
      (p.examens || []).some((e) => normLoinc(e) === n),
    );
    if (prescs.length === 0) return true;
    const rel = results.filter((r) => r.idTestLaboratoire === idTest);
    return prescs.some((p) => {
      const dp = p.datePrescription;
      if (!dp || String(dp).trim() === '') {
        return rel.length === 0;
      }
      return !rel.some((r) => this.resultatPosteriorAuPrescription(r, dp));
    });
  }

  private loadDemandeOptionsForResultat(idDossier: number): void {
    if (!idDossier) return;
    const normLoinc = (c: string | undefined) => String(c ?? '').trim().toUpperCase();
    this.resultatFormFreeCatalog = false;
    this.resultatFormInfoMessage = '';
    this.wizardPendingPrescs = [];
    this.wizardLastResults = [];

    forkJoin({
      prescs: this.moduleLabo.getPrescriptionsByDossier(idDossier),
      resultats: this.resultatLaboratoireService.getByDossier(idDossier),
    }).subscribe({
      next: ({ prescs, resultats }) => {
        const listRaw = prescs || [];
        const results = resultats || [];
        this.dossierResultats[idDossier] = results;
        this.wizardLastResults = results;

        const demandesEnCours = listRaw.filter((p) => {
          const st = String(p.statut ?? 'EN_ATTENTE').toUpperCase();
          return st === 'EN_ATTENTE' || st === 'PARTIEL';
        });
        this.wizardPendingPrescs = demandesEnCours;

        const demandedCodes = new Set<string>();
        demandesEnCours.forEach((p) =>
          (p.examens || []).forEach((code) => {
            const n = normLoinc(code);
            if (n) demandedCodes.add(n);
          }),
        );

        const idTestsWithAnyResult = new Set(
          results.map((r) => r.idTestLaboratoire).filter((x): x is number => x != null),
        );

        const catalogTestStillNeeded = (t: TestLaboratoire): boolean => {
          if (t.idTestLaboratoire == null || !String(t.codeLoinc ?? '').trim()) return false;
          const loinc = normLoinc(t.codeLoinc);
          if (!demandedCodes.has(loinc)) return false;
          const prescsNeeding = demandesEnCours.filter((p) =>
            (p.examens || []).some((e) => normLoinc(e) === loinc),
          );
          if (prescsNeeding.length === 0) return false;
          const rel = results.filter((r) => r.idTestLaboratoire === t.idTestLaboratoire);
          return prescsNeeding.some((p) => {
            const dp = p.datePrescription;
            if (!dp || String(dp).trim() === '') {
              return rel.length === 0;
            }
            return !rel.some((r) => this.resultatPosteriorAuPrescription(r, dp));
          });
        };

        const matchFromPrescription = (this.testsCatalog || []).filter((t) => catalogTestStillNeeded(t));

        let list = matchFromPrescription;
        let errMsg = '';

        if (list.length === 0) {
          if (demandesEnCours.length === 0) {
            if (listRaw.length === 0) {
              const libre = (this.testsCatalog || []).filter(
                (t) =>
                  t.idTestLaboratoire != null &&
                  !idTestsWithAnyResult.has(t.idTestLaboratoire) &&
                  !!String(t.codeLoinc ?? '').trim(),
              );
              if (libre.length > 0) {
                list = libre;
                this.resultatFormFreeCatalog = true;
                this.resultatFormInfoMessage =
                  'No active prescription for this record: choose tests from the catalogue. Your physician can validate the results.';
              } else {
                errMsg =
                  'No active prescription and no tests available in the catalogue (or all have already been entered).';
              }
            } else {
              errMsg =
                'All lab requests for this record are complete. Ask your physician for a new prescription to enter further tests.';
            }
          } else if (demandedCodes.size === 0) {
            errMsg =
              'The current request has no test codes (LOINC). Contact your physician to correct the prescription.';
          } else {
            const anyCatalogMatch = (this.testsCatalog || []).some(
              (t) => !!t.codeLoinc && demandedCodes.has(normLoinc(t.codeLoinc)),
            );
            errMsg = anyCatalogMatch
              ? 'Each prescribed test already has a result dated after the prescription. If you must enter a new analysis, ask the physician for a new request.'
              : 'Prescribed tests do not match the lab catalogue (LOINC). Check test codes or update the catalogue.';
          }
        }

        this.testsCatalogForResultatForm = list;
        this.loadingDemandeOptionsForResultat = false;
        this.resultatFormError = errMsg;

        if (list.length > 0) {
          if (this.resultatFormFreeCatalog) {
            this.selectedTestsForWizard = [];
            this.selectedIdTestInForm = null;
          } else {
            this.autoSelectAllPendingWizardTests();
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.testsCatalogForResultatForm = [];
        this.loadingDemandeOptionsForResultat = false;
        this.resultatFormError = 'Error loading test requests.';
        this.resultatFormFreeCatalog = false;
        this.resultatFormInfoMessage = '';
        this.wizardPendingPrescs = [];
        this.wizardLastResults = [];
        this.cdr.detectChanges();
      },
    });
  }

  closeResultatForm(): void {
    this.clearWizardAiConclusionDebounce();
    this.lastWizardAiFingerprint = '';
    this.resultatWizardAiConclusionLoading = false;
    this.showResultatFormPopup = false;
    this.selectedDossierForResultat = null;
    this.resultatFormError = '';
    this.resultatFormInfoMessage = '';
    this.resultatFormFreeCatalog = false;
    this.selectedIdTestInForm = null;
    this.resultatWizardStep = 1;
    this.selectedTestsForWizard = [];
    this.testsCatalogForResultatForm = [];
    this.loadingDemandeOptionsForResultat = false;
    this.wizardPendingPrescs = [];
    this.wizardLastResults = [];
  }

  submitResultatWizard(): void {
    if (!this.selectedDossierForResultat?.idDossierMedical) return;
    const rawIds = [...new Set(this.selectedTestsForWizard)].filter((id) =>
      this.testsCatalogForResultatForm.some((t) => t.idTestLaboratoire === id),
    );
    const idsToSubmit = rawIds.filter((id) => this.idTestEncoreDemandeNonCouvert(id));
    if (idsToSubmit.length === 0) {
      this.resultatFormError =
        rawIds.length === 0
          ? 'Sélectionnez au moins une analyse.'
          : 'Ces analyses sont déjà couvertes pour la période de prescription (ou existent déjà en base).';
      return;
    }
    const hasRawValue = !!String(this.resultatFormModel.valeurResultat || '').trim();
    const hasHemogram = this.isHemogramWizardTest() && this.hasHemogramValues();
    const hasIonogram = this.isIonogramWizardTest() && this.hasIonogramValues();
    const hasRenal = this.isRenalBilanWizardTest() && this.hasRenalBilanValues();
    const hasProt = this.isProteinurieWizardTest() && this.hasProteinurieValues();
    const hasOsseux = this.isOsseuxWizardTest() && this.hasOsseuxValues();
    const hasImmuno = this.isImmunosuppresseursWizardTest() && this.hasImmunosuppresseursValues();
    const hasDfgC = this.isDfgClairanceWizardTest() && this.hasDfgClairanceValues();
    const hasExtended = !this.wizardUsesStructuredPanelOnly && this.hasExtendedBioValues();
    const hasStructured =
      hasHemogram || hasIonogram || hasRenal || hasProt || hasOsseux || hasImmuno || hasDfgC;
    if (!this.resultatFormModel.dateResultat || (!hasRawValue && !hasStructured && !hasExtended)) {
      this.resultatFormError = 'Renseignez la date et la valeur du résultat.';
      return;
    }

    const valeurFinale = this.computeWizardValeurFinale();

    const dateResultat = this.resultatFormModel.dateResultat || new Date().toISOString().slice(0, 10);
    const etat = this.resultatFormModel.etat?.trim() || undefined;
    const conclusion = this.resultatFormModel.conclusion?.trim() || undefined;
    const dossierId = this.selectedDossierForResultat.idDossierMedical!;
    const dpDay = String(this.resultatFormModel.datePrelevement || '').trim();
    const datePrelevement = dpDay ? `${dpDay}T08:00:00` : `${dateResultat}T08:00:00`;
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const dateRendu = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    const interpretation = this.mapEtatToInterpretation(etat);
    const valeurTexteCourt = (etat && etat.length <= 100
      ? etat
      : (etat || valeurFinale).slice(0, 100)).trim();

    const dtos: ResultatLaboratoire[] = idsToSubmit.map((idTest) => {
      const cat = this.testsCatalogForResultatForm.find((t) => t.idTestLaboratoire === idTest);
      const uniteTest = cat?.unite?.trim() || undefined;
      const composite =
        valeurFinale.includes(';') || valeurFinale.includes('|') || valeurFinale.length > 80;
      const num = composite ? undefined : this.parseFirstNumberFromString(valeurFinale);
      return {
        idDossierMedical: dossierId,
        idTestLaboratoire: idTest,
        datePrelevement,
        dateRendu,
        dateResultat,
        valeurResultat: valeurFinale,
        valeurNumerique: num,
        valeurTexte: valeurTexteCourt || undefined,
        unite: uniteTest,
        conclusion,
        statutResultat: 'RECU',
        interpretation,
        sourceImport: 'SAISIE_MANUELLE',
        partagePatient: true,
        etat,
      } satisfies ResultatLaboratoire;
    });

    this.resultatSubmitting = true;
    forkJoin(dtos.map((dto) => this.resultatLaboratoireService.create(dto))).subscribe({
      next: () => {
        this.resultatSubmitting = false;
        this.generatePatientLabReportPdf();
        this.loadResultatsForDossier(dossierId);
        this.loadDemandesForDossier(dossierId);
        this.closeResultatForm();
        this.notification.success(
          idsToSubmit.length > 1 ? `${idsToSubmit.length} résultats enregistrés.` : 'Résultat enregistré.',
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resultatSubmitting = false;
        this.resultatFormError = err?.message ?? err?.error?.message ?? 'Erreur.';
        this.cdr.detectChanges();
      },
    });
  }
  testTypeAlreadyExistsForDossier(idTestLaboratoire: number): boolean {
    if (!this.selectedDossierForResultat?.idDossierMedical) return false;
    return (this.dossierResultats[this.selectedDossierForResultat.idDossierMedical] ?? [])
      .some(r => r.idTestLaboratoire === idTestLaboratoire);
  }

  /** Toutes les analyses cochées sont déjà couvertes (date / prescription). */
  allSelectedWizardTestsAlreadyRecorded(): boolean {
    if (this.selectedTestsForWizard.length === 0) return false;
    return this.selectedTestsForWizard.every((id) => !this.idTestEncoreDemandeNonCouvert(id));
  }
  submitResultat(form: NgForm): void {
    if (form.invalid || !this.selectedDossierForResultat?.idDossierMedical) {
      Object.keys(form.controls).forEach(k => form.controls[k]?.markAsTouched());
      if (form.invalid) this.resultatFormError = 'Fill in all required fields.';
      this.cdr.detectChanges(); return;
    }
    const v     = form.value;
    const idTest = Number(v.idTestLaboratoire);
    if (this.testTypeAlreadyExistsForDossier(idTest)) {
      this.resultatFormError = 'This test type already exists for this record.';
      this.cdr.detectChanges(); return;
    }
    if (!this.testsCatalogForResultatForm.some(t => t.idTestLaboratoire === idTest)) {
      this.resultatFormError = "Ce test n'est pas demandé pour ce dossier (ou déjà complété).";
      this.cdr.detectChanges(); return;
    }
    const dateResultat = v.dateResultat || new Date().toISOString().slice(0, 10);
    const vr = (v.valeurResultat || '').trim();
    const etatL = v.etat?.trim() || undefined;
    const conclusionL = v.conclusion?.trim() || undefined;
    const cat = this.testsCatalogForResultatForm.find((t) => t.idTestLaboratoire === idTest);
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const dateRendu = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    const datePrelevement = `${dateResultat}T08:00:00`;
    const dto: ResultatLaboratoire = {
      idDossierMedical: this.selectedDossierForResultat.idDossierMedical!,
      idTestLaboratoire: idTest,
      datePrelevement,
      dateRendu,
      dateResultat,
      valeurResultat: vr,
      valeurNumerique: (() => {
        const composite = vr.includes(';') || vr.includes('|') || vr.length > 80;
        return composite ? undefined : this.parseFirstNumberFromString(vr);
      })(),
      valeurTexte: (etatL && etatL.length <= 100 ? etatL : (etatL || vr).slice(0, 100)).trim() || undefined,
      unite: cat?.unite?.trim() || undefined,
      conclusion: conclusionL,
      statutResultat: 'RECU',
      interpretation: this.mapEtatToInterpretation(etatL),
      sourceImport: 'SAISIE_MANUELLE',
      partagePatient: true,
      etat: etatL,
    };
    this.resultatSubmitting = true;
    this.resultatLaboratoireService.create(dto).subscribe({
      next: () => {
        this.resultatSubmitting = false;
        const dossierId = this.selectedDossierForResultat!.idDossierMedical!;
        this.loadResultatsForDossier(dossierId);
        this.loadDemandesForDossier(dossierId);
        this.closeResultatForm(); form.reset();
        this.notification.success('Result recorded.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resultatSubmitting = false;
        this.resultatFormError  = err?.message ?? err?.error?.message ?? 'Error.';
        this.cdr.detectChanges();
      }
    });
  }

  /* ── Bilans ──────────────────────────────────────── */
  openAffichagePopup(r: ResultatLaboratoire): void { this.selectedResultatAffichage = r; this.showAffichagePopup = true; }
  closeAffichagePopup(): void { this.showAffichagePopup = false; this.selectedResultatAffichage = null; }
  openBilanPopup(r: ResultatLaboratoire, dossier?: DossierMedical): void {
    this.selectedBilan           = r;
    this.selectedDossierForBilan = dossier || null;
    this.rapportsForBilan        = [];
    this.showBilanPopup          = true;
    if (r.idResultatLaboratoire) this.loadRapportsForBilan(r.idResultatLaboratoire);
  }
  closeBilanPopup(): void { this.showBilanPopup = false; this.selectedBilan = null; this.selectedDossierForBilan = null; this.rapportsForBilan = []; }
  canDeleteResultat(r: ResultatLaboratoire): boolean {
    if (!r.idResultatLaboratoire) return false;
    const rapports = this.rapportsByResultatId[r.idResultatLaboratoire];
    return !rapports || rapports.length === 0;
  }
  deleteResultat(r: ResultatLaboratoire, idDossier: number): void {
    if (!r.idResultatLaboratoire || !this.canDeleteResultat(r)) return;
    this.confirmService.confirm('Delete this test result?', { title: 'Delete result' }).then(ok => {
      if (!ok || r.idResultatLaboratoire == null) return;
      this.resultatLaboratoireService.delete(r.idResultatLaboratoire).subscribe({
        next:  () => { delete this.rapportsByResultatId[r.idResultatLaboratoire!]; this.loadResultatsForDossier(idDossier); this.cdr.detectChanges(); },
        error: (err) => this.notification.error(err?.message ?? 'Error deleting.')
      });
    });
  }
  loadRapportsForBilan(idResultat: number): void {
    this.loadingRapports = true;
    this.rapportBiService.getByBilan(idResultat).subscribe({
      next:  data => { this.rapportsForBilan = data || []; this.loadingRapports = false; this.cdr.detectChanges(); },
      error: ()   => { this.rapportsForBilan = [];         this.loadingRapports = false; this.cdr.detectChanges(); }
    });
  }
  openBilanPdf(idRapportBilan: number): void {
    this.rapportBiService.getPdf(idRapportBilan).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000); },
      error: err  => this.notification.error(err?.message || 'PDF unavailable')
    });
  }
  exportRapportPdf(rap: RapportBi): void {
    this.rapportBiService.exportRapportAsPdf(rap, { patientName: this.selectedDossierForBilan?.patientNom });
  }

  /* ── Analyse logique du risque de rechute ───────────────────────────── */
  getRelapseRisk(dossier: DossierMedical): {
    score: number;
    label: string;
    labelClass: string;
    factors: { name: string; value: string; impact: string; points: number }[];
  } {
    const suivis = this.dossierSuivis[dossier.idDossierMedical!] ?? [];
    const factors: { name: string; value: string; impact: string; points: number }[] = [];

    let total = 0;

    // 1) Gravité du diagnostic (profil de base)
    const diagBase: Record<string, { label: string; points: number }> = {
      SYNDROME_NEPHROTIQUE_CORTICORESISTANT: { label: 'Très à risque', points: 22 },
      REJET_DE_GREFFE:                      { label: 'Très à risque', points: 22 },
      LUPUS_NEPHRITE:                       { label: 'Risque important', points: 18 },
      GLOMERULONEPHRITE_CHRONIQUE:          { label: 'Risque important', points: 16 },
      POST_TRANSPLANTATION_RENALE:          { label: 'Risque modéré', points: 14 },
      SYNDROME_NEPHROTIQUE_CORTICOSENSIBLE: { label: 'Risque modéré', points: 12 },
      SYNDROME_NEPHROTIQUE:                 { label: 'Risque modéré', points: 12 },
      INSUFFISANCE_RENALE_CHRONIQUE:        { label: 'Risque de fond', points: 10 },
    };
    const diagKey = dossier.diagnostic ?? 'AUTRE';
    const base = diagBase[diagKey] ?? { label: 'Risque de fond', points: 8 };
    const p1 = Math.min(25, base.points);
    factors.push({
      name: 'Profil diagnostique',
      value: diagKey || '—',
      impact: base.label,
      points: p1,
    });
    total += p1;

    // 2) Historique de rechutes
    const nbRechutes = suivis.filter(s => (s.resultat ?? '').toUpperCase() === 'RECHUTE').length;
    let p2 = 0;
    let impactRechute = 'Aucune rechute documentée';
    if (nbRechutes === 1) { p2 = 8; impactRechute = 'Antécédent isolé de rechute'; }
    else if (nbRechutes === 2) { p2 = 14; impactRechute = 'Rechutes répétées'; }
    else if (nbRechutes >= 3) { p2 = 20; impactRechute = 'Rechutes fréquentes'; }
    factors.push({
      name: 'Épisodes de rechute',
      value: `${nbRechutes} épisode(s)`,
      impact: impactRechute,
      points: p2,
    });
    total += p2;

    // 3) Fraîcheur du dernier suivi
    let p3 = 0;
    let lastSuiviDate = '';
    let impactSuivi = '';
    if (suivis.length > 0) {
      const last = [...suivis].sort((a, b) => (b.dateSuivi || '').localeCompare(a.dateSuivi || ''))[0];
      lastSuiviDate = last.dateSuivi ? this.formatDateShort(last.dateSuivi) : '—';
      const months = last.dateSuivi ? (Date.now() - new Date(last.dateSuivi).getTime()) / (30 * 24 * 60 * 60 * 1000) : 0;
      if (months <= 1) { p3 = 4; impactSuivi = 'Suivi très récent'; }
      else if (months <= 3) { p3 = 8; impactSuivi = 'Suivi récent'; }
      else if (months <= 6) { p3 = 14; impactSuivi = 'Suivi ancien — à rapprocher'; }
      else { p3 = 20; impactSuivi = 'Suivi très ancien / absent récemment'; }
    } else {
      lastSuiviDate = 'Aucun suivi';
      p3 = 16;
      impactSuivi = 'Aucun suivi disponible';
    }
    factors.push({
      name: 'Dernier suivi',
      value: lastSuiviDate,
      impact: impactSuivi,
      points: p3,
    });
    total += p3;

    // 4) Tendance du dernier résultat
    let p4 = 0;
    let lastResultat = '—';
    let impactResultat = 'Données insuffisantes';
    if (suivis.length > 0) {
      lastResultat = [...suivis].sort((a, b) => (b.dateSuivi || '').localeCompare(a.dateSuivi || ''))[0].resultat ?? '—';
      const r = (lastResultat || '').toUpperCase();
      if (['RECHUTE', 'DETERIORATION', 'URGENCE'].includes(r)) { p4 = 22; impactResultat = 'Situation instable / aggravation'; }
      else if (['SOUS_SURVEILLANCE', 'EN_COURS'].includes(r)) { p4 = 14; impactResultat = 'Évolution incertaine, sous surveillance'; }
      else if (['STABLE', 'AMELIORATION', 'REMISSION'].includes(r)) { p4 = 6; impactResultat = 'État stable ou en amélioration'; }
      else if (r === 'GUERISON') { p4 = 0; impactResultat = 'Guérison documentée'; }
      else { p4 = 10; impactResultat = 'Résultat non catégorisable'; }
    }
    factors.push({
      name: 'Résultat dernier suivi',
      value: this.getStatusLabel(lastResultat),
      impact: impactResultat,
      points: p4,
    });
    total += p4;

    // 5) Densité des suivis (qualité du monitoring)
    const nbSuivis = suivis.length;
    let p5 = 0;
    let impactNb = '';
    if (nbSuivis === 0) { p5 = 16; impactNb = 'Aucun suivi en base'; }
    else if (nbSuivis <= 2) { p5 = 10; impactNb = 'Peu de suivis — données limitées'; }
    else if (nbSuivis <= 5) { p5 = 6; impactNb = 'Suivi modéré'; }
    else { p5 = 2; impactNb = 'Bon niveau de suivi'; }
    factors.push({
      name: 'Nombre de suivis',
      value: `${nbSuivis} suivi(s)`,
      impact: impactNb,
      points: p5,
    });
    total += p5;

    const score = Math.min(100, Math.round(total));
    let label = 'Faible';
    let labelClass = 'risk-low';
    if (score >= 70) { label = 'Élevé'; labelClass = 'risk-high'; }
    else if (score >= 40) { label = 'Modéré'; labelClass = 'risk-medium'; }

    return { score, label, labelClass, factors };
  }

  openSuiviPopup(dossier: DossierMedical): void { console.log('Suivi popup:', dossier.idDossierMedical); }
  viewFullDossier(idDossier: number): void { this.router.navigate(['/back/dossiers']); }

  /* ── Formulaires modaux ──────────────────────────── */
  openAppointmentFromHome($event: Event): void { $event.preventDefault(); this.appointmentModal.open(); }
  toggleNotifications(): void  { this.showNotifications = !this.showNotifications; this.showProfile = false; }
  toggleProfile(): void        { this.showProfile = !this.showProfile; this.showNotifications = false; }
  openAppointmentForm(): void  { this.showAppointmentForm  = true; }
  closeAppointmentForm(): void { this.showAppointmentForm  = false; }
  openEmergencyForm(): void    { this.showEmergencyForm    = true; }
  closeEmergencyForm(): void   { this.showEmergencyForm    = false; }
  openMedicalReportForm(): void {
    this.resetVitalForm();
    this.showMedicalReportForm = true;
    this.loadConstantesForVitalForm();
  }

  closeMedicalReportForm(): void {
    this.showMedicalReportForm = false;
    this.resetVitalForm();
  }

  private loadConstantesForVitalForm(): void {
    this.http.get<ConstanteVitaleLite[]>(`${this.vitalApiBase}/constanteVitale/retrieveConstantesVitales`).subscribe({
      next: (data) => {
        // Évite NG0100 (ExpressionChangedAfterItHasBeenChecked) : mise à jour après le cycle de détection courant
        setTimeout(() => {
          this.constantesList = data ?? [];
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.constantesList = [];
        }, 0);
      },
    });
  }

  onConstanteChange(): void {
    const c = this.getSelectedConstante();
    if (!c) return;
    this.vitalData.nomParametre = c.nomParametre ?? '';
    this.vitalData.unite = c.unite ?? '';
    this.vitalData.referenceMin = c.valeurMinNormale;
    this.vitalData.referenceMax = c.valeurMaxNormale;
    this.calcVitalProgress();
  }

  getSelectedConstante(): ConstanteVitaleLite | null {
    const id = this.vitalData.idConstanteVitale;
    if (id == null) return null;
    return this.constantesList.find((x) => x.idConstanteVitale === id) ?? null;
  }

  isOutOfRange(c: ConstanteVitaleLite | null): boolean {
    if (!c || this.vitalData.valeurMesuree == null) return false;
    const v = Number(this.vitalData.valeurMesuree);
    const min = c.valeurMinNormale;
    const max = c.valeurMaxNormale;
    if (min == null || max == null) return false;
    return v < min || v > max;
  }

  showVitalOutOfRangeAlert(): boolean {
    const c = this.getSelectedConstante();
    return this.vitalData.valeurMesuree != null && c != null && this.isOutOfRange(c);
  }

  calcVitalProgress(): void {
    let n = 0;
    if (this.vitalData.valeurMesuree != null) n++;
    if ((this.vitalData.nomParametre || '').trim().length > 0) n++;
    if ((this.vitalData.etat || '').trim().length > 0) n++;
    this.vitalFormProgress = Math.round((n / 3) * 100);
  }

  resetVitalForm(): void {
    this.vitalData = {
      idConstanteVitale: null,
      nomParametre: '',
      valeurMesuree: null,
      unite: '',
      etat: '',
      referenceMin: null,
      referenceMax: null,
      poids: null,
      taille: null,
      age: null,
      imc: null,
    };
    this.vitalFormProgress = 0;
  }

  saveVitalParametre(): void {
    const v = this.vitalData;
    if (!v.nomParametre?.trim() || v.valeurMesuree == null || !(v.etat || '').trim()) {
      this.notification.error('Veuillez remplir le nom, la valeur mesurée et l’état.');
      return;
    }
    this.vitalIsLoading = true;
    const payload: Record<string, unknown> = {
      nomParametre: v.nomParametre.trim(),
      valeurMesuree: v.valeurMesuree,
      unite: (v.unite || '').trim(),
      referenceMin: v.referenceMin,
      referenceMax: v.referenceMax,
      etat: v.etat,
      poids: v.poids,
      taille: v.taille,
      age: v.age,
      imc: v.imc,
      idResultatLaboratoire: null,
    };
    if (v.idConstanteVitale != null) {
      payload['constanteVitaleId'] = v.idConstanteVitale;
    }
    this.http.post(`${this.vitalApiBase}/parametreVital/addParametreVital`, payload).subscribe({
      next: () => {
        this.vitalIsLoading = false;
        this.notification.success('Paramètre vital enregistré.');
        setTimeout(() => this.closeMedicalReportForm(), 0);
      },
      error: () => {
        this.vitalIsLoading = false;
        this.notification.error('Erreur lors de l’enregistrement. Réessayez plus tard.');
      },
    });
  }
  openLabResultForm(): void      { this.showLabResultForm      = true; }
  closeLabResultForm(): void     { this.showLabResultForm      = false; }
  openTreatmentForm(): void      { this.showTreatmentForm      = true; }
  closeTreatmentForm(): void     { this.showTreatmentForm      = false; }

  onSubmitAppointment(form: NgForm):    void { if (form.valid) { this.notification.success('Appointment request sent.'); this.closeAppointmentForm(); form.reset(); } }
  onSubmitEmergency(form: NgForm):      void { if (form.valid) { this.notification.success('Emergency sent!'); this.closeEmergencyForm(); form.reset(); } }
  onSubmitMedicalReport(form: NgForm): void {
    if (form.valid) {
      this.notification.info('Generating report…');
      this.closeMedicalReportForm();
      form.reset();
    }
  }
  onSubmitLabResult(form: NgForm):      void { if (form.valid) { this.notification.info('Fetching results…'); this.closeLabResultForm(); form.reset(); } }
  onSubmitTreatment(form: NgForm):      void { if (form.valid) { this.notification.info('Loading treatment…'); this.closeTreatmentForm(); form.reset(); } }

  /* ── Chatbot ─────────────────────────────────────── */
  initChatbot(): void {
    this.chatMessages = [{ role: 'bot', text: this.nephroChatbot.getWelcomeMessage(), date: new Date() }];
  }
  toggleChatbot(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen && this.chatMessages.length === 0) this.initChatbot();
    this.cdr.detectChanges();
  }
  sendChatMessage(): void {
    const text = (this.chatUserInput || '').trim();
    if (!text) return;
    this.chatMessages.push({ role: 'user', text, date: new Date() });
    this.chatUserInput = '';
    this.chatMessages.push({ role: 'bot', text: this.nephroChatbot.getReply(text), date: new Date() });
    this.cdr.detectChanges();
  }

  logout(): void {
    localStorage.removeItem('patientId');
    this.auth.logout();
  }
}