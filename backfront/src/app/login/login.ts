import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    if (this.route.snapshot.queryParams['expired'] === '1') {
      this.error = 'Session expired. Please sign in again.';
    }
    if (this.auth.isLoggedIn()) {
      if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
        this.router.navigate(['/back']);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  loginKeycloak() {
    this.loading = true;
    this.error = '';
    this.auth.login().then(() => {
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.loginWithCredentials(this.username.trim(), this.password).then(() => {
      this.loading = false;
      if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
        this.router.navigate(['/back']);
      } else {
        this.router.navigate(['/home']);
      }
    }).catch((err) => {
      this.loading = false;
      console.error('Login error', err?.status, err?.error, err?.message);
      const msg = err?.error?.message ?? err?.message;
      this.error = msg && !String(msg).startsWith('Http failure')
        ? msg
        : 'Invalid username or password. Check Keycloak (port 8180), the backend (8089), and "Direct access grants" for the client.';
    });
  }
}
