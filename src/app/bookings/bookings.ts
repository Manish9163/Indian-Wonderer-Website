import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
})
export class BookingsComponent implements OnInit {
  bookings = [
    { id: '001', customer: 'John Doe', tour: 'Bali Adventure', date: '2024-03-15', guests: 2, amount: 2400, status: 'confirmed' },
    { id: '002', customer: 'Sarah Smith', tour: 'Tokyo Explorer', date: '2024-03-18', guests: 1, amount: 890, status: 'pending' },
    { id: '003', customer: 'Mike Johnson', tour: 'Paris Romance', date: '2024-03-20', guests: 2, amount: 3000, status: 'confirmed' },
    { id: '004', customer: 'Emily Brown', tour: 'Safari Kenya', date: '2024-03-22', guests: 4, amount: 8400, status: 'pending' },
    { id: '005', customer: 'David Wilson', tour: 'Swiss Alps', date: '2024-03-25', guests: 3, amount: 5400, status: 'confirmed' },
    { id: '006', customer: 'Lisa Garcia', tour: 'Maldives Escape', date: '2024-03-28', guests: 2, amount: 5600, status: 'cancelled' }
  ];
  filteredBookings = this.bookings;
  bookingFilter = '';

  ngOnInit() {
  }

  filterBookings() {
    if (this.bookingFilter) {
      this.filteredBookings = this.bookings.filter(b => b.status === this.bookingFilter);
    } else {
      this.filteredBookings = this.bookings;
    }
  }

  confirmBooking(bookingId: string) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'confirmed';
      this.filterBookings();
    }
  }
}
