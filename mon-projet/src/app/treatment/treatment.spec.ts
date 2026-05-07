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

  const medicationMock = { getAllMedications: () => of([]) };
  const prescriptionMock = {
    getAll: () => of([]),
    getAllItems: () => of([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentComponent, HttpClientTestingModule],
      providers: [
        { provide: ConsultationService, useValue: { getPatients: () => of([]) } },
        { provide: MedicationService, useValue: medicationMock },
        { provide: PrescriptionService, useValue: prescriptionMock },
        { provide: AuthService, useValue: { isLoggedIn: () => false, logout: () => {} } },
      ],
    })
      .overrideProvider(MedicationService, { useValue: medicationMock })
      .overrideProvider(PrescriptionService, { useValue: prescriptionMock })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', async () => {
    fixture = TestBed.createComponent(TreatmentComponent);
    fixture.detectChanges();

    // Toute requête HTTP vers prescription (si les services root n’étaient pas mockés) doit être flushée,
    // sinon whenStable() ne se termine jamais (timeout 5s sur Jenkins / Vitest).
    httpMock.match((req) => req.url.includes('/prescription/api')).forEach((req) => req.flush([]));

    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
