import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  revenueTimeframe = '30d';
  selectedTimeRange: string = 'month';
  chartType: string = 'line';
  chartInitialized: boolean = false;
  showAdvancedMetrics: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Live monitoring properties
  liveMonitoringEnabled: boolean = true;
  autoRefreshInterval: any = null;
  refreshIntervalSeconds: number = 10; // Refresh every 10 seconds
  lastUpdateTime: string = '';
  isRefreshing: boolean = false;
  
  // Enhanced analytics properties
  peakRevenue: number = 0;
  averageRevenue: number = 0;
  revenueGrowthRate: number = 0;

  performanceMetrics: any[] = [];
  
  analytics = {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    bookingsGrowth: 0,
    averageBookingValue: 0,
    avgValueChange: 0,
    conversionRate: 0,
    conversionGrowth: 0
  };

  topDestinations: any[] = [];

  bookingStatus: any[] = [];

  paymentAnalytics = {
    successRate: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalProcessed: 0,
    processingFees: 0
  };

  // Refund analytics
  refundAnalytics = {
    totalRefunds: 0,
    totalRefundAmount: 0,
    pendingRefunds: 0,
    pendingRefundAmount: 0,
    completedRefunds: 0,
    completedRefundAmount: 0,
    refundRate: 0,
    netRevenue: 0,
    giftCardsIssued: 0,
    giftCardAmount: 0,
    avgRefundAmount: 0
  };

  recentActivities: any[] = [];

  // Detailed refund/gift card data
  showRefundDetailsModal: boolean = false;
  showGiftCardDetailsModal: boolean = false;
  detailedRefundsList: any[] = [];
  detailedGiftCardsList: any[] = [];
  selectedRefund: any = null;
  selectedGiftCard: any = null;
  isLoadingDetails: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAnalyticsData();
    this.startLiveMonitoring();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.stopLiveMonitoring();
    this.removeEventListeners();
  }

  /**
   * Setup event listeners for cross-component updates
   */
  setupEventListeners() {
    // Listen for refund processing events
    window.addEventListener('refund-processed', this.handleRefundEvent.bind(this));
    window.addEventListener('giftcard-activated', this.handleGiftCardEvent.bind(this));
    
    console.log('📡 Event listeners setup for cross-component live updates');
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    window.removeEventListener('refund-processed', this.handleRefundEvent.bind(this));
    window.removeEventListener('giftcard-activated', this.handleGiftCardEvent.bind(this));
  }

  /**
   * Handle refund processed event
   */
  handleRefundEvent(event: any) {
    console.log('🔔 Refund processed event received:', event.detail);
    this.refreshAnalytics();
  }

  /**
   * Handle gift card activated event
   */
  handleGiftCardEvent(event: any) {
    console.log('🔔 Gift card activated event received:', event.detail);
    this.refreshAnalytics();
  }

  /**
   * Start live monitoring with auto-refresh
   */
  startLiveMonitoring() {
    if (this.liveMonitoringEnabled && !this.autoRefreshInterval) {
      console.log(`🔴 Live Monitoring Started - Refreshing every ${this.refreshIntervalSeconds} seconds`);
      
      // Initial update
      this.updateLastRefreshTime();
      
      // Set up auto-refresh interval
      this.autoRefreshInterval = setInterval(() => {
        if (this.liveMonitoringEnabled && !this.isRefreshing) {
          this.refreshAnalytics();
        }
      }, this.refreshIntervalSeconds * 1000);
    }
  }

  /**
   * Stop live monitoring
   */
  stopLiveMonitoring() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log('🔴 Live Monitoring Stopped');
    }
  }

  /**
   * Toggle live monitoring on/off
   */
  toggleLiveMonitoring() {
    this.liveMonitoringEnabled = !this.liveMonitoringEnabled;
    
    if (this.liveMonitoringEnabled) {
      this.startLiveMonitoring();
    } else {
      this.stopLiveMonitoring();
    }
  }

  /**
   * Refresh analytics data (live update)
   */
  refreshAnalytics() {
    this.isRefreshing = true;
    console.log('🔄 Auto-refreshing analytics data...');

    this.apiService.getAnalytics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.processAnalyticsData(response.data);
          this.updateLastRefreshTime();
          console.log('✅ Analytics refreshed successfully');
        }
        this.isRefreshing = false;
      },
      error: (error) => {
        console.error('❌ Error refreshing analytics:', error);
        this.isRefreshing = false;
      }
    });
  }

  /**
   * Manual refresh button
   */
  manualRefresh() {
    if (!this.isRefreshing) {
      this.refreshAnalytics();
    }
  }

  /**
   * Update last refresh time display
   */
  updateLastRefreshTime() {
    const now = new Date();
    this.lastUpdateTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  /**
   * Change refresh interval
   */
  setRefreshInterval(seconds: number) {
    this.refreshIntervalSeconds = seconds;
    if (this.liveMonitoringEnabled) {
      this.stopLiveMonitoring();
      this.startLiveMonitoring();
    }
  }

  /**
   * Load analytics data from API
   */
  loadAnalyticsData() {
    this.isLoading = true;
    this.errorMessage = '';

    const timeframeMap: any = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };

    const days = timeframeMap[this.selectedTimeRange] || 30;

    this.apiService.getAnalytics().subscribe({
      next: (response) => {
        console.log('Analytics data received:', response);
        
        if (response.success && response.data) {
          this.processAnalyticsData(response.data);
          this.isLoading = false;
          
          // Render chart after data is loaded
          setTimeout(() => this.renderRevenueChart(), 100);
        } else {
          this.errorMessage = 'Failed to load analytics data';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.errorMessage = error.message || 'Failed to connect to analytics API';
        this.isLoading = false;
        // Load sample data as fallback
        this.loadFallbackData();
      }
    });
  }

  /**
   * Process analytics data from API response
   */
  processAnalyticsData(data: any) {
    // Revenue metrics
    if (data.revenue) {
      this.analytics.totalRevenue = parseFloat(data.revenue.current_revenue || data.revenue.total_revenue || 0);
      this.analytics.averageBookingValue = parseFloat(data.revenue.avg_booking_value || 0);
      
      // Calculate revenue growth from actual data
      const currentRevenue = parseFloat(data.revenue.current_revenue || 0);
      const totalRevenue = parseFloat(data.revenue.total_revenue || 0);
      const previousRevenue = totalRevenue - currentRevenue;
      this.analytics.revenueGrowth = previousRevenue > 0 ? 
        ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      
      // Calculate peak and average revenue for chart insights
      if (data.revenue.daily_revenue && Array.isArray(data.revenue.daily_revenue)) {
        const dailyRevenues = data.revenue.daily_revenue.map((d: any) => parseFloat(d.daily_revenue || 0));
        this.peakRevenue = Math.max(...dailyRevenues);
        this.averageRevenue = dailyRevenues.reduce((a: number, b: number) => a + b, 0) / dailyRevenues.length;
        this.revenueGrowthRate = this.analytics.revenueGrowth;
      }
    }

    // Overview metrics
    if (data.overview) {
      this.analytics.totalBookings = parseInt(data.overview.new_bookings || 0);
      this.analytics.bookingsGrowth = parseFloat(data.overview.booking_growth || 0);
      
      // Performance metrics
      this.performanceMetrics = [
        { label: 'Active Tours', value: data.overview.active_tours || 0, change: '+0%', trend: 'up', status: 'good' },
        { label: 'Total Customers', value: data.overview.total_customers || 0, change: `+${Math.abs(data.overview.customer_growth || 0)}%`, trend: (data.overview.customer_growth || 0) >= 0 ? 'up' : 'down', status: 'good' },
        { label: 'Pending Bookings', value: data.overview.pending_bookings || 0, change: '0%', trend: 'neutral', status: 'good' },
        { label: 'Confirmed Bookings', value: data.overview.confirmed_bookings || 0, change: `+${Math.abs(data.overview.booking_growth || 0)}%`, trend: (data.overview.booking_growth || 0) >= 0 ? 'up' : 'down', status: 'excellent' }
      ];
      
      // Calculate conversion rate
      const totalPotentialBookings = parseInt(data.overview.new_bookings || 0) + parseInt(data.overview.pending_bookings || 0);
      this.analytics.conversionRate = totalPotentialBookings > 0 ? 
        ((parseInt(data.overview.confirmed_bookings || 0) / totalPotentialBookings) * 100) : 0;
      this.analytics.conversionGrowth = this.analytics.bookingsGrowth;
      this.analytics.avgValueChange = this.analytics.revenueGrowth;
    }

    // Prepare chart data from daily revenue
    if (data.revenue && data.revenue.daily_revenue && Array.isArray(data.revenue.daily_revenue)) {
      this.revenueChartData.labels = data.revenue.daily_revenue.map((d: any) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      this.revenueChartData.data = data.revenue.daily_revenue.map((d: any) => 
        parseFloat(d.daily_revenue || 0)
      );
    } else if (data.booking_trends && Array.isArray(data.booking_trends)) {
      // Fallback to booking trends data
      this.revenueChartData.labels = data.booking_trends.map((d: any) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      this.revenueChartData.data = data.booking_trends.map((d: any) => 
        parseFloat(d.total_value || 0)
      );
    }

    // Top destinations
    if (data.top_destinations && Array.isArray(data.top_destinations)) {
      this.topDestinations = data.top_destinations.map((dest: any, index: number) => ({
        name: dest.tour_name || dest.destination || 'Unknown',
        flag: this.getCountryFlag(dest.tour_name || dest.destination),
        bookings: parseInt(dest.booking_count || dest.bookings || 0),
        revenue: parseFloat(dest.total_revenue || dest.revenue || 0),
        growth: parseFloat(dest.growth_rate || 0),
        percentage: Math.max(10, 100 - (index * 15))
      }));
    }

    // Booking status distribution
    if (data.booking_trends && Array.isArray(data.booking_trends)) {
      // Calculate totals from booking trends
      const totals = {
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        completed: 0
      };
      
      data.booking_trends.forEach((day: any) => {
        totals.confirmed += parseInt(day.confirmed_bookings || 0);
        totals.pending += parseInt(day.pending_bookings || 0);
        totals.cancelled += parseInt(day.cancelled_bookings || 0);
      });
      
      const totalBookings = Object.values(totals).reduce((a: number, b: number) => a + b, 0);
      
      const statusColors: any = {
        'confirmed': '#10b981',
        'pending': '#f59e0b',
        'cancelled': '#ef4444',
        'completed': '#6366f1'
      };

      this.bookingStatus = Object.keys(statusColors).map(status => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: totals[status as keyof typeof totals] || 0,
        percentage: totalBookings > 0 ? ((totals[status as keyof typeof totals] / totalBookings) * 100).toFixed(1) : 0,
        color: statusColors[status]
      }));
    } else if (data.overview) {
      // Fallback to overview data
      const confirmed = parseInt(data.overview.confirmed_bookings || 0);
      const pending = parseInt(data.overview.pending_bookings || 0);
      const total = confirmed + pending;
      
      this.bookingStatus = [
        { label: 'Confirmed', count: confirmed, percentage: total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0, color: '#10b981' },
        { label: 'Pending', count: pending, percentage: total > 0 ? ((pending / total) * 100).toFixed(1) : 0, color: '#f59e0b' }
      ];
    }

    // Recent activities - construct from tour performance or booking trends
    if (data.recent_activities && Array.isArray(data.recent_activities)) {
      this.recentActivities = data.recent_activities.slice(0, 5).map((activity: any) => ({
        timestamp: new Date(activity.created_at || activity.timestamp || Date.now()),
        description: activity.activity_type || activity.description || activity.action || 'Activity',
        user: activity.customer_name || activity.user_name || activity.user || 'System',
        amount: parseFloat(activity.amount || activity.value || 0),
        status: activity.status || 'info',
        icon: this.getActivityIcon(activity.activity_type || activity.action || activity.status),
        iconColor: this.getActivityColor(activity.status || 'info')
      }));
    } else if (data.tour_performance && Array.isArray(data.tour_performance)) {
      // Generate activities from tour performance
      this.recentActivities = data.tour_performance.slice(0, 5).map((tour: any) => ({
        timestamp: new Date(),
        description: `${tour.recent_bookings || 0} bookings for ${tour.title}`,
        user: tour.destination || 'Tour',
        amount: parseFloat(tour.revenue || 0),
        status: 'confirmed',
        icon: 'fas fa-calendar-check',
        iconColor: '#10b981'
      }));
    }

    // Payment analytics
    if (data.revenue) {
      const totalRevenue = parseFloat(data.revenue.total_revenue || 0);
      const pendingRevenue = parseFloat(data.revenue.pending_revenue || 0);
      
      this.paymentAnalytics = {
        successRate: totalRevenue > 0 ? ((totalRevenue / (totalRevenue + pendingRevenue)) * 100) : 0,
        pendingPayments: data.overview?.pending_bookings || 0,
        failedPayments: 0, // TODO: Add to API
        totalProcessed: totalRevenue,
        processingFees: totalRevenue * 0.03 // Assume 3% processing fee
      };
    }

    // Refund analytics
    if (data.refunds && data.refunds.stats) {
      const stats = data.refunds.stats;
      const giftcards = data.refunds.giftcards || {};
      
      this.refundAnalytics = {
        totalRefunds: parseInt(stats.total_refunds || 0),
        totalRefundAmount: parseFloat(stats.total_refund_amount || 0),
        pendingRefunds: parseInt(stats.pending_refunds_count || 0),
        pendingRefundAmount: parseFloat(stats.pending_refunds_amount || 0),
        completedRefunds: parseInt(stats.completed_refunds_count || 0),
        completedRefundAmount: parseFloat(stats.completed_refunds_amount || 0),
        refundRate: 0, // Will calculate below
        netRevenue: 0, // Will calculate below
        giftCardsIssued: parseInt(giftcards.total_giftcards || 0),
        giftCardAmount: parseFloat(giftcards.total_giftcard_amount || 0),
        avgRefundAmount: parseFloat(stats.avg_refund_amount || 0)
      };

      // Calculate refund rate and net revenue
      const totalRevenue = parseFloat(data.revenue?.total_revenue || 0);
      if (totalRevenue > 0) {
        this.refundAnalytics.refundRate = (this.refundAnalytics.totalRefundAmount / totalRevenue) * 100;
        this.refundAnalytics.netRevenue = totalRevenue - this.refundAnalytics.totalRefundAmount;
      }

      // Update main analytics with net revenue
      if (data.revenue) {
        this.analytics.totalRevenue = this.refundAnalytics.netRevenue || this.analytics.totalRevenue;
      }
    }
    
    // Ensure all arrays have at least empty arrays (prevent undefined errors)
    if (!this.performanceMetrics || this.performanceMetrics.length === 0) {
      this.performanceMetrics = [];
    }
    if (!this.topDestinations || this.topDestinations.length === 0) {
      this.topDestinations = [];
    }
    if (!this.bookingStatus || this.bookingStatus.length === 0) {
      this.bookingStatus = [];
    }
    if (!this.recentActivities || this.recentActivities.length === 0) {
      this.recentActivities = [];
    }
    
    console.log('✅ Analytics data processed successfully:', {
      revenue: this.analytics.totalRevenue,
      bookings: this.analytics.totalBookings,
      destinations: this.topDestinations.length,
      activities: this.recentActivities.length,
      performanceMetrics: this.performanceMetrics.length
    });
  }

  /**
   * Load fallback static data if API fails
   */
  loadFallbackData() {
    console.warn('Using fallback data - API connection failed');
    
    this.analytics = {
      totalRevenue: 285750,
      revenueGrowth: 12.5,
      totalBookings: 1247,
      bookingsGrowth: 8.2,
      averageBookingValue: 2890,
      avgValueChange: 3.1,
      conversionRate: 24.8,
      conversionGrowth: 5.3
    };

    this.performanceMetrics = [
      { label: 'Active Tours', value: 15, change: '+5%', trend: 'up', status: 'good' },
      { label: 'Total Customers', value: 50, change: '+12%', trend: 'up', status: 'good' },
      { label: 'Pending Bookings', value: 8, change: '0%', trend: 'neutral', status: 'good' },
      { label: 'Confirmed Bookings', value: 45, change: '+8%', trend: 'up', status: 'excellent' }
    ];

    this.topDestinations = [
      { name: 'Golden Triangle', flag: '🇮🇳', bookings: 12, revenue: 36000, growth: 15, percentage: 85 },
      { name: 'Kerala Backwaters', flag: '🇮🇳', bookings: 8, revenue: 24000, growth: 10, percentage: 70 },
      { name: 'Himalayan Trek', flag: '🇮🇳', bookings: 6, revenue: 18000, growth: 5, percentage: 55 }
    ];

    this.bookingStatus = [
      { label: 'Confirmed', count: 45, percentage: 60, color: '#10b981' },
      { label: 'Pending', count: 20, percentage: 27, color: '#f59e0b' },
      { label: 'Cancelled', count: 10, percentage: 13, color: '#ef4444' }
    ];

    this.paymentAnalytics = {
      successRate: 95.5,
      pendingPayments: 8,
      failedPayments: 2,
      totalProcessed: 285750,
      processingFees: 8572
    };

    this.recentActivities = [
      { timestamp: new Date(), description: 'New booking confirmed', user: 'Sample Customer', amount: 3000, status: 'confirmed', icon: 'fas fa-check-circle', iconColor: '#10b981' },
      { timestamp: new Date(), description: 'Payment received', user: 'Test User', amount: 2500, status: 'completed', icon: 'fas fa-credit-card', iconColor: '#6366f1' }
    ];

    setTimeout(() => this.renderRevenueChart(), 100);
  }

  /**
   * Get country flag emoji based on destination name
   */
  getCountryFlag(destination: string): string {
    const flagMap: any = {
      'India': '🇮🇳',
      'Bali': '🇮🇩',
      'Indonesia': '🇮🇩',
      'Tokyo': '🇯🇵',
      'Japan': '🇯🇵',
      'Paris': '🇫🇷',
      'France': '🇫🇷',
      'Maldives': '🇲🇻',
      'Switzerland': '🇨🇭',
      'Dubai': '🇦🇪',
      'Thailand': '🇹🇭',
      'Singapore': '🇸🇬'
    };

    for (const [key, flag] of Object.entries(flagMap)) {
      if (destination.includes(key)) {
        return flag as string;
      }
    }

    return '🗺️'; // Default world map emoji
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    const iconMap: any = {
      'booking': 'fas fa-calendar-plus',
      'payment': 'fas fa-credit-card',
      'completed': 'fas fa-check-circle',
      'cancelled': 'fas fa-times-circle',
      'pending': 'fas fa-clock'
    };

    return iconMap[type.toLowerCase()] || 'fas fa-info-circle';
  }

  /**
   * Get activity color based on status
   */
  getActivityColor(status: string): string {
    const colorMap: any = {
      'confirmed': '#10b981',
      'completed': '#6366f1',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'failed': '#ef4444'
    };

    return colorMap[status.toLowerCase()] || '#6b7280';
  }

  private revenueChartData: any = { labels: [], data: [] };
  private revenueChart: any = null;

  renderRevenueChart() {
    const ctx = (document.getElementById('revenueChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    
    // Generate sample data for last 30 days if no data exists
    const generateSampleData = () => {
      const labels = [];
      const data = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        // Generate random revenue between 0-5000
        data.push(Math.floor(Math.random() * 5000));
      }
      
      return { labels, data };
    };
    
    // Use real data from API or generate sample data
    let labels, data;
    if (this.revenueChartData.labels.length > 0 && this.revenueChartData.data.length > 0) {
      labels = this.revenueChartData.labels;
      data = this.revenueChartData.data;
    } else {
      // No real data available, generate sample data
      const sampleData = generateSampleData();
      labels = sampleData.labels;
      data = sampleData.data;
      console.warn('No revenue data available, showing sample data');
    }
    
    const hasRealData = this.revenueChartData.labels.length > 0 && this.revenueChartData.data.length > 0;
    const chartTitle = hasRealData ? 'Revenue Trend (Live Data)' : 'Revenue Trend (Sample Data - No Bookings Yet)';
    
    this.revenueChart = new Chart(ctx, {
      type: this.chartType as any,
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: data,
          borderColor: hasRealData ? '#10b981' : '#f59e0b',
          backgroundColor: hasRealData ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            labels: {
              font: {
                size: 12
              }
            }
          },
          title: { 
            display: true, 
            text: chartTitle,
            font: {
              size: 14,
              weight: 'bold'
            },
            color: hasRealData ? '#10b981' : '#f59e0b'
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return '₹' + value.toLocaleString();
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
    
    this.chartInitialized = true;
  }

  // Method to initialize charts (requires Chart.js integration)
  initializeCharts() {
    // Chart initialization code would go here
    // Example: Revenue trend chart, booking distribution pie chart, etc.
  }

  onTimeframeChange() {
    // Update chart data based on selected timeframe
    console.log('Timeframe changed to:', this.revenueTimeframe);
    this.loadAnalyticsData();
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
    this.loadAnalyticsData();
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

  /**
   * Get current time for display
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * View pending refunds with full details
   */
  viewPendingRefunds() {
    this.isLoadingDetails = true;
    this.showRefundDetailsModal = true;
    
    console.log('📋 Loading detailed refund information...');
    
    // Fetch all refunds from API (pending and completed)
    this.apiService.getAllRefunds().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.detailedRefundsList = response.data.refunds || [];
          console.log('✅ Loaded refund details:', this.detailedRefundsList);
          console.log('Total refunds:', this.detailedRefundsList.length);
          console.log('Refund amounts:', this.detailedRefundsList.map((r: any) => ({
            id: r.refund_id, 
            amount: r.refund_amount,
            method: r.refund_method,
            status: r.refund_status
          })));
        } else {
          this.detailedRefundsList = [];
          alert('No refund data available');
        }
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('❌ Error loading refund details:', error);
        alert('Failed to load refund details. Please try again.');
        this.isLoadingDetails = false;
        this.showRefundDetailsModal = false;
      }
    });
  }

  /**
   * View specific refund details
   */
  viewRefundDetail(refund: any) {
    this.selectedRefund = refund;
    console.log('👁️ Viewing refund detail:', refund);
  }

  /**
   * Close refund details modal
   */
  closeRefundModal() {
    this.showRefundDetailsModal = false;
    this.selectedRefund = null;
    this.detailedRefundsList = [];
  }

  /**
   * View completed refunds details
   */
  viewCompletedRefunds() {
    this.isLoadingDetails = true;
    this.showRefundDetailsModal = true;
    
    console.log('✅ Loading completed refunds information...');
    
    // Fetch completed refunds with customer details
    this.apiService.getCompletedRefunds().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.refunds) {
          this.detailedRefundsList = response.data.refunds || [];
          
          console.log('✅ Loaded completed refund details:', this.detailedRefundsList.length, 'refunds');
          console.log('Completed Refund Data:', this.detailedRefundsList);
          
          if (this.detailedRefundsList.length === 0) {
            console.warn('⚠️ No completed refunds found in database');
          }
        } else {
          this.detailedRefundsList = [];
          console.warn('⚠️ No completed refund data in response');
        }
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('❌ Error loading completed refund details:', error);
        alert('Failed to load completed refund details. Please try again.');
        this.isLoadingDetails = false;
        this.showRefundDetailsModal = false;
      }
    });
  }

  /**
   * View gift card details
   */
  viewGiftCardDetails() {
    this.isLoadingDetails = true;
    this.showGiftCardDetailsModal = true;
    
    console.log('🎁 Loading gift card information...');
    
    // Fetch actual gift cards with customer details
    this.apiService.getAllGiftCards().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.giftcards) {
          this.detailedGiftCardsList = response.data.giftcards || [];
          
          console.log('✅ Loaded gift card details:', this.detailedGiftCardsList.length, 'cards');
          console.log('Gift Card Data:', this.detailedGiftCardsList);
          
          if (this.detailedGiftCardsList.length === 0) {
            console.warn('⚠️ No gift cards found in database');
          }
        } else {
          this.detailedGiftCardsList = [];
          console.warn('⚠️ No gift card data in response');
        }
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('❌ Error loading gift card details:', error);
        alert('Failed to load gift card details. Please try again.');
        this.isLoadingDetails = false;
        this.showGiftCardDetailsModal = false;
      }
    });
  }

  /**
   * View specific gift card details
   */
  viewGiftCardDetail(giftCard: any) {
    this.selectedGiftCard = giftCard;
    console.log('👁️ Viewing gift card detail:', giftCard);
  }

  /**
   * Close gift card details modal
   */
  closeGiftCardModal() {
    this.showGiftCardDetailsModal = false;
    this.selectedGiftCard = null;
    this.detailedGiftCardsList = [];
  }

  /**
   * Export refund details to CSV
   */
  exportRefundDetails() {
    const csvHeader = 'Refund ID,Booking Reference,Customer Name,Email,Phone,Amount,Method,Status,Request Date,Processed Date\n';
    const csvRows = this.detailedRefundsList.map(r => 
      `${r.refund_id},"${r.booking_reference}","${r.first_name} ${r.last_name}","${r.email}","${r.phone || 'N/A'}",${r.refund_amount},"${r.refund_method}","${r.refund_status}","${r.created_at}","${r.completed_at || 'Pending'}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `refund_details_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Refund details exported successfully!');
  }

  /**
   * Print refund report
   */
  printRefundReport(refund: any) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Refund Details - ${refund.booking_reference}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; margin-left: 10px; }
              .status { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-completed { background: #d4edda; color: #155724; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Refund Details Report</h1>
              <p>Indian Wonderer Tours</p>
            </div>
            
            <div class="section">
              <h2>Booking Information</h2>
              <p><span class="label">Booking Reference:</span><span class="value">${refund.booking_reference}</span></p>
              <p><span class="label">Tour Name:</span><span class="value">${refund.tour_name || 'N/A'}</span></p>
              <p><span class="label">Travel Dates:</span><span class="value">${refund.tour_start_date || 'N/A'} to ${refund.tour_end_date || 'N/A'}</span></p>
            </div>
            
            <div class="section">
              <h2>Customer Information</h2>
              <p><span class="label">Name:</span><span class="value">${refund.first_name} ${refund.last_name}</span></p>
              <p><span class="label">Email:</span><span class="value">${refund.email}</span></p>
              <p><span class="label">Phone:</span><span class="value">${refund.phone || 'N/A'}</span></p>
            </div>
            
            <div class="section">
              <h2>Refund Details</h2>
              <p><span class="label">Refund ID:</span><span class="value">#${refund.refund_id}</span></p>
              <p><span class="label">Amount:</span><span class="value">₹${refund.refund_amount.toFixed(2)}</span></p>
              <p><span class="label">Method:</span><span class="value">${refund.refund_method === 'bank' ? 'Bank Transfer' : 'Gift Card'}</span></p>
              <p><span class="label">Status:</span><span class="value"><span class="status status-${refund.refund_status}">${refund.refund_status.toUpperCase()}</span></span></p>
              <p><span class="label">Reason:</span><span class="value">${refund.refund_reason || 'Not specified'}</span></p>
            </div>
            
            <div class="section">
              <h2>Timeline</h2>
              <p><span class="label">Request Date:</span><span class="value">${new Date(refund.created_at).toLocaleString()}</span></p>
              ${refund.completed_at ? `<p><span class="label">Processed Date:</span><span class="value">${new Date(refund.completed_at).toLocaleString()}</span></p>` : ''}
              ${refund.admin_notes ? `<p><span class="label">Admin Notes:</span><span class="value">${refund.admin_notes}</span></p>` : ''}
            </div>
            
            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>Indian Wonderer Tours - Admin Panel</p>
            </div>
            
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusMap: any = {
      'pending': 'warning',
      'completed': 'success',
      'rejected': 'danger',
      'processing': 'info'
    };
    return statusMap[status?.toLowerCase()] || 'secondary';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}