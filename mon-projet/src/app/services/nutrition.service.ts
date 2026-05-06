import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ── URLs ──────────────────────────────────────────────────────────────────────
const NUTRITION_URL     = 'http://localhost:8088/api';
const PRESCRIPTION_URL  = 'http://localhost:8086/api';
const PATIENT_URL       = 'http://localhost:8086';   // /patients sans /api

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES — Nutrition
// ══════════════════════════════════════════════════════════════════════════════

export interface Aliment {
  id?                   : number;
  nom                   : string;
  categorie             : string;
  potassiumMg?          : number;
  sodiumMg?             : number;
  phosphoreMg?          : number;
  proteinesG?           : number;
  sucreG?               : number;
  caloriesKcal?         : number;
  interactionTacrolimus?: boolean;
  interactionCyclosporine?: boolean;
  ageMinimumMois?       : number;
  raisonRestrictionAge? : string;
  notes?                : string;
}

export interface BesoinNutritionnel {
  id?                  : number;
  patientId            : number;
  potassiumMaxMg       : number;
  sodiumMaxMg          : number;
  phosphoreMaxMg       : number;
  proteinesMaxG        : number;
  sucreMaxG            : number;
  caloriesJour         : number;
  poidsKg?             : number;
  ageMois?             : number;
  traitementTacrolimus?: boolean;
  traitementPrednisone?: boolean;
  raisonCalcul?        : string;
  dateDebut            : string;
  dateFin?             : string;
  notes?               : string;
}

export interface RestrictionAlimentaire {
  id?                     : number;
  patientId               : number;
  alimentId               : number;
  raison                  : string;
  valeurBilanDeclencheur? : number;
  creeAutomatiquement?    : boolean;
  dateDebut               : string;
  dateFin?                : string;
  notes?                  : string;
}

export interface AlerteNutrition {
  id?           : number;
  patientId     : number;
  type          : string;
  message       : string;
  dateAlerte?   : string;
  lue           : boolean;
  alimentId?    : number;
  restrictionId?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES — Prescription Service
// ══════════════════════════════════════════════════════════════════════════════

export interface PatientDTO {
  idPatient    : number;
  username     : string;
  email?       : string;
  firstName    : string;
  lastName     : string;
  telephone?   : string;
  dateNaissance?: string;
}

export interface PatientWeight {
  id?         : number;
  patientId   : number;
  weightKg    : number;
  heightCm?   : number;
  measuredAt? : string;
}

export interface DernierBilan {
  patientId?       : number;
  dateBilan?       : string | null;
  poids?           : number | null;
  taille?          : number | null;
  potassium?       : number | null;
  sodium?          : number | null;
  phosphore?       : number | null;
  creatinine?      : number | null;
  dfg?             : number | null;
  albumine?        : number | null;
  glycemie?        : number | null;
  // recommandations calculées
  calories?        : number | null;
  potassiumMax?    : number | null;
  sodiumMax?       : number | null;
  phosphoreMax?    : number | null;
}

export interface PrescriptionDTO {
  id?            : number;
  patientId?     : number;
  medicalRecordId?: number;
  prescriptionDate?: string;
  status?        : string;
  items?         : PrescriptionItemDTO[];
}

export interface PrescriptionItemDTO {
  id?            : number;
  prescriptionId?: number;
  medicationId?  : number;
  medicationName?: string;
  dosage?        : string;
  frequency?     : string;
  startDate?     : string;
  endDate?       : string;
  notes?         : string;
}

// ══════════════════════════════════════════════════════════════════════════════
// LABELS
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIE_LABELS: Record<string, string> = {
  FRUIT:           '🍎 Fruit',
  LEGUME:          '🥦 Légume',
  VIANDE:          '🥩 Viande',
  PRODUIT_LAITIER: '🧀 Produit laitier',
  CEREALE:         '🌾 Céréale',
  AUTRE:           '🍽️ Autre'
};

export const RAISON_RESTRICTION_LABELS: Record<string, string> = {
  HYPERKALIEMIE:         '🧂 Hyperkaliémie',
  HYPERPHOSPHOREMIE:     '💊 Hyperphosphorémie',
  HYPERNATREMIE:         '🧪 Hypernatrémie',
  INTERACTION_TACROLIMUS:'⚠️ Interaction Tacrolimus',
  INTERACTION_CYCLOSPORINE:'⚠️ Interaction Cyclosporine',
  RESTRICTION_AGE:       '👶 Restriction par âge',
  DIABETE:               '🍬 Diabète',
  AUTRE:                 '📋 Autre'
};

export const TYPE_ALERTE_LABELS: Record<string, string> = {
  INTERACTION_MEDICAMENT: 'Drug Interaction',
  BILAN_ANORMAL:          'Abnormal Lab Results',
  RESTRICTION_VIOLEE:     'Dietary Restriction Violated',
  HYPERKALIEMIE:          'Hyperkalemia',
  HYPERNATREMIE:          'Hypernatremia',
  AUTRE:                  'Other'
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class NutritionService {

  constructor(private http: HttpClient) {}

  // ── Aliments ───────────────────────────────────────────────────────────────
  getAllAliments(): Observable<Aliment[]>              { return this.http.get<Aliment[]>(`${NUTRITION_URL}/aliments`); }
  getAlimentById(id: number): Observable<Aliment>     { return this.http.get<Aliment>(`${NUTRITION_URL}/aliments/${id}`); }
  createAliment(dto: Aliment): Observable<Aliment>    { return this.http.post<Aliment>(`${NUTRITION_URL}/aliments`, dto); }
  updateAliment(id: number, dto: Aliment): Observable<Aliment> { return this.http.put<Aliment>(`${NUTRITION_URL}/aliments/${id}`, dto); }
  deleteAliment(id: number): Observable<void>         { return this.http.delete<void>(`${NUTRITION_URL}/aliments/${id}`); }

  // ── Besoins nutritionnels ─────────────────────────────────────────────────
  getAllBesoins(): Observable<BesoinNutritionnel[]>    { return this.http.get<BesoinNutritionnel[]>(`${NUTRITION_URL}/besoins-nutritionnels`); }
  getActiveBesoinForPatient(patientId: number): Observable<BesoinNutritionnel> {
    return this.http.get<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels/patient/${patientId}/actif`);
  }
  createBesoin(dto: BesoinNutritionnel): Observable<BesoinNutritionnel> { return this.http.post<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels`, dto); }
  updateBesoin(id: number, dto: BesoinNutritionnel): Observable<BesoinNutritionnel> { return this.http.put<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels/${id}`, dto); }
  deleteBesoin(id: number): Observable<void>          { return this.http.delete<void>(`${NUTRITION_URL}/besoins-nutritionnels/${id}`); }

  // ── Restrictions ──────────────────────────────────────────────────────────
  getActiveRestrictionsForPatient(patientId: number): Observable<RestrictionAlimentaire[]> {
    return this.http.get<RestrictionAlimentaire[]>(`${NUTRITION_URL}/restrictions-alimentaires/patient/${patientId}/actives`);
  }
  createRestriction(dto: RestrictionAlimentaire): Observable<RestrictionAlimentaire> { return this.http.post<RestrictionAlimentaire>(`${NUTRITION_URL}/restrictions-alimentaires`, dto); }
  updateRestriction(id: number, dto: RestrictionAlimentaire): Observable<RestrictionAlimentaire> { return this.http.put<RestrictionAlimentaire>(`${NUTRITION_URL}/restrictions-alimentaires/${id}`, dto); }
  deleteRestriction(id: number): Observable<void>     { return this.http.delete<void>(`${NUTRITION_URL}/restrictions-alimentaires/${id}`); }

  // ── Alertes ───────────────────────────────────────────────────────────────
  getUnreadAlertesForPatient(patientId: number): Observable<AlerteNutrition[]> {
    return this.http.get<AlerteNutrition[]>(`${NUTRITION_URL}/alertes-nutrition/patient/${patientId}/non-lues`);
  }
  createAlerte(dto: AlerteNutrition): Observable<AlerteNutrition> { return this.http.post<AlerteNutrition>(`${NUTRITION_URL}/alertes-nutrition`, dto); }
  markAlerteAsRead(id: number): Observable<void>      { return this.http.patch<void>(`${NUTRITION_URL}/alertes-nutrition/${id}/marquer-lue`, {}); }
  markAllAlertesAsRead(patientId: number): Observable<void> { return this.http.patch<void>(`${NUTRITION_URL}/alertes-nutrition/patient/${patientId}/marquer-toutes-lues`, {}); }

  // ── Patients (prescription-service) ──────────────────────────────────────
  getAllPatients(): Observable<PatientDTO[]> {
    return this.http.get<PatientDTO[]>(`${PATIENT_URL}/patients`);
  }

  // ── Poids + Taille (prescription-service) ────────────────────────────────
  getLatestWeight(patientId: number): Observable<PatientWeight> {
    return this.http.get<PatientWeight>(`${PRESCRIPTION_URL}/patient-weight/patient/${patientId}/latest`);
  }

  // ── Dernier bilan laboratoire ─────────────────────────────────────────────
  getDernierBilan(patientId: number): Observable<DernierBilan | null> {
    return this.http.get<DernierBilan>(`${NUTRITION_URL}/nutrition/diet-recommendation/${patientId}`)
      .pipe(catchError(() => of(null)));
  }

  getActivePrescriptions(patientId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`/prescription/api/prescriptions/patient/${patientId}/active`);
  }

  getPrescriptionItems(prescriptionId: number): Observable<PrescriptionItemDTO[]> {
    return this.http.get<PrescriptionItemDTO[]>(`/prescription/api/prescription-items/prescription/${prescriptionId}`);
  }

  // ── Suggestion menus semaine ──────────────────────────────────────────────
  getMenusSemaine(patientId: number): Observable<{ [jour: string]: MenuJournalierDTO[] }> {
    return this.http.get<{ [jour: string]: MenuJournalierDTO[] }>(
      `${NUTRITION_URL}/nutrition/menus-semaine/${patientId}`
    ).pipe(catchError(() => of({})));
  }

  // ── Lab-Nutrition (OpenFeign NEPHRO → Nutrition_Service) ─────────────────
  /** Récupère les dossiers médicaux du patient connecté (JWT → NEPHRO). */
  getMesDossiers(): Observable<DossierMedicalDTO[]> {
    return this.http.get<DossierMedicalDTO[]>(`/api/dossiers-medicaux/mes-dossiers`)
      .pipe(catchError(() => of([])));
  }

  /** Fallback : récupère les dossiers par idPatient numérique. */
  getDossiersByPatient(idPatient: number): Observable<DossierMedicalDTO[]> {
    return this.http.get<DossierMedicalDTO[]>(`/api/dossiers-medicaux/patient/${idPatient}`)
      .pipe(catchError(() => of([])));
  }

  /** Récupère les résultats de labo d'un dossier médical directement depuis NEPHRO. */
  getLabResultsForDossier(idDossierMedical: number): Observable<ResultatLaboDTO[]> {
    return this.http.get<ResultatLaboDTO[]>(`/api/resultats-laboratoire/dossier/${idDossierMedical}`)
      .pipe(catchError(() => of([])));
  }

  /** Adapte les besoins nutritionnels selon les résultats de labo. */
  adaptNutritionFromLab(patientId: number, idDossierMedical: number): Observable<BesoinNutritionnel | null> {
    return this.http.post<BesoinNutritionnel>(
      `/api/nutrition/lab/adapt?patientId=${patientId}&idDossierMedical=${idDossierMedical}`, {}
    ).pipe(catchError(() => of(null)));
  }

}

// ── DTOs menus ────────────────────────────────────────────────────────────────
export interface AlimentPortionDTO {
  alimentId  : number;
  nom        : string;
  categorie  : string;
  portionG   : number;   // ← correspond exactement au JSON Spring
  calories   : number;
  proteines  : number;   // Spring envoie "proteines" pas "proteinesG"
  potassium  : number;   // Spring envoie "potassium" pas "potassiumMg"
  sodium     : number;
  phosphore  : number;
  sucre      : number;
}

export interface RepasDTO {
  type         : string;   // PETIT_DEJEUNER | DEJEUNER | DINER | COLLATION
  aliments     : AlimentPortionDTO[];
  totalCalories: number;
  totalProteines: number;
  totalPotassium: number;
  totalSodium  : number;
  totalPhosphore: number;
}

export interface MenuJournalierDTO {
  jour         : string;
  repas        : RepasDTO[];
  totalCalories: number;
  totalProteines: number;
  totalPotassium: number;
  totalSodium  : number;
  totalPhosphore: number;
}

// ── Lab-Nutrition (OpenFeign NEPHRO → Nutrition_Service) ──────────────────────
export interface DossierMedicalDTO {
  idDossierMedical?: number;
  idPatient?       : number;
  dateCreation?    : string;
  diagnostic?      : string;
  notes?           : string;
  patientNom?      : string;
  medecinNom?      : string;
}

export interface ResultatLaboDTO {
  idResultatLaboratoire?: number;
  idDossierMedical?     : number;
  idTestLaboratoire?    : number;
  datePrelevement?      : string;
  dateResultat?         : string;
  valeurNumerique?      : number;
  valeurTexte?          : string;
  unite?                : string;
  conclusion?           : string;
  interpretation?       : string;   // NORMAL | ELEVE | BAS | CRITIQUE_HAUT | CRITIQUE_BAS
  statutResultat?       : string;   // EN_ATTENTE | RECU | VALIDE
  nomTest?              : string;
  codeTest?             : string;
}