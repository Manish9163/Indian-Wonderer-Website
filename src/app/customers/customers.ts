import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="container py-5">
    <h2 class="mb-4 text-center" style="font-weight:700; letter-spacing:1px;">Customer Management</h2>
    <!-- Animated Statistics Cards -->
    <div class="row mb-5 justify-content-center">
        <div class="col-md-3 mb-3">
                    <div class="stat-card gradient-bg shadow-lg text-center">
                        <div class="stat-value">{{ totalCustomers }}</div>
                        <div class="stat-label">Total Customers</div>
                    </div>
        </div>
        <div class="col-md-3 mb-3">
                    <div class="stat-card gradient-bg shadow-lg text-center">
                        <div class="stat-value text-success">{{ activeCustomers }}</div>
                        <div class="stat-label">Active</div>
                    </div>
        </div>
        <div class="col-md-3 mb-3">
                    <div class="stat-card gradient-bg shadow-lg text-center">
                        <div class="stat-value text-danger">{{ inactiveCustomers }}</div>
                        <div class="stat-label">Inactive</div>
                    </div>
        </div>
        <div class="col-md-3 mb-3">
                    <div class="stat-card gradient-bg shadow-lg text-center">
                        <div class="stat-value text-warning">\${{ totalSpent }}</div>
                        <div class="stat-label">Total Spent</div>
                    </div>
        </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4 justify-content-center">
        <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Search by name or email..." [(ngModel)]="searchTerm">
        </div>
        <div class="col-md-3">
            <select class="form-select" [(ngModel)]="statusFilter">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
    </div>

    <!-- Customer Cards -->
    <div class="row g-4 justify-content-center">
        <div class="col-md-4 col-lg-3" *ngFor="let customer of filteredCustomers">
            <div class="card shadow-lg border-0 h-100 customer-card gradient-bg" (click)="selectCustomer(customer)" style="cursor:pointer; position:relative;">
                <div class="card-body text-center">
                    <img [src]="customer.avatar" alt="Avatar" class="rounded-circle mb-3 border border-2 border-primary" style="width:70px; height:70px; object-fit:cover;">
                    <h5 class="mb-1" style="font-weight:600;">{{ customer.name }}</h5>
                    <div class="text-muted mb-2">{{ customer.email }}</div>
                    <span class="badge" [ngClass]="{
                        'bg-success': customer.status === 'active',
                        'bg-danger': customer.status === 'inactive'
                    }">{{ customer.status | titlecase }}</span>
                    <!-- Quick Actions -->
                    <div class="mt-3 d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" (click)="emailCustomer(customer.email, \$event)"><i class="fas fa-envelope"></i></button>
                        <button class="btn btn-sm btn-outline-info" (click)="callCustomer(customer.phone, \$event)"><i class="fas fa-phone"></i></button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deactivateCustomer(customer, \$event)">Deactivate</button>
                    </div>
                </div>
                <div class="card-footer bg-light border-0 text-center">
                    <div class="d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-calendar-alt text-info me-1"></i> Joined: {{ customer.joined | date:'mediumDate' }}</span>
                        <span><i class="fas fa-shopping-cart text-warning me-1"></i> Bookings: <strong>{{ customer.bookings }}</strong></span>
                    </div>
                    <div class="mt-2">
                        <span class="fw-bold text-success">\${{ customer.totalSpent }}</span>
                        <small class="text-muted">Total Spent</small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Floating Add Button -->
    <button class="btn btn-primary rounded-circle shadow-lg floating-add-btn" title="Add Customer">
        <i class="fas fa-user-plus fa-lg"></i>
    </button>

    <!-- Customer Details Modal -->
    <div class="modal fade" id="customerDetailsModal" tabindex="-1" [class.show]="selectedCustomer" [style.display]="selectedCustomer ? 'block' : 'none'">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Customer Details</h5>
                    <button type="button" class="btn-close" (click)="closeDetails()"></button>
                </div>
                <div class="modal-body" *ngIf="selectedCustomer">
                    <div class="text-center mb-3">
                        <img [src]="selectedCustomer.avatar" class="rounded-circle border border-2 border-primary" style="width:90px; height:90px; object-fit:cover;">
                        <h4 class="mt-2 mb-0">{{ selectedCustomer.name }}</h4>
                        <span class="badge" [ngClass]="{
                            'bg-success': selectedCustomer.status === 'active',
                            'bg-danger': selectedCustomer.status === 'inactive'
                        }">{{ selectedCustomer.status | titlecase }}</span>
                    </div>
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item"><i class="fas fa-envelope me-2 text-primary"></i> {{ selectedCustomer.email }}</li>
                        <li class="list-group-item"><i class="fas fa-phone me-2 text-info"></i> {{ selectedCustomer.phone }}</li>
                        <li class="list-group-item"><i class="fas fa-calendar-alt me-2 text-warning"></i> Joined: {{ selectedCustomer.joined | date:'mediumDate' }}</li>
                        <li class="list-group-item"><i class="fas fa-shopping-cart me-2 text-success"></i> Bookings: <strong>{{ selectedCustomer.bookings }}</strong></li>
                        <li class="list-group-item"><i class="fas fa-dollar-sign me-2 text-success"></i> Total Spent: <strong>\${{ selectedCustomer.totalSpent }}</strong></li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" (click)="closeDetails()">Close</button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .customer-card {
        background: linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%);
        transition: box-shadow 0.2s, transform 0.2s;
    }
    .customer-card:hover {
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        transform: translateY(-2px) scale(1.03);
        background: linear-gradient(135deg, #e0e7ff 60%, #f8fafc 100%);
    }
    .stat-card {
        border-radius: 1rem;
        padding: 2rem 1rem;
        font-size: 1.5rem;
        background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
        color: #fff;
        box-shadow: 0 4px 16px rgba(99,102,241,0.08);
        animation: fadeInUp 0.7s;
    }
    .stat-label {
        font-size: 1rem;
        font-weight: 500;
        opacity: 0.85;
    }
    .stat-value {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .floating-add-btn {
        position: fixed;
        bottom: 32px;
        right: 32px;
        width: 64px;
        height: 64px;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        box-shadow: 0 4px 16px rgba(99,102,241,0.18);
        transition: background 0.2s;
    }
    .floating-add-btn:hover {
        background: #6366f1;
        color: #fff;
    }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
`,
})
export class CustomersComponent {
  customers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 555-1234',
      joined: new Date('2024-03-15'),
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      totalSpent: 3200,
      bookings: 5
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 555-5678',
      joined: new Date('2024-05-22'),
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      totalSpent: 2100,
      bookings: 3
    },
    {
      id: 3,
      name: 'Alex Kim',
      email: 'alex.kim@email.com',
      phone: '+1 555-8765',
      joined: new Date('2024-07-10'),
      status: 'inactive',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      totalSpent: 0,
      bookings: 0
    },
    {
      id: 4,
      name: 'Emily Brown',
      email: 'emily.brown@email.com',
      phone: '+1 555-4321',
      joined: new Date('2024-08-01'),
      status: 'active',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      totalSpent: 1500,
      bookings: 2
    }
  ];

  selectedCustomer: any = null;
  searchTerm: string = '';
  statusFilter: string = 'all';

  get filteredCustomers() {
    let filtered = this.customers;
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    }
    return filtered;
  }

  get totalCustomers() {
    return this.customers.length;
  }

  get activeCustomers() {
    return this.customers.filter(c => c.status === 'active').length;
  }

  get inactiveCustomers() {
    return this.customers.filter(c => c.status === 'inactive').length;
  }

  get totalSpent() {
    return this.customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }

  emailCustomer(email: string, event: Event) {
    event.stopPropagation();
    window.open('mailto:' + email);
  }

  callCustomer(phone: string, event: Event) {
    event.stopPropagation();
    window.open('tel:' + phone);
  }

  deactivateCustomer(customer: any, event: Event) {
    event.stopPropagation();
    customer.status = 'inactive';
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
  }

  closeDetails() {
    this.selectedCustomer = null;
  }
}

