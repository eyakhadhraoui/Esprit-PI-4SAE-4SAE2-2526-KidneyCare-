import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { StatsComponent } from './stats';
import { StatsService } from '../services/stats';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  beforeEach(async () => {
    const statsStub = {
      getDashboardStats: () =>
        of({
          totalHospitalizations: 0,
          criticalPatients: 0,
          stablePatients: 0,
          averageStayDuration: 0,
          occupancyRate: 0,
          admissionsByMonth: {},
          dailyEvolution: 0,
        }),
      getSummary: () => of(''),
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StatsComponent],
      providers: [{ provide: StatsService, useValue: statsStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
