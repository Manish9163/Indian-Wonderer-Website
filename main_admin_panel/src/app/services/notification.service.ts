import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  timestamp: Date;
  read: boolean;
  icon: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Load notifications from localStorage
    this.loadNotifications();
    
    // Initialize with some sample notifications
    if (this.notifications.length === 0) {
      this.initializeSampleNotifications();
    }
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem('admin_notifications');
    if (stored) {
      this.notifications = JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      this.updateSubjects();
    }
  }

  private saveNotifications(): void {
    localStorage.setItem('admin_notifications', JSON.stringify(this.notifications));
  }

  private updateSubjects(): void {
    this.notificationsSubject.next([...this.notifications]);
    const unreadCount = this.notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private initializeSampleNotifications(): void {
    const samples: Omit<Notification, 'id' | 'timestamp'>[] = [
      {
        title: 'New Booking Received',
        message: 'Kerala Backwaters Bliss tour booked by Manish Das',
        type: 'success',
        icon: 'fa-calendar-check',
        read: false,
        link: '/bookings'
      },
      {
        title: 'Guide Assignment',
        message: 'Rajesh Kumar assigned to booking #2',
        type: 'info',
        icon: 'fa-user-check',
        read: false,
        link: '/guides'
      },
      {
        title: 'Tour Completed',
        message: '2 bookings auto-completed successfully',
        type: 'warning',
        icon: 'fa-check-circle',
        read: false,
        link: '/bookings'
      }
    ];

    samples.forEach((sample, index) => {
      this.addNotification(sample, new Date(Date.now() - (index * 60000))); // Stagger by 1 minute
    });
  }

  addNotification(
    notification: Omit<Notification, 'id' | 'timestamp'>,
    timestamp: Date = new Date()
  ): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.updateSubjects();
  }

  markAsRead(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.updateSubjects();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.updateSubjects();
  }

  deleteNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.updateSubjects();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.updateSubjects();
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Helper methods for adding specific notification types
  addBookingNotification(bookingRef: string, customerName: string, tourName: string): void {
    this.addNotification({
      title: 'New Booking Received',
      message: `${tourName} booked by ${customerName} (${bookingRef})`,
      type: 'success',
      icon: 'fa-calendar-check',
      read: false,
      link: '/bookings'
    });
  }

  addGuideAssignmentNotification(guideName: string, bookingId: number): void {
    this.addNotification({
      title: 'Guide Assigned',
      message: `${guideName} assigned to booking #${bookingId}`,
      type: 'info',
      icon: 'fa-user-check',
      read: false,
      link: '/guides'
    });
  }

  addTourCompletedNotification(count: number): void {
    this.addNotification({
      title: 'Tours Completed',
      message: `${count} booking(s) auto-completed successfully`,
      type: 'success',
      icon: 'fa-check-circle',
      read: false,
      link: '/bookings'
    });
  }

  addPaymentNotification(amount: number, customerName: string, bookingRef?: string): void {
    this.addNotification({
      title: 'Payment Received',
      message: `₹${amount.toLocaleString()} received from ${customerName}${bookingRef ? ` (${bookingRef})` : ''}`,
      type: 'success',
      icon: 'fa-rupee-sign',
      read: false,
      link: '/bookings'
    });
  }

  addUserLoginNotification(userName: string, userType: string = 'User'): void {
    this.addNotification({
      title: 'User Login',
      message: `${userName} logged in as ${userType}`,
      type: 'info',
      icon: 'fa-sign-in-alt',
      read: false,
      link: '/customers'
    });
  }

  addUserRegistrationNotification(userName: string, email: string): void {
    this.addNotification({
      title: 'New User Registration',
      message: `${userName} registered with email ${email}`,
      type: 'success',
      icon: 'fa-user-plus',
      read: false,
      link: '/customers'
    });
  }

  addBookingPaymentNotification(bookingRef: string, amount: number, status: string): void {
    this.addNotification({
      title: 'Booking Payment Update',
      message: `Payment ${status} for ${bookingRef} - ₹${amount.toLocaleString()}`,
      type: status === 'completed' ? 'success' : 'info',
      icon: 'fa-credit-card',
      read: false,
      link: '/bookings'
    });
  }

  addGuideSelectionNotification(guideName: string, customerName: string, tourName: string): void {
    this.addNotification({
      title: 'Guide Selected by Customer',
      message: `${customerName} selected ${guideName} for ${tourName}`,
      type: 'info',
      icon: 'fa-user-check',
      read: false,
      link: '/guides'
    });
  }

  addTourInquiryNotification(customerName: string, tourName: string): void {
    this.addNotification({
      title: 'Tour Inquiry',
      message: `${customerName} inquired about ${tourName}`,
      type: 'info',
      icon: 'fa-question-circle',
      read: false,
      link: '/tours'
    });
  }

  addCancellationNotification(bookingRef: string, customerName: string): void {
    this.addNotification({
      title: 'Booking Cancelled',
      message: `${bookingRef} cancelled by ${customerName}`,
      type: 'warning',
      icon: 'fa-times-circle',
      read: false,
      link: '/bookings'
    });
  }

  addReviewNotification(customerName: string, rating: number, tourName: string): void {
    this.addNotification({
      title: 'New Review Received',
      message: `${customerName} rated ${tourName} - ${rating} stars`,
      type: 'success',
      icon: 'fa-star',
      read: false,
      link: '/analytics'
    });
  }

  addWarningNotification(title: string, message: string): void {
    this.addNotification({
      title,
      message,
      type: 'warning',
      icon: 'fa-exclamation-triangle',
      read: false
    });
  }

  addErrorNotification(title: string, message: string): void {
    this.addNotification({
      title,
      message,
      type: 'danger',
      icon: 'fa-exclamation-circle',
      read: false
    });
  }
}
