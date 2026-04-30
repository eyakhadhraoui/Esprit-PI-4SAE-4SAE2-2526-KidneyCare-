import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { CalendrierService, CalendrierEvent } from './calendrier.service';

describe('CalendrierService', () => {
  let service: CalendrierService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalendrierService],
    });
    service = TestBed.inject(CalendrierService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getMesEvenements devrait GET /api/calendrier/mes-evenements et mapper les types connus', () => {
    const raw = [
      {
        date: '2026-04-10',
        type: 'RAPPORT_BILAN',
        titre: 'Rapport médical',
        id: 42,
        idDossierMedical: 7,
        description: 'Synthèse',
      },
      {
        date: '2026-04-11',
        type: 'TEST_REALISE',
        titre: 'Examen',
        id: 43,
        idDossierMedical: 7,
      },
    ];

    let result: CalendrierEvent[] | undefined;
    service.getMesEvenements().subscribe((list) => (result = list));

    const req = httpMock.expectOne('/api/calendrier/mes-evenements');
    expect(req.request.method).toBe('GET');
    req.flush(raw);

    expect(result!.length).toBe(2);
    expect(result![0].type).toBe('RAPPORT_BILAN');
    expect(result![0].titre).toBe('Rapport médical');
    expect(result![1].type).toBe('TEST_REALISE');
  });

  it('mapEvent : type inconnu devrait devenir SUIVI', () => {
    let result: CalendrierEvent[] | undefined;
    service.getMesEvenements().subscribe((list) => (result = list));

    httpMock
      .expectOne('/api/calendrier/mes-evenements')
      .flush([{ date: '2026-01-01', type: 'INCONNU', titre: 'X', id: 1, idDossierMedical: 2 }]);

    expect(result![0].type).toBe('SUIVI');
  });

  it('réponse non tableau devrait produire une liste vide', () => {
    let result: CalendrierEvent[] | undefined;
    service.getMesEvenements().subscribe((list) => (result = list));

    httpMock.expectOne('/api/calendrier/mes-evenements').flush(null as unknown as null);

    expect(result).toEqual([]);
  });

  it('erreur 401 devrait être propagée avec message session', () => {
    let errOut: unknown;
    service.getMesEvenements().subscribe({
      next: () => {
        errOut = new Error('next inattendu');
      },
      error: (e) => {
        errOut = e;
      },
    });

    httpMock.expectOne('/api/calendrier/mes-evenements').flush(
      { message: 'unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(errOut).toBeTruthy();
    expect((errOut as { message?: string }).message).toContain('Session');
  });
});
