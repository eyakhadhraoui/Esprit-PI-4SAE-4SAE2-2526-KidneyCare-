import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InfectionVaccinationService, Infection, Vaccination } from '../services/infection-vaccination.service';
import { AuthRoleService } from '../services/auth-role.service';

@Component({
  selector: 'app-infection-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './infection-dashboard.html',
  styleUrls: ['./infection-dashboard.css']
})
export class InfectionDashboardComponent implements OnInit {
  infections: Infection[] = [];
  vaccinations: Vaccination[] = [];
  loading = false;
  apiError = '';

  constructor(
    private svc: InfectionVaccinationService,
    private cdr: ChangeDetectorRef,
    public auth: AuthRoleService
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.apiError = '';
    this.svc.getAllInfections().subscribe({
      next: (data: Infection[]) => {
        this.infections = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.apiError = 'Could not reach the server.';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
    this.svc.getAllVaccinations().subscribe({
      next: (data: Vaccination[]) => {
        this.vaccinations = data;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error(err)
    });
  }
}
