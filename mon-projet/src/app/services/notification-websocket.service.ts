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

/** Payload {@code /topic/medecin/{id}} (patient a saisi un test, alerte labo…). */
export interface MedecinNotificationPayload {
  type?: string;
  titre?: string;
  corps?: string;
  idDossierMedical?: number;
  idResultatLaboratoire?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  private apiUrl = '/api/patients/me';
  private wsUrl: string;
  private client: Client | null = null;
  /** Connexion dédiée médecin (topic /topic/medecin/{id}). */
  private medecinClient: Client | null = null;
  private connected = false;

  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  /** Callback pour afficher un toast (injecté par le composant). */
  onToast: ((msg: string) => void) | null = null;

  /** Alerte médecin temps réel (nouveau résultat patient, alerte labo…). */
  onMedecinRealtime: ((payload: MedecinNotificationPayload) => void) | null = null;

  constructor(private http: HttpClient) {
    // Utiliser une URL relative pour passer par le proxy Angular en dev (/ws -> backend 8089).
    // Évite les soucis d'origines/ports quand le front et le back ne partagent pas le même host.
    this.wsUrl = '/ws';
  }

  /** Démarre la connexion WebSocket pour le patient connecté (idPatient). */
  connectForPatient(): void {
    this.http.get<Record<string, unknown>>(this.apiUrl).subscribe({
      next: (me) => {
        const raw = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
        const id = raw != null ? Number(raw) : NaN;
        if (!isNaN(id) && id > 0) {
          this.connect(id);
        } else {
          // Pas d'id patient => pas d'abonnement /topic/patient/{id}
          if (this.onToast) this.onToast('Impossible de démarrer les notifications (id patient introuvable).');
        }
      },
      error: (err) => {
        // Très fréquent : 401 si non connecté → le WS "semble" ne pas marcher alors que /me échoue.
        if (this.onToast) {
          const status = typeof err?.status === 'number' ? err.status : null;
          if (status === 401) {
            this.onToast('Notifications temps réel indisponibles : veuillez vous connecter.');
          } else {
            this.onToast('Notifications temps réel indisponibles (profil patient non chargé).');
          }
        }
        // Garder une trace exploitable en console (sans faire planter l'app).
        // eslint-disable-next-line no-console
        console.warn('[NotificationWebSocketService] /api/patients/me failed:', err);
      }
    });
  }

  /**
   * Abonnement STOMP pour le médecin connecté (KidneyCare NEPHRO : port 8089 /ws).
   */
  connectForMedecin(idMedecin: number): void {
    if (idMedecin <= 0) return;
    if (this.medecinClient?.active) return;
    try {
      const socket = new SockJS(this.wsUrl);
      this.medecinClient = new Client({
        webSocketFactory: () => socket as unknown as WebSocket,
        debug: () => {},
        onConnect: () => {
          this.medecinClient?.subscribe('/topic/medecin/' + idMedecin, (message) => {
            try {
              const body = JSON.parse(message.body) as MedecinNotificationPayload;
              if (this.onMedecinRealtime) {
                this.onMedecinRealtime(body);
              }
            } catch {
              /* ignore */
            }
          });
        },
        onStompError: () => {
          /* ignore */
        },
        onWebSocketClose: () => {
          /* ignore */
        },
      });
      this.medecinClient.activate();
    } catch {
      /* ignore */
    }
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
      case 'RAPPORT_BILAN':
        return '📄';
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
    if (this.medecinClient) {
      this.medecinClient.deactivate();
      this.medecinClient = null;
    }
    this.connected = false;
  }
}
