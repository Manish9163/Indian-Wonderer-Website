import { Component, OnInit, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  sidebarOpen = false;
  searchQuery = '';
  activeTab = 'dashboard';
  isDarkMode = false;

  constructor(
    private router: Router, 
    private renderer: Renderer2, 
    private themeService: ThemeService,
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
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    this.createParticles();
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
}
