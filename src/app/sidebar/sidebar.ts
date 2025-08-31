import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.sidebar-open]="sidebarOpen">
      <!-- Logo Section -->
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo-icon">
            <i class="fas fa-compass"></i>
          </div>
          <div class="logo-text">
            <h4 class="mb-0">Indian Wonderer</h4>
            <small class="text-muted">Management Portal</small>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item" *ngFor="let item of menuItems">
            <a 
              [routerLink]="item.route" 
              class="nav-link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
              (click)="onMenuClick(item.route)">
              <div class="nav-icon">
                <i [class]="item.icon"></i>
              </div>
              <span class="nav-text">{{item.label}}</span>
              <div class="nav-badge" *ngIf="item.badge">
                <span class="badge" [ngClass]="item.badgeClass">{{item.badge}}</span>
              </div>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Bottom Section -->
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-info">
            <div class="user-name">Admin User</div>
            <div class="user-role">Super Administrator</div>
          </div>
        </div>
        
        <div class="footer-actions">
          <button class="btn btn-outline-light btn-sm w-100 mb-2" (click)="openSettings()">
            <i class="fas fa-cog me-2"></i>Settings
          </button>
          <button class="btn btn-outline-light btn-sm w-100" (click)="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div class="sidebar-overlay" 
         [class.show]="sidebarOpen" 
         (click)="closeSidebar()"
         *ngIf="sidebarOpen"></div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #1a1d29 0%, #2d3748 100%);
      color: white;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      overflow-y: auto;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    }

    .sidebar.sidebar-open {
      transform: translateX(0);
    }

    @media (min-width: 769px) {
      .sidebar {
        transform: translateX(0);
        position: fixed;
      }
    }

    .sidebar-header {
      padding: 2rem 1.5rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .logo-text h4 {
      color: white;
      font-weight: 700;
      margin: 0;
    }

    .logo-text small {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sidebar-nav {
      padding: 1.5rem 0;
      flex: 1;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-item {
      margin-bottom: 0.5rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.05);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .nav-link:hover {
      color: white;
      border-left-color: #667eea;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link:hover::before {
      transform: translateX(0);
    }

    .nav-link.active {
      color: white;
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(102, 126, 234, 0.05) 100%);
      border-left-color: #667eea;
      box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.1);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .nav-text {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .nav-badge {
      margin-left: auto;
    }

    .nav-badge .badge {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 50px;
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: auto;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .user-avatar {
      font-size: 2rem;
      color: #667eea;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: white;
    }

    .user-role {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-actions .btn {
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
    }

    .footer-actions .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.4);
      color: white;
      transform: translateY(-1px);
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .sidebar-overlay.show {
      opacity: 1;
      visibility: visible;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        max-width: 320px;
      }
    }

    /* Custom Scrollbar */
    .sidebar::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    .sidebar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() sidebarOpen = false;

  menuItems = [
    {
      route: '/dashboard',
      icon: 'fas fa-home',
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
      icon: 'fas fa-map',
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
      route: '/payments',
      icon: 'fas fa-credit-card',
      label: 'Payments',
      badge: '3',
      badgeClass: 'bg-success'
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

  constructor(private router: Router) {}

  ngOnInit() {
  }

  onMenuClick(route: string) {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  closeSidebar() {
    // Emit event to parent component to close sidebar
    // In a real application, you might use a service or EventEmitter
  }

  openSettings() {
    this.router.navigate(['/settings']);
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  logout() {
    console.log('Logging out...');
    // Implement logout logic here
    // Clear user session, redirect to login page, etc.
  }
}