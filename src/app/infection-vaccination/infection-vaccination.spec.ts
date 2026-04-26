import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InfectionVaccinationComponent } from './infection-vaccination';
import { InfectionVaccinationService, Infection, Vaccination } from '../services/infection-vaccination';
import { AuthRoleService } from '../services/auth-role.service';

describe('InfectionVaccinationComponent', () => {
  let component: InfectionVaccinationComponent;
  let fixture: ComponentFixture<InfectionVaccinationComponent>;
  let mockSvc: Partial<InfectionVaccinationService>;
  let mockAuth: Partial<AuthRoleService>;

  const mockInfections: Infection[] = [
    { id: 1, type: 'UTI', detectionDate: '2024-12-01', severity: 'Moderate', patientName: 'p1' },
    { id: 2, type: 'UTI', detectionDate: '2025-01-10', severity: 'Severe',   patientName: 'p1' },
    { id: 3, type: 'CMV', detectionDate: '2024-11-15', severity: 'Mild',     patientName: 'p1' }
  ];

  const mockVaccinations: Vaccination[] = [
    {
      id: 1,
      name: 'Influenza',
      vaccination_date: '2025-01-01',
      patientName: 'p1',
      booster_date: '',
      booster_taken: false,
      infectionId: null,
      taken: true
    },
    {
      id: 2,
      name: 'MMR',
      vaccination_date: '2024-10-01',
      patientName: 'p1',
      booster_date: '',
      booster_taken: false,
      infectionId: null,
      taken: false
    }
  ];

  beforeEach(async () => {
    mockSvc = {
      getAllInfections:          () => of(mockInfections),
      getAllVaccinations:        () => of(mockVaccinations),
      createInfection:          () => of({} as Infection),
      updateInfection:          () => of({} as Infection),
      deleteInfection:          () => of(),
      createVaccination:        () => of({} as Vaccination),
      deleteVaccination:        () => of(),
      getVaccinationsByInfection: () => of([])
    };

    mockAuth = {
      isMedecin:      () => false,
      isPatient:      () => true,
      getUsername:    () => 'p1',
      getPatientUsers: () => of([]),
      logout:         () => {}
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        InfectionVaccinationComponent
      ],
      providers: [
        { provide: InfectionVaccinationService, useValue: mockSvc },
        { provide: AuthRoleService,             useValue: mockAuth }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(InfectionVaccinationComponent);
    component = fixture.componentInstance;

    component.infections   = mockInfections;
    component.vaccinations = mockVaccinations;

    component.newVaccination = {
      name: '',
      vaccination_date: '',
      patientName: 'p1',
      booster_date: '',
      infectionId: null,
      taken: false
    };

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  // ----- Recurrence prediction -----
  describe('Recurrence prediction', () => {
    it('should compute average days between episodes', () => {
      const uti = mockInfections.filter(i => i.type === 'UTI');
      const avg = component.getAvgDaysBetween(uti);
      expect(avg).toBe(40);
    });

    it('should calculate recurrence chance with escalation', () => {
      const rec = {
        type: 'UTI',
        count: 2,
        infections: mockInfections.filter(i => i.type === 'UTI')
      };
      const pred = component.getPrediction(rec as any);
      expect(pred.chance).toBeGreaterThan(40);
      expect(pred.label).toBeTruthy();
    });
  });

  // ----- Vaccination interaction -----
  describe('Vaccination interaction warnings', () => {
    beforeEach(() => {
      component.vaccinations = [
        {
          id: 99,
          name: 'MMR',
          vaccination_date: '2025-01-01',
          patientName: 'p1',
          booster_date: '',
          booster_taken: false,
          infectionId: null,
          taken: true
        }
      ];

      component.newVaccination.name             = 'Varicella';
      component.newVaccination.vaccination_date = '2025-01-15';
    });

    it('should detect conflict (<28 days)', () => {
      expect(component.vacInteractionWarnings.length).toBeGreaterThan(0);
    });
  });

  // ----- Contraindications -----
  describe('Contraindication warnings', () => {
    beforeEach(() => {
      component.newVaccination.name        = 'MMR';
      component.newVaccination.infectionId = 1;
    });

    it('should warn for severe infection', () => {
      component.infections = [
        { ...mockInfections[0], severity: 'Severe' }
      ];
      expect(component.vacContraindicationWarnings.length).toBeGreaterThan(0);
    });
  });

  // ----- Efficacy -----
  describe('Efficacy percentage', () => {
    it('should return 100%', () => {
      const vac: Vaccination = {
        id: 10,
        name: 'Hepatitis B',
        vaccination_date: new Date().toISOString().split('T')[0],
        patientName: 'p1',
        booster_date: '',
        booster_taken: false,
        infectionId: null,
        taken: true
      };
      expect(component.getEfficacyPercent(vac)).toBe(100);
    });
  });

  // ----- Patient filtering -----
  describe('effectiveInfectionPatientFilter', () => {
    it('returns username for patient', () => {
      expect(component.effectiveInfectionPatientFilter).toBe('p1');
    });

    it('returns empty string for medecin with no filter selected', () => {
      (mockAuth.isPatient as any) = () => false;
      (mockAuth.isMedecin as any) = () => true;
      component.infectionPatientFilter = '';
      expect(component.effectiveInfectionPatientFilter).toBe('');
    });
  });
});