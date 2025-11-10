
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL: string;
      BACKEND_URL: string;
      ADMIN_URL: string;
      FRONTEND_URL: string;
      BASE_PATH: string;
      NODE_ENV: string;
    };
  }
}

const getConfig = () => {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return {
      apiUrl: window.APP_CONFIG.API_BASE_URL,
      backendUrl: window.APP_CONFIG.BACKEND_URL,
      adminUrl: window.APP_CONFIG.ADMIN_URL,
      frontendUrl: window.APP_CONFIG.FRONTEND_URL,
    };
  }

  return {
    apiUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost/fu/backend/api',
    backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost/fu/backend',
    adminUrl: process.env.REACT_APP_ADMIN_PANEL_URL || 'http://localhost/fu/admin',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://localhost/fu/app',
  };
};

const config = getConfig();

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

class ApiService {
  private baseURL: string;
  private backendURL: string;
  private adminURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = config.apiUrl;
    this.backendURL = config.backendUrl;
    this.adminURL = config.adminUrl;
    
    this.authToken = localStorage.getItem('authToken');
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getAuthToken(): string | null {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && storedToken !== this.authToken) {
      this.authToken = storedToken;
    }
    return this.authToken || storedToken;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = this.getAuthToken();
    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}/${endpoint}`;
        
    const defaultOptions: RequestInit = {
      headers: this.getHeaders(),
      credentials: 'include',
      mode: 'cors',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (response.status === 0) {
        throw new Error('CORS preflight failed - check server CORS configuration');
      }
      
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get(endpoint: string): Promise<ApiResponse> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<ApiResponse> {
    return this.request(endpoint, { method: 'DELETE' });
  }


  async testBackendConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.backendURL}/health-check.php`, {
        method: 'GET',
        headers: this.getHeaders(false),
        credentials: 'include',
        mode: 'cors'
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async testDatabaseConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.backendURL}/db-test.php`, {
        method: 'GET',
        headers: this.getHeaders(false),
        credentials: 'include',
        mode: 'cors'
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.post('auth.php?action=login', { email, password });
    
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async register(userData: any): Promise<ApiResponse> {
    return this.post('auth.php?action=register', userData);
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.post('auth.php?action=logout', {});
      this.setAuthToken(null);
      localStorage.removeItem('current_user');
      return response;
    } catch (error) {
      this.setAuthToken(null);
      localStorage.removeItem('current_user');
      throw error;
    }
  }

  async getProfile(): Promise<ApiResponse> {
    return this.get('auth.php?action=profile');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async getTours(filters?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `tours.php?${params}` : 'tours.php';
    return this.get(endpoint);
  }

  async getTour(id: number) {
    return this.get(`tours.php?id=${id}`);
  }

  async createTour(tourData: any) {
    return this.post('tours.php?action=create', tourData);
  }

  async updateTour(id: number, tourData: any) {
    return this.put(`tours.php?action=update&id=${id}`, tourData);
  }

  async deleteTour(id: number) {
    return this.delete(`tours.php?action=delete&id=${id}`);
  }

  // Booking methods
  async createBooking(bookingData: any) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    return this.post('bookings.php?action=create', bookingData);
  }

  // Agent application
  async submitAgentApplication(formData: FormData) {
    try {
      const response = await fetch(`${this.baseURL}/agent_application.php`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: data.success || false,
        message: data.message || 'Application submitted successfully!',
        data: data.data || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Itineraries 
  async getItineraries() {
    return this.get('itineraries.php');
  }

  async getUserItineraries(userId: number) {
    return this.get(`itineraries.php?action=user&user_id=${userId}`);
  }

  async createItinerary(itineraryData: any) {
    return this.post('itineraries.php?action=create', itineraryData);
  }

  async updateItinerary(id: number, itineraryData: any) {
    return this.put(`itineraries.php?action=update&id=${id}`, itineraryData);
  }

  async deleteItinerary(id: number) {
    return this.delete(`itineraries.php?action=delete&id=${id}`);
  }

  // Booking
  async getBookings() {
    return this.get('bookings.php');
  }


  async updateBooking(id: number, bookingData: any) {
    return this.put(`bookings.php?action=update&id=${id}`, bookingData);
  }

  async cancelBooking(id: number) {
    return this.delete(`bookings.php?action=cancel&id=${id}`);
  }

  async getCustomers() {
    return this.get('customers.php');
  }

  async getCustomer(id: number) {
    return this.get(`customers.php?id=${id}`);
  }

  // Payment
  async getPayments() {
    return this.get('payments.php');
  }

  async processPayment(paymentData: any) {
    return this.post('payments.php?action=process', paymentData);
  }

  // Analytics 
  async getAnalytics() {
    return this.get('analytics.php');
  }

  async getDashboardStats() {
    return this.get('dashboard.php?action=stats');
  }

  async getRecentActivities() {
    return this.get('dashboard.php?action=recent');
  }
}

const apiService = new ApiService();
export default apiService;
