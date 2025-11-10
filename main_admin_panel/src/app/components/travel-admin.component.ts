import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TravelOperator {
  id: number;
  operator_name: string;
  operator_type: 'airline' | 'bus_company' | 'railway';
  logo_url?: string;
  rating: number;
  is_active: boolean;
}

interface TravelRoute {
  id: number;
  from_city: string;
  to_city: string;
  travel_mode: 'flight' | 'bus' | 'train';
  distance_km: number;
  estimated_duration_hours: number;
  is_active: boolean;
}

interface TravelOption {
  id: number;
  mode: string;
  operator_name: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  total_amount: number;
  seats_available: number;
  status: string;
}

@Component({
  selector: 'app-travel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="travel-admin-container bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">Travel Booking Admin</h1>
          <p class="text-gray-600">Manage operators, routes, and bookings</p>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex gap-4 mb-8">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.id"
            [class.active]="activeTab === tab.id"
            class="px-6 py-3 rounded-lg font-semibold transition-all"
            [ngClass]="activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-white text-gray-700 hover:bg-gray-100'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Operators Management -->
        <div *ngIf="activeTab === 'operators'" class="space-y-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Travel Operators</h2>
            
            <!-- Add Operator Form -->
            <div class="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 class="text-lg font-semibold mb-4">Add New Operator</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  [(ngModel)]="newOperator.operator_name"
                  placeholder="Operator Name"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                
                <select
                  [(ngModel)]="newOperator.operator_type"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Type</option>
                  <option value="airline">Airline</option>
                  <option value="bus_company">Bus Company</option>
                  <option value="railway">Railway</option>
                </select>
                
                <input
                  [(ngModel)]="newOperator.logo_url"
                  placeholder="Logo URL"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                
                <input
                  [(ngModel)]="newOperator.rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Rating (0-5)"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <button
                (click)="addOperator()"
                class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Add Operator
              </button>
            </div>

            <!-- Operators List -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-indigo-200">
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Rating</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let operator of operators" class="border-b hover:bg-gray-50">
                    <td class="px-4 py-2">{{ operator.id }}</td>
                    <td class="px-4 py-2">{{ operator.operator_name }}</td>
                    <td class="px-4 py-2">
                      <span class="px-3 py-1 rounded-full text-sm font-semibold"
                        [ngClass]="operator.operator_type === 'airline' 
                          ? 'bg-blue-100 text-blue-800'
                          : operator.operator_type === 'bus_company'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'">
                        {{ operator.operator_type | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <span class="flex items-center gap-1">
                        ⭐ {{ operator.rating.toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <span [ngClass]="operator.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'"
                        class="px-3 py-1 rounded-full text-sm font-semibold">
                        {{ operator.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <button
                        (click)="deleteOperator(operator.id)"
                        class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Routes Management -->
        <div *ngIf="activeTab === 'routes'" class="space-y-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Travel Routes</h2>
            
            <!-- Add Route Form -->
            <div class="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 class="text-lg font-semibold mb-4">Add New Route</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  [(ngModel)]="newRoute.from_city"
                  placeholder="From City"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                
                <input
                  [(ngModel)]="newRoute.to_city"
                  placeholder="To City"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                
                <select
                  [(ngModel)]="newRoute.travel_mode"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Mode</option>
                  <option value="flight">Flight</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                </select>
                
                <input
                  [(ngModel)]="newRoute.distance_km"
                  type="number"
                  placeholder="Distance (km)"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                
                <input
                  [(ngModel)]="newRoute.estimated_duration_hours"
                  type="number"
                  step="0.5"
                  placeholder="Duration (hours)"
                  class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <button
                (click)="addRoute()"
                class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Add Route
              </button>
            </div>

            <!-- Routes List -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-indigo-200">
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">From</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">To</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Mode</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Distance</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Duration</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let route of routes" class="border-b hover:bg-gray-50">
                    <td class="px-4 py-2">{{ route.from_city }}</td>
                    <td class="px-4 py-2">{{ route.to_city }}</td>
                    <td class="px-4 py-2">
                      <span class="px-3 py-1 rounded-full text-sm font-semibold"
                        [ngClass]="route.travel_mode === 'flight'
                          ? 'bg-blue-100 text-blue-800'
                          : route.travel_mode === 'bus'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'">
                        {{ route.travel_mode | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-2">{{ route.distance_km }} km</td>
                    <td class="px-4 py-2">{{ route.estimated_duration_hours }} hrs</td>
                    <td class="px-4 py-2">
                      <span [ngClass]="route.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'"
                        class="px-3 py-1 rounded-full text-sm font-semibold">
                        {{ route.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <button
                        (click)="deleteRoute(route.id)"
                        class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Bookings Management -->
        <div *ngIf="activeTab === 'bookings'" class="space-y-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Travel Bookings</h2>
            
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p class="text-gray-700 font-semibold">Total Bookings</p>
                <p class="text-3xl font-bold text-blue-600">{{ bookings.length }}</p>
              </div>
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p class="text-gray-700 font-semibold">Confirmed</p>
                <p class="text-3xl font-bold text-green-600">{{ getConfirmedCount() }}</p>
              </div>
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                <p class="text-gray-700 font-semibold">Pending</p>
                <p class="text-3xl font-bold text-yellow-600">{{ getPendingCount() }}</p>
              </div>
              <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                <p class="text-gray-700 font-semibold">Cancelled</p>
                <p class="text-3xl font-bold text-red-600">{{ getCancelledCount() }}</p>
              </div>
            </div>

            <!-- Bookings List -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-indigo-200">
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Route</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Mode</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Seats</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let booking of bookings" class="border-b hover:bg-gray-50">
                    <td class="px-4 py-2 font-mono text-sm">{{ booking.id }}</td>
                    <td class="px-4 py-2">{{ booking.from_city }} → {{ booking.to_city }}</td>
                    <td class="px-4 py-2">
                      <span class="px-3 py-1 rounded-full text-sm font-semibold"
                        [ngClass]="booking.mode === 'flight'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.mode === 'bus'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'">
                        {{ booking.mode | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-2">{{ booking.travel_date }} {{ booking.travel_time }}</td>
                    <td class="px-4 py-2 font-semibold">₹{{ booking.total_amount }}</td>
                    <td class="px-4 py-2">{{ booking.seats_available }} available</td>
                    <td class="px-4 py-2">
                      <span [ngClass]="booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'"
                        class="px-3 py-1 rounded-full text-sm font-semibold">
                        {{ booking.status | titlecase }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .travel-admin-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    input, select {
      width: 100%;
    }

    table {
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
    }
  `]
})
export class TravelAdminComponent implements OnInit {
  activeTab: string = 'operators';
  
  tabs = [
    { id: 'operators', label: '✈️ Operators' },
    { id: 'routes', label: '🗺️ Routes' },
    { id: 'bookings', label: '📋 Bookings' }
  ];

  operators: TravelOperator[] = [];
  routes: TravelRoute[] = [];
  bookings: TravelOption[] = [];

  newOperator: Partial<TravelOperator> = {
    operator_type: 'airline',
    is_active: true
  };

  newRoute: Partial<TravelRoute> = {
    travel_mode: 'flight',
    is_active: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOperators();
    this.loadRoutes();
    this.loadBookings();
  }

  loadOperators() {
    this.http.get<any>('http://localhost/fu/backend/api/travel_admin.php?action=get-operators')
      .subscribe(
        data => {
          this.operators = data.data || [];
        },
        error => console.error('Error loading operators:', error)
      );
  }

  loadRoutes() {
    this.http.get<any>('http://localhost/fu/backend/api/travel_admin.php?action=get-routes')
      .subscribe(
        data => {
          this.routes = data.data || [];
        },
        error => console.error('Error loading routes:', error)
      );
  }

  loadBookings() {
    this.http.get<any>('http://localhost/fu/backend/api/travel_admin.php?action=get-bookings')
      .subscribe(
        data => {
          this.bookings = data.data || [];
        },
        error => console.error('Error loading bookings:', error)
      );
  }

  addOperator() {
    this.http.post('http://localhost/fu/backend/api/travel_admin.php?action=add-operator', this.newOperator)
      .subscribe(
        () => {
          this.loadOperators();
          this.newOperator = { operator_type: 'airline', is_active: true };
        },
        error => console.error('Error adding operator:', error)
      );
  }

  addRoute() {
    this.http.post('http://localhost/fu/backend/api/travel_admin.php?action=add-route', this.newRoute)
      .subscribe(
        () => {
          this.loadRoutes();
          this.newRoute = { travel_mode: 'flight', is_active: true };
        },
        error => console.error('Error adding route:', error)
      );
  }

  deleteOperator(id: number) {
    if (confirm('Are you sure you want to delete this operator?')) {
      this.http.post(`http://localhost/fu/backend/api/travel_admin.php?action=delete-operator&id=${id}`, {})
        .subscribe(
          () => this.loadOperators(),
          error => console.error('Error deleting operator:', error)
        );
    }
  }

  deleteRoute(id: number) {
    if (confirm('Are you sure you want to delete this route?')) {
      this.http.post(`http://localhost/fu/backend/api/travel_admin.php?action=delete-route&id=${id}`, {})
        .subscribe(
          () => this.loadRoutes(),
          error => console.error('Error deleting route:', error)
        );
    }
  }

  getConfirmedCount(): number {
    return this.bookings.filter((b: TravelOption) => b.status === 'confirmed').length;
  }

  getPendingCount(): number {
    return this.bookings.filter((b: TravelOption) => b.status === 'pending').length;
  }

  getCancelledCount(): number {
    return this.bookings.filter((b: TravelOption) => b.status === 'cancelled').length;
  }
}