import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ModuleLaboService, PrescriptionBilanDTO, ResultatLabtestDTO } from './module-labo.service';

describe('ModuleLaboService', () => {
  let service: ModuleLaboService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ModuleLaboService],
    });
    service = TestBed.inject(ModuleLaboService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getPrescriptionsByMedecin devrait appeler GET prescriptions-bilan/medecin/:id', () => {
    const mock: PrescriptionBilanDTO[] = [
      {
        id: 10,
        dossierId: 3,
        medecinId: 99,
        datePrescription: '2026-04-01T10:00:00',
        examens: ['2160-0'],
        statut: 'PARTIEL',
      },
    ];

    let out: PrescriptionBilanDTO[] | undefined;
    service.getPrescriptionsByMedecin(99).subscribe((list) => (out = list));

    const req = httpMock.expectOne('/api/prescriptions-bilan/medecin/99');
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(out!.length).toBe(1);
    expect(out![0].id).toBe(10);
    expect(out![0].statut).toBe('PARTIEL');
  });

  it('getResultatsByPrescription devrait appeler GET resultats-labtest/prescription/:id', () => {
    const mock: ResultatLabtestDTO[] = [
      {
        id: 1,
        prescriptionId: 5,
        dossierId: 3,
        codeLoinc: '2160-0',
        libelleExamen: 'Créatinine',
        valeur: 45,
        unite: 'µmol/L',
        source: 'SAISIE_MANUELLE',
      },
    ];

    let out: ResultatLabtestDTO[] | undefined;
    service.getResultatsByPrescription(5).subscribe((list) => (out = list));

    const req = httpMock.expectOne('/api/resultats-labtest/prescription/5');
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(out![0].source).toBe('SAISIE_MANUELLE');
    expect(out![0].valeur).toBe(45);
  });

  it('getPdfCompletPrescription devrait demander le PDF en blob', () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });

    let received: Blob | undefined;
    service.getPdfCompletPrescription(12).subscribe((b) => (received = b));

    const req = httpMock.expectOne('/api/prescriptions-bilan/12/pdf-complet');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);

    expect(received instanceof Blob).toBe(true);
  });
});
