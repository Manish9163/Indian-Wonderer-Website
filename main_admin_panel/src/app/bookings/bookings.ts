import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingsService, Booking, BookingStats } from '../services/bookings.service';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html'
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookingFilter: string = '';
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  isLoading: boolean = true;
  errorMessage: string = '';
  
  bookingStats: BookingStats = {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  };

  private subscriptions = new Subscription();

  constructor(
    private bookingsService: BookingsService,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to bookings changes for real-time updates
    this.subscriptions.add(
      this.bookingsService.bookings$.subscribe(bookings => {
        this.bookings = bookings;
        this.filterBookings();
        console.log('🔔 Bookings updated:', bookings.length);
      })
    );

    // Subscribe to stats changes for real-time updates
    this.subscriptions.add(
      this.bookingsService.stats$.subscribe(stats => {
        this.bookingStats = stats;
        console.log('📊 Stats updated:', stats);
      })
    );

    // Subscribe to loading state
    this.subscriptions.add(
      this.bookingsService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    // Subscribe to error messages
    this.subscriptions.add(
      this.bookingsService.error$.subscribe(error => {
        this.errorMessage = error;
      })
    );

    // Initial load
    this.loadBookings();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  loadBookings(): void {
    console.log('📊 Loading bookings via service...');
    
    // Auto-complete expired bookings first
    this.autoCompleteExpiredBookings();
    
    this.bookingsService.loadBookings();
  }

  autoCompleteExpiredBookings(): void {
    // Check and complete expired bookings silently in the background
    this.apiService.autoCompleteExpiredBookings().subscribe({
      next: (response: any) => {
        if (response && response.success && response.completed_count > 0) {
          console.log(`🔄 Auto-completed ${response.completed_count} expired booking(s)`);
          console.log('Details:', response.completed_bookings);
          
          // Add notification
          this.notificationService.addTourCompletedNotification(response.completed_count);
        }
      },
      error: (error: any) => {
        // Fail silently, don't interrupt the user experience
        console.warn('⚠️ Failed to auto-complete bookings:', error);
      }
    });
  }

  filterBookings(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesSearch = booking.tourName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           booking.customerName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || booking.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterBookings();
  }

  onStatusFilterChange(): void {
    this.filterBookings();
  }

  confirmBooking(bookingId: number): void {
    console.log('✅ Confirming booking:', bookingId);
    this.bookingsService.updateBookingStatus(bookingId, 'confirmed').subscribe({
      next: (response) => {
        console.log('✅ Booking confirmed successfully!');
        // No need to manually update - service broadcasts changes automatically
        alert('Booking confirmed successfully! 🎉');
      },
      error: (error) => {
        console.error('❌ Error confirming booking:', error);
        alert('Failed to confirm booking: ' + error.message);
      }
    });
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      console.log('❌ Cancelling booking:', bookingId);
      this.bookingsService.updateBookingStatus(bookingId, 'cancelled').subscribe({
        next: (response) => {
          console.log('✅ Booking cancelled successfully!');
          // No need to manually update - service broadcasts changes automatically
          alert('Booking cancelled successfully!');
        },
        error: (error) => {
          console.error('❌ Error cancelling booking:', error);
          alert('Failed to cancel booking: ' + error.message);
        }
      });
    }
  }

  deleteBooking(bookingId: number): void {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      console.log('🗑️ Deleting booking:', bookingId);
      this.bookingsService.deleteBooking(bookingId).subscribe({
        next: (response) => {
          console.log('✅ Booking deleted successfully!');
          // No need to manually update - service broadcasts changes automatically
          alert('Booking deleted successfully!');
        },
        error: (error) => {
          console.error('❌ Error deleting booking:', error);
          alert('Failed to delete booking: ' + error.message);
        }
      });
    }
  }

  viewBookingDetails(bookingId: number): void {
    console.log('Viewing booking details:', bookingId);
  }

  exportBookings(): void {
    console.log('Exporting bookings...');
  }

  refreshBookings(): void {
    console.log('🔄 Refreshing bookings...');
    this.bookingsService.refresh();
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
