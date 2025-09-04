import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-dashboard">
      <!-- Enhanced Payment Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-gradient-header rounded">
        <div>
          <h4 class="mb-1">💳 Payment Management Center</h4>
          <small class="text-light">Comprehensive payment processing and analytics</small>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm payment-filter" [(ngModel)]="selectedFilter" (change)="applyFilter()" style="width: auto;">
            <option value="all">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button class="btn btn-light btn-sm" (click)="generateReport()">
            <i class="fas fa-chart-bar"></i> Generate Report
          </button>
          <button class="btn btn-light btn-sm" (click)="exportPayments()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <!-- Enhanced Payment Statistics Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="payment-stats-card gradient-success fade-in-up" (click)="onRevenueCardClick()">
            <div class="payment-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="payment-metric">{{ '$' + (paymentStats.totalRevenue | number) }}</div>
            <div class="payment-label">Total Revenue</div>
            <div class="payment-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{paymentStats.revenueGrowth}}% this month
            </div>
            <div class="payment-subtitle">Across all payment gateways</div>
            <div class="payment-progress">
              <div class="progress-bar success" [style.width]="'85%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="payment-stats-card gradient-primary fade-in-up" (click)="onTransactionsCardClick()">
            <div class="payment-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <div class="payment-metric">{{paymentStats.totalTransactions | number}}</div>
            <div class="payment-label">Total Transactions</div>
            <div class="payment-change positive">
              <i class="fas fa-arrow-up"></i>
              +{{paymentStats.transactionGrowth}}% this month
            </div>
            <div class="payment-subtitle">Successfully processed</div>
            <div class="payment-progress">
              <div class="progress-bar success" [style.width]="'92%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="payment-stats-card gradient-warning fade-in-up" (click)="onPendingCardClick()">
            <div class="payment-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="payment-metric">{{ '$' + (paymentStats.pendingPayments | number) }}</div>
            <div class="payment-label">Pending Payments</div>
            <div class="payment-change negative">
              <i class="fas fa-arrow-down"></i>
              {{paymentStats.pendingGrowth}}% this month
            </div>
            <div class="payment-subtitle">Awaiting processing</div>
            <div class="payment-progress">
              <div class="progress-bar warning" [style.width]="'35%'"></div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="payment-stats-card gradient-danger fade-in-up" (click)="onFailedCardClick()">
            <div class="payment-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="payment-metric">{{paymentStats.failedPayments}}</div>
            <div class="payment-label">Failed Payments</div>
            <div class="payment-change positive">
              <i class="fas fa-arrow-down"></i>
              {{paymentStats.failureGrowth}}% this month
            </div>
            <div class="payment-subtitle">Declined or errors</div>
            <div class="payment-progress">
              <div class="progress-bar danger" [style.width]="'12%'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Gateway Status Panel -->
      <div class="payment-gateway-panel mb-4 fade-in-up">
        <div class="panel-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1"><i class="fas fa-globe"></i> Payment Gateway Status</h5>
              <small>Real-time monitoring of payment processors</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-light btn-sm" (click)="refreshGatewayStatus()">
                <i class="fas fa-sync-alt"></i> Refresh
              </button>
              <button class="btn btn-light btn-sm" (click)="toggleMonitoring()">
                <i class="fas fa-play" *ngIf="!monitoringActive"></i>
                <i class="fas fa-pause" *ngIf="monitoringActive"></i>
                {{monitoringActive ? 'Stop' : 'Start'}} Monitor
              </button>
            </div>
          </div>
        </div>
        
        <div class="panel-body">
          <div class="row">
            <div class="col-md-3" *ngFor="let gateway of paymentGateways">
              <div class="gateway-status" [ngClass]="gateway.status" (click)="configureGateway(gateway.name)">
                <div class="text-center">
                  <div class="gateway-icon">
                    <i [class]="gateway.icon"></i>
                  </div>
                  <div class="gateway-name">{{gateway.name}}</div>
                  <div class="gateway-metric">{{ '$' + (gateway.revenue | number) }}</div>
                  <div class="gateway-status-text">{{gateway.status.toUpperCase()}}</div>
                  <div class="gateway-uptime">Uptime: {{gateway.uptime}}</div>
                  <div class="gateway-uptime">Response: {{gateway.responseTime}}</div>
                  <div class="mt-2">
                    <button class="btn btn-sm" 
                            [ngClass]="gateway.status === 'active' ? 'btn-warning' : 'btn-success'"
                            (click)="toggleGateway(gateway.name); $event.stopPropagation()">
                      {{gateway.status === 'active' ? 'Disable' : 'Enable'}}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Payments Table -->
      <div class="card-modern mb-4 fade-in-up">
        <div class="panel-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1"><i class="fas fa-list"></i> Recent Transactions</h5>
              <small>Latest payment activities and transactions</small>
            </div>
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm payment-filter" [(ngModel)]="selectedPaymentGateway" (change)="applyGatewayFilter()" style="width: auto;">
                <option value="all">All Gateways</option>
                <option value="Stripe">Stripe</option>
                <option value="PayPal">PayPal</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Square">Square</option>
              </select>
              <select class="form-select form-select-sm payment-filter" [(ngModel)]="selectedDateRange" (change)="applyDateRange()" style="width: auto;">
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="panel-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of payments">
                  <td>
                    <span class="fw-bold">{{payment.id}}</span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                        {{payment.customerName.charAt(0)}}
                      </div>
                      {{payment.customerName}}
                    </div>
                  </td>
                  <td>
                    <span class="fw-bold">{{ '$' + payment.amount }}</span>
                    <small class="text-muted d-block">{{payment.currency}}</small>
                  </td>
                  <td>
                    <span class="badge bg-info">{{payment.gateway}}</span>
                  </td>
                  <td>
                    <span class="badge" 
                          [ngClass]="{
                            'bg-success': payment.status === 'completed',
                            'bg-warning': payment.status === 'pending',
                            'bg-danger': payment.status === 'failed',
                            'bg-secondary': payment.status === 'refunded'
                          }">
                      {{payment.status | titlecase}}
                    </span>
                  </td>
                  <td>{{payment.date | date:'short'}}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-info" (click)="viewPaymentDetails(payment.id)" title="View Details">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-success" (click)="downloadReceipt(payment.id)" title="Download Receipt">
                        <i class="fas fa-download"></i>
                      </button>
                      <button class="btn btn-warning" 
                              (click)="processRefund(payment.id)" 
                              [disabled]="payment.status !== 'completed'"
                              title="Process Refund">
                        <i class="fas fa-undo"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Live Transaction Monitor -->
      <div class="card-modern fade-in-up" *ngIf="monitoringActive && liveTransactions.length > 0">
        <div class="panel-header">
          <h5 class="mb-0"><i class="fas fa-broadcast-tower pulse"></i> Live Transaction Monitor</h5>
        </div>
        <div class="panel-body">
          <div class="live-transactions">
            <div class="transaction-item" *ngFor="let transaction of liveTransactions">
              <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                  <strong>{{transaction.customer}}</strong>
                  <span class="text-muted ms-2">{{ '$' + transaction.amount }}</span>
                </div>
                <div class="text-end">
                  <span class="badge bg-{{transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'info'}}">
                    {{transaction.status}}
                  </span>
                  <small class="text-muted d-block">{{transaction.gateway}}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-dashboard {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .bg-gradient-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }

    .payment-filter {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 20px;
      color: #2c3e50;
    }

    .payment-stats-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      padding: 2rem;
      text-align: center;
      transition: all 0.4s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      min-height: 280px;
    }

    .payment-stats-card:hover {
      transform: translateY(-15px) scale(1.02);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    }

    .payment-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border-radius: 25px 25px 0 0;
    }

    .gradient-success::before { background: linear-gradient(90deg, #10b981, #059669); }
    .gradient-warning::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .gradient-primary::before { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
    .gradient-danger::before { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .payment-icon {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .payment-metric {
      font-size: 2.8rem;
      font-weight: 900;
      margin-bottom: 0.8rem;
      background: linear-gradient(45deg, #2c3e50, #34495e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .payment-label {
      font-size: 1.2rem;
      color: #7f8c8d;
      font-weight: 600;
      margin-bottom: 1rem;
      letter-spacing: 0.5px;
    }

    .payment-change {
      font-size: 1rem;
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border-radius: 25px;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .payment-change.positive {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .payment-change.negative {
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .payment-subtitle {
      font-size: 0.9rem;
      color: #95a5a6;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .payment-progress {
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .payment-progress .progress-bar {
      height: 100%;
      border-radius: 10px;
      transition: width 0.8s ease;
    }

    .progress-bar.success { background: linear-gradient(90deg, #10b981, #059669); }
    .progress-bar.warning { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .progress-bar.danger { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .payment-gateway-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .panel-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem 2rem;
    }

    .panel-body {
      padding: 2rem;
    }

    .gateway-status {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 15px;
      padding: 1.5rem;
      margin: 0.5rem;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .gateway-status:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    }

    .gateway-status.active {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    .gateway-status.warning {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .gateway-status.inactive {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    .gateway-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #667eea;
    }

    .gateway-name {
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #2c3e50;
    }

    .gateway-metric {
      font-size: 1.3rem;
      font-weight: 600;
      color: #34495e;
      margin-bottom: 0.5rem;
    }

    .gateway-status-text {
      font-size: 0.9rem;
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .gateway-status.active .gateway-status-text {
      background: rgba(16, 185, 129, 0.2);
      color: #059669;
    }

    .gateway-status.warning .gateway-status-text {
      background: rgba(245, 158, 11, 0.2);
      color: #d97706;
    }

    .gateway-status.inactive .gateway-status-text {
      background: rgba(239, 68, 68, 0.2);
      color: #dc2626;
    }

    .gateway-uptime {
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .fade-in-up {
      animation: fadeInUp 0.8s ease forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-modern {
      border: none;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .card-modern:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .btn {
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      padding: 0.6rem 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.85rem;
    }

    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .btn-light {
      background: rgba(255, 255, 255, 0.9);
      color: #2c3e50;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }

    .btn-light:hover {
      background: white;
      color: #667eea;
      border-color: #667eea;
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .btn-info {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    }

    .form-select {
      border-radius: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
    }

    .form-select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }

    .pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .payment-stats-card {
        margin-bottom: 1.5rem;
        min-height: 250px;
        padding: 1.5rem;
      }
      
      .payment-metric {
        font-size: 2.2rem;
      }
      
      .payment-icon {
        font-size: 2.8rem;
      }
      
      .gateway-status {
        margin: 0.25rem;
        padding: 1rem;
      }
      
      .payments-dashboard {
        padding: 15px;
      }
    }
  `]
})
export class PaymentsComponent implements OnInit {
  // Properties for enhanced payment management
  selectedFilter: string = 'all';
  selectedPaymentGateway: string = 'all';
  selectedDateRange: string = 'this-week';
  
  // Payment statistics
  paymentStats = {
    totalRevenue: 284750,
    totalTransactions: 1245,
    pendingPayments: 12450,
    failedPayments: 23,
    successRate: 98.5,
    averageAmount: 189.50,
    revenueGrowth: 15.8,
    transactionGrowth: 12.4,
    pendingGrowth: -8.2,
    failureGrowth: -32.1,
    successImprovement: 2.3,
    averageGrowth: 8.7
  };

  // Payment gateway statuses
  paymentGateways = [
    {
      name: 'Stripe',
      icon: 'fab fa-stripe',
      status: 'active',
      uptime: '99.9%',
      transactions: 847,
      revenue: 156820,
      responseTime: '1.2s',
      successRate: 99.2
    },
    {
      name: 'PayPal',
      icon: 'fab fa-paypal',
      status: 'active',
      uptime: '99.7%',
      transactions: 298,
      revenue: 87440,
      responseTime: '2.1s',
      successRate: 97.8
    },
    {
      name: 'Razorpay',
      icon: 'fas fa-credit-card',
      status: 'warning',
      uptime: '98.5%',
      transactions: 89,
      revenue: 35290,
      responseTime: '3.2s',
      successRate: 96.5
    },
    {
      name: 'Square',
      icon: 'fab fa-cc-square',
      status: 'active',
      uptime: '99.8%',
      transactions: 11,
      revenue: 5200,
      responseTime: '1.8s',
      successRate: 98.9
    }
  ];

  // Sample payment data
  payments = [
    {
      id: 'PAY-001',
      customerName: 'John Smith',
      amount: 299.99,
      status: 'completed',
      gateway: 'Stripe',
      date: new Date('2024-01-15'),
      currency: 'USD',
      fee: 8.99
    },
    {
      id: 'PAY-002',
      customerName: 'Sarah Johnson',
      amount: 149.50,
      status: 'pending',
      gateway: 'PayPal',
      date: new Date('2024-01-14'),
      currency: 'USD',
      fee: 4.35
    },
    {
      id: 'PAY-003',
      customerName: 'Mike Davis',
      amount: 599.00,
      status: 'failed',
      gateway: 'Stripe',
      date: new Date('2024-01-13'),
      currency: 'USD',
      fee: 0
    }
  ];

  // Monitoring data
  liveTransactions: any[] = [];
  monitoringActive = false;
  alertCount = 0;

  ngOnInit() {
    this.loadPaymentData();
    this.startLiveMonitoring();
  }

  loadPaymentData() {
    console.log('Loading comprehensive payment data...');
    this.updatePaymentStats();
  }

  updatePaymentStats() {
    const variation = () => (Math.random() - 0.5) * 0.1;
    
    this.paymentStats = {
      ...this.paymentStats,
      totalRevenue: Math.round(this.paymentStats.totalRevenue * (1 + variation())),
      totalTransactions: Math.round(this.paymentStats.totalTransactions * (1 + variation())),
      pendingPayments: Math.round(this.paymentStats.pendingPayments * (1 + variation())),
      failedPayments: Math.round(this.paymentStats.failedPayments * (1 + variation()))
    };
  }

  applyFilter() {
    console.log(`Applying payment filter: ${this.selectedFilter}`);
  }

  applyGatewayFilter() {
    console.log(`Filtering by gateway: ${this.selectedPaymentGateway}`);
  }

  applyDateRange() {
    console.log(`Applying date range: ${this.selectedDateRange}`);
  }

  processRefund(paymentId: string) {
    console.log(`Processing refund for payment: ${paymentId}`);
    const confirmed = confirm(`Are you sure you want to process a refund for payment ${paymentId}?`);
    
    if (confirmed) {
      const payment = this.payments.find(p => p.id === paymentId);
      if (payment) {
        payment.status = 'refunded';
        alert(`Refund processed successfully for ${payment.customerName}!\n\nAmount: $${payment.amount}\nRefund ID: REF-${Date.now()}`);
        this.paymentStats.totalRevenue -= payment.amount;
        this.paymentStats.totalTransactions--;
      }
    }
  }

  viewPaymentDetails(paymentId: string) {
    console.log(`Viewing details for payment: ${paymentId}`);
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment) {
      const details = `Payment Details for ${payment.id}:\n\nCustomer: ${payment.customerName}\nAmount: $${payment.amount} ${payment.currency}\nStatus: ${payment.status.toUpperCase()}\nGateway: ${payment.gateway}\nDate: ${payment.date.toLocaleDateString()}\nProcessing Fee: $${payment.fee}\nNet Amount: $${(payment.amount - payment.fee).toFixed(2)}`;
      alert(details);
    }
  }

  downloadReceipt(paymentId: string) {
    console.log(`Downloading receipt for payment: ${paymentId}`);
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment) {
      const receiptContent = this.generateReceiptHTML(payment);
      this.downloadFile(receiptContent, `receipt-${payment.id}.html`, 'text/html');
      alert(`Receipt downloaded for payment ${payment.id}!`);
    }
  }

  generateReceiptHTML(payment: any): string {
    return `<!DOCTYPE html><html><head><title>Payment Receipt - ${payment.id}</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:20px}.details{margin:20px 0}.amount{font-size:24px;font-weight:bold;color:#28a745}.footer{margin-top:40px;text-align:center;color:#666}</style></head><body><div class="header"><h1>Payment Receipt</h1><p>Transaction ID: ${payment.id}</p></div><div class="details"><h3>Customer Information</h3><p><strong>Name:</strong> ${payment.customerName}</p><p><strong>Date:</strong> ${payment.date.toLocaleDateString()}</p><h3>Payment Details</h3><p><strong>Amount:</strong> <span class="amount">$${payment.amount}</span></p><p><strong>Currency:</strong> ${payment.currency}</p><p><strong>Payment Method:</strong> ${payment.gateway}</p><p><strong>Status:</strong> ${payment.status.toUpperCase()}</p><p><strong>Processing Fee:</strong> $${payment.fee}</p><p><strong>Net Amount:</strong> $${(payment.amount - payment.fee).toFixed(2)}</p></div><div class="footer"><p>Thank you for your business!</p><p>Generated on ${new Date().toLocaleString()}</p></div></body></html>`;
  }

  toggleGateway(gatewayName: string) {
    console.log(`Toggling gateway: ${gatewayName}`);
    const gateway = this.paymentGateways.find(g => g.name === gatewayName);
    if (gateway) {
      gateway.status = gateway.status === 'active' ? 'inactive' : 'active';
      alert(`${gatewayName} gateway ${gateway.status === 'active' ? 'activated' : 'deactivated'} successfully!`);
    }
  }

  refreshGatewayStatus() {
    console.log('Refreshing gateway statuses...');
    this.paymentGateways.forEach(gateway => {
      gateway.uptime = (98 + Math.random() * 2).toFixed(1) + '%';
      gateway.responseTime = (1 + Math.random() * 2).toFixed(1) + 's';
      gateway.successRate = parseFloat((96 + Math.random() * 4).toFixed(1));
    });
    alert('Gateway statuses refreshed successfully!');
  }

  configureGateway(gatewayName: string) {
    console.log(`Configuring gateway: ${gatewayName}`);
    const config = prompt(`Enter configuration for ${gatewayName}:\n\nExample: API_KEY=your_key, WEBHOOK_URL=your_url`);
    if (config) {
      alert(`${gatewayName} configuration updated successfully!\n\nConfiguration: ${config}`);
    }
  }

  startLiveMonitoring() {
    console.log('Starting live payment monitoring...');
    this.monitoringActive = true;
    
    setInterval(() => {
      if (this.monitoringActive) {
        this.simulateLiveTransaction();
      }
    }, 5000);
  }

  simulateLiveTransaction() {
    const customers = ['Alice Chen', 'Bob Wilson', 'Carol Brown', 'David Lee', 'Emma Taylor'];
    const gateways = ['Stripe', 'PayPal', 'Razorpay', 'Square'];
    const statuses = ['completed', 'pending', 'processing'];
    
    const transaction = {
      id: `PAY-${Date.now()}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      amount: Math.round((Math.random() * 500 + 50) * 100) / 100,
      gateway: gateways[Math.floor(Math.random() * gateways.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date()
    };
    
    this.liveTransactions.unshift(transaction);
    if (this.liveTransactions.length > 10) {
      this.liveTransactions.pop();
    }
  }

  toggleMonitoring() {
    this.monitoringActive = !this.monitoringActive;
    console.log(`Payment monitoring ${this.monitoringActive ? 'started' : 'stopped'}`);
  }

  generateReport() {
    console.log('Generating comprehensive payment report...');
    const reportData = {
      generatedOn: new Date().toLocaleString(),
      period: this.selectedDateRange,
      totalRevenue: this.paymentStats.totalRevenue,
      totalTransactions: this.paymentStats.totalTransactions,
      averageTransaction: this.paymentStats.averageAmount,
      successRate: this.paymentStats.successRate,
      topGateway: this.paymentGateways.reduce((prev, current) => 
        (prev.revenue > current.revenue) ? prev : current
      ).name,
      failureRate: (100 - this.paymentStats.successRate).toFixed(1)
    };
    
    const reportHTML = this.generateReportHTML(reportData);
    this.downloadFile(reportHTML, `payment-report-${Date.now()}.html`, 'text/html');
    alert('Payment report generated and downloaded successfully!');
  }

  generateReportHTML(data: any): string {
    return `<!DOCTYPE html><html><head><title>Payment Analytics Report</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}.header{text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:10px}.metric{background:#f8f9fa;padding:20px;margin:10px 0;border-radius:8px;border-left:4px solid #667eea}.metric-value{font-size:24px;font-weight:bold;color:#2c3e50}.metric-label{color:#7f8c8d;margin-top:5px}</style></head><body><div class="header"><h1>💳 Payment Analytics Report</h1><p>Generated on: ${data.generatedOn}</p><p>Report Period: ${data.period}</p></div><div class="metric"><div class="metric-value">$${data.totalRevenue.toLocaleString()}</div><div class="metric-label">Total Revenue</div></div><div class="metric"><div class="metric-value">${data.totalTransactions.toLocaleString()}</div><div class="metric-label">Total Transactions</div></div><div class="metric"><div class="metric-value">$${data.averageTransaction}</div><div class="metric-label">Average Transaction Value</div></div><div class="metric"><div class="metric-value">${data.successRate}%</div><div class="metric-label">Success Rate</div></div><div class="metric"><div class="metric-value">${data.topGateway}</div><div class="metric-label">Top Performing Gateway</div></div></body></html>`;
  }

  exportPayments() {
    console.log('Exporting payment data...');
    const csvContent = this.generatePaymentCSV();
    this.downloadFile(csvContent, `payments-export-${Date.now()}.csv`, 'text/csv');
    alert('Payment data exported successfully!');
  }

  generatePaymentCSV(): string {
    const headers = ['ID', 'Customer', 'Amount', 'Currency', 'Status', 'Gateway', 'Date', 'Fee'];
    const rows = this.payments.map(payment => [
      payment.id,
      payment.customerName,
      payment.amount,
      payment.currency,
      payment.status,
      payment.gateway,
      payment.date.toISOString().split('T')[0],
      payment.fee
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

  onRevenueCardClick() {
    console.log('Revenue card clicked - showing detailed revenue breakdown');
    alert(`Revenue Breakdown:\n\nStripe: $156,820\nPayPal: $87,440\nRazorpay: $35,290\nSquare: $5,200\n\nTotal: $${this.paymentStats.totalRevenue.toLocaleString()}`);
  }

  onTransactionsCardClick() {
    console.log('Transactions card clicked - showing transaction analysis');
    alert(`Transaction Analysis:\n\nCompleted: ${Math.round(this.paymentStats.totalTransactions * 0.985)}\nPending: ${Math.round(this.paymentStats.totalTransactions * 0.012)}\nFailed: ${Math.round(this.paymentStats.totalTransactions * 0.003)}\n\nTotal: ${this.paymentStats.totalTransactions}`);
  }

  onPendingCardClick() {
    console.log('Pending payments card clicked - showing pending details');
    alert(`Pending Payments Details:\n\nAwaiting confirmation: 8\nProcessing: 3\nUnder review: 1\n\nTotal Pending: $${this.paymentStats.pendingPayments.toLocaleString()}`);
  }

  onFailedCardClick() {
    console.log('Failed payments card clicked - showing failure analysis');
    alert(`Failed Payments Analysis:\n\nInsufficient funds: 12\nCard declined: 8\nNetwork timeout: 3\n\nTotal Failed: ${this.paymentStats.failedPayments}`);
  }
}
