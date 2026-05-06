import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Même hôte que le greffon (8095) — préfixe proxy {@code /graft-api} */
const BASE = '/graft-api';

export interface Infection {
  id: number;
  type: string;
  detectionDate: string;
  severity: string;
  patientName: string;
}

export interface Vaccination {
  id: number;
  name: string;
  vaccination_date: string;
  patientName: string;
  booster_date: string;
  infectionId: number | null;
  taken: boolean;
  booster_taken: boolean;
}

@Injectable({ providedIn: 'root' })
export class InfectionVaccinationService {
  constructor(private http: HttpClient) {}

  getAllInfections(): Observable<Infection[]> {
    return this.http.get<Infection[]>(`${BASE}/infections`);
  }

  getInfection(id: number): Observable<Infection> {
    return this.http.get<Infection>(`${BASE}/infections/${id}`);
  }

  createInfection(body: Omit<Infection, 'id'>): Observable<Infection> {
    return this.http.post<Infection>(`${BASE}/infections`, body);
  }

  updateInfection(id: number, body: Omit<Infection, 'id'>): Observable<Infection> {
    return this.http.put<Infection>(`${BASE}/infections/${id}`, body);
  }

  deleteInfection(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/infections/${id}`);
  }

  getAllVaccinations(): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${BASE}/vaccinations`);
  }

  getVaccination(id: number): Observable<Vaccination> {
    return this.http.get<Vaccination>(`${BASE}/vaccinations/${id}`);
  }

  createVaccination(body: Omit<Vaccination, 'id'>): Observable<Vaccination> {
    return this.http.post<Vaccination>(`${BASE}/vaccinations`, body);
  }

  deleteVaccination(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/vaccinations/${id}`);
  }

  getVaccinationsByInfection(infectionId: number): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${BASE}/vaccinations/infection/${infectionId}`);
  }
}
