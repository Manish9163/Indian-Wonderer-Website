import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {
    console.log('ApiService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Check API health (no authentication required)
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health.php`, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get HTTP headers with authentication token
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An error occurred';
    
    // Check if response is HTML (PHP error page)
    if (error.error && typeof error.error === 'string' && error.error.includes('<br')) {
      errorMessage = 'Server returned an error page. Check if the API endpoint exists and XAMPP is running.';
      console.error('HTML Error Response:', error.error.substring(0, 200));
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found (404). Check if the endpoint exists.';
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to backend server. Check if XAMPP Apache is running.';
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    return throwError(() => new Error(errorMessage));
  }

  // Authentication
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_login.php`, credentials, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_logout.php`, {}, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_session.php`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // Dashboard Analytics
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_dashboard_simple.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  getAnalytics(action: string = 'dashboard', timeframe: string = '30'): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_analytics.php?action=${action}&timeframe=${timeframe}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // Guides Management
  getGuides(applicationStatus?: string): Observable<any> {
    let url = `${this.baseUrl}/admin_guides_simple.php`;
    if (applicationStatus) {
      url += `?application_status=${applicationStatus}`;
    }
    return this.http.get(url, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  createGuide(guide: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_guides_simple.php`, guide, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updateGuide(id: number, guide: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin_guides_simple.php?id=${id}`, guide, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deleteGuide(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin_guides_simple.php?id=${id}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  assignGuideToTour(assignment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_tours_simple.php?action=assign_guide`, assignment, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  autoCompleteExpiredBookings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auto_complete_bookings.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  getUserActivities(limit: number = 20, since?: string): Observable<any> {
    let url = `${this.baseUrl}/user_activities.php?limit=${limit}`;
    if (since) {
      url += `&since=${since}`;
    }
    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Tours Management
  getTours(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_tours_simple.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  createTour(tour: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_tours_simple.php`, tour, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateTour(id: number, tour: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin_tours_simple.php?id=${id}`, tour, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteTour(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin_tours_simple.php?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Bookings Management
  getBookings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_bookings_simple.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateBookingStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin_bookings_simple.php?id=${id}`, { status }, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteBooking(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin_bookings_simple.php?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Users Management
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_users_simple.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_users_simple.php`, user, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin_users_simple.php?id=${id}`, user, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin_users_simple.php?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Customers Management
  getCustomers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_customers.php`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  getCustomer(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_customers.php?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  createCustomer(customer: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_customers.php`, customer, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateCustomerStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin_customers.php?id=${id}`, { status }, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin_customers.php?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Itineraries Management
  getItineraries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/itineraries.php`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  createItinerary(itinerary: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/itineraries.php`, itinerary, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updateItinerary(id: number, itinerary: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/itineraries.php?id=${id}`, itinerary, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deleteItinerary(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/itineraries.php?id=${id}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getItineraryById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/itineraries.php?action=single&id=${id}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // Payments Management
  getPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payments.php`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updatePaymentStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/payments.php?id=${id}`, { status }, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payments.php?id=${id}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  // Refund Management
  completeRefund(refundId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_refunds.php?action=complete`, 
      { refund_id: refundId, notes: notes || 'Refund processed by admin' }, 
      {
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(catchError(this.handleError));
  }

  completeGiftCard(giftcardId: number, bookingId?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin_refunds.php?action=complete_giftcard`, 
      { giftcard_id: giftcardId, booking_id: bookingId }, 
      {
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(catchError(this.handleError));
  }

  getPendingRefunds(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_refunds.php?action=get_pending`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getCompletedRefunds(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_refunds.php?action=get_completed`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getAllRefunds(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_refunds.php?action=get_all`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getAllGiftCards(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_refunds.php?action=get_gift_cards`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getRefundDetails(refundId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin_refunds.php?action=get_details&refund_id=${refundId}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }
}