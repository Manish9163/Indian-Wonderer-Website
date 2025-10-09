import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private tokenRefreshTimer: any;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    console.log('🔐 AuthService initialized');
    this.checkAuthStatus();
    this.startTokenRefreshTimer();
  }

  /**
   * Check if user is authenticated
   */
  checkAuthStatus(): boolean {
    const token = this.getToken();
    
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      return false;
    }

    // Validate token format and expiration
    const isValid = this.isTokenValid(token);
    this.isAuthenticatedSubject.next(isValid);

    // If token is expiring soon, try to refresh it
    if (isValid && this.isTokenExpiringSoon(token)) {
      console.log('⏰ Token expiring soon, refreshing...');
      this.refreshTokenSilently();
    }

    return isValid;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('adminToken') || localStorage.getItem('authToken');
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);

      return payload.exp > now;
    } catch (e) {
      console.error('❌ Invalid token format:', e);
      return false;
    }
  }

  /**
   * Check if token is expiring within 1 hour
   */
  private isTokenExpiringSoon(token: string): boolean {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 60 * 60;

      return (payload.exp - now) < oneHour;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get token expiration time in seconds
   */
  private getTokenExpirationTime(token: string): number {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer(): void {
    // Check token every 30 minutes
    const checkInterval = 30 * 60 * 1000; // 30 minutes

    this.tokenRefreshTimer = setInterval(() => {
      console.log('⏰ Periodic token check...');
      const token = this.getToken();

      if (token && this.isTokenValid(token)) {
        if (this.isTokenExpiringSoon(token)) {
          console.log('🔄 Token expiring soon, refreshing...');
          this.refreshTokenSilently();
        } else {
          console.log('✅ Token still valid');
        }
      } else if (token) {
        console.log('❌ Token expired or invalid');
        this.clearAuth();
      }
    }, checkInterval);
  }

  /**
   * Refresh token silently in background
   */
  private refreshTokenSilently(): void {
    // Get stored credentials (if remember me was enabled)
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail && rememberedPassword) {
      console.log('🔄 Auto-refreshing token...');
      
      this.apiService.login({
        email: rememberedEmail,
        password: atob(rememberedPassword) // Decode password
      }).subscribe({
        next: (response) => {
          if (response.success && response.token) {
            localStorage.setItem('adminToken', response.token);
            this.isAuthenticatedSubject.next(true);
            console.log('✅ Token refreshed successfully!');
          }
        },
        error: (error) => {
          console.error('❌ Failed to refresh token:', error);
        }
      });
    } else {
      console.log('⚠️ No remembered credentials, cannot auto-refresh');
    }
  }

  /**
   * Login and optionally remember credentials for auto-refresh
   */
  login(email: string, password: string, rememberMe: boolean = true): Observable<any> {
    return this.apiService.login({ email, password }).pipe(
      tap(response => {
        if (response.success && response.token) {
          // Store token
          localStorage.setItem('adminToken', response.token);
          this.isAuthenticatedSubject.next(true);

          // Remember credentials for auto-refresh (if enabled)
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', btoa(password)); // Basic encoding
            console.log('✅ Credentials saved for auto-refresh');
          }

          console.log('✅ Login successful, token saved');
        }
      }),
      catchError(error => {
        console.error('❌ Login failed:', error);
        this.isAuthenticatedSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Logout and clear all auth data
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Clear all authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    // Keep remembered credentials for next login
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }
  }
}
