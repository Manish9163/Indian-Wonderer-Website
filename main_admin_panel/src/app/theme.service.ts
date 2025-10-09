import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize theme from localStorage or settings
    this.initializeTheme();
  }

  private initializeTheme() {
    // Only access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Check for saved admin settings first
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const isDark = settings.theme === 'dark';
        this.setDarkMode(isDark);
      } else {
        // Fallback to old theme storage
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        this.setDarkMode(isDark);
      }
    }
  }

  setDarkMode(isDark: boolean) {
    this.isDarkModeSubject.next(isDark);
    
    // Only manipulate DOM in browser environment
    if (isPlatformBrowser(this.platformId)) {
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }

  toggleTheme() {
    const currentMode = this.isDarkModeSubject.value;
    this.setDarkMode(!currentMode);
    
    // Only access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Update localStorage theme
      localStorage.setItem('theme', !currentMode ? 'dark' : 'light');
      
      // Update admin settings if they exist
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        settings.theme = !currentMode ? 'dark' : 'cyber';
        localStorage.setItem('adminSettings', JSON.stringify(settings));
      }
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}
