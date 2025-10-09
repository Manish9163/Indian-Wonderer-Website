import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AdminSettings {
  // System Settings
  siteName: string;
  adminEmail: string;
  timezone: string;
  maintenanceMode: boolean;
  enableGpt5Mini: boolean;
  
  // Booking Settings
  maxBookingsPerDay: number;
  advanceBookingDays: number;
  autoConfirm: boolean;
  emailNotifications: boolean;
  
  // Payment Settings
  currency: string;
  paymentGateway: string;
  transactionFee: number;
  partialPayments: boolean;
  
  // Security Settings
  twoFactorAuth: boolean;
  loginTracking: boolean;
  sessionTimeout: number;
  gdprCompliance: boolean;
  
  // Notification Settings
  newBookingAlerts: boolean;
  paymentNotifications: boolean;
  dailyReports: boolean;
  reportTime: string;
  
  // Appearance Settings
  theme: string;
  accentColor: string;
  animatedBg: boolean;
  soundEffects: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private defaultSettings: AdminSettings = {
    siteName: 'Indian Wonderer',
    adminEmail: 'admin@indianWonderer.ac.in',
    timezone: 'IST',
    maintenanceMode: false,
    enableGpt5Mini: true,
    maxBookingsPerDay: 50,
    advanceBookingDays: 365,
    autoConfirm: true,
    emailNotifications: true,
    currency: 'INR',
    paymentGateway: 'razorpay',
    transactionFee: 2.5,
    partialPayments: true,
    twoFactorAuth: false,
    loginTracking: true,
    sessionTimeout: 30,
    gdprCompliance: true,
    newBookingAlerts: true,
    paymentNotifications: true,
    dailyReports: false,
    reportTime: '09:00',
    theme: 'cyber',
    accentColor: 'blue',
    animatedBg: true,
    soundEffects: false
  };

  private settingsSubject = new BehaviorSubject<AdminSettings>(this.defaultSettings);
  public settings$ = this.settingsSubject.asObservable();

  // Individual setting observables for specific subscriptions
  private siteNameSubject = new BehaviorSubject<string>(this.defaultSettings.siteName);
  public siteName$ = this.siteNameSubject.asObservable();

  private currencySubject = new BehaviorSubject<string>(this.defaultSettings.currency);
  public currency$ = this.currencySubject.asObservable();

  private themeSubject = new BehaviorSubject<string>(this.defaultSettings.theme);
  public theme$ = this.themeSubject.asObservable();

  private accentColorSubject = new BehaviorSubject<string>(this.defaultSettings.accentColor);
  public accentColor$ = this.accentColorSubject.asObservable();

  private maintenanceModeSubject = new BehaviorSubject<boolean>(this.defaultSettings.maintenanceMode);
  public maintenanceMode$ = this.maintenanceModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings() {
    if (isPlatformBrowser(this.platformId)) {
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          this.updateAllSettings(settings);
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    }
  }

  /**
   * Update all settings and notify subscribers
   */
  updateAllSettings(settings: Partial<AdminSettings>) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    this.settingsSubject.next(newSettings);
    
    // Update individual subjects
    if (settings.siteName !== undefined) {
      this.siteNameSubject.next(settings.siteName);
    }
    if (settings.currency !== undefined) {
      this.currencySubject.next(settings.currency);
    }
    if (settings.theme !== undefined) {
      this.themeSubject.next(settings.theme);
    }
    if (settings.accentColor !== undefined) {
      this.accentColorSubject.next(settings.accentColor);
    }
    if (settings.maintenanceMode !== undefined) {
      this.maintenanceModeSubject.next(settings.maintenanceMode);
    }
    
    this.saveToLocalStorage(newSettings);
  }

  /**
   * Update a single setting
   */
  updateSetting<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, [key]: value };
    
    this.settingsSubject.next(newSettings);
    
    // Update specific subject if it exists
    switch (key) {
      case 'siteName':
        this.siteNameSubject.next(value as string);
        break;
      case 'currency':
        this.currencySubject.next(value as string);
        break;
      case 'theme':
        this.themeSubject.next(value as string);
        break;
      case 'accentColor':
        this.accentColorSubject.next(value as string);
        break;
      case 'maintenanceMode':
        this.maintenanceModeSubject.next(value as boolean);
        break;
    }
    
    this.saveToLocalStorage(newSettings);
  }

  /**
   * Get current settings (synchronous)
   */
  getCurrentSettings(): AdminSettings {
    return this.settingsSubject.value;
  }

  /**
   * Get a specific setting value
   */
  getSetting<K extends keyof AdminSettings>(key: K): AdminSettings[K] {
    return this.settingsSubject.value[key];
  }

  /**
   * Reset to default settings
   */
  resetToDefaults() {
    this.updateAllSettings(this.defaultSettings);
  }

  /**
   * Save settings to localStorage
   */
  private saveToLocalStorage(settings: AdminSettings) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('adminSettings', JSON.stringify(settings));
    }
  }

  /**
   * Apply accent color to document
   */
  applyAccentColor(color: string) {
    if (isPlatformBrowser(this.platformId)) {
      const colorMap: { [key: string]: string } = {
        blue: '#00d4ff',
        green: '#00ff88',
        purple: '#b400ff',
        pink: '#ff00e6'
      };
      
      const hexColor = colorMap[color] || colorMap['blue'];
      document.documentElement.style.setProperty('--primary-accent', hexColor);
      document.documentElement.style.setProperty('--neon-primary', hexColor);
    }
  }

  /**
   * Export settings as JSON
   */
  exportSettings(): string {
    return JSON.stringify(this.settingsSubject.value, null, 2);
  }

  /**
   * Import settings from JSON
   */
  importSettings(jsonString: string): boolean {
    try {
      const settings = JSON.parse(jsonString);
      this.updateAllSettings(settings);
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}
