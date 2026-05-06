import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { TreatmentComponent } from './treatment';
import { MedicationService } from '../services/medication';
import { PrescriptionService } from '../services/prescription.service';
import { ConsultationService } from '../services/consultation.service';
import { AuthService } from '../auth/auth.service';

describe('TreatmentComponent', () => {
  let fixture: ComponentFixture<TreatmentComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentComponent, HttpClientTestingModule],
      providers: [
        { provide: ConsultationService, useValue: { getPatients: () => of([]) } },
        { provide: MedicationService, useValue: { getAllMedications: () => of([]) } },
        {
          provide: PrescriptionService,
          useValue: {
            getAll: () => of([]),
            getAllItems: () => of([]),
          },
        },
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', async () => {
    fixture = TestBed.createComponent(TreatmentComponent);
    fixture.detectChanges();
    httpMock
      .expectOne((req) => req.url.includes('/prescription/api/medication-history'))
      .flush([]);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
