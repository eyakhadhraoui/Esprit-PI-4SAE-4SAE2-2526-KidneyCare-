import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';
import { PatientService, Patient } from './patient.service';

export interface PatientUser {
  username: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  constructor(
    private auth: AuthService,
    private patients: PatientService
  ) {}

  isMedecin(): boolean {
    return this.auth.hasRole([KEYCLOAK_ROLES.medecin]);
  }

  isPatient(): boolean {
    return this.auth.hasRole([KEYCLOAK_ROLES.patient]);
  }

  getUsername(): string | null {
    return this.auth.getProfile()?.username ?? null;
  }

  /** Libellé affiché côté patient (bannière). */
  getPatientIdentifier(): string {
    const p = this.auth.getProfile();
    const name = (p?.name as string) || '';
    const email = (p?.email as string) || '';
    return name || email || p?.username || '';
  }

  /** Liste des patients (médecin) pour les sélecteurs. */
  getPatientUsers(): Observable<PatientUser[]> {
    return this.patients.getAll().pipe(
      map((list: Patient[]) =>
        (list || []).map((p) => ({
          username: p.username,
          displayName:
            [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.username,
        }))
      ),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          return of([]);
        }
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    void this.auth.logout();
  }
}
