import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'vip';
  joinDate: string;
  avatar: string;
  location: string;
  lastActivity: string;
  score: number;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Command Center Header -->
    <div class="admin-header mb-5">
      <h1 class="main-title">🌐 Customer Management</h1>
      <p class="subtitle">Advanced customer intelligence and analytics</p>
    </div>

    <!-- Quantum Stats Overview -->
    <div class="row mb-5">
      <div class="col-md-3">
        <div class="stats-card" style="--accent-color: var(--neon-blue)">
          <div class="stats-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stats-content">
            <div class="stats-number">{{totalCustomers}}</div>
            <div class="stats-label">Total Entities</div>
            <div class="stats-trend">
              <i class="fas fa-arrow-up"></i> +12.5%
            </div>
          </div>
          <div class="stats-particles"></div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stats-card" style="--accent-color: var(--neon-green)">
          <div class="stats-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="stats-content">
            <div class="stats-number">{{activeCustomers}}</div>
            <div class="stats-label">Active Nodes</div>
            <div class="stats-trend">
              <i class="fas fa-arrow-up"></i> +8.3%
            </div>
          </div>
          <div class="stats-particles"></div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stats-card" style="--accent-color: var(--neon-purple)">
          <div class="stats-icon">
            <i class="fas fa-crown"></i>
          </div>
          <div class="stats-content">
            <div class="stats-number">{{vipCustomers}}</div>
            <div class="stats-label">VIP Quantum</div>
            <div class="stats-trend">
              <i class="fas fa-arrow-up"></i> +15.7%
            </div>
          </div>
          <div class="stats-particles"></div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stats-card" style="--accent-color: var(--neon-pink)">
          <div class="stats-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="stats-content">
            <div class="stats-number">\${{totalSpent | number}}</div>
            <div class="stats-label">Revenue</div>
            <div class="stats-trend">
              <i class="fas fa-arrow-up"></i> +23.1%
            </div>
          </div>
          <div class="stats-particles"></div>
        </div>
      </div>
    </div>

    <!-- Advanced Control Panel -->
    <div class="control-panel glass-intense mb-4">
      <div class="row align-items-center">
        <div class="col-md-4">
          <div class="search-container">
            <input 
              type="text" 
              class="form-control-futuristic" 
              placeholder="🔍 Search Customers..." 
              [(ngModel)]="searchQuery"
            >
            <div class="search-glow"></div>
          </div>
        </div>
        <div class="col-md-3">
          <select class="form-control-futuristic" [(ngModel)]="filterStatus">
            <option value="">All Status Nodes</option>
            <option value="active">Active Entities</option>
            <option value="inactive">Dormant Nodes</option>
            <option value="vip">VIP Quantum</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-control-futuristic" [(ngModel)]="sortBy">
            <option value="name">Sort by Name</option>
            <option value="totalSpent">Sort by Value</option>
            <option value="joinDate">Sort by Join Date</option>
            <option value="score">Sort by Score</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn-neon w-100" (click)="addCustomer()">
            <i class="fas fa-plus"></i> Add Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Holographic Customer Grid -->
    <div class="row">
      <div class="col-12" *ngFor="let customer of filteredCustomers; trackBy: trackByCustomer">
        <div class="customer-card glass" [class.vip]="customer.status === 'vip'">
          <div class="customer-header">
            <div class="avatar-container">
              <img [src]="customer.avatar" [alt]="customer.name" class="avatar-image">
              <div class="status-ring" [class]="customer.status"></div>
              <div class="neural-pulse"></div>
            </div>
            <div class="customer-info">
              <h4 class="customer-name">{{customer.name}}</h4>
              <p class="customer-email">{{customer.email}}</p>
              <div class="customer-meta">
                <span class="meta-item">
                  <i class="fas fa-map-marker-alt"></i> {{customer.location}}
                </span>
                <span class="meta-item">
                  <i class="fas fa-calendar"></i> Joined {{customer.joinDate}}
                </span>
                <span class="meta-item">
                  <i class="fas fa-clock"></i> {{customer.lastActivity}}
                </span>
              </div>
            </div>
            <div class="customer-score">
              <div class="score-circle">
                <span class="score-value">{{customer.score}}</span>
                <span class="score-label">Score</span>
              </div>
            </div>
          </div>
          
          <div class="customer-body">
            <div class="row">
              <div class="col-md-3">
                <div class="metric-card">
                  <i class="fas fa-shopping-cart"></i>
                  <div class="metric-value">{{customer.totalBookings}}</div>
                  <div class="metric-label">Quantum Trips</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="metric-card">
                  <i class="fas fa-dollar-sign"></i>
                  <div class="metric-value">\${{customer.totalSpent}}</div>
                  <div class="metric-label">Total Spent</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="metric-card">
                  <i class="fas fa-star"></i>
                  <div class="metric-value">{{customer.status | uppercase}}</div>
                  <div class="metric-label">Entity Status</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="action-buttons">
                  <button class="btn-action primary" (click)="viewCustomer(customer)" title="View Profile">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-action success" (click)="contactCustomer(customer)" title="Contact">
                    <i class="fas fa-phone"></i>
                  </button>
                  <button class="btn-action warning" (click)="editCustomer(customer)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-action danger" (click)="deleteCustomer(customer)" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Actions -->
    <div class="floating-actions">
      <div class="action-orb" (click)="exportData()" title="Export Data">
        <i class="fas fa-download"></i>
      </div>
      <div class="action-orb" (click)="analyzePattern()" title="Analyze Patterns">
        <i class="fas fa-chart-bar"></i>
      </div>
      <div class="action-orb" (click)="generateReport()" title="Generate Report">
        <i class="fas fa-chart-line"></i>
      </div>
    </div>
  `,
  styleUrls: ['./customers-cyber.css']
})
export class CustomersCyberComponent {
  searchQuery = '';
  filterStatus = '';
  sortBy = 'name';

  customers: Customer[] = [
    {
      id: 1,
      name: 'Alexandra Chen',
      email: 'alex.chen@quantum.net',
      phone: '+1-555-0123',
      totalBookings: 8,
      totalSpent: 15750,
      status: 'vip',
      joinDate: '2023-01-15',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      location: 'New York',
      lastActivity: '2 hours ago',
      score: 78
    },
    {
      id: 2,
      name: 'Marcus Rodriguez',
      email: 'marcus.r@cybernet.io',
      phone: '+1-555-0124',
      totalBookings: 5,
      totalSpent: 8920,
      status: 'active',
      joinDate: '2023-03-22',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      location: 'Los Angeles',
      lastActivity: '1 day ago',
      score: 78
    },
    {
      id: 3,
      name: 'Zara Al-Rashid',
      email: 'zara.ar@future.ae',
      phone: '+1-555-0125',
      totalBookings: 12,
      totalSpent: 23400,
      status: 'vip',
      joinDate: '2022-11-08',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      location: 'Dubai',
      lastActivity: '30 minutes ago',
      score: 98
    },
    {
      id: 4,
      name: 'Viktor Petrov',
      email: 'viktor.p@matrix.ru',
      phone: '+1-555-0126',
      totalBookings: 3,
      totalSpent: 4580,
      status: 'active',
      joinDate: '2023-06-10',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      location: 'Moscow',
      lastActivity: '3 hours ago',
      score: 65
    },
    {
      id: 5,
      name: 'Luna Kim',
      email: 'luna.kim@neonet.kr',
      phone: '+1-555-0127',
      totalBookings: 1,
      totalSpent: 1250,
      status: 'inactive',
      joinDate: '2023-08-15',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      location: 'Seoul',
      lastActivity: '2 weeks ago',
      score: 45
    }
  ];

  get filteredCustomers(): Customer[] {
    let filtered = this.customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           customer.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           customer.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = !this.filterStatus || customer.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'score':
          return b.score - a.score;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get activeCustomers(): number {
    return this.customers.filter(c => c.status === 'active' || c.status === 'vip').length;
  }

  get vipCustomers(): number {
    return this.customers.filter(c => c.status === 'vip').length;
  }

  get totalSpent(): number {
    return this.customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }

  trackByCustomer(index: number, customer: Customer): number {
    return customer.id;
  }

  addCustomer(): void {
    console.log('Adding new quantum entity...');
  }

  viewCustomer(customer: Customer): void {
    console.log('Viewing neural profile:', customer.name);
  }

  contactCustomer(customer: Customer): void {
    console.log('Initiating quantum communication with:', customer.name);
  }

  editCustomer(customer: Customer): void {
    console.log('Editing neural data for:', customer.name);
  }

  deleteCustomer(customer: Customer): void {
    console.log('Removing entity from matrix:', customer.name);
  }

  exportData(): void {
    console.log('Exporting neural database...');
  }

  analyzePattern(): void {
    console.log('Analyzing quantum patterns...');
  }

  generateReport(): void {
    console.log('Generating neural report...');
  }
}
