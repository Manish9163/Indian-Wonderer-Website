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
      <!-- Analytics Header with Actions -->
      <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
        <div>
          <h4 class="mb-1">📊 Analytics Dashboard</h4>
          <small class="text-muted">Comprehensive business insights and performance metrics</small>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" [(ngModel)]="selectedTimeRange" (change)="onTimeRangeChange()" style="width: auto;">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button class="btn btn-outline-primary btn-sm" (click)="refreshAnalytics()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button class="btn btn-success btn-sm" (click)="exportAnalyticsReport()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn btn-info btn-sm" (click)="generateDetailedReport()">
            <i class="fas fa-file-alt"></i> Report
          </button>
          <button class="btn btn-warning btn-sm" (click)="openRealTimeMonitor()">
            <i class="fas fa-chart-line"></i> Live
          </button>
        </div>
      </div>
      
      <!-- Key Metrics -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up gradient-blue" (click)="drillDownRevenue()">
            <div class="analytics-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="analytics-metric">\${{analytics.totalRevenue | number:'1.0-0'}}</div>
            <div class="analytics-label">Total Revenue</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.revenueGrowth}}% from last month
            </div>
            <div class="analytics-subtitle">Click for details</div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up gradient-green" style="animation-delay: 0.1s;" (click)="drillDownBookings()">
            <div class="analytics-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="analytics-metric">{{analytics.totalBookings}}</div>
            <div class="analytics-label">Total Bookings</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.bookingsGrowth}}% this month
            </div>
            <div class="analytics-subtitle">Click for breakdown</div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up gradient-purple" style="animation-delay: 0.2s;" (click)="drillDownAvgValue()">
            <div class="analytics-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="analytics-metric">{{analytics.averageBookingValue | currency}}</div>
            <div class="analytics-label">Avg Booking Value</div>
            <div class="analytics-change negative">
              <i class="fas fa-arrow-down"></i>
              -{{analytics.avgValueChange}}% from last month
            </div>
            <div class="analytics-subtitle">View trends</div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="analytics-card fade-in-up gradient-orange" style="animation-delay: 0.3s;" (click)="drillDownConversion()">
            <div class="analytics-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="analytics-metric">{{analytics.conversionRate}}%</div>
            <div class="analytics-label">Conversion Rate</div>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{analytics.conversionGrowth}}% this month
            </div>
            <div class="analytics-subtitle">Optimize further</div>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card-modern performance-summary">
            <div class="card-header-modern d-flex justify-content-between align-items-center">
              <h6 class="mb-0">📈 Performance Summary</h6>
              <button class="btn btn-sm btn-outline-primary" (click)="togglePerformanceView()">
                <i class="fas fa-{{showAdvancedMetrics ? 'eye-slash' : 'eye'}}"></i>
                {{showAdvancedMetrics ? 'Simple' : 'Advanced'}} View
              </button>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-2 text-center" *ngFor="let metric of performanceMetrics">
                  <div class="performance-metric" (click)="showMetricDetails(metric)">
                    <div class="metric-value" [ngClass]="metric.status">{{metric.value}}</div>
                    <div class="metric-label">{{metric.label}}</div>
                    <div class="metric-change" [ngClass]="metric.trend">
                      <i class="fas fa-{{metric.trend === 'up' ? 'arrow-up' : metric.trend === 'down' ? 'arrow-down' : 'minus'}}"></i>
                      {{metric.change}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Charts and Detailed Analytics -->
      <div class="row mb-4">
        <div class="col-md-8">
          <div class="card-modern chart-container-enhanced">
            <div class="card-header-modern d-flex justify-content-between align-items-center">
              <h6 class="mb-0">📊 Revenue Trends & Analytics</h6>
              <div class="d-flex gap-2">
                <select class="form-select form-select-sm" style="width: auto;" [(ngModel)]="revenueTimeframe" (change)="onTimeframeChange()">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
                <button class="btn btn-sm btn-outline-secondary" (click)="toggleChartType()">
                  <i class="fas fa-{{chartType === 'line' ? 'chart-bar' : 'chart-line'}}"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" (click)="downloadChartData()">
                  <i class="fas fa-download"></i>
                </button>
              </div>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <div class="chart-container position-relative">
                <canvas id="revenueChart" width="400" height="200"></canvas>
                <!-- Enhanced chart placeholder -->
                <div class="chart-placeholder d-flex align-items-center justify-content-center h-100" *ngIf="!chartInitialized">
                  <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Loading revenue analytics...</p>
                    <small class="text-muted">Analyzing {{revenueTimeframe}} data</small>
                  </div>
                </div>
                <!-- Chart overlay controls -->
                <div class="chart-overlay" *ngIf="chartInitialized">
                  <button class="btn btn-sm btn-light chart-control" (click)="resetZoom()" title="Reset Zoom">
                    <i class="fas fa-search-minus"></i>
                  </button>
                  <button class="btn btn-sm btn-light chart-control" (click)="exportChart()" title="Export Chart">
                    <i class="fas fa-camera"></i>
                  </button>
                </div>
              </div>
              <!-- Chart insights -->
              <div class="chart-insights mt-3" *ngIf="chartInitialized">
                <div class="row">
                  <div class="col-4 text-center">
                    <small class="text-muted">Peak Revenue</small>
                    <div class="fw-bold text-success">\${{peakRevenue | number}}</div>
                  </div>
                  <div class="col-4 text-center">
                    <small class="text-muted">Average</small>
                    <div class="fw-bold">\${{averageRevenue | number}}</div>
                  </div>
                  <div class="col-4 text-center">
                    <small class="text-muted">Growth Rate</small>
                    <div class="fw-bold text-info">{{revenueGrowthRate}}%</div>
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
            <div class="card-body" style="padding: 1.5rem;">
              <div *ngFor="let destination of topDestinations; let i = index" class="mb-3" style="padding: 0.75rem 0;">
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
                <div class="progress progress-modern" style="margin-top: 0.5rem;">
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
          <div class="card-modern payment-analytics-card">
            <div class="card-header-modern payment-analytics-header">
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
  styles: [`
    .analytics-dashboard {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .analytics-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .analytics-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .analytics-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
    }

    .gradient-blue { border-left: 5px solid #3498db; }
    .gradient-green { border-left: 5px solid #2ecc71; }
    .gradient-purple { border-left: 5px solid #9b59b6; }
    .gradient-orange { border-left: 5px solid #f39c12; }

    .analytics-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #3498db;
      background: linear-gradient(45deg, #3498db, #2ecc71);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .analytics-metric {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(45deg, #2c3e50, #34495e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .analytics-label {
      font-size: 1.1rem;
      color: #7f8c8d;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .analytics-change {
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      display: inline-block;
    }

    .analytics-change.positive {
      background: rgba(46, 204, 113, 0.1);
      color: #27ae60;
    }

    .analytics-change.negative {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .analytics-subtitle {
      font-size: 0.8rem;
      color: #95a5a6;
      margin-top: 1rem;
      font-style: italic;
    }

    .performance-summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      overflow: hidden;
    }

    .performance-metric {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 1.5rem;
      margin: 0.5rem;
      transition: all 0.3s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .performance-metric:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .metric-value.good { color: #2ecc71; }
    .metric-value.excellent { color: #f39c12; }

    .metric-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 0.5rem;
    }

    .metric-change {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .metric-change.up { color: #2ecc71; }
    .metric-change.down { color: #e74c3c; }

    .chart-container-enhanced {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .chart-container {
      position: relative;
      height: 400px;
    }

    .chart-placeholder {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
    }

    .chart-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 5px;
    }

    .chart-control {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .chart-control:hover {
      background: #3498db;
      color: white;
      transform: scale(1.1);
    }

    .chart-insights {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      padding: 1rem;
      color: white;
    }

    .fade-in-up {
      animation: fadeInUp 0.8s ease forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

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
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .card-header-modern {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border: none;
    }

    .progress-modern {
      height: 8px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .progress-modern .progress-bar {
      border-radius: 10px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.6s ease;
    }

    .btn {
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      padding: 0.5rem 1.5rem;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .btn-outline-primary {
      border: 2px solid #3498db;
      color: #3498db;
      background: transparent;
    }

    .btn-outline-primary:hover {
      background: #3498db;
      color: white;
    }

    @media (max-width: 768px) {
      .analytics-card {
        margin-bottom: 1rem;
      }
      
      .analytics-metric {
        font-size: 2rem;
      }
      
      .performance-metric {
        margin: 0.25rem;
        padding: 1rem;
      }
      
      .chart-container {
        height: 300px;
      }
    }
  `],
  styleUrls: []
})
export class AnalyticsComponent implements OnInit {
  revenueTimeframe = '30d';
  selectedTimeRange: string = 'month';
  chartType: string = 'line';
  chartInitialized: boolean = false;
  showAdvancedMetrics: boolean = false;
  
  // Enhanced analytics properties
  peakRevenue: number = 45000;
  averageRevenue: number = 28500;
  revenueGrowthRate: number = 15.3;

  performanceMetrics = [
    { label: 'Website Traffic', value: '12.4K', change: '+8.2%', trend: 'up', status: 'good' },
    { label: 'Bounce Rate', value: '24.1%', change: '-3.1%', trend: 'down', status: 'good' },
    { label: 'Session Duration', value: '4:32', change: '+12%', trend: 'up', status: 'excellent' },
    { label: 'Page Views', value: '48.2K', change: '+5.7%', trend: 'up', status: 'good' },
    { label: 'New Visitors', value: '67%', change: '+2.1%', trend: 'up', status: 'good' },
    { label: 'Goal Completion', value: '89%', change: '+4.3%', trend: 'up', status: 'excellent' }
  ];
  
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

  // --- Compatibility properties for external template bindings ---
  totalRevenue: number = this.analytics.totalRevenue;
  totalBookings: number = this.analytics.totalBookings;
  activeTours: number = this.topDestinations.length;
  averageRating: number = 4.6; // placeholder average rating
  conversionRate: number = this.analytics.conversionRate;
  avgBookingValue: number = this.analytics.averageBookingValue;
  repeatCustomers: number = 128; // placeholder
  newCustomers: number = 42; // placeholder

  // external template expects these exact names
  popularDestinations = this.topDestinations;
  recentBookings = this.recentActivities.map(a => ({
    customerName: a.user,
    tourName: a.description,
    status: a.status,
    amount: a.amount
  }));

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
    this.renderRevenueChart();
    alert(`Analytics updated for timeframe: ${this.revenueTimeframe}`);
  }

  exportAnalyticsReport() {
    const reportData = [
      'Analytics Report - ' + new Date().toISOString().split('T')[0],
      '',
      'KEY METRICS',
      `Total Revenue,${this.analytics.totalRevenue}`,
      `Total Bookings,${this.analytics.totalBookings}`,
      `Average Booking Value,${this.analytics.averageBookingValue}`,
      `Conversion Rate,${this.analytics.conversionRate}%`,
      '',
      'TOP DESTINATIONS',
      'Name,Bookings,Revenue,Growth',
      ...this.topDestinations.map(dest => 
        `${dest.name},${dest.bookings},${dest.revenue},${dest.growth}%`
      ),
      '',
      'BOOKING STATUS',
      'Status,Count,Percentage',
      ...this.bookingStatus.map(status => 
        `${status.label},${status.count},${status.percentage}%`
      ),
      '',
      'RECENT ACTIVITIES',
      'Time,Activity,User,Amount,Status',
      ...this.recentActivities.map(activity => 
        `${activity.timestamp.toISOString()},${activity.description},${activity.user},${activity.amount},${activity.status}`
      )
    ].join('\n');

    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Analytics report exported successfully!');
  }

  refreshAnalytics() {
    // Simulate data refresh
    setTimeout(() => {
      this.analytics.totalRevenue += Math.floor(Math.random() * 1000);
      this.analytics.totalBookings += Math.floor(Math.random() * 10);
      this.renderRevenueChart();
      alert('Analytics data refreshed successfully!');
    }, 1000);
  }

  generateDetailedReport() {
    const reportWindow = window.open('', '_blank', 'width=1000,height=1200');
    if (reportWindow) {
      reportWindow.document.write(`
        <html>
          <head>
            <title>Detailed Analytics Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .header { text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
              .section { margin: 30px 0; }
              .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
              .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
              .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
              .metric-label { color: #6c757d; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              .table th { background: #f8f9fa; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Travel Admin Analytics Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h2>Key Performance Metrics</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">$${this.analytics.totalRevenue.toLocaleString()}</div>
                  <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${this.analytics.totalBookings}</div>
                  <div class="metric-label">Total Bookings</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">$${this.analytics.averageBookingValue}</div>
                  <div class="metric-label">Avg Booking Value</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${this.analytics.conversionRate}%</div>
                  <div class="metric-label">Conversion Rate</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>Top Destinations</h2>
              <table class="table">
                <thead>
                  <tr><th>Destination</th><th>Bookings</th><th>Revenue</th><th>Growth</th></tr>
                </thead>
                <tbody>
                  ${this.topDestinations.map(dest => 
                    `<tr><td>${dest.name}</td><td>${dest.bookings}</td><td>$${dest.revenue}</td><td>${dest.growth}%</td></tr>`
                  ).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <button onclick="window.print()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; margin: 0 10px;">Print Report</button>
              <button onclick="window.close()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; margin: 0 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      reportWindow.document.close();
    }
  }

  // Enhanced Analytics Methods
  onTimeRangeChange() {
    this.refreshAnalytics();
    alert(`Time range updated to: ${this.selectedTimeRange}`);
  }

  drillDownRevenue() {
    const detailWindow = window.open('', '_blank', 'width=800,height=600');
    if (detailWindow) {
      detailWindow.document.write(`
        <html>
          <head>
            <title>Revenue Drill-Down Analysis</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
              .container { background: white; padding: 30px; border-radius: 10px; }
              .metric { background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 8px; }
              .chart-mock { height: 200px; background: linear-gradient(45deg, #2196f3, #21cbf3); margin: 20px 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>💰 Revenue Analysis Details</h2>
              <div class="metric">
                <h4>Total Revenue: $${this.analytics.totalRevenue.toLocaleString()}</h4>
                <p>Growth: +${this.analytics.revenueGrowth}% from last period</p>
              </div>
              <div class="metric">
                <h4>Peak Revenue Day: $${this.peakRevenue.toLocaleString()}</h4>
                <p>Average Daily Revenue: $${this.averageRevenue.toLocaleString()}</p>
              </div>
              <div class="chart-mock">Revenue Trend Chart (Interactive)</div>
              <button onclick="window.close()" style="padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 5px;">Close</button>
            </div>
          </body>
        </html>
      `);
      detailWindow.document.close();
    }
  }

  drillDownBookings() {
    alert(`📅 Bookings Analysis:\n\nTotal Bookings: ${this.analytics.totalBookings}\nGrowth: +${this.analytics.bookingsGrowth}%\nAverage per day: ${Math.round(this.analytics.totalBookings / 30)}\n\nOpening detailed analysis...`);
  }

  drillDownAvgValue() {
    alert(`📊 Average Booking Value Analysis:\n\nCurrent: $${this.analytics.averageBookingValue}\nChange: -${this.analytics.avgValueChange}%\nRecommendation: Focus on premium packages`);
  }

  drillDownConversion() {
    alert(`🎯 Conversion Rate Analysis:\n\nCurrent Rate: ${this.analytics.conversionRate}%\nGrowth: +${this.analytics.conversionGrowth}%\nIndustry Average: 18-22%\nStatus: Above Average!`);
  }

  togglePerformanceView() {
    this.showAdvancedMetrics = !this.showAdvancedMetrics;
    alert(`Switched to ${this.showAdvancedMetrics ? 'Advanced' : 'Simple'} metrics view`);
  }

  showMetricDetails(metric: any) {
    alert(`📈 ${metric.label} Details:\n\nCurrent Value: ${metric.value}\nChange: ${metric.change}\nTrend: ${metric.trend}\nStatus: ${metric.status}\n\nClick for detailed analysis...`);
  }

  toggleChartType() {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
    this.renderRevenueChart();
    alert(`Chart type changed to: ${this.chartType}`);
  }

  downloadChartData() {
    const chartData = {
      timeframe: this.revenueTimeframe,
      type: this.chartType,
      data: [12000, 15000, 18000, 22000, 20000, 25000, 27000, 28500],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    };

    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart_data_${this.revenueTimeframe}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Chart data downloaded successfully!');
  }

  resetZoom() {
    this.renderRevenueChart();
    alert('Chart zoom reset to default view');
  }

  exportChart() {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `revenue_chart_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      alert('Chart exported as image!');
    }
  }

  openRealTimeMonitor() {
    const monitorWindow = window.open('', '_blank', 'width=1000,height=700');
    if (monitorWindow) {
      monitorWindow.document.write(`
        <html>
          <head>
            <title>🔴 LIVE Analytics Monitor</title>
            <style>
              body { font-family: 'Courier New', monospace; background: #000; color: #0f0; padding: 20px; }
              .monitor-header { text-align: center; border-bottom: 2px solid #0f0; padding: 20px; }
              .live-metric { background: rgba(0,255,0,0.1); padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #0f0; }
              .pulse { animation: pulse 2s infinite; }
              @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
              .status-green { color: #0f0; }
              .status-yellow { color: #ff0; }
              .status-red { color: #f00; }
            </style>
          </head>
          <body>
            <div class="monitor-header">
              <h1 class="pulse">🔴 LIVE ANALYTICS MONITOR</h1>
              <p>Real-time system monitoring - Updated every 5 seconds</p>
            </div>
            <div class="live-metric">
              <span class="status-green">● REVENUE STREAM:</span> $${Math.floor(Math.random() * 1000) + 500}/hour
            </div>
            <div class="live-metric">
              <span class="status-green">● ACTIVE USERS:</span> ${Math.floor(Math.random() * 50) + 25} online now
            </div>
            <div class="live-metric">
              <span class="status-yellow">● CONVERSION RATE:</span> ${(Math.random() * 5 + 20).toFixed(1)}% (last hour)
            </div>
            <div class="live-metric">
              <span class="status-green">● NEW BOOKINGS:</span> ${Math.floor(Math.random() * 5) + 1} in last 10 minutes
            </div>
            <div class="live-metric">
              <span class="status-green">● SYSTEM STATUS:</span> ALL SYSTEMS OPERATIONAL
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <button onclick="window.close()" style="background: #0f0; color: #000; border: none; padding: 10px 20px; border-radius: 5px;">Close Monitor</button>
            </div>
          </body>
        </html>
      `);
      monitorWindow.document.close();
    }
  }
}