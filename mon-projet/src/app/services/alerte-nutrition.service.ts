import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private readonly BASE = 'http://localhost:8088/api/alertes-nutrition';

  constructor(private http: HttpClient) {}

  // POST /api/alertes-nutrition
  createAlerte(dto: AlerteNutritionDTO): Observable<AlerteNutritionDTO> {
    return this.http.post<AlerteNutritionDTO>(this.BASE, dto);
  }

  // GET /api/alertes-nutrition
  getAllAlertes(): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(this.BASE);
  }

  // GET /api/alertes-nutrition/:id
  getAlerteById(id: number): Observable<AlerteNutritionDTO> {
    return this.http.get<AlerteNutritionDTO>(`${this.BASE}/${id}`);
  }

  // GET /api/alertes-nutrition/patient/:patientId
  getAlertesForPatient(patientId: number): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(`${this.BASE}/patient/${patientId}`);
  }

  // GET /api/alertes-nutrition/patient/:patientId/non-lues
  getUnreadAlertesForPatient(patientId: number): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(`${this.BASE}/patient/${patientId}/non-lues`);
  }

  // GET /api/alertes-nutrition/patient/:patientId/count-non-lues
  countUnreadAlertes(patientId: number): Observable<number> {
    return this.http.get<number>(`${this.BASE}/patient/${patientId}/count-non-lues`);
  }

  // GET /api/alertes-nutrition/recentes?hours=24
  getRecentAlertes(hours: number = 24): Observable<AlerteNutritionDTO[]> {
    return this.http.get<AlerteNutritionDTO[]>(`${this.BASE}/recentes`, {
      params: { hours: hours.toString() }
    });
  }

  // PATCH /api/alertes-nutrition/:id/marquer-lue
  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/${id}/marquer-lue`, {});
  }

  // PATCH /api/alertes-nutrition/patient/:patientId/marquer-toutes-lues
  markAllAsReadForPatient(patientId: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/patient/${patientId}/marquer-toutes-lues`, {});
  }
}