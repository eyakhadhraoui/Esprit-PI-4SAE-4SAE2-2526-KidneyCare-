import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterService, RegisterRequest } from '../services/register';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  model: RegisterRequest = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'patient',
  };
  confirmPassword = '';
  phone = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private registerService: RegisterService,
    private router: Router,
  ) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';
    this.registerService.register(this.model).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Account created. You can now log in.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        const firstFieldError = Array.isArray(body?.errors) && body.errors.length > 0 ? body.errors[0].message : null;
        this.error = firstFieldError ?? body?.message ?? err?.message ?? 'Registration error.';
      },
    });
  }
}
