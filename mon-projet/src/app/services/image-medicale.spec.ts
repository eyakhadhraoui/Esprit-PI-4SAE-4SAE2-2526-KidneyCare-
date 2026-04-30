import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ImageMedicaleService } from './image-medicale';

describe('ImageMedicaleService', () => {
  let service: ImageMedicaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ImageMedicaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
