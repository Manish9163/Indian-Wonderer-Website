import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Enhanced Dashboard Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-gradient-header rounded">
        <div>
          <h4 class="mb-1">🚀 Dashboard Overview</h4>
          <small class="text-light">Real-time business intelligence and analytics</small>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm dashboard-filter" [(ngModel)]="selectedPeriod" (change)="updatePeriod()" style="width: auto;">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button class="btn btn-light btn-sm" (click)="refreshDashboard()">
            <i class="fas fa-sync-alt" [class.fa-spin]="isRefreshing"></i> Refresh
          </button>
          <button class="btn btn-light btn-sm" (click)="exportDashboard()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <!-- Enhanced Statistics Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="dashboard-stats-card gradient-primary fade-in-up" (click)="onToursCardClick()">
            <div class="stats-icon">
              <i class="fas fa-route"></i>
            </div>
            <div class="stats-metric">{{ stats.totalTours }}</div>
            <div class="stats-label">Active Tours</div>
            <div class="stats-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{ stats.toursGrowth }}% this month
            </div>
            <div class="stats-subtitle">Currently available packages</div>
            <div class="stats-progress">
              <div class="progress-bar primary" [style.width]="'75%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="dashboard-stats-card gradient-success fade-in-up" (click)="onBookingsCardClick()">
            <div class="stats-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="stats-metric">{{ stats.activeBookings }}</div>
            <div class="stats-label">Active Bookings</div>
            <div class="stats-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{ stats.bookingsGrowth }}% this month
            </div>
            <div class="stats-subtitle">Confirmed reservations</div>
            <div class="stats-progress">
              <div class="progress-bar success" [style.width]="'89%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="dashboard-stats-card gradient-info fade-in-up" (click)="onCustomersCardClick()">
            <div class="stats-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stats-metric">{{ stats.totalCustomers | number }}</div>
            <div class="stats-label">Total Customers</div>
            <div class="stats-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{ stats.customersGrowth }}% this month
            </div>
            <div class="stats-subtitle">Registered users</div>
            <div class="stats-progress">
              <div class="progress-bar info" [style.width]="'92%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="dashboard-stats-card gradient-warning fade-in-up" (click)="onRevenueCardClick()">
            <div class="stats-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stats-metric">{{ '$' + (stats.monthlyRevenue | number) }}</div>
            <div class="stats-label">Monthly Revenue</div>
            <div class="stats-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{ stats.revenueGrowth }}% this month
            </div>
            <div class="stats-subtitle">Total earnings</div>
            <div class="stats-progress">
              <div class="progress-bar warning" [style.width]="'96%'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Row -->
      <div class="row g-4 mb-4">
        <!-- Recent Bookings Section -->
        <div class="col-lg-8">
          <div class="card-modern fade-in-up">
            <div class="panel-header">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-1"><i class="fas fa-list"></i> Recent Bookings</h5>
                  <small>Latest customer reservations and activities</small>
                </div>
                <div class="d-flex gap-2">
                  <select class="form-select form-select-sm dashboard-filter" [(ngModel)]="selectedBookingStatus" (change)="filterBookings()" style="width: auto;">
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button class="btn btn-light btn-sm" (click)="refreshBookings()">
                    <i class="fas fa-sync-alt" [class.fa-spin]="isRefreshingBookings"></i> Refresh
                  </button>
                </div>
              </div>
            </div>
            
            <div class="panel-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Tour</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let booking of filteredBookings">
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                            {{ booking.customer.charAt(0) }}
                          </div>
                          {{ booking.customer }}
                        </div>
                      </td>
                      <td>
                        <strong>{{ booking.tour }}</strong>
                        <small class="text-muted d-block">{{ booking.destination || 'International' }}</small>
                      </td>
                      <td>{{ booking.date | date:'short' }}</td>
                      <td>
                        <span class="badge" 
                              [ngClass]="{
                                'bg-success': booking.status === 'confirmed',
                                'bg-warning': booking.status === 'pending',
                                'bg-danger': booking.status === 'cancelled',
                                'bg-info': booking.status === 'processing'
                              }">
                          {{ booking.status | titlecase }}
                        </span>
                      </td>
                      <td>
                        <span class="fw-bold">{{ '$' + booking.amount }}</span>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-info" (click)="viewBookingDetails(booking.id)" title="View Details">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button class="btn btn-success" (click)="editBooking(booking.id)" title="Edit">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-warning" 
                                  (click)="cancelBooking(booking.id)" 
                                  [disabled]="booking.status === 'cancelled'"
                                  title="Cancel">
                            <i class="fas fa-ban"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Popular Tours Section -->
        <div class="col-lg-4">
          <div class="card-modern fade-in-up">
            <div class="panel-header">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-1"><i class="fas fa-star"></i> Popular Tours</h5>
                  <small>Top performing tour packages</small>
                </div>
                <button class="btn btn-light btn-sm" (click)="viewAllTours()">
                  <i class="fas fa-external-link-alt"></i>
                </button>
              </div>
            </div>
            
            <div class="panel-body">
              <div class="popular-tours-list">
                <div class="popular-tour-item" *ngFor="let tour of popularTours; let i = index" (click)="viewTourDetails(tour.id)">
                  <div class="tour-rank">{{ '#' + (i + 1) }}</div>
                  <div class="tour-info">
                    <h6 class="tour-name">{{ tour.name }}</h6>
                    <div class="tour-stats">
                      <span class="stat-item">
                        <i class="fas fa-users"></i>
                        {{ tour.bookings }} bookings
                      </span>
                      <span class="stat-item">
                        <i class="fas fa-star"></i>
                        {{ tour.rating }}
                      </span>
                    </div>
                    <div class="tour-revenue">{{ '$' + (tour.revenue | number) }}</div>
                  </div>
                  <div class="tour-progress">
                    <div class="progress">
                      <div class="progress-bar" 
                           [style.width.%]="tour.percentage"
                           [style.background-color]="tour.color">
                      </div>
                    </div>
                    <span class="percentage">{{ tour.percentage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Panel -->
      <div class="card-modern fade-in-up">
        <div class="panel-header">
          <h5 class="mb-0"><i class="fas fa-bolt"></i> Quick Actions</h5>
        </div>
        <div class="panel-body">
          <div class="row">
            <div class="col-md-3 mb-3">
              <button class="quick-action-btn" (click)="createNewTour()">
                <div class="action-icon">
                  <i class="fas fa-plus-circle"></i>
                </div>
                <div class="action-text">
                  <h6>Create New Tour</h6>
                  <small>Add a new tour package</small>
                </div>
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="quick-action-btn" (click)="manageBookings()">
                <div class="action-icon">
                  <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="action-text">
                  <h6>Manage Bookings</h6>
                  <small>View all reservations</small>
                </div>
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="quick-action-btn" (click)="viewAnalytics()">
                <div class="action-icon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="action-text">
                  <h6>Analytics</h6>
                  <small>Business insights</small>
                </div>
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="quick-action-btn" (click)="manageCustomers()">
                <div class="action-icon">
                  <i class="fas fa-users"></i>
                </div>
                <div class="action-text">
                  <h6>Customers</h6>
                  <small>Manage user accounts</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Activity Monitor -->
      <div class="card-modern fade-in-up" *ngIf="liveActivities.length > 0">
        <div class="panel-header">
          <h5 class="mb-0"><i class="fas fa-broadcast-tower pulse"></i> Live Activity Monitor</h5>
        </div>
        <div class="panel-body">
          <div class="live-activities">
            <div class="activity-item" *ngFor="let activity of liveActivities">
              <div class="activity-icon">
                <i [class]="activity.icon" [style.color]="activity.color"></i>
              </div>
              <div class="activity-content">
                <strong>{{ activity.title }}</strong>
                <span class="activity-description">{{ activity.description }}</span>
                <small class="activity-time">{{ activity.timestamp | date:'short' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .bg-gradient-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }

    .dashboard-filter {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 20px;
      color: #2c3e50;
    }

    .dashboard-stats-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      padding: 2rem;
      text-align: center;
      transition: all 0.4s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      min-height: 280px;
    }

    .dashboard-stats-card:hover {
      transform: translateY(-15px) scale(1.02);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    }

    .dashboard-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border-radius: 25px 25px 0 0;
    }

    .gradient-primary::before { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
    .gradient-success::before { background: linear-gradient(90deg, #10b981, #059669); }
    .gradient-info::before { background: linear-gradient(90deg, #06b6d4, #0891b2); }
    .gradient-warning::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

    .stats-icon {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .stats-metric {
      font-size: 2.8rem;
      font-weight: 900;
      margin-bottom: 0.8rem;
      background: linear-gradient(45deg, #2c3e50, #34495e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stats-label {
      font-size: 1.2rem;
      color: #7f8c8d;
      font-weight: 600;
      margin-bottom: 1rem;
      letter-spacing: 0.5px;
    }

    .stats-change {
      font-size: 1rem;
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border-radius: 25px;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .stats-change.positive {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .stats-subtitle {
      font-size: 0.9rem;
      color: #95a5a6;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .stats-progress {
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .stats-progress .progress-bar {
      height: 100%;
      border-radius: 10px;
      transition: width 0.8s ease;
    }

    .progress-bar.primary { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
    .progress-bar.success { background: linear-gradient(90deg, #10b981, #059669); }
    .progress-bar.info { background: linear-gradient(90deg, #06b6d4, #0891b2); }
    .progress-bar.warning { background: linear-gradient(90deg, #f59e0b, #d97706); }

    .card-modern {
      border: none;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .card-modern:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .panel-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem 2rem;
    }

    .panel-body {
      padding: 2rem;
    }

    .fade-in-up {
      animation: fadeInUp 0.8s ease forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .btn {
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      padding: 0.6rem 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.85rem;
    }

    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .btn-light {
      background: rgba(255, 255, 255, 0.9);
      color: #2c3e50;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }

    .btn-light:hover {
      background: white;
      color: #667eea;
      border-color: #667eea;
    }

    .popular-tours-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .popular-tour-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-radius: 15px;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .popular-tour-item:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(10px);
    }

    .tour-rank {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
      margin-right: 1rem;
      min-width: 40px;
    }

    .tour-info {
      flex: 1;
    }

    .tour-name {
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 600;
    }

    .tour-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .stat-item {
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .tour-revenue {
      font-weight: bold;
      color: #10b981;
    }

    .tour-progress {
      min-width: 100px;
      text-align: right;
    }

    .progress {
      height: 6px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      margin-bottom: 0.25rem;
    }

    .percentage {
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid transparent;
      border-radius: 15px;
      transition: all 0.3s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .quick-action-btn:hover {
      background: rgba(255, 255, 255, 1);
      border-color: #667eea;
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .action-icon {
      font-size: 2rem;
      color: #667eea;
      margin-right: 1rem;
    }

    .action-text h6 {
      margin-bottom: 0.25rem;
      color: #2c3e50;
    }

    .action-text small {
      color: #7f8c8d;
    }

    .live-activities {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .activity-icon {
      font-size: 1.5rem;
      margin-right: 1rem;
      min-width: 40px;
      text-align: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-description {
      color: #7f8c8d;
      margin-left: 0.5rem;
    }

    .activity-time {
      display: block;
      color: #95a5a6;
      margin-top: 0.25rem;
    }

    .pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .form-select {
      border-radius: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
    }

    .form-select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }

    @media (max-width: 768px) {
      .dashboard-stats-card {
        margin-bottom: 1.5rem;
        min-height: 250px;
        padding: 1.5rem;
      }
      
      .stats-metric {
        font-size: 2.2rem;
      }
      
      .stats-icon {
        font-size: 2.8rem;
      }
      
      .dashboard-container {
        padding: 15px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Router injection
  private router = inject(Router);
  
  // Enhanced properties
  selectedPeriod: string = 'month';
  selectedBookingStatus: string = 'all';
  isRefreshing: boolean = false;
  isRefreshingBookings: boolean = false;

  // Enhanced stats with growth metrics
  stats = {
    totalTours: 24,
    activeBookings: 156,
    totalCustomers: 1247,
    monthlyRevenue: 45620,
    toursGrowth: 15.3,
    bookingsGrowth: 23.7,
    customersGrowth: 8.9,
    revenueGrowth: 31.2
  };

  // Enhanced bookings data
  recentBookings = [
    { 
      id: 'BK001',
      customer: 'John Doe', 
      tour: 'Bali Adventure', 
      destination: 'Indonesia',
      date: new Date('2024-03-15'), 
      status: 'confirmed', 
      amount: 1200 
    },
    { 
      id: 'BK002',
      customer: 'Sarah Smith', 
      tour: 'Tokyo Explorer', 
      destination: 'Japan',
      date: new Date('2024-03-18'), 
      status: 'pending', 
      amount: 890 
    },
    { 
      id: 'BK003',
      customer: 'Mike Johnson', 
      tour: 'Paris Romance', 
      destination: 'France',
      date: new Date('2024-03-20'), 
      status: 'confirmed', 
      amount: 1500 
    },
    { 
      id: 'BK004',
      customer: 'Emily Brown', 
      tour: 'Safari Kenya', 
      destination: 'Kenya',
      date: new Date('2024-03-22'), 
      status: 'processing', 
      amount: 2100 
    }
  ];

  filteredBookings = [...this.recentBookings];

  // Enhanced popular tours
  popularTours = [
    { 
      id: 'TR001',
      name: 'Bali Adventure', 
      bookings: 45, 
      percentage: 90,
      rating: 4.9,
      revenue: 13455,
      color: '#3b82f6'
    },
    { 
      id: 'TR002',
      name: 'Tokyo Explorer', 
      bookings: 38, 
      percentage: 76,
      rating: 4.8,
      revenue: 11362,
      color: '#10b981'
    },
    { 
      id: 'TR003',
      name: 'Paris Romance', 
      bookings: 32, 
      percentage: 64,
      rating: 4.7,
      revenue: 9600,
      color: '#f59e0b'
    },
    { 
      id: 'TR004',
      name: 'Safari Kenya', 
      bookings: 28, 
      percentage: 56,
      rating: 4.6,
      revenue: 8372,
      color: '#ef4444'
    }
  ];

  // Live activities
  liveActivities: any[] = [];

  ngOnInit() {
    this.startLiveActivityMonitor();
    this.filterBookings();
  }

  // Dashboard management methods
  updatePeriod() {
    console.log(`Updating dashboard for period: ${this.selectedPeriod}`);
    this.refreshDashboard();
  }

  refreshDashboard() {
    console.log('Refreshing dashboard data...');
    this.isRefreshing = true;
    
    setTimeout(() => {
      // Simulate data update
      const variation = () => (Math.random() - 0.5) * 0.1;
      
      this.stats = {
        ...this.stats,
        totalTours: Math.round(this.stats.totalTours * (1 + variation())),
        activeBookings: Math.round(this.stats.activeBookings * (1 + variation())),
        totalCustomers: Math.round(this.stats.totalCustomers * (1 + variation())),
        monthlyRevenue: Math.round(this.stats.monthlyRevenue * (1 + variation()))
      };
      
      this.isRefreshing = false;
      alert('Dashboard refreshed successfully!');
    }, 2000);
  }

  exportDashboard() {
    console.log('Exporting dashboard data...');
    const dashboardData = {
      generatedOn: new Date().toLocaleString(),
      period: this.selectedPeriod,
      stats: this.stats,
      totalBookings: this.recentBookings.length,
      topTour: this.popularTours[0].name
    };
    
    const content = this.generateDashboardReport(dashboardData);
    this.downloadFile(content, `dashboard-report-${Date.now()}.html`, 'text/html');
    alert('Dashboard report exported successfully!');
  }

  // Booking management methods
  filterBookings() {
    if (this.selectedBookingStatus === 'all') {
      this.filteredBookings = [...this.recentBookings];
    } else {
      this.filteredBookings = this.recentBookings.filter(
        booking => booking.status === this.selectedBookingStatus
      );
    }
  }

  refreshBookings() {
    console.log('Refreshing bookings data...');
    this.isRefreshingBookings = true;
    
    setTimeout(() => {
      // Simulate fresh data
      const newBookings = [
        { 
          id: 'BK005',
          customer: 'Anna Wilson', 
          tour: 'Swiss Alps', 
          destination: 'Switzerland',
          date: new Date('2024-03-25'), 
          status: 'confirmed', 
          amount: 1800 
        },
        { 
          id: 'BK006',
          customer: 'David Lee', 
          tour: 'Maldives Escape', 
          destination: 'Maldives',
          date: new Date('2024-03-26'), 
          status: 'pending', 
          amount: 2800 
        }
      ];
      
      this.recentBookings = [...newBookings, ...this.recentBookings.slice(0, 2)];
      this.filterBookings();
      this.isRefreshingBookings = false;
      alert('Bookings refreshed successfully!');
    }, 1500);
  }

  viewBookingDetails(bookingId: string) {
    console.log(`Viewing details for booking: ${bookingId}`);
    const booking = this.recentBookings.find(b => b.id === bookingId);
    if (booking) {
      const details = `Booking Details:\n\nID: ${booking.id}\nCustomer: ${booking.customer}\nTour: ${booking.tour}\nDestination: ${booking.destination}\nDate: ${booking.date.toLocaleDateString()}\nStatus: ${booking.status.toUpperCase()}\nAmount: $${booking.amount}`;
      alert(details);
    }
  }

  editBooking(bookingId: string) {
    console.log(`Editing booking: ${bookingId}`);
    alert(`Edit booking ${bookingId} - This would open the booking edit form.`);
  }

  cancelBooking(bookingId: string) {
    console.log(`Cancelling booking: ${bookingId}`);
    const confirmed = confirm(`Are you sure you want to cancel booking ${bookingId}?`);
    if (confirmed) {
      const booking = this.recentBookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
        this.filterBookings();
        alert(`Booking ${bookingId} cancelled successfully!`);
      }
    }
  }

  // Tour management methods
  viewAllTours() {
    console.log('Redirecting to tours management...');
    alert('Redirecting to Tours Management section...');
  }

  viewTourDetails(tourId: string) {
    console.log(`Viewing tour details: ${tourId}`);
    const tour = this.popularTours.find(t => t.id === tourId);
    if (tour) {
      const details = `Tour Details:\n\nName: ${tour.name}\nBookings: ${tour.bookings}\nRating: ${tour.rating}/5\nRevenue: $${tour.revenue}\nPopularity: ${tour.percentage}%`;
      alert(details);
    }
  }

  // Quick action methods
  createNewTour() {
    console.log('Creating new tour...');
    try {
      // Navigate to tours page
      this.router.navigate(['/tours']).then(
        (success) => console.log('Navigation to tours successful:', success),
        (error) => console.error('Navigation to tours failed:', error)
      );
    } catch (error) {
      console.error('Error navigating to tours:', error);
      alert('Navigation failed. Using fallback...');
      window.location.href = '/tours';
    }
  }

  manageBookings() {
    console.log('Managing bookings...');
    try {
      // Navigate to bookings page
      this.router.navigate(['/bookings']).then(
        (success) => console.log('Navigation to bookings successful:', success),
        (error) => console.error('Navigation to bookings failed:', error)
      );
    } catch (error) {
      console.error('Error navigating to bookings:', error);
      alert('Navigation failed. Using fallback...');
      window.location.href = '/bookings';
    }
  }

  viewAnalytics() {
    console.log('Viewing analytics...');
    try {
      // Navigate to analytics page
      this.router.navigate(['/analytics']).then(
        (success) => console.log('Navigation to analytics successful:', success),
        (error) => console.error('Navigation to analytics failed:', error)
      );
    } catch (error) {
      console.error('Error navigating to analytics:', error);
      alert('Navigation failed. Using fallback...');
      window.location.href = '/analytics';
    }
  }

  manageCustomers() {
    console.log('Managing customers...');
    try {
      // Navigate to customers page
      this.router.navigate(['/customers']).then(
        (success) => console.log('Navigation to customers successful:', success),
        (error) => console.error('Navigation to customers failed:', error)
      );
    } catch (error) {
      console.error('Error navigating to customers:', error);
      alert('Navigation failed. Using fallback...');
      window.location.href = '/customers';
    }
  }

  // Card click handlers
  onToursCardClick() {
    console.log('Tours card clicked');
    alert(`Tour Statistics:\n\nActive Tours: ${this.stats.totalTours}\nGrowth: +${this.stats.toursGrowth}%\nTop Performer: ${this.popularTours[0].name}`);
  }

  onBookingsCardClick() {
    console.log('Bookings card clicked');
    alert(`Booking Statistics:\n\nActive Bookings: ${this.stats.activeBookings}\nGrowth: +${this.stats.bookingsGrowth}%\nConfirmed: ${this.recentBookings.filter(b => b.status === 'confirmed').length}`);
  }

  onCustomersCardClick() {
    console.log('Customers card clicked');
    alert(`Customer Statistics:\n\nTotal Customers: ${this.stats.totalCustomers}\nGrowth: +${this.stats.customersGrowth}%\nActive This Month: ${Math.round(this.stats.totalCustomers * 0.23)}`);
  }

  onRevenueCardClick() {
    console.log('Revenue card clicked');
    alert(`Revenue Statistics:\n\nMonthly Revenue: $${this.stats.monthlyRevenue}\nGrowth: +${this.stats.revenueGrowth}%\nTop Revenue Source: ${this.popularTours[0].name}`);
  }

  // Live activity monitor
  startLiveActivityMonitor() {
    console.log('Starting live activity monitor...');
    
    setInterval(() => {
      this.addLiveActivity();
    }, 10000);
  }

  addLiveActivity() {
    const activities = [
      {
        icon: 'fas fa-user-plus',
        color: '#10b981',
        title: 'New Customer Registration',
        description: 'John Smith registered for Bali Adventure',
        timestamp: new Date()
      },
      {
        icon: 'fas fa-calendar-check',
        color: '#3b82f6',
        title: 'Booking Confirmed',
        description: 'Tokyo Explorer tour booked by Sarah Wilson',
        timestamp: new Date()
      },
      {
        icon: 'fas fa-star',
        color: '#f59e0b',
        title: 'New Review',
        description: '5-star review for Paris Romance tour',
        timestamp: new Date()
      },
      {
        icon: 'fas fa-dollar-sign',
        color: '#ef4444',
        title: 'Payment Received',
        description: '$1,500 payment processed successfully',
        timestamp: new Date()
      }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    this.liveActivities.unshift(randomActivity);

    // Keep only last 5 activities
    if (this.liveActivities.length > 5) {
      this.liveActivities.pop();
    }
  }

  // Utility methods
  generateDashboardReport(data: any): string {
    return `<!DOCTYPE html><html><head><title>Dashboard Report</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}.header{text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:10px}.metric{background:#f8f9fa;padding:20px;margin:10px 0;border-radius:8px;border-left:4px solid #667eea}.metric-value{font-size:24px;font-weight:bold;color:#2c3e50}.metric-label{color:#7f8c8d;margin-top:5px}</style></head><body><div class="header"><h1>🚀 Dashboard Report</h1><p>Generated on: ${data.generatedOn}</p><p>Report Period: ${data.period}</p></div><div class="metric"><div class="metric-value">${data.stats.totalTours}</div><div class="metric-label">Total Tours</div></div><div class="metric"><div class="metric-value">${data.stats.activeBookings}</div><div class="metric-label">Active Bookings</div></div><div class="metric"><div class="metric-value">${data.stats.totalCustomers}</div><div class="metric-label">Total Customers</div></div><div class="metric"><div class="metric-value">$${data.stats.monthlyRevenue}</div><div class="metric-label">Monthly Revenue</div></div><div class="metric"><div class="metric-value">${data.topTour}</div><div class="metric-label">Top Performing Tour</div></div></body></html>`;
  }

  downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
