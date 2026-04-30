import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface MedicationDTO {
  id?: number;
  name: string;
  dosage: string;
  unit: string;
  form: string;
  activeIngredient: string;
  category: string;
  requiresMonitoring: boolean;
  contraindications?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicationService {

  /** Microservice prescription-Service (port 8086). Proxy : /prescription → 8086. */
  private apiUrl = '/prescription/api/medications';

  constructor(private http: HttpClient) {}

  createMedication(medication: MedicationDTO): Observable<MedicationDTO> {
    return this.http.post<MedicationDTO>(this.apiUrl, medication, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(catchError(this.handleError));
  }

  getAllMedications(): Observable<MedicationDTO[]> {
    console.log('📥 Récupération de tous les médicaments...');
    return this.http.get<MedicationDTO[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getMedicationById(id: number): Observable<MedicationDTO> {
    return this.http.get<MedicationDTO>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  searchByName(name: string): Observable<MedicationDTO[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<MedicationDTO[]>(`${this.apiUrl}/search/name`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getByCategory(category: string): Observable<MedicationDTO[]> {
    return this.http.get<MedicationDTO[]>(`${this.apiUrl}/category/${category}`).pipe(
      catchError(this.handleError)
    );
  }

  getMedicationsRequiringMonitoring(): Observable<MedicationDTO[]> {
    return this.http.get<MedicationDTO[]>(`${this.apiUrl}/monitoring`).pipe(
      catchError(this.handleError)
    );
  }

  searchByActiveIngredient(activeIngredient: string): Observable<MedicationDTO[]> {
    const params = new HttpParams().set('activeIngredient', activeIngredient);
    return this.http.get<MedicationDTO[]>(`${this.apiUrl}/search/active-ingredient`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  updateMedication(id: number, medication: MedicationDTO): Observable<MedicationDTO> {
    return this.http.put<MedicationDTO>(`${this.apiUrl}/${id}`, medication, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(catchError(this.handleError));
  }

  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    if (error.status === 0) {
      errorMessage = '❌ Impossible de contacter le serveur backend';
    } else if (error.status === 404) {
      errorMessage = '❌ Médicament non trouvé';
    } else if (error.status === 409) {
      errorMessage = '❌ Un médicament avec ce nom existe déjà';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || '❌ Données invalides';
    } else if (error.status === 500) {
      errorMessage = '❌ Erreur serveur interne';
    }
    return throwError(() => new Error(errorMessage));
  }
}