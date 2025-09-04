import { Component, Input, OnInit, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface MenuItem {
  route: string;
  icon: string;
  label: string;
  badge?: string | null;
  badgeClass?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  @Input() sidebarOpen = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    {
      route: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      badge: null,
      badgeClass: ''
    },
    {
      route: '/tours',
      icon: 'fas fa-route',
      label: 'Tours',
      badge: '12',
      badgeClass: 'bg-primary'
    },
    {
      route: '/itineraries',
      icon: 'fas fa-list-alt',
      label: 'Itineraries',
      badge: null,
      badgeClass: ''
    },
    {
      route: '/bookings',
      icon: 'fas fa-calendar-check',
      label: 'Bookings',
      badge: '23',
      badgeClass: 'bg-warning'
    },
    {
      route: '/customers',
      icon: 'fas fa-users',
      label: 'Customers',
      badge: null,
      badgeClass: ''
    },
    {
      route: '/guides',
      icon: 'fas fa-user-tie',
      label: 'Tour Guides',
      badge: null,
      badgeClass: ''
    },
    {
      route: '/payments',
      icon: 'fas fa-credit-card',
      label: 'Payments',
      badge: '3',
      badgeClass: 'bg-success'
    },
    {
      route: '/analytics',
      icon: 'fas fa-chart-line',
      label: 'Analytics',
      badge: null,
      badgeClass: ''
    },
    {
      route: '/settings',
      icon: 'fas fa-cog',
      label: 'Settings',
      badge: null,
      badgeClass: ''
    }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  onMenuClick(route: string): void {
    // Navigate to the selected route
    this.router.navigate([route]);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.sidebarToggle.emit(this.sidebarOpen);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit(this.sidebarOpen);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      console.log('Logging out...');
      // Clear user session data (only in browser)
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      }
      
      // Redirect to login page
      this.router.navigate(['/login']);
    }
  }

  // Check if current route is active
  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  // Get badge count for menu items
  getBadgeCount(menuItem: MenuItem): string | null {
    // This could be connected to a service to get real-time counts
    return menuItem.badge || null;
  }

  // Handle sidebar overlay click
  onOverlayClick(): void {
    this.closeSidebar();
  }
}
