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
    this.initializeTheme();
  }

  private initializeTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const isDark = settings.theme === 'dark';
        this.setDarkMode(isDark);
      } else {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        this.setDarkMode(isDark);
      }
    }
  }

  setDarkMode(isDark: boolean) {
    this.isDarkModeSubject.next(isDark);
    
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
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', !currentMode ? 'dark' : 'light');
      
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
