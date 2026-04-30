import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';

import { CalendrierPatientComponent } from './calendrier-patient';
import { CalendrierService, CalendrierEvent } from '../services/calendrier.service';

describe('CalendrierPatientComponent', () => {
  let fixture: ComponentFixture<CalendrierPatientComponent>;
  let component: CalendrierPatientComponent;
  let loadCalls = 0;

  const sampleEvents: CalendrierEvent[] = [
    {
      date: '2026-04-15',
      type: 'RAPPORT_BILAN',
      titre: 'Rapport médical — demande #3',
      id: 100,
      idDossierMedical: 2,
      description: 'Commentaire court',
    },
    {
      date: '2026-04-15',
      type: 'TEST_REALISE',
      titre: 'Examen réalisé',
      id: 101,
      idDossierMedical: 2,
    },
    {
      date: '2026-04-16',
      type: 'SUIVI',
      titre: 'Suivi',
      id: 102,
      idDossierMedical: 2,
    },
  ];

  beforeEach(async () => {
    loadCalls = 0;
    const calendrierStub = {
      getMesEvenements() {
        loadCalls++;
        return of(sampleEvents);
      },
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CalendrierPatientComponent],
      providers: [{ provide: CalendrierService, useValue: calendrierStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendrierPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('devrait créer le composant et charger les événements', () => {
    expect(component).toBeTruthy();
    expect(loadCalls).toBe(1);
    expect(component.events.length).toBe(3);
    expect(component.loading).toBe(false);
    expect(component.error).toBe('');
  });

  it('countRapports devrait compter les RAPPORT_BILAN', () => {
    expect(component.countRapports).toBe(1);
  });

  it('getTypeLabel et getTypeIcon pour RAPPORT_BILAN', () => {
    expect(component.getTypeLabel('RAPPORT_BILAN')).toBe('Medical report');
    expect(component.getTypeIcon('RAPPORT_BILAN')).toBe('📄');
  });

  it('filterTypeLabel pour RAPPORT_BILAN', () => {
    component.setFilter('RAPPORT_BILAN');
    expect(component.filterTypeLabel()).toBe('Medical reports');
  });

  it('groupEventsByDate devrait indexer par jour', () => {
    expect(component.eventsByDate['2026-04-15']?.length).toBe(2);
    expect(component.eventsByDate['2026-04-16']?.length).toBe(1);
  });

});

describe('CalendrierPatientComponent (erreur chargement)', () => {
  it('error devrait afficher le message en cas d’échec du service', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CalendrierPatientComponent],
      providers: [
        {
          provide: CalendrierService,
          useValue: {
            getMesEvenements: () => throwError(() => ({ message: 'réseau indisponible' })),
          },
        },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(CalendrierPatientComponent);
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.loading).toBe(false);
    expect(f.componentInstance.error).toContain('réseau');
  });
});
