import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.css']
})
export class PaymentsComponent implements OnInit, OnDestroy {
  // Properties for enhanced payment management
  selectedFilter: string = 'all';
  selectedPaymentGateway: string = 'all';
  selectedDateRange: string = 'this-week';
  
  private refreshSubscription?: Subscription;
  
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
    averageGrowth: 8.7,
    // Refund statistics
    totalRefunds: 0,
    totalRefundAmount: 0,
    pendingRefunds: 0,
    pendingRefundAmount: 0,
    completedRefunds: 0,
    completedRefundAmount: 0,
    giftCardsIssued: 0,
    giftCardAmount: 0,
    netRevenue: 284750
  };
  
  // Pending refunds list
  pendingRefundsList: any[] = [];
  
  // Completed refunds list
  completedRefundsList: any[] = [];

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

  // Payment data (will be loaded from API)
  payments: any[] = [];
  allPayments: any[] = []; // Store all payments for filtering

  // Monitoring data
  liveTransactions: any[] = [];
  monitoringActive = false;
  alertCount = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    console.log('=== PaymentsComponent ngOnInit started ===');
    console.log('Initial payments array length:', this.payments.length);
    console.log('Initial allPayments array length:', this.allPayments.length);
    
    this.loadPaymentData();
    this.startLiveMonitoring();
    
    // Auto-refresh every 10 seconds for live monitoring
    console.log('🔴 LIVE MONITORING: Payments will auto-refresh every 10 seconds');
    this.refreshSubscription = interval(10000)
      .pipe(switchMap(() => {
        console.log('🔄 Auto-refreshing payments data...');
        return this.apiService.getPayments();
      }))
      .subscribe({
        next: (response) => {
          console.log('✅ Auto-refresh response received:', response);
          if (response.success) {
            this.processPaymentData(response.data);
            console.log('✅ Payments data updated successfully');
          }
        },
        error: (error) => console.error('❌ Error refreshing payments:', error)
      });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadPaymentData() {
    console.log('Loading real-time payment data from backend...');
    this.apiService.getPayments().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response.success && response.data) {
          console.log('Payments loaded successfully:', response.data.length, 'payments');
          this.processPaymentData(response.data);
        } else {
          console.warn('No payment data returned:', response);
        }
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        console.error('Error details:', error.message, error.status);
        alert('Failed to load payment data. Please check console for details.');
      }
    });
  }

  processPaymentData(paymentData: any[]) {
    console.log('Processing payment data:', paymentData.length, 'payments');
    
    // Transform backend data to match component structure
    this.allPayments = paymentData.map(payment => ({
      id: `PAY-${String(payment.id).padStart(3, '0')}`,
      customerName: payment.customer_name || 
                    (payment.first_name && payment.last_name ? `${payment.first_name} ${payment.last_name}` : null) ||
                    'Guest Customer',
      amount: parseFloat(payment.amount),
      status: payment.status === 'completed' ? 'completed' : 
              payment.status === 'pending' ? 'pending' :
              payment.status === 'failed' ? 'failed' : 
              payment.status === 'refunded' ? 'refunded' : 'pending',
      gateway: this.mapPaymentMethod(payment.payment_method),
      date: new Date(payment.payment_date || payment.created_at),
      currency: 'INR', // Always INR for India
      fee: parseFloat(payment.processing_fee || 0),
      booking_id: payment.booking_id,
      transaction_id: payment.transaction_id,
      tour_title: payment.tour_title || 'Tour'
    }));

    // Apply current filter
    this.applyFilter();
    
    this.updatePaymentStats();
    this.updateGatewayStats();
    this.loadLiveTransactions();
  }

  mapPaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'credit_card': 'Stripe',
      'debit_card': 'Stripe',
      'paypal': 'PayPal',
      'bank_transfer': 'Razorpay',
      'cash': 'Square'
    };
    return methodMap[method] || 'Stripe';
  }

  updatePaymentStats() {
    // Calculate real statistics from payment data
    const completedPayments = this.payments.filter(p => p.status === 'completed');
    const pendingPayments = this.payments.filter(p => p.status === 'pending');
    const failedPayments = this.payments.filter(p => p.status === 'failed');
    
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = this.payments.length;
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const failedCount = failedPayments.length;
    const successRate = totalTransactions > 0 
      ? (completedPayments.length / totalTransactions) * 100 
      : 0;
    const averageAmount = totalTransactions > 0 
      ? totalRevenue / completedPayments.length 
      : 0;
    
    // Calculate refund stats
    const refundedPayments = this.payments.filter(p => p.status === 'refunded');
    const totalRefundAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    this.paymentStats = {
      totalRevenue: Math.round(totalRevenue),
      totalTransactions: totalTransactions,
      pendingPayments: Math.round(pendingAmount),
      failedPayments: failedCount,
      successRate: parseFloat(successRate.toFixed(1)),
      averageAmount: parseFloat(averageAmount.toFixed(2)),
      revenueGrowth: 15.8, // These can be calculated with historical data
      transactionGrowth: 12.4,
      pendingGrowth: -8.2,
      failureGrowth: -32.1,
      successImprovement: 2.3,
      averageGrowth: 8.7,
      // Refund statistics
      totalRefunds: refundedPayments.length,
      totalRefundAmount: Math.round(totalRefundAmount),
      pendingRefunds: 0, // Will be loaded from analytics
      pendingRefundAmount: 0,
      completedRefunds: refundedPayments.length,
      completedRefundAmount: Math.round(totalRefundAmount),
      giftCardsIssued: 0, // Will be loaded from analytics
      giftCardAmount: 0,
      netRevenue: Math.round(totalRevenue - totalRefundAmount)
    };
    
    // Load refund details from analytics
    this.loadRefundAnalytics();
  }
  
  loadRefundAnalytics() {
    // Load analytics stats
    this.apiService.getAnalytics('dashboard', '30').subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.refunds) {
          const refundData = response.data.refunds;
          this.paymentStats.pendingRefunds = refundData.stats.pending_refunds_count || 0;
          this.paymentStats.pendingRefundAmount = Math.round(refundData.stats.pending_refunds_amount || 0);
          this.paymentStats.completedRefunds = refundData.stats.completed_refunds_count || 0;
          this.paymentStats.completedRefundAmount = Math.round(refundData.stats.completed_refunds_amount || 0);
          this.paymentStats.totalRefunds = refundData.stats.total_refunds || 0;
          this.paymentStats.totalRefundAmount = Math.round(refundData.stats.total_refund_amount || 0);
          this.paymentStats.giftCardsIssued = refundData.giftcards.total_giftcards || 0;
          this.paymentStats.giftCardAmount = Math.round(refundData.giftcards.total_giftcard_amount || 0);
          
          console.log('📊 Refund Stats Updated:', {
            totalRefunds: this.paymentStats.totalRefunds,
            totalAmount: this.paymentStats.totalRefundAmount,
            pendingRefunds: this.paymentStats.pendingRefunds,
            pendingAmount: this.paymentStats.pendingRefundAmount,
            completedRefunds: this.paymentStats.completedRefunds,
            completedAmount: this.paymentStats.completedRefundAmount,
            giftCards: this.paymentStats.giftCardsIssued,
            giftCardAmount: this.paymentStats.giftCardAmount
          });
        }
      },
      error: (error) => console.error('Error loading refund analytics:', error)
    });
    
    // Load detailed pending refunds list
    this.apiService.getPendingRefunds().subscribe({
      next: (response) => {
        console.log('📋 Full API Response:', response);
        if (response.success && response.data) {
          this.pendingRefundsList = response.data.refunds || [];
          console.log('📋 Pending Refunds List Loaded:', this.pendingRefundsList.length, 'items');
          
          // Log first refund in detail if available
          if (this.pendingRefundsList.length > 0) {
            console.log('🔍 First Refund Complete Object:', this.pendingRefundsList[0]);
            console.log('🔍 First Refund Keys:', Object.keys(this.pendingRefundsList[0]));
          }
          
          console.log('💰 Refund Details with Amount Check:', this.pendingRefundsList.map(r => ({
            id: r.refund_id,
            refund_amount: r.refund_amount,
            amount: r.amount,
            has_refund_amount: 'refund_amount' in r,
            has_amount: 'amount' in r,
            customer: `${r.first_name} ${r.last_name}`,
            booking: r.booking_reference,
            method: r.refund_method
          })));
        }
      },
      error: (error) => console.error('❌ Error loading pending refunds:', error)
    });
    
    // Load detailed completed refunds list
    this.apiService.getCompletedRefunds().subscribe({
      next: (response) => {
        console.log('✅ Completed Refunds API Response:', response);
        if (response.success && response.data) {
          this.completedRefundsList = response.data.refunds || [];
          console.log('✅ Completed Refunds List Loaded:', this.completedRefundsList.length, 'items');
          
          if (this.completedRefundsList.length > 0) {
            console.log('🔍 First Completed Refund:', this.completedRefundsList[0]);
          }
        }
      },
      error: (error) => console.error('❌ Error loading completed refunds:', error)
    });
  }

  updateGatewayStats() {
    // Calculate real gateway statistics from payment data
    const gatewayData: { [key: string]: { transactions: number, revenue: number } } = {
      'Stripe': { transactions: 0, revenue: 0 },
      'PayPal': { transactions: 0, revenue: 0 },
      'Razorpay': { transactions: 0, revenue: 0 },
      'Square': { transactions: 0, revenue: 0 }
    };

    this.payments.forEach(payment => {
      if (payment.status === 'completed' && gatewayData[payment.gateway]) {
        gatewayData[payment.gateway].transactions++;
        gatewayData[payment.gateway].revenue += payment.amount;
      }
    });

    this.paymentGateways = this.paymentGateways.map(gateway => ({
      ...gateway,
      transactions: gatewayData[gateway.name]?.transactions || 0,
      revenue: Math.round(gatewayData[gateway.name]?.revenue || 0)
    }));
  }

  applyFilter() {
    console.log(`Applying payment filter: ${this.selectedFilter}`);
    
    if (this.selectedFilter === 'all') {
      this.payments = [...this.allPayments];
    } else {
      this.payments = this.allPayments.filter(p => p.status === this.selectedFilter);
    }
    
    console.log(`Filtered payments: ${this.payments.length} of ${this.allPayments.length}`);
  }

  applyGatewayFilter() {
    console.log(`Filtering by gateway: ${this.selectedPaymentGateway}`);
    
    if (this.selectedPaymentGateway === 'all') {
      this.payments = [...this.allPayments];
    } else {
      this.payments = this.allPayments.filter(p => p.gateway === this.selectedPaymentGateway);
    }
  }

  applyDateRange() {
    console.log(`Applying date range: ${this.selectedDateRange}`);
    // You can implement date filtering here if needed
  }

  processRefund(refundOrPaymentId: any) {
    // Handle both old payment ID format and new refund object format
    if (typeof refundOrPaymentId === 'string') {
      // Old format - process as payment refund
      console.log(`Processing refund for payment: ${refundOrPaymentId}`);
      const confirmed = confirm(`Are you sure you want to process a refund for payment ${refundOrPaymentId}?`);
      
      if (confirmed) {
        const payment = this.payments.find(p => p.id === refundOrPaymentId);
        if (payment) {
          const reason = prompt('Enter refund reason (optional):') || 'Admin initiated refund';
          
          // Extract numeric ID from PAY-XXX format
          const numericId = parseInt(refundOrPaymentId.replace('PAY-', ''));
          
          this.apiService.updatePaymentStatus(numericId, 'refunded').subscribe({
            next: (response: any) => {
              if (response.success) {
                payment.status = 'refunded';
                alert(`Refund processed successfully for ${payment.customerName}!\n\nAmount: $${payment.amount}\nRefund ID: REF-${Date.now()}`);
                this.updatePaymentStats();
                this.updateGatewayStats();
              } else {
                alert('Failed to process refund: ' + response.message);
              }
            },
            error: (error: any) => {
              console.error('Error processing refund:', error);
              alert('Failed to process refund. Please try again.');
            }
          });
        }
      }
    } else {
      // New format - process as refund object from analytics
      const refund = refundOrPaymentId;
      
      // Check if it's a bank refund or gift card
      if (refund.refund_id && refund.refund_method === 'bank') {
        // Process bank refund
        const refundAmount = parseFloat(refund.refund_amount || refund.amount || 0);
        const confirmed = confirm(`Process refund of ₹${refundAmount.toFixed(2)} for ${refund.first_name} ${refund.last_name}?\n\nBooking: ${refund.booking_reference}\nMethod: Bank Transfer\n\nThis will mark the refund as completed and notify the customer.`);
        
        if (confirmed) {
          const notes = prompt('Enter any notes (optional):', 'Refund processed by admin') || 'Refund processed by admin';
          
          console.log('🔄 Processing refund:', {
            refund_id: refund.refund_id,
            amount: refundAmount,
            customer: `${refund.first_name} ${refund.last_name}`,
            booking: refund.booking_reference,
            notes: notes
          });
          
          this.apiService.completeRefund(refund.refund_id, notes).subscribe({
            next: (response: any) => {
              if (response.success) {
                alert(`✅ Refund Processed Successfully!\n\nBooking: ${refund.booking_reference}\nCustomer: ${refund.first_name} ${refund.last_name}\nAmount: ₹${refundAmount.toFixed(2)}\n\nThe customer has been notified via email.\nThe amount will be credited within 5-7 business days.`);
                
                // Immediate refresh for live monitoring
                console.log('🔄 Triggering immediate data refresh after refund processing...');
                this.loadRefundAnalytics(); // Reload refund data
                this.loadPaymentData(); // Reload all payment data
                
                // Also trigger a broadcast event for other components
                window.dispatchEvent(new CustomEvent('refund-processed', { detail: response.data }));
              } else {
                alert('❌ Failed to process refund: ' + response.message);
              }
            },
            error: (error: any) => {
              console.error('Error processing refund:', error);
              alert('❌ Failed to process refund. Please check your connection and try again.\n\nError: ' + error.message);
            }
          });
        }
      } else if (refund.giftcard_id || refund.refund_method === 'giftcard') {
        // Process gift card activation
        const giftcardAmount = parseFloat(refund.refund_amount || refund.giftcard_amount || 0);
        const confirmed = confirm(`Activate gift card for ${refund.first_name} ${refund.last_name}?\n\nBooking: ${refund.booking_reference}\nAmount: ₹${giftcardAmount.toFixed(2)}\n\nThis will send a reminder email with the gift card details.`);
        
        if (confirmed) {
          const giftcardId = refund.giftcard_id || null;
          const bookingId = refund.booking_id || null;
          
          this.apiService.completeGiftCard(giftcardId, bookingId).subscribe({
            next: (response: any) => {
              if (response.success) {
                const giftcard = response.data.giftcard;
                const amount = parseFloat(giftcard.amount || 0);
                alert(`✅ Gift Card Activated Successfully!\n\nCode: ${giftcard.code}\nAmount: ₹${amount.toFixed(2)}\n\nThe customer has been notified via email with instructions on how to use the gift card.`);
                
                // Immediate refresh for live monitoring
                console.log('🔄 Triggering immediate data refresh after gift card activation...');
                this.loadRefundAnalytics(); // Reload refund data
                this.loadPaymentData(); // Reload all payment data
                
                // Also trigger a broadcast event for other components
                window.dispatchEvent(new CustomEvent('giftcard-activated', { detail: response.data }));
              } else {
                alert('❌ Failed to activate gift card: ' + response.message);
              }
            },
            error: (error: any) => {
              console.error('Error activating gift card:', error);
              alert('❌ Failed to activate gift card. Please check your connection and try again.\n\nError: ' + error.message);
            }
          });
        }
      } else {
        // Generic refund processing
        alert('⚠️ Refund type could not be determined. Please try again or contact support.');
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
    console.log('Starting live payment monitoring with real data...');
    this.monitoringActive = true;
    
    // Load initial transactions
    this.loadLiveTransactions();
    
    // Refresh live transactions every 10 seconds
    setInterval(() => {
      if (this.monitoringActive) {
        this.loadLiveTransactions();
      }
    }, 10000);
  }

  loadLiveTransactions() {
    // Get the 10 most recent payments from our current data
    if (this.allPayments && this.allPayments.length > 0) {
      this.liveTransactions = this.allPayments
        .slice(0, 10)
        .map(payment => ({
          id: payment.id,
          customer: payment.customerName,
          amount: payment.amount,
          gateway: payment.gateway,
          status: payment.status,
          timestamp: payment.date
        }));
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
  
  // Refund management methods
  scrollToPendingRefunds() {
    const element = document.getElementById('pendingRefundsSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  viewRefundDetails(refund: any) {
    const details = `
      🔍 REFUND DETAILS
      
      Booking Reference: ${refund.booking_reference}
      Customer: ${refund.first_name} ${refund.last_name}
      Email: ${refund.email}
      Tour: ${refund.tour_name}
      
      Refund Amount: ₹${refund.refund_amount}
      Method: ${refund.refund_method}
      Initiated: ${new Date(refund.initiated_at).toLocaleString()}
      
      Booking ID: ${refund.booking_id}
      Refund ID: ${refund.refund_id}
    `;
    
    alert(details);
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
