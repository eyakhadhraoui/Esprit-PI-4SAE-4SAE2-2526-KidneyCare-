import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Users } from './users';
import { ConfirmService } from '../services/confirm.service';
import { ConsultationService } from '../services/consultation.service';
import { PatientService } from '../services/patient.service';
import { DossierService } from '../services/dossier';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        { provide: ConfirmService, useValue: {} },
        { provide: ConsultationService, useValue: { getPatients: () => of([]) } },
        { provide: PatientService, useValue: { getAll: () => of([]) } },
        { provide: DossierService, useValue: { getAllDossiers: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
