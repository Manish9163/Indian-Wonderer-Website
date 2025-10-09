import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  selectedPeriod: string = 'month';
  selectedBookingStatus: string = 'all';
  isRefreshing: boolean = false;
  isRefreshingBookings: boolean = false;

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

  liveActivities: any[] = [];

  ngOnInit() {
    this.loadDashboardData();
    this.startLiveActivityMonitor();
    this.filterBookings();
  }

  loadDashboardData() {
    this.isRefreshing = true;
    
    console.log('Loading dashboard data from API...');
    
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        console.log('Dashboard API Response:', response);
        
        if (response && response.success && response.data) {
          const data = response.data;
          const stats = data.stats || {};
          
          this.stats = {
            totalTours: stats.totalTours || stats.activeTours || 0,
            activeBookings: stats.totalBookings || stats.confirmedBookings || 0,
            totalCustomers: stats.totalCustomers || stats.activeCustomers || 0,
            monthlyRevenue: stats.monthlyRevenue || stats.totalRevenue || 0,
            toursGrowth: Math.floor(Math.random() * 15) + 5, // Simulated growth
            bookingsGrowth: Math.floor(Math.random() * 20) + 5,
            customersGrowth: Math.floor(Math.random() * 10) + 3,
            revenueGrowth: Math.floor(Math.random() * 25) + 10
          };
          
          if (data.recentBookings && Array.isArray(data.recentBookings)) {
            this.recentBookings = data.recentBookings.slice(0, 5).map((booking: any) => ({
              id: booking.booking_reference || booking.id,
              customer: booking.customer_name || 'Unknown',
              tour: booking.tour_name || 'Unknown Tour',
              destination: booking.destination || 'Unknown',
              date: new Date(booking.travel_date || booking.created_at),
              status: booking.status || 'pending',
              amount: parseFloat(booking.total_amount) || 0
            }));
          }
          
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

  updatePeriod() {
    console.log(`Updating dashboard for period: ${this.selectedPeriod}`);
    this.refreshDashboard();
  }

  refreshDashboard() {
    console.log('Refreshing dashboard data...');
    this.isRefreshing = true;
    
    setTimeout(() => {
      const variation = () => (Math.random() - 0.5) ;
      
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

  createNewTour() {
    console.log('Creating new tour...');
    try {
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

  startLiveActivityMonitor() {
    console.log('Starting live activity monitor...');
    
    this.loadLiveActivities();
    
    setInterval(() => {
      this.loadLiveActivities();
    }, 10000);
  }

  loadLiveActivities() {
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const data = response.data;
          
          if (data.recentBookings && Array.isArray(data.recentBookings)) {
            data.recentBookings.slice(0, 3).forEach((booking: any) => {
              const activity = {
                icon: 'fas fa-calendar-check',
                color: '#3b82f6',
                title: 'New Booking',
                description: `${booking.customer_name || 'Customer'} booked ${booking.tour_name || 'tour'}`,
                timestamp: new Date(booking.created_at || Date.now())
              };
              
              const exists = this.liveActivities.some(a => 
                a.description === activity.description && 
                Math.abs(new Date(a.timestamp).getTime() - activity.timestamp.getTime()) < 60000
              );
              
              if (!exists) {
                this.liveActivities.unshift(activity);
              }
            });
          }
          
          const stats = data.stats || {};
          if (stats.totalCustomers && stats.totalCustomers > 0) {
            const customerActivity = {
              icon: 'fas fa-user-plus',
              color: '#10b981',
              title: 'Active Customers',
              description: `${stats.totalCustomers} customers in database`,
              timestamp: new Date()
            };
            
            const customerIndex = this.liveActivities.findIndex(a => a.title === 'Active Customers');
            if (customerIndex >= 0) {
              this.liveActivities[customerIndex] = customerActivity;
            } else if (this.liveActivities.length < 5) {
              this.liveActivities.push(customerActivity);
            }
          }
          
          if (stats.totalRevenue && stats.totalRevenue > 0) {
            const revenueActivity = {
              icon: 'fas fa-rupee-sign',
              color: '#ef4444',
              title: 'Revenue Update',
              description: `Total revenue: ₹${stats.totalRevenue.toLocaleString()}`,
              timestamp: new Date()
            };
            
            const revenueIndex = this.liveActivities.findIndex(a => a.title === 'Revenue Update');
            if (revenueIndex >= 0) {
              this.liveActivities[revenueIndex] = revenueActivity;
            } else if (this.liveActivities.length < 5) {
              this.liveActivities.push(revenueActivity);
            }
          }
          
          if (this.liveActivities.length > 5) {
            this.liveActivities = this.liveActivities.slice(0, 5);
          }
        }
      },
      error: (error) => {
        console.error('Error loading live activities:', error);
      }
    });
  }

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
