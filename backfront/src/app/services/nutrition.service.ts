import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ── URLs microservices ───────────────────────────────────────────────────────
// Nutrition : accès direct (CORS 8084). Prescription / liste patients : via proxy ng serve → /prescription → :8086
const NUTRITION_URL = 'http://localhost:8084/api';
const PRESCRIPTION_URL = '/prescription/api';
const PATIENT_URL = '/prescription';

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES — Nutrition
// ══════════════════════════════════════════════════════════════════════════════

export interface Aliment {
  id?: number;
  nom: string;
  categorie: string;
  potassiumMg?: number;
  sodiumMg?: number;
  phosphoreMg?: number;
  proteinesG?: number;
  sucreG?: number;
  caloriesKcal?: number;
  interactionTacrolimus?: boolean;
  interactionCyclosporine?: boolean;
  ageMinimumMois?: number;
  raisonRestrictionAge?: string;
  notes?: string;
}

export interface BesoinNutritionnel {
  id?: number;
  patientId?: number;
  potassiumMaxMg?: number;
  sodiumMaxMg?: number;
  phosphoreMaxMg?: number;
  proteinesMaxG?: number;
  sucreMaxG?: number;
  caloriesJour?: number;
  poidsKg?: number;
  ageMois?: number;
  traitementTacrolimus?: boolean;
  traitementPrednisone?: boolean;
  raisonCalcul?: string;
  dateDebut?: string;
  dateFin?: string;
  notes?: string;
}

export interface RestrictionAlimentaire {
  id?: number;
  patientId?: number;
  alimentId?: number;
  raison: string;
  valeurBilanDeclencheur?: number;
  creeAutomatiquement?: boolean;
  dateDebut?: string;
  dateFin?: string;
  notes?: string;
}

export interface AlerteNutrition {
  id?: number;
  patientId?: number;
  type?: string;
  message?: string;
  dateAlerte?: string;
  lue?: boolean;
  alimentId?: number;
  restrictionId?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES — Prescription / Patient
// ══════════════════════════════════════════════════════════════════════════════

export interface PatientDTO {
  idPatient: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  dateNaissance?: string;
}

export interface PatientWeight {
  id?: number;
  patientId?: number;
  weightKg?: number;
  heightCm?: number;
  measuredAt?: string;
}

export interface DernierBilan {
  patientId?: number;
  id_patient?: number;
  id_dossier_medical?: number;
  poids?: number;
  taille?: number;
  diagnostic?: string;
  date_dernier_bilan?: string;
  /** Alias utilisé par certains écrans */
  dateBilan?: string | null;
  potassium?: number | null;
  sodium?: number | null;
  phosphore?: number | null;
  creatinine?: number | null;
  dfg?: number | null;
  albumine?: number | null;
  glycemie?: number | null;
  proteinurie?: number | null;
  /** Recommandations / plafonds éventuels (agrégation ou écran combiné) */
  calories?: number | null;
  potassiumMax?: number | null;
  sodiumMax?: number | null;
  phosphoreMax?: number | null;
}

/** Portion dans un repas (backend : portionG) */
export interface AlimentPortionNutrition {
  alimentId?: number;
  nom?: string;
  categorie?: string;
  portionG?: number;
  quantiteG?: number;
  calories?: number;
  potassium?: number;
  sodium?: number;
  phosphore?: number;
  proteines?: number;
  sucre?: number;
}

export interface RepasNutrition {
  type?: string;
  aliments?: AlimentPortionNutrition[];
  totalCalories?: number;
  totalPotassium?: number;
  totalSodium?: number;
  totalPhosphore?: number;
  totalProteines?: number;
  totalSucre?: number;
}

/** Alias noms du collage (portionG / quantiteG gérés côté templates) */
export type AlimentPortionDTO = AlimentPortionNutrition;
export type RepasDTO = RepasNutrition;

/** Un jour = 3 repas + totaux (menus suggérés) */
export interface MenuJournalierDTO {
  numero?: number;
  jour?: string;
  repas?: RepasNutrition[];
  totalCalories?: number;
  totalPotassium?: number;
  totalSodium?: number;
  totalPhosphore?: number;
  totalProteines?: number;
  totalSucre?: number;
  pctCalories?: number;
  pctPotassium?: number;
  pctSodium?: number;
  pctPhosphore?: number;
  pctProteines?: number;
  pctSucre?: number;
}

export interface PrescriptionDTO {
  id?: number;
  patientId?: number;
  medicalRecordId?: number;
  prescriptionDate?: string;
  status?: string;
  /** Réponse prescription-service */
  items?: PrescriptionItemDTO[];
  /** Alias pour compatibilité avec l’UI existante */
  prescriptionItems?: PrescriptionItemDTO[];
}

export interface PrescriptionItemDTO {
  id?: number;
  prescriptionId?: number;
  medicationId?: number;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// LABELS (fusion clés backend + écrans patient/médecin)
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIE_LABELS: Record<string, string> = {
  FRUIT: '🍎 Fruit',
  LEGUME: '🥦 Légume',
  VIANDE: '🥩 Viande',
  PRODUIT_LAITIER: '🧀 Produit laitier',
  CEREALE: '🌾 Céréale',
  AUTRE: '🍽️ Autre',
};

export const RAISON_RESTRICTION_LABELS: Record<string, string> = {
  INTERACTION_MEDICAMENT: 'Interaction médicamenteuse',
  TACROLIMUS: '⚠️ Interaction Tacrolimus',
  CYCLOSPORINE: '⚠️ Interaction Cyclosporine',
  HYPERKALIEMIE: '🧂 Hyperkaliémie',
  HYPERPHOSPHATEMIE: 'Hyperphosphatémie',
  HYPONATREMIE: 'Hyponatrémie',
  HYPERPHOSPHOREMIE: '💊 Hyperphosphorémie',
  HYPERNATREMIE: '🧪 Hypernatrémie',
  INTERACTION_TACROLIMUS: '⚠️ Interaction Tacrolimus',
  INTERACTION_CYCLOSPORINE: '⚠️ Interaction Cyclosporine',
  RESTRICTION_AGE: '👶 Restriction par âge',
  DIABETE: '🍬 Diabète',
  DENUTRITION: 'Dénutrition',
  AUTRE: '📋 Autre',
};

export const TYPE_ALERTE_LABELS: Record<string, string> = {
  INTERACTION_MEDICAMENT: '💊 Interaction médicamenteuse',
  BILAN_ANORMAL: '🔬 Bilan anormal',
  RESTRICTION_VIOLEE: '🚫 Restriction violée',
  HYPERKALIEMIE: 'Hyperkaliémie',
  HYPONATREMIE: 'Hyponatrémie',
  DÉNUTRITION: 'Dénutrition',
  DENUTRITION: 'Dénutrition',
  AUTRE: '🔔 Autre',
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class NutritionService {
  constructor(private http: HttpClient) {}

  // ── Aliments ───────────────────────────────────────────────────────────────
  getAllAliments(): Observable<Aliment[]> {
    return this.http.get<Aliment[]>(`${NUTRITION_URL}/aliments`).pipe(catchError(() => of([])));
  }

  getAlimentById(id: number): Observable<Aliment> {
    return this.http.get<Aliment>(`${NUTRITION_URL}/aliments/${id}`).pipe(catchError(() => of({} as Aliment)));
  }

  createAliment(dto: Aliment): Observable<Aliment> {
    return this.http.post<Aliment>(`${NUTRITION_URL}/aliments`, dto).pipe(catchError(() => of(dto)));
  }

  updateAliment(id: number, dto: Aliment): Observable<Aliment> {
    return this.http.put<Aliment>(`${NUTRITION_URL}/aliments/${id}`, dto).pipe(catchError(() => of(dto)));
  }

  deleteAliment(id: number): Observable<unknown> {
    return this.http.delete(`${NUTRITION_URL}/aliments/${id}`).pipe(catchError(() => of(null)));
  }

  // ── Besoins nutritionnels ─────────────────────────────────────────────────
  getAllBesoins(): Observable<BesoinNutritionnel[]> {
    return this.http.get<BesoinNutritionnel[]>(`${NUTRITION_URL}/besoins-nutritionnels`).pipe(catchError(() => of([])));
  }

  getActiveBesoinForPatient(patientId: number): Observable<BesoinNutritionnel | null> {
    return this.http
      .get<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels/patient/${patientId}/actif`)
      .pipe(catchError(() => of(null)));
  }

  createBesoin(dto: BesoinNutritionnel): Observable<BesoinNutritionnel> {
    return this.http.post<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels`, dto).pipe(catchError(() => of(dto)));
  }

  updateBesoin(id: number, dto: BesoinNutritionnel): Observable<BesoinNutritionnel> {
    return this.http.put<BesoinNutritionnel>(`${NUTRITION_URL}/besoins-nutritionnels/${id}`, dto).pipe(catchError(() => of(dto)));
  }

  deleteBesoin(id: number): Observable<unknown> {
    return this.http.delete(`${NUTRITION_URL}/besoins-nutritionnels/${id}`).pipe(catchError(() => of(null)));
  }

  // ── Restrictions ──────────────────────────────────────────────────────────
  getActiveRestrictionsForPatient(patientId: number): Observable<RestrictionAlimentaire[]> {
    return this.http
      .get<RestrictionAlimentaire[]>(`${NUTRITION_URL}/restrictions-alimentaires/patient/${patientId}/actives`)
      .pipe(catchError(() => of([])));
  }

  createRestriction(dto: RestrictionAlimentaire): Observable<RestrictionAlimentaire> {
    return this.http
      .post<RestrictionAlimentaire>(`${NUTRITION_URL}/restrictions-alimentaires`, dto)
      .pipe(catchError(() => of(dto)));
  }

  updateRestriction(id: number, dto: RestrictionAlimentaire): Observable<RestrictionAlimentaire> {
    return this.http
      .put<RestrictionAlimentaire>(`${NUTRITION_URL}/restrictions-alimentaires/${id}`, dto)
      .pipe(catchError(() => of(dto)));
  }

  deleteRestriction(id: number): Observable<unknown> {
    return this.http.delete(`${NUTRITION_URL}/restrictions-alimentaires/${id}`).pipe(catchError(() => of(null)));
  }

  // ── Alertes (microservice Nutrition 8084) ─────────────────────────────────
  getUnreadAlertesForPatient(patientId: number): Observable<AlerteNutrition[]> {
    return this.http
      .get<AlerteNutrition[]>(`${NUTRITION_URL}/alertes-nutrition/patient/${patientId}/non-lues`)
      .pipe(catchError(() => of([])));
  }

  createAlerte(dto: AlerteNutrition): Observable<AlerteNutrition> {
    return this.http.post<AlerteNutrition>(`${NUTRITION_URL}/alertes-nutrition`, dto).pipe(catchError(() => of(dto)));
  }

  markAlerteAsRead(id: number): Observable<unknown> {
    return this.http.patch(`${NUTRITION_URL}/alertes-nutrition/${id}/marquer-lue`, {}).pipe(catchError(() => of(null)));
  }

  markAllAlertesAsRead(patientId: number): Observable<unknown> {
    return this.http
      .patch(`${NUTRITION_URL}/alertes-nutrition/patient/${patientId}/marquer-toutes-lues`, {})
      .pipe(catchError(() => of(null)));
  }

  // ── Patients (prescription-service) ──────────────────────────────────────
  getAllPatients(): Observable<PatientDTO[]> {
    return this.http.get<PatientDTO[]>(`${PATIENT_URL}/patients`).pipe(catchError(() => of([])));
  }

  // ── Poids + Taille (prescription-service) ────────────────────────────────
  getLatestWeight(patientId: number): Observable<PatientWeight | null> {
    return this.http
      .get<PatientWeight>(`${PRESCRIPTION_URL}/patient-weight/patient/${patientId}/latest`)
      .pipe(catchError(() => of(null)));
  }

  // ── Dernier bilan laboratoire ─────────────────────────────────────────────
  getDernierBilan(patientId: number): Observable<DernierBilan | null> {
    return this.http
      .get<DernierBilan>(`${PRESCRIPTION_URL}/bilan/patient/${patientId}/dernier`)
      .pipe(catchError(() => of(null)));
  }

  getActivePrescriptions(patientId: number): Observable<PrescriptionDTO[]> {
    return this.http
      .get<PrescriptionDTO[]>(`${PRESCRIPTION_URL}/prescriptions/patient/${patientId}/active`)
      .pipe(catchError(() => of([])));
  }

  getPrescriptionItems(prescriptionId: number): Observable<PrescriptionItemDTO[]> {
    return this.http
      .get<PrescriptionItemDTO[]>(`${PRESCRIPTION_URL}/prescription-items/prescription/${prescriptionId}`)
      .pipe(catchError(() => of([])));
  }

  /**
   * 7 jours × 3 variantes — clés {@code LUNDI}…{@code DIMANCHE}, valeurs = 3 menus.
   */
  getMenusSemaine(patientId: number): Observable<Record<string, MenuJournalierDTO[]>> {
    return this.http
      .get<Record<string, MenuJournalierDTO[]>>(`${NUTRITION_URL}/nutrition/menus-semaine/${patientId}`)
      .pipe(catchError(() => of({})));
  }
}

/** Alias pour les écrans qui importaient encore {@code NutritionMedecinService} */
export { NutritionService as NutritionMedecinService };
