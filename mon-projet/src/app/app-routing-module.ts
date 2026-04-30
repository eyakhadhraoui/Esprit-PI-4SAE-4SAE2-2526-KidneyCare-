import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout-component/layout-component';
import { Home } from './home/home';
import { Back } from './back/back';
import { Users } from './users/users';
import { TreatmentComponent } from './treatment/treatment';
import { DossiersListComponent } from './dossiers-list-component/dossiers-list-component';
import { CalendrierPatientComponent } from './calendrier-patient/calendrier-patient';
import { Navbar } from './navbar/navbar';
import { Login } from './login/login';
import { Register } from './register/register';
import { patientAreaGuard, medecinAreaGuard } from './auth/auth.guard';
import { UpdateConsultationComponent } from './update-consultation/update-consultation';
import { UpdateRendezvousComponent } from './update-rendezvous/update-rendezvous';
import { UpdateRapportComponent } from './update-rapport/update-rapport';
import { RemindersComponent } from './reminders/reminders';
import { SidebarPlaceholderPage } from './sidebar-placeholder-page/sidebar-placeholder-page';
import { ReminderMedicaHomeComponent } from './reminder-medica-home/reminder-medica-home';
import { NutritionPatientComponent } from './nutrition-patient/nutrition-patient';
import { NutritionBackComponent } from './nutrition-back/nutrition-back';
import { MedicationScannerComponent } from './medication-scanner/medication-scanner.component';
import { AfficheParametreVital } from './affiche-parametre-vital/affiche-parametre-vital';
import { AjouterConstanteVitale } from './ajouter-constante-vitale/ajouter-constante-vitale';
import { AjouterIndicateurVital } from './ajouter-indicateur-vital/ajouter-indicateur-vital';
import { AnalyseVitaleComponent } from './analyse-vitale/analyse-vitale';
import { AfficheConsultationComponent } from './affiche-consultation/affiche-consultation';
import { AjouterRendezvousComponent } from './ajouter-rendezvous/ajouter-rendezvous';
import { AjouterRapportComponent } from './ajouter-rapport/ajouter-rapport';
import { ConsultationComponent } from './consultation/consultation';
import { LaboBilanComponent } from './labo-bilan/labo-bilan';
import { GraftFunctionComponent } from './graft-function/graft-function';
import { InfectionDashboardComponent } from './infection-dashboard/infection-dashboard';
import { InfectionVaccinationComponent } from './infection-vaccination/infection-vaccination';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Front office — patient
  {
    path: 'home',
    component: Navbar,
    canActivate: [patientAreaGuard],
    children: [
      { path: '', component: Home },
      { path: 'treatment', component: TreatmentComponent },
      { path: 'graft-function', component: GraftFunctionComponent },
      { path: 'calendrier', component: CalendrierPatientComponent },
      { path: 'reminders', component: ReminderMedicaHomeComponent },
      { path: 'reminder-classic', component: RemindersComponent },
      { path: 'nutrition', component: NutritionPatientComponent },
      { path: 'scanner', component: MedicationScannerComponent },
    ],
  },
  




  // Back office — médecin
  {
    path: 'back',
    component: LayoutComponent,
    canActivate: [medecinAreaGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dossiers', component: DossiersListComponent },
      { path: 'dashboard', component: Back },
      { path: 'users', component: Users },
      { path: 'consultations', component: AfficheConsultationComponent },
      { path: 'consultations/new', component: ConsultationComponent },
      { path: 'rendezvous/new', component: AjouterRendezvousComponent },
      { path: 'rapports/new', component: AjouterRapportComponent },
      { path: 'consultations/edit/:id', component: UpdateConsultationComponent },
      { path: 'rendezvous/edit/:id', component: UpdateRendezvousComponent },
      { path: 'rapports/edit/:id', component: UpdateRapportComponent },
      { path: 'consultation-detail', component: SidebarPlaceholderPage, data: { title: 'Détail consultation' } },
      { path: 'treatment', component: TreatmentComponent},
      { path: 'reminder', component: RemindersComponent},
      { path: 'nutrition', component: NutritionBackComponent },
      { path: 'parametres-vitaux', component: AfficheParametreVital },
      { path: 'ajouter-indicateur', component: AjouterIndicateurVital },
      { path: 'ajouter-constante', component: AjouterConstanteVitale },
      { path: 'analyse-vitale', component: AnalyseVitaleComponent },
      { path: 'labo', component: LaboBilanComponent },
      { path: 'graft-function', component: GraftFunctionComponent },
      { path: 'infection-dashboard', component: InfectionDashboardComponent },
      { path: 'infection-vaccination', component: InfectionVaccinationComponent },
    ],
  },

  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}