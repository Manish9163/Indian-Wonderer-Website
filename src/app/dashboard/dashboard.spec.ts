import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Enhanced Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="stats-card fade-in-up">
          <div class="icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;">
            <i class="fas fa-route"></i>
          </div>
          <h3 class="mb-1">{{stats.totalTours}}</h3>
          <p class="text-muted mb-0">Total Tours</p>
          <div class="analytics-change positive">
            <i class="fas fa-arrow-up"></i>
            +{{stats.toursGrowth}}% this month
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="stats-card fade-in-up" style="animation-delay: 0.1s;">
          <div class="icon" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
            <i class="fas fa-calendar-check"></i>
          </div>
          <h3 class="mb-1">{{stats.activeBookings}}</h3>
          <p class="text-muted mb-0">Active Bookings</p>
          <div class="analytics-change positive">
            <i class="fas fa-arrow-up"></i>
            +{{stats.bookingsGrowth}}% this week
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="stats-card fade-in-up" style="animation-delay: 0.2s;">
          <div class="icon" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
            <i class="fas fa-users"></i>
          </div>
          <h3 class="mb-1">{{stats.totalCustomers}}</h3>
          <p class="text-muted mb-0">Total Customers</p>
          <div class="analytics-change positive">
            <i class="fas fa-arrow-up"></i>
            +{{stats.customersGrowth}}% this month
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="stats-card fade-in-up" style="animation-delay: 0.3s;">
          <div class="icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white;">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <h3 class="mb-1">\${{stats.monthlyRevenue.toLocaleString()}}</h3>
          <p class="text-muted mb-0">Monthly Revenue</p>
          <div class="analytics-change positive">
            <i class="fas fa-arrow-up"></i>
            +{{stats.revenueGrowth}}% vs last month
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card-modern">
          <div class="card-header-modern">
            <h6 class="mb-0">Quick Actions</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-primary w-100 p-3" (click)="quickAction('add-tour')">
                  <i class="fas fa-plus-circle fa-2x mb-2"></i>
                  <div>Add Tour</div>
                </button>
              </div>
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-success w-100 p-3" (click)="quickAction('new-booking')">
                  <i class="fas fa-calendar-plus fa-2x mb-2"></i>
                  <div>New Booking</div>
                </button>
              </div>
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-info w-100 p-3" (click)="quickAction('add-customer')">
                  <i class="fas fa-user-plus fa-2x mb-2"></i>
                  <div>Add Customer</div>
                </button>
              </div>
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-warning w-100 p-3" (click)="quickAction('process-payment')">
                  <i class="fas fa-credit-card fa-2x mb-2"></i>
                  <div>Process Payment</div>
                </button>
              </div>
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-secondary w-100 p-3" (click)="quickAction('generate-report')">
                  <i class="fas fa-chart-bar fa-2x mb-2"></i>
                  <div>Generate Report</div>
                </button>
              </div>
              <div class="col-md-2 col-6 mb-3">
                <button class="btn btn-outline-dark w-100 p-3" (click)="quickAction('settings')">
                  <i class="fas fa-cog fa-2x mb-2"></i>
                  <div>Settings</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Row -->
    <div class="row">
      <!-- Recent Bookings -->
      <div class="col-md-8 mb-4">
        <div class="card-modern">
          <div class="card-header-modern d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Recent Bookings</h6>
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm" [(ngModel)]="bookingFilter" (change)="filterBookings()">
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-modern">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Tour</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let booking of filteredRecentBookings; trackBy: trackByBookingId">
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="avatar-sm me-2">{{booking.customer.charAt(0)}}</div>
                        <div>
                          <div class="fw-semibold">{{booking.customer}}</div>
                          <small class="text-muted">{{booking.email}}</small>
                        </div>
                      </div>
                    </td>
                    <td>{{booking.tour}}</td>
                    <td>{{booking.date | date:'MMM d, y'}}</td>
                    <td>{{booking.guests}}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': booking.status === 'confirmed',
                        'bg-warning': booking.status === 'pending',
                        'bg-info': booking.status === 'completed'
                      }">{{booking.status}}</span>
                    </td>
                    <td class="fw-semibold">\${{booking.amount}}</td>
                    <td>
                      <span class="payment-status" [ngClass]="booking.paymentStatus">
                        <i [class]="getPaymentStatusIcon(booking.paymentStatus)"></i>
                        {{booking.paymentStatus | titlecase}}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar Stats -->
      <div class="col-md-4">
        <!-- Popular Tours -->
        <div class="card-modern mb-4">
          <div class="card-header-modern">
            <h6 class="mb-0">Popular Tours</h6>
          </div>
          <div class="card-body">
            <div *ngFor="let tour of popularTours" class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold">{{tour.name}}</span>
                <span class="text-muted">{{tour.bookings}} bookings</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">Revenue: \${{tour.revenue.toLocaleString()}}</small>
                <small class="text-success">+{{tour.growth}}%</small>
              </div>
              <div class="progress progress-modern">
                <div class="progress-bar" [style.width.%]="tour.percentage"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Overview -->
        <div class="card-modern mb-4">
          <div class="card-header-modern">
            <h6 class="mb-0">Revenue Overview</h6>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-6 mb-3">
                <div class="analytics-metric text-success">\${{revenueOverview.thisMonth.toLocaleString()}}</div>
                <div class="analytics-label">This Month</div>
              </div>
              <div class="col-6 mb-3">
                <div class="analytics-metric text-primary">\${{revenueOverview.lastMonth.toLocaleString()}}</div>
                <div class="analytics-label">Last Month</div>
              </div>
              <div class="col-12">
                <div class="analytics-change" [ngClass]="revenueOverview.change >= 0 ? 'positive' : 'negative'">
                  <i [class]="revenueOverview.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{Math.abs(revenueOverview.change)}}% change from last month
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Tours -->
        <div class="card-modern">
          <div class="card-header-modern">
            <h6 class="mb-0">Upcoming Tours</h6>
          </div>
          <div class="card-body">
            <div *ngFor="let tour of upcomingTours" class="mb-3 p-3 rounded" style="background: var(--light-color);">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="fw-semibold">{{tour.name}}</div>
                <span class="badge bg-primary">{{tour.participants}} guests</span>
              </div>
              <div class="d-flex align-items-center text-muted">
                <i class="fas fa-calendar me-2"></i>
                <small>{{tour.date | date:'MMM d, y'}} at {{tour.date | date:'h:mm a'}}</small>
              </div>
              <div class="d-flex align-items-center text-muted mt-1">
                <i class="fas fa-map-marker-alt me-2"></i>
                <small>{{tour.destination}}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Alerts -->
    <div class="row mt-4" *ngIf="alerts.length > 0">
      <div class="col-md-12">
        <div class="card-modern">
          <div class="card-header-modern">
            <h6 class="mb-0">System Alerts</h6>
          </div>
          <div class="card-body">
            <div *ngFor="let alert of alerts" 
                 class="alert" 
                 [ngClass]="{
                   'alert-warning': alert.type === 'warning',
                   'alert-info': alert.type === 'info',
                   'alert-success': alert.type === 'success',
                   'alert-danger': alert.type === 'danger'
                 }" 
                 role="alert">
              <div class="d-flex align-items-center">
                <i [class]="alert.icon + ' me-2'"></i>
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{alert.title}}</div>
                  <small>{{alert.message}}</small>
                </div>
                <button type="button" class="btn-close" (click)="dismissAlert(alert.id)"></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 32px;
      height: 32px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .btn-outline-primary:hover,
    .btn-outline-success:hover,
    .btn-outline-info:hover,
    .btn-outline-warning:hover,
    .btn-outline-secondary:hover,
    .btn-outline-dark:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .quick-action-btn {
      transition: all 0.3s ease;
      border-radius: 12px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  bookingFilter = '';
  Math = Math;
  
  stats = {
    totalTours: 156,
    toursGrowth: 12.5,
    activeBookings: 89,
    bookingsGrowth: 18.2,
    totalCustomers: 1247,
    customersGrowth: 8.7,
    monthlyRevenue: 285750,
    revenueGrowth: 15.3
  };

  recentBookings = [
    {
      id: 'BK001',
      customer: 'John Doe',
      email: 'john.doe@email.com',
      tour: 'Bali Adventure',
      date: new Date('2024-03-15'),
      guests: 2,
      status: 'confirmed',
      amount: 2400,
      paymentStatus: 'paid'
    },
    {
      id: 'BK002',
      customer: 'Sarah Smith',
      email: 'sarah.smith@email.com',
      tour: 'Tokyo Explorer',
      date: new Date('2024-03-18'),
      guests: 1,
      status: 'pending',
      amount: 890,
      paymentStatus: 'pending'
    },
    {
      id: 'BK003',
      customer: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      tour: 'Paris Romance',
      date: new Date('2024-03-20'),
      guests: 2,
      status: 'confirmed',
      amount: 3000,
      paymentStatus: 'paid'
    },
    {
      id: 'BK004',
      customer: 'Emily Brown',
      email: 'emily.brown@email.com',
      tour: 'Safari Kenya',
      date: new Date('2024-03-22'),
      guests: 4,
      status: 'pending',
      amount: 8400,
      paymentStatus: 'pending'
    },
    {
      id: 'BK005',
      customer: 'David Wilson',
      email: 'david.wilson@email.com',
      tour: 'Swiss Alps',
      date: new Date('2024-03-25'),
      guests: 3,
      status: 'confirmed',
      amount: 5400,
      paymentStatus: 'paid'
    },
    {
      id: 'BK006',
      customer: 'Lisa Garcia',
      email: 'lisa.garcia@email.com',
      tour: 'Maldives Escape',
      date: new Date('2024-03-28'),
      guests: 2,
      status: 'completed',
      amount: 5600,
      paymentStatus: 'paid'
    }
  ];

  filteredRecentBookings = this.recentBookings;

  popularTours = [
    { name: 'Bali Adventure', bookings: 45, revenue: 108000, growth: 15.2, percentage: 85 },
    { name: 'Tokyo Explorer', bookings: 38, revenue: 76000, growth: 12.8, percentage: 72 },
    { name: 'Paris Romance', bookings: 35, revenue: 105000, growth: 18.5, percentage: 68 },
    { name: 'Safari Kenya', bookings: 28, revenue: 196000, growth: 25.1, percentage: 55 },
    { name: 'Swiss Alps', bookings: 24, revenue: 129600, growth: 8.3, percentage: 48 }
  ];

  revenueOverview = {
    thisMonth: 285750,
    lastMonth: 248320,
    change: 15.1
  };

  upcomingTours = [
    {
      name: 'Bali Sunset Tour',
      date: new Date('2024-03-30T16:00:00'),
      participants: 8,
      destination: 'Uluwatu, Bali'
    },
    {
      name: 'Tokyo Food Walk',
      date: new Date('2024-03-31T10:00:00'),
      participants: 6,
      destination: 'Shibuya, Tokyo'
    },
    {
      name: 'Swiss Mountain Hike',
      date: new Date('2024-04-01T08:00:00'),
      participants: 12,
      destination: 'Jungfraujoch, Switzerland'
    }
  ];

  alerts = [
    {
      id: 1,
      type: 'warning',
      icon: 'fas fa-exclamation-triangle',
      title: 'Payment Processing Delay',
      message: '3 payments are experiencing processing delays. Please check payment gateway status.'
    },
    {
      id: 2,
      type: 'info',
      icon: 'fas fa-info-circle',
      title: 'High Demand Alert',
      message: 'Bali Adventure tour is 90% booked for next month. Consider adding more dates.'
    },
    {
      id: 3,
      type: 'success',
      icon: 'fas fa-check-circle',
      title: 'Monthly Target Achieved',
      message: 'Congratulations! You\'ve achieved 105% of your monthly revenue target.'
    }
  ];

  ngOnInit() {
    this.filterBookings();
  }

  filterBookings() {
    if (this.bookingFilter) {
      this.filteredRecentBookings = this.recentBookings.filter(booking => 
        booking.status === this.bookingFilter
      );
    } else {
      this.filteredRecentBookings = this.recentBookings;
    }
  }

  trackByBookingId(index: number, booking: any): string {
    return booking.id;
  }

  getPaymentStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'paid': 'fas fa-check-circle',
      'pending': 'fas fa-clock',
      'failed': 'fas fa-times-circle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  quickAction(action: string) {
    console.log('Quick action triggered:', action);
    switch (action) {
      case 'add-tour':
        // Navigate to add tour page or open modal
        break;
      case 'new-booking':
        // Navigate to new booking page
        break;
      case 'add-customer':
        // Navigate to add customer page
        break;
      case 'process-payment':
        // Navigate to payment processing page
        break;
      case 'generate-report':
        // Open report generation modal
        break;
      case 'settings':
        // Navigate to settings page
        break;
    }
  }

  dismissAlert(alertId: number) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }
}