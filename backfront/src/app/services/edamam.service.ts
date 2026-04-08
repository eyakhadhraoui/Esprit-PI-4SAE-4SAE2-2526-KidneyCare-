import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EdamamNutrients {
  caloriesKcal?: number;
  proteinesG?: number;
  sucreG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  phosphoreMg?: number;
}

@Injectable({ providedIn: 'root' })
export class EdamamService {
  constructor(private http: HttpClient) {}

  /** Auto-remplissage nutritionnel ; si pas d’API backend, retour vide. */
  searchNutrients(foodName: string): Observable<EdamamNutrients> {
    const q = (foodName || '').trim();
    if (!q) return of({});
    return this.http.get<EdamamNutrients>('/api/nutrition/edamam', { params: { q } }).pipe(
      catchError(() => of({}))
    );
  }
}
