import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { DossiersListComponent } from './dossiers-list-component';

vi.setConfig({ hookTimeout: 30000, testTimeout: 30000 });

describe('DossiersListComponent', () => {
  let component: DossiersListComponent;
  let fixture: ComponentFixture<DossiersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DossiersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossiersListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
