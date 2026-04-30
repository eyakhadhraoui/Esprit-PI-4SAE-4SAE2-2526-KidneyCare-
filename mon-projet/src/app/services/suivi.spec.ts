import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SuiviService } from './suivi';

describe('SuiviService', () => {
  let service: SuiviService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SuiviService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
