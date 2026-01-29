import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import Chart from 'chart.js/auto';

interface TravelBooking {
  id: number;
  booking_reference: string;
  from_city: string;
  to_city: string;
  mode: string;
  operator_name: string;
  travel_date: string;
  travel_time?: string;
  total_amount: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  selected_seats?: string;
  cancellation_reason?: string;
}

interface DashboardData {
  overview: any;
  mode_breakdown: any[];
  top_routes: any[];
  recent_bookings: TravelBooking[];
  daily_trends: any[];
}

@Component({
  selector: 'app-travel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel.html',
  styleUrls: ['./travel.css']
})
export class TravelComponent implements OnInit, OnDestroy {
  // Tab management
  activeTab: string = 'dashboard';
  
  // Loading & Error states
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Dashboard data
  dashboard: DashboardData = {
    overview: {},
    mode_breakdown: [],
    top_routes: [],
    recent_bookings: [],
    daily_trends: []
  };
  
  // Bookings data
  bookings: TravelBooking[] = [];
  selectedBooking: TravelBooking | null = null;
  bookingsPagination = {
    total: 0,
    page: 1,
    limit: 25,
    pages: 1
  };
  
  // Filters
  filters = {
    status: '',
    mode: '',
    from_date: '',
    to_date: '',
    search: ''
  };
  
  // Analytics data
  cancellationAnalytics: any = null;
  revenueAnalytics: any = null;
  
  // Routes & Operators
  routes: any[] = [];
  operators: any[] = [];
  
  // Modal states
  showBookingDetailsModal: boolean = false;
  showCancelModal: boolean = false;
  showRefundModal: boolean = false;
  showAddRouteModal: boolean = false;
  
  // Form data
  cancelReason: string = '';
  refundAmount: number = 0;
  refundMethod: string = 'original';
  
  newRoute = {
    from_city: '',
    to_city: '',
    mode: 'bus',
    operator_name: '',
    vehicle_number: '',
    seat_class: 'Standard',
    travel_time: '',
    cost: 0,
    total_seats: 40,
    duration: '',
    amenities: ''
  };
  
  // Timeframe
  selectedTimeframe: number = 30;
  
  // Charts
  private trendChart: Chart | null = null;
  private modeChart: Chart | null = null;
  private cancellationChart: Chart | null = null;
  
  // Live monitoring
  liveMonitoringEnabled: boolean = true;
  autoRefreshInterval: any = null;
  lastUpdateTime: string = '';
  isRefreshing: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboard();
    this.startLiveMonitoring();
  }

  ngOnDestroy() {
    this.stopLiveMonitoring();
    this.destroyCharts();
  }

  // ==================== TAB MANAGEMENT ====================
  
  switchTab(tab: string) {
    this.activeTab = tab;
    this.errorMessage = '';
    
    switch (tab) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'bookings':
        this.loadBookings();
        break;
      case 'cancellations':
        this.loadCancellationAnalytics();
        break;
      case 'revenue':
        this.loadRevenueAnalytics();
        break;
      case 'routes':
        this.loadRoutes();
        break;
      case 'operators':
        this.loadOperators();
        break;
    }
  }

  // ==================== LIVE MONITORING ====================
  
  startLiveMonitoring() {
    if (this.liveMonitoringEnabled && !this.autoRefreshInterval) {
      this.updateLastRefreshTime();
      this.autoRefreshInterval = setInterval(() => {
        if (this.liveMonitoringEnabled && !this.isRefreshing) {
          this.refreshCurrentTab();
        }
      }, 30000); // Refresh every 30 seconds
    }
  }

  stopLiveMonitoring() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  toggleLiveMonitoring() {
    this.liveMonitoringEnabled = !this.liveMonitoringEnabled;
    if (this.liveMonitoringEnabled) {
      this.startLiveMonitoring();
    } else {
      this.stopLiveMonitoring();
    }
  }

  updateLastRefreshTime() {
    const now = new Date();
    this.lastUpdateTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  refreshCurrentTab() {
    switch (this.activeTab) {
      case 'dashboard':
        this.loadDashboard(true);
        break;
      case 'bookings':
        this.loadBookings(true);
        break;
      case 'cancellations':
        this.loadCancellationAnalytics(true);
        break;
      case 'revenue':
        this.loadRevenueAnalytics(true);
        break;
    }
  }

  manualRefresh() {
    if (!this.isRefreshing) {
      this.refreshCurrentTab();
    }
  }

  // ==================== DASHBOARD ====================
  
  loadDashboard(isRefresh: boolean = false) {
    if (!isRefresh) this.isLoading = true;
    this.isRefreshing = true;

    this.apiService.getTravelDashboard(this.selectedTimeframe).subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboard = response.data;
          this.updateLastRefreshTime();
          
          setTimeout(() => {
            this.renderTrendChart();
            this.renderModeChart();
          }, 100);
        }
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  onTimeframeChange() {
    this.loadDashboard();
  }

  // ==================== BOOKINGS ====================
  
  loadBookings(isRefresh: boolean = false) {
    if (!isRefresh) this.isLoading = true;
    this.isRefreshing = true;

    const params = {
      ...this.filters,
      page: this.bookingsPagination.page,
      limit: this.bookingsPagination.limit
    };

    this.apiService.getTravelBookings(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.bookings = response.data.bookings;
          this.bookingsPagination = response.data.pagination;
          this.updateLastRefreshTime();
        }
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  applyFilters() {
    this.bookingsPagination.page = 1;
    this.loadBookings();
  }

  clearFilters() {
    this.filters = {
      status: '',
      mode: '',
      from_date: '',
      to_date: '',
      search: ''
    };
    this.loadBookings();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.bookingsPagination.pages) {
      this.bookingsPagination.page = page;
      this.loadBookings();
    }
  }

  viewBookingDetails(booking: TravelBooking) {
    this.selectedBooking = booking;
    this.showBookingDetailsModal = true;
    
    // Load full details
    this.apiService.getTravelBookingDetails(booking.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedBooking = { ...booking, ...response.data };
        }
      },
      error: (error) => {
        console.error('Error loading booking details:', error);
      }
    });
  }

  closeBookingDetailsModal() {
    this.showBookingDetailsModal = false;
    this.selectedBooking = null;
  }

  // ==================== CANCELLATION ====================
  
  openCancelModal(booking: TravelBooking) {
    this.selectedBooking = booking;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedBooking = null;
    this.cancelReason = '';
  }

  confirmCancellation() {
    if (!this.selectedBooking || !this.cancelReason) return;

    this.apiService.cancelTravelBooking(this.selectedBooking.id, this.cancelReason).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Booking cancelled successfully');
          this.closeCancelModal();
          this.loadBookings();
        }
      },
      error: (error) => {
        alert('Error cancelling booking: ' + error.message);
      }
    });
  }

  // ==================== REFUND ====================
  
  openRefundModal(booking: TravelBooking) {
    this.selectedBooking = booking;
    this.refundAmount = booking.total_amount;
    this.refundMethod = 'original';
    this.showRefundModal = true;
  }

  closeRefundModal() {
    this.showRefundModal = false;
    this.selectedBooking = null;
  }

  processRefund() {
    if (!this.selectedBooking) return;

    this.apiService.processTravelRefund(
      this.selectedBooking.id,
      this.refundAmount,
      this.refundMethod
    ).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Refund processed successfully');
          this.closeRefundModal();
          this.loadBookings();
        }
      },
      error: (error) => {
        alert('Error processing refund: ' + error.message);
      }
    });
  }

  // ==================== CANCELLATION ANALYTICS ====================
  
  loadCancellationAnalytics(isRefresh: boolean = false) {
    if (!isRefresh) this.isLoading = true;
    this.isRefreshing = true;

    this.apiService.getCancellationAnalytics(this.selectedTimeframe).subscribe({
      next: (response) => {
        if (response.success) {
          this.cancellationAnalytics = response.data;
          this.updateLastRefreshTime();
          
          setTimeout(() => this.renderCancellationChart(), 100);
        }
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  // ==================== REVENUE ANALYTICS ====================
  
  loadRevenueAnalytics(isRefresh: boolean = false) {
    if (!isRefresh) this.isLoading = true;
    this.isRefreshing = true;

    this.apiService.getTravelRevenueAnalytics(this.selectedTimeframe).subscribe({
      next: (response) => {
        if (response.success) {
          this.revenueAnalytics = response.data;
          this.updateLastRefreshTime();
        }
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  // ==================== ROUTES ====================
  
  loadRoutes() {
    this.isLoading = true;

    this.apiService.getTravelRoutes().subscribe({
      next: (response) => {
        if (response.success) {
          this.routes = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  openAddRouteModal() {
    this.newRoute = {
      from_city: '',
      to_city: '',
      mode: 'bus',
      operator_name: '',
      vehicle_number: '',
      seat_class: 'Standard',
      travel_time: '',
      cost: 0,
      total_seats: 40,
      duration: '',
      amenities: ''
    };
    this.showAddRouteModal = true;
  }

  closeAddRouteModal() {
    this.showAddRouteModal = false;
  }

  addRoute() {
    this.apiService.addTravelRoute(this.newRoute).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Route added successfully');
          this.closeAddRouteModal();
          this.loadRoutes();
        }
      },
      error: (error) => {
        alert('Error adding route: ' + error.message);
      }
    });
  }

  deleteRoute(route: any) {
    if (confirm(`Are you sure you want to deactivate this route: ${route.route}?`)) {
      this.apiService.deleteTravelRoute(route.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Route deactivated');
            this.loadRoutes();
          }
        },
        error: (error) => {
          alert('Error: ' + error.message);
        }
      });
    }
  }

  // ==================== OPERATORS ====================
  
  loadOperators() {
    this.isLoading = true;

    this.apiService.getTravelOperators().subscribe({
      next: (response) => {
        if (response.success) {
          this.operators = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  // ==================== CHARTS ====================
  
  destroyCharts() {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
    if (this.modeChart) {
      this.modeChart.destroy();
      this.modeChart = null;
    }
    if (this.cancellationChart) {
      this.cancellationChart.destroy();
      this.cancellationChart = null;
    }
  }

  renderTrendChart() {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboard.daily_trends?.length) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dashboard.daily_trends.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Bookings',
            data: this.dashboard.daily_trends.map(d => d.bookings),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Revenue (₹)',
            data: this.dashboard.daily_trends.map(d => d.revenue),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Cancellations',
            data: this.dashboard.daily_trends.map(d => d.cancellations),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#fff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#10b981' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  renderModeChart() {
    const canvas = document.getElementById('modeChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboard.mode_breakdown?.length) return;

    if (this.modeChart) {
      this.modeChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors: any = {
      bus: '#f59e0b',
      train: '#3b82f6',
      flight: '#8b5cf6'
    };

    this.modeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.dashboard.mode_breakdown.map(m => m.mode.toUpperCase()),
        datasets: [{
          data: this.dashboard.mode_breakdown.map(m => m.booking_count),
          backgroundColor: this.dashboard.mode_breakdown.map(m => colors[m.mode] || '#6b7280'),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#fff', padding: 20 }
          }
        }
      }
    });
  }

  renderCancellationChart() {
    const canvas = document.getElementById('cancellationChart') as HTMLCanvasElement;
    if (!canvas || !this.cancellationAnalytics?.trends?.length) return;

    if (this.cancellationChart) {
      this.cancellationChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.cancellationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.cancellationAnalytics.trends.map((d: any) => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Total Bookings',
            data: this.cancellationAnalytics.trends.map((d: any) => d.total_bookings),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderRadius: 4
          },
          {
            label: 'Cancellations',
            data: this.cancellationAnalytics.trends.map((d: any) => d.cancellations),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#fff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }

  // ==================== HELPERS ====================
  
  getModeIcon(mode: string): string {
    switch (mode) {
      case 'bus': return 'fa-bus';
      case 'train': return 'fa-train';
      case 'flight': return 'fa-plane';
      default: return 'fa-car';
    }
  }

  getModeColor(mode: string): string {
    switch (mode) {
      case 'bus': return '#f59e0b';
      case 'train': return '#3b82f6';
      case 'flight': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      case 'completed': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getPaymentBadgeClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'refunded': return 'badge-info';
      case 'failed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportBookings() {
    const fromDate = this.filters.from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = this.filters.to_date || new Date().toISOString().split('T')[0];
    
    this.apiService.exportTravelBookings(fromDate, toDate).subscribe({
      next: (response) => {
        if (response.success) {
          // Convert to CSV
          const data = response.data;
          if (data.length === 0) {
            alert('No data to export');
            return;
          }
          
          const headers = Object.keys(data[0]);
          const csv = [
            headers.join(','),
            ...data.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(','))
          ].join('\n');
          
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `travel_bookings_${fromDate}_to_${toDate}.csv`;
          a.click();
        }
      },
      error: (error) => {
        alert('Export failed: ' + error.message);
      }
    });
  }
}
