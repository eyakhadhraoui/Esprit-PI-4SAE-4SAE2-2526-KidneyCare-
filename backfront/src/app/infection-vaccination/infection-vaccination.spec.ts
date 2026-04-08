import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfectionVaccination } from './infection-vaccination';

describe('InfectionVaccination', () => {
  let component: InfectionVaccination;
  let fixture: ComponentFixture<InfectionVaccination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InfectionVaccination]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfectionVaccination);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
