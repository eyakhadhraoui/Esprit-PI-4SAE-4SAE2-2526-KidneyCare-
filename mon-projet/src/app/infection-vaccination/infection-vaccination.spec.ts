import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InfectionVaccinationComponent } from './infection-vaccination';
import { InfectionVaccinationService } from '../services/infection-vaccination.service';
import { AuthRoleService } from '../services/auth-role.service';

describe('InfectionVaccinationComponent', () => {
  let fixture: ComponentFixture<InfectionVaccinationComponent>;
  let component: InfectionVaccinationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfectionVaccinationComponent],
      providers: [
        {
          provide: InfectionVaccinationService,
          useValue: {
            getAllInfections: () => of([]),
            getAllVaccinations: () => of([]),
          },
        },
        {
          provide: AuthRoleService,
          useValue: {
            isMedecin: () => false,
            isPatient: () => false,
            getUsername: () => '',
            getPatientUsers: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfectionVaccinationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
