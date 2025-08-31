import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  stats = {
    totalTours: 24,
    activeBookings: 156,
    totalCustomers: 1247,
    monthlyRevenue: 45620
  };

  recentBookings = [
    { customer: 'John Doe', tour: 'Bali Adventure', date: '2024-03-15', status: 'confirmed', amount: 1200 },
    { customer: 'Sarah Smith', tour: 'Tokyo Explorer', date: '2024-03-18', status: 'pending', amount: 890 },
    { customer: 'Mike Johnson', tour: 'Paris Romance', date: '2024-03-20', status: 'confirmed', amount: 1500 },
    { customer: 'Emily Brown', tour: 'Safari Kenya', date: '2024-03-22', status: 'pending', amount: 2100 }
  ];

  popularTours = [
    { 
      name: 'Bali Adventure', 
      bookings: 45, 
      percentage: 90,
      rating: 4.9,
      revenue: 13455,
      color: 'var(--neon-blue)'
    },
    { 
      name: 'Tokyo Explorer', 
      bookings: 38, 
      percentage: 76,
      rating: 4.8,
      revenue: 11362,
      color: 'var(--neon-green)'
    },
    { 
      name: 'Paris Romance', 
      bookings: 32, 
      percentage: 64,
      rating: 4.7,
      revenue: 9600,
      color: 'var(--neon-purple)'
    },
    { 
      name: 'Safari Kenya', 
      bookings: 28, 
      percentage: 56,
      rating: 4.6,
      revenue: 8372,
      color: 'var(--neon-pink)'
    }
  ];
}
