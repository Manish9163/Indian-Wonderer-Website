import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-dashboard">
      <!-- Key Metrics -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up">
            <div class="analytics-metric">{{analytics.totalRevenue | number:'1.0-0'}}</div>
            <div class="analytics-label">Total Revenue</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.revenueGrowth}}% from last month
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="analytics-metric">{{analytics.totalBookings}}</div>
            <div class="analytics-label">Total Bookings</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.bookingsGrowth}}% this month
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up" style="animation-delay: 0.2s;">
            <div class="analytics-metric">{{analytics.averageBookingValue | currency}}</div>
            <div class="analytics-label">Avg Booking Value</div>
            <div class="analytics-change negative">
              <i class="fas fa-arrow-down"></i>
              -{{analytics.avgValueChange}}% from last month
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up" style="animation-delay: 0.3s;">
            <div class="analytics-metric">{{analytics.conversionRate}}%</div>
            <div class="analytics-label">Conversion Rate</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.conversionGrowth}}% this month
            </div>
          </div>
        </div>
      </div>

      <!-- Charts and Detailed Analytics -->
      <div class="row mb-4">
        <div class="col-md-8">
          <div class="card-modern">
            <div class="card-header-modern d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Revenue Trends</h6>
              <select class="form-select" style="width: auto;" [(ngModel)]="revenueTimeframe">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas id="revenueChart" width="400" height="200"></canvas>
                <!-- Placeholder for chart -->
                <div class="d-flex align-items-center justify-content-center h-100">
                  <div class="text-center">
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Revenue chart will be rendered here</p>
                    <small class="text-muted">Integration with Chart.js or similar library needed</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card-modern">
            <div class="card-header-modern">
              <h6 class="mb-0">Top Destinations</h6>
            </div>
            <div class="card-body">
              <div *ngFor="let destination of topDestinations; let i = index" class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center">
                    <div class="me-3" style="font-size: 1.5rem;">{{destination.flag}}</div>
                    <div>
                      <div class="fw-semibold">{{destination.name}}</div>
                      <small class="text-muted">{{destination.bookings}} bookings</small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-semibold">{{destination.revenue | currency}}</div>
                    <small class="text-success">{{destination.growth}}%</small>
                  </div>
                </div>
                <div class="progress progress-modern">
                  <div class="progress-bar" [style.width.%]="destination.percentage"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Analytics -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card-modern">
            <div class="card-header-modern">
              <h6 class="mb-0">Booking Status Distribution</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div *ngFor="let status of bookingStatus" class="col-6 mb-3">
                  <div class="text-center p-3 rounded" [style.background]="status.color + '15'">
                    <div class="h4 mb-1" [style.color]="status.color">{{status.count}}</div>
                    <div class="text-muted">{{status.label}}</div>
                    <div class="progress progress-modern mt-2">
                      <div class="progress-bar" [style.background]="status.color" [style.width.%]="status.percentage"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card-modern">
            <div class="card-header-modern">
              <h6 class="mb-0">Payment Analytics</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-4 text-center">
                  <div class="analytics-metric text-success">{{paymentAnalytics.successRate}}%</div>
                  <div class="analytics-label">Success Rate</div>
                </div>
                <div class="col-4 text-center">
                  <div class="analytics-metric text-warning">{{paymentAnalytics.pendingPayments}}</div>
                  <div class="analytics-label">Pending</div>
                </div>
                <div class="col-4 text-center">
                  <div class="analytics-metric text-danger">{{paymentAnalytics.failedPayments}}</div>
                  <div class="analytics-label">Failed</div>
                </div>
              </div>
              <hr>
              <div class="row">
                <div class="col-6">
                  <small class="text-muted">Total Processed</small>
                  <div class="h5 mb-0">{{paymentAnalytics.totalProcessed | currency}}</div>
                </div>
                <div class="col-6">
                  <small class="text-muted">Processing Fees</small>
                  <div class="h5 mb-0">{{paymentAnalytics.processingFees | currency}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="card-modern">
        <div class="card-header-modern">
          <h6 class="mb-0">Recent Activities</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-modern">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Activity</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let activity of recentActivities">
                  <td>{{activity.timestamp | date:'short'}}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <i [class]="activity.icon + ' me-2'" [style.color]="activity.iconColor"></i>
                      {{activity.description}}
                    </div>
                  </td>
                  <td>{{activity.user}}</td>
                  <td>{{activity.amount | currency}}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-success': activity.status === 'completed',
                      'bg-warning': activity.status === 'pending',
                      'bg-danger': activity.status === 'failed'
                    }">{{activity.status}}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class AnalyticsComponent implements OnInit {
  revenueTimeframe = '30d';
  
  analytics = {
    totalRevenue: 285750,
    revenueGrowth: 12.5,
    totalBookings: 1247,
    bookingsGrowth: 8.2,
    averageBookingValue: 2890,
    avgValueChange: 3.1,
    conversionRate: 24.8,
    conversionGrowth: 5.3
  };

  topDestinations = [
    { name: 'Bali, Indonesia', flag: '🇮🇩', bookings: 156, revenue: 45000, growth: 15.2, percentage: 85 },
    { name: 'Tokyo, Japan', flag: '🇯🇵', bookings: 134, revenue: 38000, growth: 12.8, percentage: 72 },
    { name: 'Paris, France', flag: '🇫🇷', bookings: 121, revenue: 42000, growth: 18.5, percentage: 68 },
    { name: 'Maldives', flag: '🇲🇻', bookings: 98, revenue: 55000, growth: 25.1, percentage: 55 },
    { name: 'Switzerland', flag: '🇨🇭', bookings: 87, revenue: 48000, growth: 8.3, percentage: 48 }
  ];

  bookingStatus = [
    { label: 'Confirmed', count: 856, percentage: 68.7, color: '#10b981' },
    { label: 'Pending', count: 234, percentage: 18.8, color: '#f59e0b' },
    { label: 'Cancelled', count: 98, percentage: 7.9, color: '#ef4444' },
    { label: 'Completed', count: 59, percentage: 4.7, color: '#6366f1' }
  ];

  paymentAnalytics = {
    successRate: 94.2,
    pendingPayments: 23,
    failedPayments: 8,
    totalProcessed: 285750,
    processingFees: 8573
  };

  recentActivities = [
    {
      timestamp: new Date(Date.now() - 300000),
      description: 'New booking received',
      user: 'John Doe',
      amount: 2400,
      status: 'pending',
      icon: 'fas fa-calendar-plus',
      iconColor: '#f59e0b'
    },
    {
      timestamp: new Date(Date.now() - 900000),
      description: 'Payment processed',
      user: 'Sarah Smith',
      amount: 1890,
      status: 'completed',
      icon: 'fas fa-credit-card',
      iconColor: '#10b981'
    },
    {
      timestamp: new Date(Date.now() - 1800000),
      description: 'Tour completed',
      user: 'Mike Johnson',
      amount: 3200,
      status: 'completed',
      icon: 'fas fa-check-circle',
      iconColor: '#6366f1'
    },
    {
      timestamp: new Date(Date.now() - 3600000),
      description: 'Payment failed',
      user: 'Emily Brown',
      amount: 2100,
      status: 'failed',
      icon: 'fas fa-exclamation-circle',
      iconColor: '#ef4444'
    },
    {
      timestamp: new Date(Date.now() - 7200000),
      description: 'Booking cancelled',
      user: 'David Wilson',
      amount: 1650,
      status: 'failed',
      icon: 'fas fa-times-circle',
      iconColor: '#ef4444'
    }
  ];

  ngOnInit() {
    this.renderRevenueChart();
  }

  renderRevenueChart() {
    const ctx = (document.getElementById('revenueChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          label: 'Revenue',
          data: [12000, 15000, 18000, 22000, 20000, 25000, 27000, 28500],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Monthly Revenue' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Method to initialize charts (requires Chart.js integration)
  initializeCharts() {
    // Chart initialization code would go here
    // Example: Revenue trend chart, booking distribution pie chart, etc.
  }

  onTimeframeChange() {
    // Update chart data based on selected timeframe
    console.log('Timeframe changed to:', this.revenueTimeframe);
  }
}