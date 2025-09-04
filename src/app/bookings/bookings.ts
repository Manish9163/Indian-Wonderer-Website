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
    if (confirm('Are you sure you want to confirm this booking?')) {
      const booking = this.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'confirmed';
        this.filterBookings();
        alert('Booking confirmed successfully!');
      }
    }
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      const booking = this.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
        this.filterBookings();
        alert('Booking cancelled successfully!');
      }
    }
  }

  viewBookingDetails(booking: any) {
    const detailsWindow = window.open('', '_blank', 'width=600,height=800');
    if (detailsWindow) {
      detailsWindow.document.write(`
        <html>
          <head>
            <title>Booking Details - ${booking.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              .detail-row { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; display: inline-block; width: 120px; }
              .status { padding: 5px 10px; border-radius: 4px; }
              .confirmed { background-color: #d4edda; color: #155724; }
              .pending { background-color: #fff3cd; color: #856404; }
              .cancelled { background-color: #f8d7da; color: #721c24; }
            </style>
          </head>
          <body>
            <h2 class="header">Booking Details</h2>
            <div class="detail-row"><span class="label">Booking ID:</span> ${booking.id}</div>
            <div class="detail-row"><span class="label">Customer:</span> ${booking.customer}</div>
            <div class="detail-row"><span class="label">Tour:</span> ${booking.tour}</div>
            <div class="detail-row"><span class="label">Date:</span> ${booking.date}</div>
            <div class="detail-row"><span class="label">Guests:</span> ${booking.guests}</div>
            <div class="detail-row"><span class="label">Amount:</span> $${booking.amount}</div>
            <div class="detail-row"><span class="label">Status:</span> <span class="status ${booking.status}">${booking.status.toUpperCase()}</span></div>
            <div style="margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 4px; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      detailsWindow.document.close();
    }
  }

  exportBookings() {
    const csvContent = [
      'ID,Customer,Tour,Date,Guests,Amount,Status',
      ...this.filteredBookings.map(booking => 
        `${booking.id},${booking.customer},"${booking.tour}",${booking.date},${booking.guests},${booking.amount},${booking.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Bookings exported successfully!');
  }
}
