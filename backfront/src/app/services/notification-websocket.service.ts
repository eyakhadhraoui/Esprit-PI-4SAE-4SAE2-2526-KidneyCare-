import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificationItem {
  icon: string;
  title: string;
  time: string;
  type?: string;
  idDossierMedical?: number;
  idItem?: number;
  idPrescription?: number;
}

interface NotificationPayload {
  type?: string;
  titre?: string;
  date?: string;
  idDossierMedical?: number;
  idItem?: number;
  idPrescription?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  private apiUrl = '/api/patients/me';
  private wsUrl: string;
  private client: Client | null = null;
  private connected = false;

  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  /** Callback pour afficher un toast (injecté par le composant). */
  onToast: ((msg: string) => void) | null = null;

  constructor(private http: HttpClient) {
    const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
    const port = host === 'localhost' ? '8089' : (window.location.port || '80');
    const protocol = window.location?.protocol === 'https:' ? 'https' : 'http';
    this.wsUrl = `${protocol}://${host}:${port}/ws`;
  }

  /** Démarre la connexion WebSocket pour le patient connecté (idPatient). */
  connectForPatient(): void {
    this.http.get<Record<string, unknown>>(this.apiUrl).subscribe({
      next: (me) => {
        const raw = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
        const id = raw != null ? Number(raw) : NaN;
        if (!isNaN(id) && id > 0) {
          this.connect(id);
        }
      },
      error: () => {}
    });
  }

  private connect(idPatient: number): void {
    if (this.client?.active) return;

    try {
      const socket = new SockJS(this.wsUrl);
      this.client = new Client({
        webSocketFactory: () => socket as unknown as WebSocket,
        debug: () => {},
        onConnect: () => {
          this.connected = true;
          this.client?.subscribe('/topic/patient/' + idPatient, (message) => {
            try {
              const body: NotificationPayload = JSON.parse(message.body);
              this.handleNotification(body);
            } catch { /* ignore */ }
          });
        },
        onStompError: () => {
          this.connected = false;
        },
        onWebSocketClose: () => {
          this.connected = false;
        }
      });
      this.client.activate();
    } catch (e) {
      // Si SockJS/STOMP échoue (ex. global undefined), ne pas faire planter l'app
    }
  }

  private iconForType(type?: string): string {
    switch (type) {
      case 'IMAGE_MEDICALE':
        return '🖼️';
      case 'LAB_CRITIQUE':
        return '🚨';
      case 'LAB_PREVENTIF':
        return '⚠️';
      case 'LAB_RAPPEL_TEST':
        return '🧪';
      default:
        return '📋';
    }
  }

  private handleNotification(payload: NotificationPayload): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const title = payload.titre || 'Nouvelle notification';
    const item: NotificationItem = {
      icon: this.iconForType(payload.type),
      title,
      time: timeStr,
      type: payload.type,
      idDossierMedical: payload.idDossierMedical,
      idItem: payload.idItem,
      idPrescription: payload.idPrescription
    };
    const list = [...this.notificationsSubject.value, item];
    this.notificationsSubject.next(list);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    if (this.onToast) this.onToast(title);
  }

  /** Marquer les notifications comme lues (remet le compteur à 0). */
  markAllAsRead(): void {
    this.unreadCountSubject.next(0);
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
  }
}
