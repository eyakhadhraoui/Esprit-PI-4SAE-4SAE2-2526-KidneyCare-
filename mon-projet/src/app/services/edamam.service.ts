import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface EdamamNutrients {
  caloriesKcal?: number;
  proteinesG?: number;
  sucreG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  phosphoreMg?: number;
}

// Edamam Nutrition Analysis API credentials
const EDAMAM_APP_ID  = '6ff3c3c7';
const EDAMAM_APP_KEY = 'f41670303f26ee11d1e0d18a15ecd08c';
const EDAMAM_API_URL = 'https://api.edamam.com/api/nutrition-data';

@Injectable({ providedIn: 'root' })
export class EdamamService {
  constructor(private http: HttpClient) {}

  searchNutrients(foodName: string): Observable<EdamamNutrients> {
    const q = (foodName || '').trim();
    if (!q) return of({} as EdamamNutrients);

    // Edamam attend un ingrédient quantifié (ex: "100g pomme", "1 apple")
    const ingr = q.match(/\d/) ? q : `100g ${q}`;

    return this.http.get<any>(EDAMAM_API_URL, {
      params: {
        app_id:  EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        ingr,
      }
    }).pipe(
      map(res => this.mapResponse(res)),
      catchError(() => of({} as EdamamNutrients))
    );
  }

  private mapResponse(res: any): EdamamNutrients {
    if (!res) return {};
    const tn = res.totalNutrients || {};
    return {
      caloriesKcal: res.calories ?? undefined,
      proteinesG:   tn['PROCNT']?.quantity ?? undefined,
      sucreG:       tn['SUGAR']?.quantity  ?? undefined,
      sodiumMg:     tn['NA']?.quantity     ?? undefined,
      potassiumMg:  tn['K']?.quantity      ?? undefined,
      phosphoreMg:  tn['P']?.quantity      ?? undefined,
    };
  }

  searchSuggestions(query: string): Observable<string[]> {
    const q = (query || '').trim();
    if (!q) return of([] as string[]);
    return this.http.get<string[]>('/api/nutrition/suggestions', { params: { q } }).pipe(
      catchError(() => of([] as string[]))
    );
  }
}
