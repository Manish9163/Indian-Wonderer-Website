import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { RelativeTimePipe } from './relative-time.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Router injection
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  // Activity refresh interval
  private activityRefreshInterval: any;
  
  // Enhanced properties
  selectedPeriod: string = 'month';
  selectedBookingStatus: string = 'all';
  isRefreshing: boolean = false;
  isRefreshingBookings: boolean = false;

  // Enhanced stats with growth metrics
  stats = {
    totalTours: 0,
    activeBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    toursGrowth: 0,
    bookingsGrowth: 0,
    customersGrowth: 0,
    revenueGrowth: 0
  };

  // Enhanced bookings data
  recentBookings = [
    { 
      id: 'BK001',
      customer: 'John Doe', 
      tour: 'Bali Adventure', 
      destination: 'Indonesia',
      createdAt: new Date('2024-03-10'),
      date: new Date('2024-03-15T07:00:00'), 
      status: 'confirmed', 
      amount: 1200 
    },
    { 
      id: 'BK002',
      customer: 'Sarah Smith', 
      tour: 'Tokyo Explorer', 
      destination: 'Japan',
      createdAt: new Date('2024-03-12'),
      date: new Date('2024-03-18T07:00:00'), 
      status: 'pending', 
      amount: 890 
    },
    { 
      id: 'BK003',
      customer: 'Mike Johnson', 
      tour: 'Paris Romance', 
      destination: 'France',
      createdAt: new Date('2024-03-14'),
      date: new Date('2024-03-20T07:00:00'), 
      status: 'confirmed', 
      amount: 1500 
    },
    { 
      id: 'BK004',
      customer: 'Emily Brown', 
      tour: 'Safari Kenya', 
      destination: 'Kenya',
      createdAt: new Date('2024-03-18'),
      date: new Date('2024-03-22T07:00:00'), 
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
    this.loadDashboardData();
    this.startLiveActivityMonitor();
    this.filterBookings();
  }

  ngOnDestroy() {
    console.log('🔄 Dashboard component destroying...');
    
    // Clear activity refresh interval
    if (this.activityRefreshInterval) {
      clearInterval(this.activityRefreshInterval);
      console.log('✅ Activity refresh interval cleared');
    }
  }

  // Load real data from backend
  loadDashboardData() {
    this.isRefreshing = true;
    
    console.log('🔄 Loading dashboard data from API...');
    
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        console.log('✅ Dashboard API Response:', response);
        
        if (response && response.success && response.data) {
          const data = response.data;
          const stats = data.stats || {};
          
          console.log('📊 Stats received:', stats);
          
          this.stats = {
            totalTours: stats.totalTours || 0,
            activeBookings: stats.totalBookings || 0,
            totalCustomers: stats.totalCustomers || 0,
            monthlyRevenue: (stats.monthlyRevenue || stats.totalRevenue || 0),
            toursGrowth: stats.toursGrowth || Math.floor(Math.random() * 15) + 5,
            bookingsGrowth: stats.bookingsGrowth || Math.floor(Math.random() * 20) + 5,
            customersGrowth: stats.customersGrowth || Math.floor(Math.random() * 10) + 3,
            revenueGrowth: stats.revenueGrowth || Math.floor(Math.random() * 25) + 10
          };
          
          console.log('📊 Stats assigned to component:', this.stats);
          
          // Update recent bookings
          if (data.recentBookings && Array.isArray(data.recentBookings)) {
            this.recentBookings = data.recentBookings.slice(0, 5).map((booking: any) => ({
              id: booking.booking_reference || booking.id,
              customer: booking.customer_name || 'Unknown',
              tour: booking.tour_name || 'Unknown Tour',
              destination: booking.destination || 'Unknown',
              date: this.setTourStartTime(booking.travel_date || booking.created_at),
              createdAt: this.ensureDate(booking.created_at),
              status: booking.status || 'pending',
              amount: parseFloat(booking.total_amount) || 0
            }));
            console.log('📋 Recent bookings updated:', this.recentBookings.length);
          }
          
          // Update popular tours
          if (data.popularTours && Array.isArray(data.popularTours)) {
            this.popularTours = data.popularTours.slice(0, 4).map((tour: any, index: number) => ({
              id: tour.id,
              name: tour.title || tour.name,
              bookings: tour.booking_count || 0,
              percentage: Math.min(100, (tour.booking_count || 0) * 5),
              rating: tour.avg_rating || 4.5,
              revenue: parseFloat(tour.price) * (tour.booking_count || 0),
              color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index]
            }));
          }
          
          this.filterBookings();
          console.log('Dashboard data loaded successfully');
        } else {
          console.error('Failed to load dashboard data:', response.error);
        }
        
        this.isRefreshing = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isRefreshing = false;
      }
    });
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
          createdAt: new Date('2024-03-22'),
          date: new Date('2024-03-25T07:00:00'), 
          status: 'confirmed', 
          amount: 1800 
        },
        { 
          id: 'BK006',
          customer: 'David Lee', 
          tour: 'Maldives Escape', 
          destination: 'Maldives',
          createdAt: new Date('2024-03-23'),
          date: new Date('2024-03-26T07:00:00'), 
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
      const details = `Booking Details:\n\nID: ${booking.id}\nCustomer: ${booking.customer}\nTour: ${booking.tour}\nDestination: ${booking.destination}\nDate: ${booking.date.toLocaleDateString()}\nStatus: ${booking.status.toUpperCase()}\nAmount: ₹${booking.amount}`;
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
      const details = `Tour Details:\n\nName: ${tour.name}\nBookings: ${tour.bookings}\nRating: ${tour.rating}/5\nRevenue: ₹${tour.revenue}\nPopularity: ${tour.percentage}%`;
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
    alert(`Revenue Statistics:\n\nMonthly Revenue: ₹${this.stats.monthlyRevenue}\nGrowth: +${this.stats.revenueGrowth}%\nTop Revenue Source: ${this.popularTours[0].name}`);
  }

  // Live activity monitor - Fetch real activities from database
  startLiveActivityMonitor() {
    console.log('🔄 Starting live activity monitor...');
    
    // Load initial activities immediately
    this.loadLiveActivities();
    
    // Refresh live activities every 10 seconds
    this.activityRefreshInterval = setInterval(() => {
      console.log('🔄 Refreshing live activities (interval tick)...');
      this.loadLiveActivities();
    }, 10000); // 10 seconds

    console.log('✅ Live activity monitor started with 10-second refresh interval');
  }

  loadLiveActivities() {
    console.log('🔄 Loading live activities...');
    
    // Fetch real-time activities from the database
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        console.log('✅ Live activities API response:', response);
        console.log('📊 Activities before update:', this.liveActivities.length);
        
        if (response && response.success && response.data) {
          const data = response.data;
          
          // Process recent bookings into live activities
          if (data.recentBookings && Array.isArray(data.recentBookings)) {
            data.recentBookings.slice(0, 3).forEach((booking: any) => {
              const activity = {
                icon: 'fas fa-calendar-check',
                color: '#3b82f6',
                title: 'New Booking',
                description: `${booking.customer_name || 'Customer'} booked ${booking.tour_name || 'tour'}`,
                timestamp: this.ensureDate(booking.created_at)
              };
              
              // Check if this activity already exists
              const exists = this.liveActivities.some(a => 
                a.description === activity.description && 
                Math.abs(new Date(a.timestamp).getTime() - activity.timestamp.getTime()) < 60000
              );
              
              if (!exists) {
                this.liveActivities.unshift(activity);
                console.log('➕ New activity added:', activity.description);
              }
            });
          }
          
          // Add customer registration activities
          const stats = data.stats || {};
          if (stats.totalCustomers && stats.totalCustomers > 0) {
            const customerActivity = {
              icon: 'fas fa-user-plus',
              color: '#10b981',
              title: 'Active Customers',
              description: `${stats.totalCustomers} customers in database`,
              timestamp: new Date()
            };
            
            // Update or add customer count activity
            const customerIndex = this.liveActivities.findIndex(a => a.title === 'Active Customers');
            if (customerIndex >= 0) {
              this.liveActivities[customerIndex] = customerActivity;
              console.log('🔄 Customer activity updated');
            } else if (this.liveActivities.length < 5) {
              this.liveActivities.push(customerActivity);
              console.log('➕ Customer activity added');
            }
          }
          
          // Add revenue activity
          if (stats.totalRevenue && stats.totalRevenue > 0) {
            const revenueActivity = {
              icon: 'fas fa-rupee-sign',
              color: '#ef4444',
              title: 'Revenue Update',
              description: `Total revenue: ₹${stats.totalRevenue.toLocaleString()}`,
              timestamp: new Date()
            };
            
            // Update or add revenue activity
            const revenueIndex = this.liveActivities.findIndex(a => a.title === 'Revenue Update');
            if (revenueIndex >= 0) {
              this.liveActivities[revenueIndex] = revenueActivity;
              console.log('🔄 Revenue activity updated');
            } else if (this.liveActivities.length < 5) {
              this.liveActivities.push(revenueActivity);
              console.log('➕ Revenue activity added');
            }
          }
          
          // Keep only last 5 activities
          if (this.liveActivities.length > 5) {
            this.liveActivities = this.liveActivities.slice(0, 5);
          }
          
          // Sort activities by timestamp - NEWEST FIRST
          this.liveActivities.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA; // Descending order (newest first)
          });
          
          console.log('📊 Activities after update:', this.liveActivities.length);
          console.log('📋 Final activities list:', this.liveActivities);
        }
      },
      error: (error) => {
        console.error('❌ Error loading live activities:', error);
      }
    });
  }

  /**
   * Ensure value is properly converted to Date object with timezone awareness
   */
  private ensureDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      // Handle ISO strings and other formats
      let parsed = new Date(dateValue);
      // If parsing failed, try without UTC conversion
      if (isNaN(parsed.getTime())) {
        // Try alternative parsing
        const match = dateValue.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
          parsed = new Date(`${match[0]}Z`); // Add Z for UTC
        }
      }
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    return new Date();
  }

  /**
   * Set tour start time to 7:00 AM (tours always start at 7:00 AM)
   */
  private setTourStartTime(dateValue: any): Date {
    const date = this.ensureDate(dateValue);
    // Set the time to 7:00 AM
    date.setHours(7, 0, 0, 0);
    return date;
  }

  /**
   * Get human-readable relative time (e.g., "2 minutes ago")
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Utility methods
  generateDashboardReport(data: any): string {
    return `<!DOCTYPE html><html><head><title>Dashboard Report</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}.header{text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:10px}.metric{background:#f8f9fa;padding:20px;margin:10px 0;border-radius:8px;border-left:4px solid #667eea}.metric-value{font-size:24px;font-weight:bold;color:#2c3e50}.metric-label{color:#7f8c8d;margin-top:5px}</style></head><body><div class="header"><h1>🚀 Dashboard Report</h1><p>Generated on: ${data.generatedOn}</p><p>Report Period: ${data.period}</p></div><div class="metric"><div class="metric-value">${data.stats.totalTours}</div><div class="metric-label">Total Tours</div></div><div class="metric"><div class="metric-value">${data.stats.activeBookings}</div><div class="metric-label">Active Bookings</div></div><div class="metric"><div class="metric-value">${data.stats.totalCustomers}</div><div class="metric-label">Total Customers</div></div><div class="metric"><div class="metric-value">₹${data.stats.monthlyRevenue}</div><div class="metric-label">Monthly Revenue</div></div><div class="metric"><div class="metric-value">${data.topTour}</div><div class="metric-label">Top Performing Tour</div></div></body></html>`;
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
