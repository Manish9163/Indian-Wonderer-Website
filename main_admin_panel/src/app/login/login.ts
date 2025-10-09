import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  connectionStatus = 'checking';
  connectionMessage = 'Checking backend connection...';
  connectionIcon = 'fas fa-spinner fa-spin';
  apiUrl = 'http://localhost/fu/backend/api';

  ngOnInit() {
    this.checkConnection();
  }

  checkConnection() {
    this.connectionStatus = 'checking';
    this.connectionMessage = 'Checking backend connection...';
    this.connectionIcon = 'fas fa-spinner fa-spin';

    this.apiService.checkHealth().subscribe({
      next: (response) => {
        if (response.success) {
          this.connectionStatus = 'connected';
          this.connectionMessage = `✅ Backend connected: ${response.data.server}`;
          this.connectionIcon = 'fas fa-check-circle';
        } else {
          this.connectionStatus = 'disconnected';
          this.connectionMessage = '❌ Backend returned error';
          this.connectionIcon = 'fas fa-exclamation-circle';
        }
      },
      error: (error) => {
        this.connectionStatus = 'disconnected';
        this.connectionMessage = '❌ Cannot connect to backend API';
        this.connectionIcon = 'fas fa-times-circle';
        console.error('Connection error:', error);
      }
    });
  }

  onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password, true).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          console.log('✅ Login successful with auto-refresh enabled');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.message || 'Login failed. Please check your credentials.';
        console.error('Login error:', error);
      }
    });
  }
}
