import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class CustomersComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  isLoading: boolean = true;
  errorMessage: string = '';

  customerStats = {
    total: 0,
    active: 0,
    premium: 0,
    newThisMonth: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading customers from API...');
    
    this.apiService.getCustomers().subscribe({
      next: (response) => {
        console.log('Customers API Response:', response);
        
        if (response.success && response.data) {
          this.customers = response.data.customers || [];
          this.customerStats = response.data.stats || {
            total: 0,
            active: 0,
            premium: 0,
            newThisMonth: 0
          };
          
          console.log('Loaded customers:', this.customers.length);
          console.log('Customer stats:', this.customerStats);
          
          this.filterCustomers();
          this.isLoading = false;
        } else {
          this.errorMessage = 'Failed to load customers data';
          this.isLoading = false;
          this.loadFallbackData();
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.errorMessage = error.message || 'Failed to connect to the server. Please check if XAMPP is running.';
        this.isLoading = false;
        this.loadFallbackData();
      }
    });
  }

  loadFallbackData(): void {
    console.log('Loading fallback customer data...');
    this.customers = [
      {
        id: 1,
        name: 'Sample Customer',
        email: 'customer@example.com',
        phone: 'N/A',
        type: 'regular',
        status: 'active',
        joinDate: new Date().toISOString(),
        totalBookings: 0,
        totalSpent: 0,
        avatar: null
      }
    ];
    
    this.customerStats = {
      total: 1,
      active: 1,
      premium: 0,
      newThisMonth: 1
    };
    
    this.filterCustomers();
  }

  filterCustomers(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || customer.status === this.statusFilter;
      const matchesType = this.typeFilter === 'all' || customer.type === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  onSearchChange(): void {
    this.filterCustomers();
  }

  onFilterChange(): void {
    this.filterCustomers();
  }

  addNewCustomer(): void {
    // Simple prompt-based customer creation
    const name = prompt('Enter customer name:');
    if (!name || !name.trim()) {
      alert('Name is required');
      return;
    }
    
    const email = prompt('Enter customer email:');
    if (!email || !email.trim()) {
      alert('Email is required');
      return;
    }
    
    const phone = prompt('Enter customer phone number:');
    if (!phone || !phone.trim()) {
      alert('Phone number is required');
      return;
    }
    
    const customerData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim()
    };
    
    this.apiService.createCustomer(customerData).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Customer created successfully!\n\nDefault Password: ${response.data.defaultPassword}\n\nPlease share this password with the customer.`);
          this.loadCustomers(); // Reload the list
        } else {
          alert(response.error || 'Failed to create customer');
        }
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        alert(error.message || 'Failed to create customer');
      }
    });
  }

  viewCustomer(customerId: number): void {
    console.log('Viewing customer:', customerId);
  }

  editCustomer(customerId: number): void {
    console.log('Editing customer:', customerId);
  }

  deleteCustomer(customerId: number): void {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      this.apiService.deleteCustomer(customerId).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Customer deleted successfully');
            this.loadCustomers(); // Reload the list
          } else {
            alert(response.error || 'Failed to delete customer');
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          alert(error.message || 'Failed to delete customer');
        }
      });
    }
  }

  exportCustomers(): void {
    console.log('Exporting customers...');
  }

  importCustomers(): void {
    console.log('Importing customers...');
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.filterCustomers();
  }

  trackByCustomerId(index: number, customer: any): number {
    return customer.id;
  }

  // Get default avatar URL - using UI Avatars service
  getDefaultAvatar(name: string): string {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    // Use UI Avatars service - free and no registration needed
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&size=40&bold=true`;
  }

  // Handle image error - fallback to default avatar
  onImageError(event: any, customerName: string): void {
    event.target.src = this.getDefaultAvatar(customerName);
  }
}
