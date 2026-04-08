import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Microservice **Nutrition_Service** (port 8084) — `AlerteNutritionController` sous `/api/alertes-nutrition`.
 * Si vous routez via une **gateway** (ex. :8080), remplacez l’hôte par l’URL de la gateway.
 */
const BASE = 'http://localhost:8084/api/alertes-nutrition';

export interface AlerteNutritionDTO {
  id?: number;
  patientId: number;
  type: string;
  message: string;
  dateAlerte?: string;
  lue?: boolean;
  alimentId?: number;
  restrictionId?: number;
  detailsTechniques?: string;
}

@Injectable({ providedIn: 'root' })
export class AlerteNutritionService {
  constructor(private http: HttpClient) {}

  createAlerte(dto: AlerteNutritionDTO): Observable<AlerteNutritionDTO> {
    return this.http.post<AlerteNutritionDTO>(BASE, dto);
  }

  getAllAlertes(): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(BASE);
  }

  getAlerteById(id: number): Observable<AlerteNutritionDTO> {
    return this.http.get<AlerteNutritionDTO>(`${BASE}/${id}`);
  }

  getAlertesForPatient(patientId: number): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(`${BASE}/patient/${patientId}`);
  }

  getUnreadAlertesForPatient(patientId: number): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(`${BASE}/patient/${patientId}/non-lues`);
  }

  countUnreadAlertes(patientId: number): Observable<number> {
    return this.http.get<number>(`${BASE}/patient/${patientId}/count-non-lues`);
  }

  getRecentAlertes(hours: number = 24): Observable<AlerteNutritionDTO[]> {
    const params = new HttpParams().set('hours', String(hours));
    return this.http.get<AlerteNutritionDTO[]>(`${BASE}/recentes`, { params });
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${BASE}/${id}/marquer-lue`, {});
  }

  markAllAsReadForPatient(patientId: number): Observable<void> {
    return this.http.patch<void>(`${BASE}/patient/${patientId}/marquer-toutes-lues`, {});
  }
}
