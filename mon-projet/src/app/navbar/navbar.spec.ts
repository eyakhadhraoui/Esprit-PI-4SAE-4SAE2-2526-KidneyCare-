import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subject } from 'rxjs';

import { Navbar } from './navbar';
import { AuthService } from '../auth/auth.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { NotificationService } from '../services/notification.service';
import { AppointmentModalService } from '../services/appointment-modal.service';
import { PrescriptionModalService } from '../services/prescription-modal.service';
import { PrescriptionService } from '../services/prescription.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    const appointmentOpen = new Subject<void>();
    const prescriptionOpen = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [Navbar],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => false,
            hasRole: () => false,
          },
        },
        {
          provide: NotificationWebSocketService,
          useValue: {
            connectForPatient: () => {},
            disconnect: () => {},
            onToast: undefined as ((m: string) => void) | undefined,
            onMedecinRealtime: null as ((payload: unknown) => void) | null,
          },
        },
        { provide: NotificationService, useValue: {} },
        {
          provide: AppointmentModalService,
          useValue: { onOpen: appointmentOpen },
        },
        {
          provide: PrescriptionModalService,
          useValue: { onOpen: prescriptionOpen },
        },
        { provide: PrescriptionService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
