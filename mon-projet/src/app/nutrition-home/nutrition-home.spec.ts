import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NutritionHomeComponent } from './nutrition-home';
import { NutritionService } from '../services/nutrition';

describe('NutritionHomeComponent', () => {
  let fixture: ComponentFixture<NutritionHomeComponent>;
  let component: NutritionHomeComponent;

  beforeEach(async () => {
    const nutritionStub = {
      getAllAliments: () => of([]),
      getActiveBesoinForPatient: () => of(null),
      getActiveRestrictionsForPatient: () => of([]),
      getUnreadAlertesForPatient: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [NutritionHomeComponent],
      providers: [{ provide: NutritionService, useValue: nutritionStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(NutritionHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
