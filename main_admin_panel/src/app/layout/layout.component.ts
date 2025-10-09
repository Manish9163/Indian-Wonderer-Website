import { Component, OnInit, Renderer2, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../theme.service';
import { SettingsService } from '../services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  searchQuery = '';
  activeTab = 'dashboard';
  isDarkMode = false;
  siteName = 'Indian Wonderer';
  private subscriptions = new Subscription();

  constructor(
    private router: Router, 
    private renderer: Renderer2, 
    private themeService: ThemeService,
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.activeTab = event.urlAfterRedirects.split('/')[1] || 'dashboard';
    });
  }

  ngOnInit() {
    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.isDarkMode$.subscribe(isDark => {
        this.isDarkMode = isDark;
      })
    );
    
    // Subscribe to settings changes for real-time updates
    this.subscriptions.add(
      this.settingsService.siteName$.subscribe(name => {
        this.siteName = name;
        // Update page title or any other UI that displays site name
        if (isPlatformBrowser(this.platformId)) {
          document.title = `${name} - Admin Panel`;
        }
      })
    );

    // Subscribe to accent color changes for real-time theme updates
    this.subscriptions.add(
      this.settingsService.accentColor$.subscribe(color => {
        this.settingsService.applyAccentColor(color);
      })
    );
    
    this.createParticles();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private createParticles() {
    // Only create particles in browser environment
    if (isPlatformBrowser(this.platformId)) {
      const particlesContainer = document.createElement('div');
      particlesContainer.className = 'particles';
      document.body.appendChild(particlesContainer);

      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
      }
    }
  }

  getTabTitle() {
    const titles: { [key: string]: string } = {
        dashboard: 'Dashboard Overview',
        tours: 'Tours Management',
        itineraries: 'Itinerary Management',
        bookings: 'Bookings Management',
        customers: 'Customer Management',
        guides: 'Tour Guide Management',
        payments: 'Payment Management',
        analytics: 'Analytics & Reports',
        settings: 'System Settings'
    };
    return titles[this.activeTab] || 'Dashboard';
  }

  logout() {
    // Clear any stored tokens/session
    localStorage.removeItem('adminToken');
    this.router.navigate(['/login']);
  }
}
