import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  @Input() sidebarOpen: boolean = false;
  isCollapsed: boolean = false;
  activeRoute: string = '';

  menuItems = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      active: false
    },
    {
      icon: 'analytics',
      label: 'Analytics',
      route: '/analytics',
      active: false
    },
    {
      icon: 'bookings',
      label: 'Bookings',
      route: '/bookings',
      active: false
    },
    {
      icon: 'tours',
      label: 'Tours',
      route: '/tours',
      active: false
    },
    {
      icon: 'users',
      label: 'Users',
      route: '/users',
      active: false
    },
    {
      icon: 'guides',
      label: 'Guides',
      route: '/guides',
      active: false
    },
    {
      icon: 'itineraries',
      label: 'Itineraries',
      route: '/itineraries',
      active: false
    },
    {
      icon: 'payments',
      label: 'Payments',
      route: '/payments',
      active: false
    },
    {
      icon: 'customers',
      label: 'Customers',
      route: '/customers',
      active: false
    },
    {
      icon: 'settings',
      label: 'Settings',
      route: '/settings',
      active: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setActiveRoute();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.setActiveRoute();
  }

  setActiveRoute(): void {
    this.activeRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.active = item.route === this.activeRoute;
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminToken');
      this.router.navigate(['/auth']);
    }
  }
}
