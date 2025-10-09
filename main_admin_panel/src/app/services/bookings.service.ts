import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Booking {
  id: number;
  tourName: string;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  tourDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amount: number;
  guests: number;
  paymentStatus: string;
  refund_id?: number;
  refund_amount?: number;
  refund_status?: string;
  refund_method?: string;
  giftcard_code?: string;
  giftcard_amount?: number;
  giftcard_balance?: number;
  giftcard_status?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private statsSubject = new BehaviorSubject<BookingStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  public bookings$ = this.bookingsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('BookingsService initialized');
  }

  /**
   * Get current bookings snapshot
   */
  getCurrentBookings(): Booking[] {
    return this.bookingsSubject.value;
  }

  /**
   * Get current stats snapshot
   */
  getCurrentStats(): BookingStats {
    return this.statsSubject.value;
  }

  /**
   * Load all bookings from API and broadcast
   */
  loadBookings(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next('');

    console.log('📊 Loading bookings from API...');

    this.apiService.getBookings().subscribe({
      next: (response) => {
        console.log('✅ Bookings API Response:', response);

        if (response && response.success && response.data) {
          const bookings: Booking[] = (response.data.bookings || []).map((booking: any) => ({
            id: booking.id,
            tourName: booking.tour_name || 'Unknown Tour',
            customerName: booking.customer_name || 'Unknown Customer',
            customerEmail: booking.customer_email || '',
            bookingDate: booking.created_at || booking.booking_date,
            tourDate: booking.travel_date,
            status: booking.status || 'pending',
            amount: parseFloat(booking.total_amount) || 0,
            guests: booking.number_of_travelers || 1,
            paymentStatus: booking.payment_status,
            refund_id: booking.refund_id,
            refund_amount: booking.refund_amount,
            refund_status: booking.refund_status,
            refund_method: booking.refund_method,
            giftcard_code: booking.giftcard_code,
            giftcard_amount: booking.giftcard_amount,
            giftcard_balance: booking.giftcard_balance,
            giftcard_status: booking.giftcard_status
          }));

          const stats: BookingStats = response.data.stats || {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0,
            totalRevenue: 0
          };

          // Broadcast to all subscribers
          this.bookingsSubject.next(bookings);
          this.statsSubject.next(stats);
          this.loadingSubject.next(false);

          console.log(`🔔 Broadcast: ${bookings.length} bookings loaded`);
        } else {
          const errorMsg = response.error || 'Failed to load bookings';
          this.errorSubject.next(errorMsg);
          this.loadingSubject.next(false);
          console.error('❌ Error:', errorMsg);
        }
      },
      error: (error) => {
        console.error('❌ Error loading bookings:', error);
        const errorMsg = error.message || 'Error loading bookings. Check if XAMPP is running.';
        this.errorSubject.next(errorMsg);
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Update booking status and broadcast changes
   */
  updateBookingStatus(bookingId: number, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Observable<any> {
    console.log(`🔄 Updating booking ${bookingId} status to ${status}...`);

    return new Observable(observer => {
      this.apiService.updateBookingStatus(bookingId, status).subscribe({
        next: (response) => {
          if (response.success) {
            // Update local state
            const currentBookings = this.bookingsSubject.value;
            const updatedBookings = currentBookings.map(booking =>
              booking.id === bookingId ? { ...booking, status } : booking
            );

            // Recalculate stats
            const stats = this.calculateStats(updatedBookings);

            // Broadcast updates
            this.bookingsSubject.next(updatedBookings);
            this.statsSubject.next(stats);

            console.log(`✅ Booking ${bookingId} updated and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Update failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error updating booking:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Delete booking and broadcast changes
   */
  deleteBooking(bookingId: number): Observable<any> {
    console.log(`🗑️ Deleting booking ${bookingId}...`);

    return new Observable(observer => {
      this.apiService.deleteBooking(bookingId).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove from local state
            const currentBookings = this.bookingsSubject.value;
            const updatedBookings = currentBookings.filter(booking => booking.id !== bookingId);

            // Recalculate stats
            const stats = this.calculateStats(updatedBookings);

            // Broadcast updates
            this.bookingsSubject.next(updatedBookings);
            this.statsSubject.next(stats);

            console.log(`✅ Booking ${bookingId} deleted and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Delete failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error deleting booking:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Refresh bookings (reload from API)
   */
  refresh(): void {
    console.log('🔄 Refreshing bookings...');
    this.loadBookings();
  }

  /**
   * Calculate booking statistics
   */
  private calculateStats(bookings: Booking[]): BookingStats {
    return {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      totalRevenue: bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + b.amount, 0)
    };
  }

  /**
   * Filter bookings by search term and status
   */
  filterBookings(searchTerm: string, statusFilter: string): Booking[] {
    const currentBookings = this.bookingsSubject.value;
    
    return currentBookings.filter(booking => {
      const matchesSearch = booking.tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next('');
  }
}
