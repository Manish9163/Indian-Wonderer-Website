import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-dashboard">
      <!-- Payment Stats -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="stats-card fade-in-up">
            <div class="icon" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
              <i class="fas fa-credit-card"></i>
            </div>
            <h3 class="mb-1">{{paymentStats.totalProcessed | currency}}</h3>
            <p class="text-muted mb-0">Total Processed</p>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{paymentStats.growthRate}}% this month
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="stats-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="icon" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
              <i class="fas fa-clock"></i>
            </div>
            <h3 class="mb-1">{{paymentStats.pendingPayments}}</h3>
            <p class="text-muted mb-0">Pending Payments</p>
            <div class="analytics-change negative">
              <i class="fas fa-arrow-down"></i>
              -{{paymentStats.pendingDecrease}}% from last week
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="stats-card fade-in-up" style="animation-delay: 0.2s;">
            <div class="icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;">
              <i class="fas fa-percentage"></i>
            </div>
            <h3 class="mb-1">{{paymentStats.successRate}}%</h3>
            <p class="text-muted mb-0">Success Rate</p>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{paymentStats.successImprovement}}% this month
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="stats-card fade-in-up" style="animation-delay: 0.3s;">
            <div class="icon" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="mb-1">{{paymentStats.failedPayments}}</h3>
            <p class="text-muted mb-0">Failed Payments</p>
            <div class="analytics-change positive">
              <i class="fas fa-arrow-down"></i>
              -{{paymentStats.failureReduction}}% this month
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Filters -->
      <div class="row mb-4">
        <div class="col-md-12">
          <div class="card-modern">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-3">
                  <label class="form-label">Payment Status</label>
                  <select class="form-select" [(ngModel)]="filters.status" (change)="applyFilters()">
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Payment Method</label>
                  <select class="form-select" [(ngModel)]="filters.method" (change)="applyFilters()">
                    <option value="">All Methods</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Date Range</label>
                  <select class="form-select" [(ngModel)]="filters.dateRange" (change)="applyFilters()">
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Amount Range</label>
                  <select class="form-select" [(ngModel)]="filters.amountRange" (change)="applyFilters()">
                    <option value="">All Amounts</option>
                    <option value="0-500">$0 - $500</option>
                    <option value="500-2000">$500 - $2,000</option>
                    <option value="2000-5000">$2,000 - $5,000</option>
                    <option value="5000+">$5,000+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Transactions Table -->
      <div class="card-modern">
        <div class="card-header-modern d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Payment Transactions</h6>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" (click)="exportPayments()">
              <i class="fas fa-download me-2"></i>Export
            </button>
            <button class="btn btn-success" (click)="processRefund()">
              <i class="fas fa-undo me-2"></i>Process Refund
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-modern">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" class="form-check-input" (change)="toggleAllPayments($event)">
                  </th>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Tour</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of filteredPayments; trackBy: trackByPaymentId">
                  <td>
                    <input type="checkbox" class="form-check-input" 
                           [checked]="selectedPayments.includes(payment.id)"
                           (change)="togglePaymentSelection(payment.id, $event)">
                  </td>
                  <td>
                    <span class="font-monospace">{{payment.transactionId}}</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-sm me-2">{{payment.customer.charAt(0)}}</div>
                      <div>
                        <div class="fw-semibold">{{payment.customer}}</div>
                        <small class="text-muted">{{payment.customerEmail}}</small>
                      </div>
                    </div>
                  </td>
                  <td>{{payment.tour}}</td>
                  <td class="fw-semibold">{{payment.amount | currency}}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <i [class]="getPaymentMethodIcon(payment.method)" class="me-2"></i>
                      {{getPaymentMethodLabel(payment.method)}}
                    </div>
                  </td>
                  <td>{{payment.date | date:'short'}}</td>
                  <td>
                    <span class="payment-status" [ngClass]="payment.status">
                      <i [class]="getStatusIcon(payment.status)"></i>
                      {{payment.status | titlecase}}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-action btn-primary" 
                              [title]="'View Details'"
                              (click)="viewPaymentDetails(payment)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-action btn-warning" 
                              *ngIf="payment.status === 'completed'"
                              [title]="'Process Refund'"
                              (click)="initiateRefund(payment)">
                        <i class="fas fa-undo"></i>
                      </button>
                      <button class="btn btn-action btn-success" 
                              *ngIf="payment.status === 'pending'"
                              [title]="'Retry Payment'"
                              (click)="retryPayment(payment)">
                        <i class="fas fa-redo"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Payment Details Modal (simplified representation) -->
      <div class="modal fade" id="paymentDetailsModal" *ngIf="selectedPaymentDetails">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Payment Details</h5>
              <button type="button" class="btn-close" (click)="closePaymentDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Transaction Information</h6>
                  <table class="table table-borderless">
                    <tr><td><strong>ID:</strong></td><td>{{selectedPaymentDetails.transactionId}}</td></tr>
                    <tr><td><strong>Amount:</strong></td><td>{{selectedPaymentDetails.amount | currency}}</td></tr>
                    <tr><td><strong>Method:</strong></td><td>{{getPaymentMethodLabel(selectedPaymentDetails.method)}}</td></tr>
                    <tr><td><strong>Status:</strong></td><td>{{selectedPaymentDetails.status | titlecase}}</td></tr>
                    <tr><td><strong>Date:</strong></td><td>{{selectedPaymentDetails.date | date:'full'}}</td></tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Customer Information</h6>
                  <table class="table table-borderless">
                    <tr><td><strong>Name:</strong></td><td>{{selectedPaymentDetails.customer}}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>{{selectedPaymentDetails.customerEmail}}</td></tr>
                    <tr><td><strong>Tour:</strong></td><td>{{selectedPaymentDetails.tour}}</td></tr>
                    <tr><td><strong>Booking ID:</strong></td><td>{{selectedPaymentDetails.bookingId}}</td></tr>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closePaymentDetails()">Close</button>
              <button type="button" class="btn btn-primary" (click)="downloadReceipt()">Download Receipt</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 32px;
      height: 32px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
  `]
})
export class PaymentsComponent implements OnInit {
  selectedPayments: string[] = [];
  selectedPaymentDetails: any = null;
  
  filters = {
    status: '',
    method: '',
    dateRange: 'month',
    amountRange: ''
  };

  paymentStats = {
    totalProcessed: 285750,
    growthRate: 12.5,
    pendingPayments: 23,
    pendingDecrease: 15.2,
    successRate: 94.2,
    successImprovement: 2.8,
    failedPayments: 8,
    failureReduction: 35.7
  };

  allPayments = [
    {
      id: 'TXN001',
      transactionId: 'txn_1a2b3c4d5e',
      customer: 'John Doe',
      customerEmail: 'john.doe@email.com',
      tour: 'Bali Adventure',
      amount: 2400,
      method: 'credit_card',
      date: new Date('2024-03-15'),
      status: 'completed',
      bookingId: 'BK001'
    },
    {
      id: 'TXN002',
      transactionId: 'txn_2f3g4h5i6j',
      customer: 'Sarah Smith',
      customerEmail: 'sarah.smith@email.com',
      tour: 'Tokyo Explorer',
      amount: 890,
      method: 'paypal',
      date: new Date('2024-03-18'),
      status: 'pending',
      bookingId: 'BK002'
    },
    {
      id: 'TXN003',
      transactionId: 'txn_3k4l5m6n7o',
      customer: 'Mike Johnson',
      customerEmail: 'mike.johnson@email.com',
      tour: 'Paris Romance',
      amount: 3000,
      method: 'bank_transfer',
      date: new Date('2024-03-20'),
      status: 'completed',
      bookingId: 'BK003'
    },
    {
      id: 'TXN004',
      transactionId: 'txn_4p5q6r7s8t',
      customer: 'Emily Brown',
      customerEmail: 'emily.brown@email.com',
      tour: 'Safari Kenya',
      amount: 8400,
      method: 'credit_card',
      date: new Date('2024-03-22'),
      status: 'failed',
      bookingId: 'BK004'
    },
    {
      id: 'TXN005',
      transactionId: 'txn_5u6v7w8x9y',
      customer: 'David Wilson',
      customerEmail: 'david.wilson@email.com',
      tour: 'Swiss Alps',
      amount: 5400,
      method: 'crypto',
      date: new Date('2024-03-25'),
      status: 'completed',
      bookingId: 'BK005'
    },
    {
      id: 'TXN006',
      transactionId: 'txn_6z7a8b9c0d',
      customer: 'Lisa Garcia',
      customerEmail: 'lisa.garcia@email.com',
      tour: 'Maldives Escape',
      amount: 5600,
      method: 'paypal',
      date: new Date('2024-03-28'),
      status: 'refunded',
      bookingId: 'BK006'
    }
  ];

  filteredPayments = this.allPayments;

  ngOnInit() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredPayments = this.allPayments.filter(payment => {
      if (this.filters.status && payment.status !== this.filters.status) return false;
      if (this.filters.method && payment.method !== this.filters.method) return false;
      // Add date range and amount range filtering logic here
      return true;
    });
  }

  getPaymentMethodIcon(method: string): string {
    const icons: { [key: string]: string } = {
      'credit_card': 'fas fa-credit-card text-primary',
      'paypal': 'fab fa-paypal text-info',
      'bank_transfer': 'fas fa-university text-success',
      'crypto': 'fab fa-bitcoin text-warning'
    };
    return icons[method] || 'fas fa-money-bill';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'credit_card': 'Credit Card',
      'paypal': 'PayPal',
      'bank_transfer': 'Bank Transfer',
      'crypto': 'Cryptocurrency'
    };
    return labels[method] || method;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'completed': 'fas fa-check-circle',
      'pending': 'fas fa-clock',
      'failed': 'fas fa-times-circle',
      'refunded': 'fas fa-undo'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  toggleAllPayments(event: any) {
    if (event.target.checked) {
      this.selectedPayments = this.filteredPayments.map(p => p.id);
    } else {
      this.selectedPayments = [];
    }
  }

  togglePaymentSelection(paymentId: string, event: any) {
    if (event.target.checked) {
      this.selectedPayments.push(paymentId);
    } else {
      this.selectedPayments = this.selectedPayments.filter(id => id !== paymentId);
    }
  }

  trackByPaymentId(index: number, payment: any): string {
    return payment.id;
  }

  viewPaymentDetails(payment: any) {
    this.selectedPaymentDetails = payment;
    // In a real app, you'd open a modal here
    console.log('Viewing payment details:', payment);
  }

  closePaymentDetails() {
    this.selectedPaymentDetails = null;
  }

  initiateRefund(payment: any) {
    console.log('Initiating refund for:', payment.transactionId);
    // Implementation for refund process
  }

  retryPayment(payment: any) {
    console.log('Retrying payment for:', payment.transactionId);
    payment.status = 'pending';
  }

  processRefund() {
    console.log('Processing refunds for selected payments:', this.selectedPayments);
  }

  exportPayments() {
    console.log('Exporting payments data');
    // Implementation for CSV/Excel export
  }

  downloadReceipt() {
    console.log('Downloading receipt for:', this.selectedPaymentDetails?.transactionId);
  }
}   

// <h3 class="mb-1">{{paymentStats.totalProcessed | currency}}</h3>
//             <p class="text-muted mb-0">Total Processed</p>
//             <div class="analytics-change positive">
//               <i class="fas fa-arrow-up"></i>
//               +{{paymentStats.growthRate}}% this month
//             </div>
//           </div>
//         </div>
//         <div class="col-md-3 mb-3">
//           <div class="stats-card fade-in-up" style="animation-delay: 0.1s;">
//             <div class="icon" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
//               <i class="fas fa-clock"></i>
//             </div>
//             <h3 class="mb-1">{{paymentStats.pendingPayments}}</h3>
//             <p class="text-muted mb-0">Pending Payments</p>
//             <div class="analytics-change negative">
//               <i class="fas fa-arrow-down"></i>
//               -{{paymentStats.pendingDecrease}}% from last week
//             </div>
//           </div>
//         </div>
//         <div class="col-md-3 mb-3">
//           <div class="stats-card fade-in-up" style="animation-delay: 0.2s;">
//             <div class="icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;">
//               <i class="fas fa-percentage"></i>
//             </div>
//             <h3 class="mb-1">{{paymentStats.successRate}}%</h3>
//             <p class="text-muted mb-0">Success Rate</p>
//             <div class="analytics-change positive">
//               <i class="fas fa-arrow-up"></i>
//               +{{paymentStats.successImprovement}}% this month
//             </div>
//           </div>
//         </div>

        