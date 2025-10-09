import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Payment {
  id: number;
  transactionId: string;
  bookingId: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  gateway: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  description?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  pendingPayments: number;
  failedPayments: number;
  successRate: number;
  averageAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  private statsSubject = new BehaviorSubject<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    failedPayments: 0,
    successRate: 0,
    averageAmount: 0
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  public payments$ = this.paymentsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('💳 PaymentsService initialized');
  }

  /**
   * Get current payments snapshot
   */
  getCurrentPayments(): Payment[] {
    return this.paymentsSubject.value;
  }

  /**
   * Get current stats snapshot
   */
  getCurrentStats(): PaymentStats {
    return this.statsSubject.value;
  }

  /**
   * Load all payments from API and broadcast
   */
  loadPayments(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next('');

    console.log('💳 Loading payments from API...');

    this.apiService.getPayments().subscribe({
      next: (response) => {
        console.log('✅ Payments API Response:', response);

        if (response && response.success) {
          const paymentsData = response.data?.payments || response.data || [];
          
          const payments: Payment[] = paymentsData.map((item: any) => ({
            id: item.id,
            transactionId: item.transaction_id || item.transactionId || `TXN-${item.id}`,
            bookingId: item.booking_id || item.bookingId || 0,
            customerName: item.customer_name || item.customerName || 'Unknown',
            customerEmail: item.customer_email || item.customerEmail || '',
            amount: parseFloat(item.amount) || 0,
            paymentMethod: item.payment_method || item.paymentMethod || 'card',
            gateway: item.gateway || item.payment_method || 'stripe',
            status: item.payment_status || item.status || 'pending',
            paymentDate: item.payment_date || item.paymentDate || new Date().toISOString(),
            description: item.description || ''
          }));

          // Calculate stats
          const stats = this.calculateStats(payments);

          // Broadcast to all subscribers
          this.paymentsSubject.next(payments);
          this.statsSubject.next(stats);
          this.loadingSubject.next(false);

          console.log(`🔔 Broadcast: ${payments.length} payments loaded`);
        } else {
          console.log('⚠️ No payment data from API, using empty array');
          this.paymentsSubject.next([]);
          this.statsSubject.next(this.calculateStats([]));
          this.loadingSubject.next(false);
        }
      },
      error: (error) => {
        console.error('❌ Error loading payments:', error);
        this.errorSubject.next(error.message || 'Failed to load payments');
        this.loadingSubject.next(false);
        
        // Use empty array on error
        this.paymentsSubject.next([]);
        this.statsSubject.next(this.calculateStats([]));
      }
    });
  }

  /**
   * Update payment status and broadcast
   */
  updatePaymentStatus(id: number, status: string): Observable<any> {
    console.log(`🔄 Updating payment ${id} status to ${status}...`);

    return new Observable(observer => {
      this.apiService.updatePaymentStatus(id, status).subscribe({
        next: (response) => {
          if (response.success) {
            // Update local state
            const currentPayments = this.paymentsSubject.value;
            const updatedPayments = currentPayments.map(payment =>
              payment.id === id ? { ...payment, status: status as any } : payment
            );

            const stats = this.calculateStats(updatedPayments);

            // Broadcast updates
            this.paymentsSubject.next(updatedPayments);
            this.statsSubject.next(stats);

            console.log(`✅ Payment ${id} status updated and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Update failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error updating payment status:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Delete payment and broadcast changes
   */
  deletePayment(id: number): Observable<any> {
    console.log(`🗑️ Deleting payment ${id}...`);

    return new Observable(observer => {
      this.apiService.deletePayment(id).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove from local state
            const currentPayments = this.paymentsSubject.value;
            const updatedPayments = currentPayments.filter(payment => payment.id !== id);

            const stats = this.calculateStats(updatedPayments);

            // Broadcast updates
            this.paymentsSubject.next(updatedPayments);
            this.statsSubject.next(stats);

            console.log(`✅ Payment ${id} deleted and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Delete failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error deleting payment:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Refresh payments from API
   */
  refresh(): void {
    console.log('🔄 Refreshing payments...');
    this.loadPayments();
  }

  /**
   * Calculate statistics from payments array
   */
  private calculateStats(payments: Payment[]): PaymentStats {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const averageAmount = total > 0 ? totalRevenue / completed || 0 : 0;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalRevenue,
      totalTransactions: total,
      pendingPayments: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      failedPayments: failed,
      successRate,
      averageAmount
    };
  }
}
