import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { BackLayoutComponent } from './back-layout/back-layout';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { App } from './app';
import { Home } from './home/home';
import { Back } from './back/back';
import { Users } from './users/users';
import { TreatmentComponent } from './treatment/treatment';
import { DossiersListComponent } from './dossiers-list-component/dossiers-list-component';
import { SuiviPopupComponent } from './suivi-popup-component/suivi-popup-component';
import { CalendrierPatientComponent } from './calendrier-patient/calendrier-patient';
import { Sidebar } from './sidebar/sidebar';
import { LayoutComponent } from './layout-component/layout-component';
import { Navbar2 } from './navbar2/navbar2';
import { DossierService } from './services/dossier';
import { SuiviService } from './services/suivi';
import { Navbar } from './navbar/navbar';
import { Login } from './login/login';
import { Register } from './register/register';

import { AuthService } from './auth/auth.service';
import { initializeAuth } from './auth/app-init';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AppMessagesComponent } from './app-messages/app-messages';
import { UpdateConsultationComponent } from './update-consultation/update-consultation';
import { UpdateRendezvousComponent } from './update-rendezvous/update-rendezvous';
import { UpdateRapportComponent } from './update-rapport/update-rapport';
import { RemindersComponent } from './reminders/reminders';
import { ReminderMedicaHomeComponent } from './reminder-medica-home/reminder-medica-home';
import { NutritionPatientComponent } from './nutrition-patient/nutrition-patient';
import { MedicationScannerComponent } from './medication-scanner/medication-scanner.component';
import { MedicationScannerService } from './services/medication-scanner.service';
import { MedicationsBackComponent } from './medications-back/medications-back';
import { MedicationService } from './services/medication';
import { NutritionService } from './services/nutrition';
import { Hospitalisation } from './hospitalisation/hospitalisation';
import { StatsComponent } from './stats/stats';
import { DailyReportComponent } from './daily-report/daily-report';
import { LaboBilanComponent } from './labo-bilan/labo-bilan';
import { GraftFunctionComponent } from './graft-function/graft-function';
import { InfectionDashboardComponent } from './infection-dashboard/infection-dashboard';
import { InfectionVaccinationComponent } from './infection-vaccination/infection-vaccination';
import { NutritionBackComponent } from './nutrition-back/nutrition-back';
import { SidebarPlaceholderPage } from './sidebar-placeholder-page/sidebar-placeholder-page';
import { AfficheParametreVital } from './affiche-parametre-vital/affiche-parametre-vital';
import { AjouterConstanteVitale } from './ajouter-constante-vitale/ajouter-constante-vitale';
import { AjouterIndicateurVital } from './ajouter-indicateur-vital/ajouter-indicateur-vital';
import { AnalyseVitaleComponent } from './analyse-vitale/analyse-vitale';
import { AfficheConsultationComponent } from './affiche-consultation/affiche-consultation';
import { AjouterRendezvousComponent } from './ajouter-rendezvous/ajouter-rendezvous';
import { AjouterRapportComponent } from './ajouter-rapport/ajouter-rapport';
import { ConsultationComponent } from './consultation/consultation';
import { PatientLabEvolutionComponent } from './patient-lab-evolution/patient-lab-evolution.component';
import { WeeklyMenuComponent } from './nutrition-patient/weekly-menu.component';

@NgModule({
  declarations: [
    App,
    Home,
    Back,
    ReminderMedicaHomeComponent,
    DossiersListComponent,
    SuiviPopupComponent,
    CalendrierPatientComponent,
    Sidebar,
    LayoutComponent,
    Navbar2,
    Navbar,
    Login,
    Register,
    MedicationsBackComponent,
    Hospitalisation,
    StatsComponent,
    DailyReportComponent,
    LaboBilanComponent,
    NutritionBackComponent,
    NutritionPatientComponent,
    SidebarPlaceholderPage,
    AfficheParametreVital,
    PatientLabEvolutionComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AppMessagesComponent,
    TreatmentComponent,
    Users,
    UpdateConsultationComponent,
    UpdateRendezvousComponent,
    UpdateRapportComponent,
    RemindersComponent,
    MedicationScannerComponent,
    AjouterConstanteVitale,
    AjouterIndicateurVital,
    AnalyseVitaleComponent,
    AfficheConsultationComponent,
    AjouterRendezvousComponent,
    AjouterRapportComponent,
    ConsultationComponent,
    BackLayoutComponent,
    WeeklyMenuComponent,
    GraftFunctionComponent,
    InfectionDashboardComponent,
    InfectionVaccinationComponent,
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    DossierService,
    SuiviService,
    MedicationService,
    NutritionService,
    MedicationScannerService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}