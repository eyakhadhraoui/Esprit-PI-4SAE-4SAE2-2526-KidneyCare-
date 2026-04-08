import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * API greffon — backend : {@code http://localhost:8095/api/...}
 * Dev : {@code proxy.conf.json} réécrit {@code /graft-api} → cible sans préfixe, donc {@code /graft-api/api/...} → 8095 {@code /api/...}
 */
const BASE = '/graft-api/api';

export interface GraftFunctionEntry {
  id: number;
  patientId: string;
  measurementDate: string;
  creatinine: number | null;
  eGFR: number | null;
  urineOutput: number | null;
  tacrolimusLevel: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  weight: number | null;
  temperature: number | null;
  collectionType: string;
  notes?: string;
  createdAt?: string;
}

export interface ReferenceValue {
  id: number;
  patientId: string;
  establishedDate: string;
  baselineCreatinine: number | null;
  baselineEGFR: number | null;
  targetTacrolimusMin: number | null;
  targetTacrolimusMax: number | null;
  targetSystolicBP: number | null;
  targetDiastolicBP: number | null;
  setBy?: string;
  notes?: string;
}

export interface AlertThreshold {
  id: number;
  patientId: string;
  creatinineRisePercent: number | null;
  eGFRDropPercent: number | null;
  creatinineAbsoluteMax: number | null;
  eGFRCriticalMin: number | null;
  tacrolimusMin: number | null;
  tacrolimusMax: number | null;
  acuteDeclineLevel: string;
  chronicDeclineLevel: string;
  configuredBy?: string;
  updatedAt?: string;
}

export interface GraftSurvivalScore {
  id: number;
  patientId: string;
  calculatedAt?: string;
  survivalProbability1Year: number | null;
  survivalProbability3Year: number | null;
  survivalProbability5Year: number | null;
  riskLevel: string;
  eGFRSlope: number | null;
  creatinineSlope: number | null;
  rejectionEpisodeCount: number | null;
  hasChronicDecline: boolean;
  hasAcuteDecline: boolean;
  tacrolimusVariability: number | null;
  calculationModel: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class GraftFunctionService {
  constructor(private http: HttpClient) {}

  getAllEntries(): Observable<GraftFunctionEntry[]> {
    return this.http.get<GraftFunctionEntry[]>(`${BASE}/graft-entries`);
  }

  getEntriesByPatient(patientId: string): Observable<GraftFunctionEntry[]> {
    return this.http.get<GraftFunctionEntry[]>(`${BASE}/graft-entries/patient/${encodeURIComponent(patientId)}`);
  }

  createEntry(body: Partial<GraftFunctionEntry>): Observable<GraftFunctionEntry> {
    return this.http.post<GraftFunctionEntry>(`${BASE}/graft-entries`, body);
  }

  updateEntry(id: number, body: Partial<GraftFunctionEntry>): Observable<GraftFunctionEntry> {
    return this.http.put<GraftFunctionEntry>(`${BASE}/graft-entries/${id}`, body);
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/graft-entries/${id}`);
  }

  getAllRefs(): Observable<ReferenceValue[]> {
    return this.http.get<ReferenceValue[]>(`${BASE}/reference-values`);
  }

  getRefByPatient(patientId: string): Observable<ReferenceValue> {
    return this.http.get<ReferenceValue>(`${BASE}/reference-values/patient/${encodeURIComponent(patientId)}`);
  }

  createRef(body: Partial<ReferenceValue>): Observable<ReferenceValue> {
    return this.http.post<ReferenceValue>(`${BASE}/reference-values`, body);
  }

  updateRef(id: number, body: Partial<ReferenceValue>): Observable<ReferenceValue> {
    return this.http.put<ReferenceValue>(`${BASE}/reference-values/${id}`, body);
  }

  deleteRef(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/reference-values/${id}`);
  }

  getAllThresholds(): Observable<AlertThreshold[]> {
    return this.http.get<AlertThreshold[]>(`${BASE}/alert-thresholds`);
  }

  getThresholdByPatient(patientId: string): Observable<AlertThreshold> {
    return this.http.get<AlertThreshold>(`${BASE}/alert-thresholds/patient/${encodeURIComponent(patientId)}`);
  }

  createThreshold(body: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.post<AlertThreshold>(`${BASE}/alert-thresholds`, body);
  }

  updateThreshold(id: number, body: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.put<AlertThreshold>(`${BASE}/alert-thresholds/${id}`, body);
  }

  deleteThreshold(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/alert-thresholds/${id}`);
  }

  getAllScores(): Observable<GraftSurvivalScore[]> {
    return this.http.get<GraftSurvivalScore[]>(`${BASE}/survival-scores`);
  }

  getScoresByPatient(patientId: string): Observable<GraftSurvivalScore[]> {
    return this.http.get<GraftSurvivalScore[]>(`${BASE}/survival-scores/patient/${encodeURIComponent(patientId)}`);
  }

  getLatestScore(patientId: string): Observable<GraftSurvivalScore> {
    return this.http.get<GraftSurvivalScore>(`${BASE}/survival-scores/patient/${encodeURIComponent(patientId)}/latest`);
  }

  createScore(body: Partial<GraftSurvivalScore>): Observable<GraftSurvivalScore> {
    return this.http.post<GraftSurvivalScore>(`${BASE}/survival-scores`, body);
  }

  updateScore(id: number, body: Partial<GraftSurvivalScore>): Observable<GraftSurvivalScore> {
    return this.http.put<GraftSurvivalScore>(`${BASE}/survival-scores/${id}`, body);
  }

  deleteScore(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/survival-scores/${id}`);
  }
}
