import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../services/confirm.service';
import { ConsultationService, PatientDTO } from '../services/consultation.service';
import { PatientService } from '../services/patient.service';
import { DossierService } from '../services/dossier';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number; // Pour patients
  greftDate?: string; // Pour patients
  diagnostic?: string; // Pour patients — diagnostic du dossier médical
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements OnInit {
  loadingPatients = false;

  constructor(
    private confirmService: ConfirmService,
    private consultationService: ConsultationService,
    private patientService: PatientService,
    private dossierService: DossierService
  ) {}

  // Mode d'affichage : 'grid' ou 'list'
  viewMode: 'grid' | 'list' = 'grid';
  
  // Modal state
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  currentUser: Partial<User> = {};
  
  // Search & Filter
  searchTerm: string = '';
  statusFilter: string = 'all';
  
  // Data
  patients: User[] = [];

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loadingPatients = true;
    const applyPatients = (data: any[], diagnosticByPatient: Map<number, string>) => {
      this.patients = (Array.isArray(data) ? data : []).map(p => this.mapPatientToUser(p, diagnosticByPatient));
      this.loadingPatients = false;
    };
    this.dossierService.getAllDossiers().subscribe({
      next: (dossiers) => {
        const diagMap = new Map<number, string>();
        for (const d of dossiers || []) {
          const idP = d.idPatient ?? (d as any).id_patient;
          if (idP != null && d.diagnostic) {
            diagMap.set(Number(idP), d.diagnostic);
          }
        }
        this.consultationService.getPatients().subscribe({
          next: (data) => {
            const arr = Array.isArray(data) ? data : [];
            if (arr.length > 0) {
              applyPatients(arr, diagMap);
            } else {
              this.patientService.getAll().subscribe({
                next: (apiData) => applyPatients(apiData || [], diagMap),
                error: () => { this.patients = []; this.loadingPatients = false; }
              });
            }
          },
          error: () => {
            this.patientService.getAll().subscribe({
              next: (apiData) => applyPatients(apiData || [], diagMap),
              error: () => { this.patients = []; this.loadingPatients = false; }
            });
          }
        });
      },
      error: () => {
        const diagMap = new Map<number, string>();
        this.consultationService.getPatients().subscribe({
          next: (data) => {
            const arr = Array.isArray(data) ? data : [];
            if (arr.length > 0) {
              applyPatients(arr, diagMap);
            } else {
              this.patientService.getAll().subscribe({
                next: (apiData) => applyPatients(apiData || [], diagMap),
                error: () => { this.patients = []; this.loadingPatients = false; }
              });
            }
          },
          error: () => {
            this.patientService.getAll().subscribe({
              next: (apiData) => applyPatients(apiData || [], diagMap),
              error: () => { this.patients = []; this.loadingPatients = false; }
            });
          }
        });
      }
    });
  }

  private mapPatientToUser(p: PatientDTO | Record<string, unknown>, diagnosticByPatient?: Map<number, string>): User {
    const idPatient = (p as any).idPatient ?? (p as any).id_patient ?? (p as any).id;
    const id = String(idPatient ?? '');
    const firstName = (p as any).firstName ?? (p as any).first_name ?? (p as any).prenom ?? '';
    const lastName = (p as any).lastName ?? (p as any).last_name ?? (p as any).nom ?? '';
    const email = (p as any).email ?? (p as any).username ?? '';
    const phone = (p as any).telephone ?? (p as any).phone ?? (p as any).tel ?? (p as any).numTel ?? (p as any).numeroTelephone ?? (p as any).mobile ?? '';
    const dateNaiss = (p as any).dateNaissance ?? (p as any).date_naissance ?? (p as any).dateNaissance;
    const greftDate = (p as any).greftDate ?? (p as any).date_greffe ?? (p as any).dateGreffe ?? dateNaiss;
    const age = this.calcAge(dateNaiss);
    const diagnostic = idPatient != null && diagnosticByPatient ? diagnosticByPatient.get(Number(idPatient)) : undefined;
    return {
      id,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phone: String(phone),
      age: age ?? undefined,
      greftDate: greftDate ? String(greftDate).substring(0, 10) : undefined,
      diagnostic: diagnostic ?? undefined,
      status: 'active',
      createdAt: new Date()
    };
  }

  private calcAge(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined;
    const d = new Date(String(dateStr));
    if (isNaN(d.getTime())) return undefined;
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }


  // Getters
  get filteredUsers(): User[] {
    let users = this.patients;
    
    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      users = users.filter(user => 
        (user.firstName || '').toLowerCase().includes(term) ||
        (user.lastName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.phone || '').includes(this.searchTerm)
      );
    }
    
    // Filter by status
    if (this.statusFilter !== 'all') {
      users = users.filter(user => user.status === this.statusFilter);
    }
    
    return users;
  }

  // View mode
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // CRUD Operations
  openCreateModal(): void {
    this.isEditing = false;
    this.currentUser = {};
    this.isModalOpen = true;
  }

  openEditModal(user: User): void {
    this.isEditing = true;
    this.currentUser = { ...user };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentUser = {};
  }

  saveUser(): void {
    if (this.isEditing) {
      const index = this.patients.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) {
        this.patients[index] = { ...this.patients[index], ...this.currentUser };
      }
    } else {
      const newUser: User = {
        ...this.currentUser as User,
        id: Date.now().toString(),
        createdAt: new Date(),
        status: 'active'
      };
      this.patients.push(newUser);
    }
    this.closeModal();
  }

  deleteUser(userId: string): void {
    this.confirmService.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?', { title: 'Supprimer patient' }).then((ok) => {
      if (!ok) return;
      this.patients = this.patients.filter(p => p.id !== userId);
    });
  }

  toggleStatus(user: User): void {
    user.status = user.status === 'active' ? 'inactive' : 'active';
  }

  // Utility
  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#48bb78';
      case 'inactive': return '#e53e3e';
      case 'pending': return '#ed8936';
      default: return '#718096';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
    }
  }

  getGraftDuration(greftDate: string): string {
    const graft = new Date(greftDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - graft.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 12) {
      return `${months} mois`;
    } else {
      const years = Math.floor(months / 12);
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }
}