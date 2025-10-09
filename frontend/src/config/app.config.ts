/**
 * Unified Configuration for React Frontend
 * Connects with PHP Backend and Angular Admin Panel
 */

interface AppConfig {
  apiUrl: string;
  backendUrl: string;
  adminUrl: string;
  frontendUrl: string;
  environment: 'development' | 'production';
  features: {
    adminIntegration: boolean;
    realTimeUpdates: boolean;
    analytics: boolean;
  };
}

// Get configuration from environment or window object
const getConfig = (): AppConfig => {
  // Check if configuration was injected by PHP
  if (typeof window !== 'undefined' && (window as any).REACT_APP_CONFIG) {
    const injectedConfig = (window as any).REACT_APP_CONFIG;
    return {
      apiUrl: injectedConfig.API_BASE_URL,
      backendUrl: injectedConfig.BACKEND_URL,
      adminUrl: injectedConfig.ADMIN_URL,
      frontendUrl: injectedConfig.basePath || '/fu/frontend',
      environment: injectedConfig.NODE_ENV || 'development',
      features: {
        adminIntegration: true,
        realTimeUpdates: true,
        analytics: true
      }
    };
  }

  // Fallback to environment variables
  return {
    apiUrl: process.env.REACT_APP_API_BASE_URL || '/fu/backend/api',
    backendUrl: process.env.REACT_APP_BACKEND_URL || '/fu/backend',
    adminUrl: process.env.REACT_APP_ADMIN_PANEL_URL || '/fu/admin',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || '/fu/frontend',
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    features: {
      adminIntegration: true,
      realTimeUpdates: true,
      analytics: true
    }
  };
};

export const AppConfig = getConfig();

// API Endpoints configuration
export const ApiEndpoints = {
  // Authentication
  auth: {
    login: '/auth.php?action=login',
    logout: '/auth.php?action=logout',
    register: '/auth.php?action=register',
    profile: '/auth.php?action=profile'
  },

  // Tours
  tours: {
    list: '/tours.php',
    get: '/tours.php?action=get',
    search: '/tours.php?action=search',
    featured: '/tours.php?action=featured',
    categories: '/tours.php?action=categories'
  },

  // Bookings
  bookings: {
    create: '/bookings.php?action=create',
    list: '/bookings.php?action=user',
    get: '/bookings.php?action=get',
    cancel: '/bookings.php?action=cancel',
    update: '/bookings.php?action=update'
  },

  // Payments
  payments: {
    initiate: '/payments.php?action=initiate',
    verify: '/payments.php?action=verify',
    status: '/payments.php?action=status'
  },

  // Itineraries
  itineraries: {
    list: '/itineraries.php?action=user',
    get: '/itineraries.php?action=get',
    create: '/itineraries.php?action=create',
    update: '/itineraries.php?action=update',
    delete: '/itineraries.php?action=delete'
  },

  // Customer Analytics (for customer dashboard)
  analytics: {
    dashboard: '/analytics.php?action=customer_dashboard',
    bookingHistory: '/analytics.php?action=booking_history',
    preferences: '/analytics.php?action=preferences'
  },

  // Admin Integration (limited access for customers)
  admin: {
    tourAvailability: '/admin_tours.php?action=availability',
    systemStatus: '/admin_dashboard.php?action=system_status'
  }
};

// Utility functions
export const ConfigUtils = {
  /**
   * Get full API URL
   */
  getApiUrl: (endpoint: string): string => {
    const baseUrl = AppConfig.apiUrl.endsWith('/') 
      ? AppConfig.apiUrl.slice(0, -1) 
      : AppConfig.apiUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  },

  /**
   * Get full backend URL
   */
  getBackendUrl: (path: string = ''): string => {
    const baseUrl = AppConfig.backendUrl.endsWith('/') 
      ? AppConfig.backendUrl.slice(0, -1) 
      : AppConfig.backendUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },

  /**
   * Get admin panel URL
   */
  getAdminUrl: (path: string = ''): string => {
    const baseUrl = AppConfig.adminUrl.endsWith('/') 
      ? AppConfig.adminUrl.slice(0, -1) 
      : AppConfig.adminUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },

  /**
   * Check if running in development
   */
  isDevelopment: (): boolean => {
    return AppConfig.environment === 'development';
  },

  /**
   * Check if running in production
   */
  isProduction: (): boolean => {
    return AppConfig.environment === 'production';
  },

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled: (feature: keyof typeof AppConfig.features): boolean => {
    return AppConfig.features[feature];
  },

  /**
   * Get connection status info
   */
  getConnectionInfo: () => {
    return {
      backend: AppConfig.backendUrl,
      admin: AppConfig.adminUrl,
      api: AppConfig.apiUrl,
      environment: AppConfig.environment,
      timestamp: new Date().toISOString()
    };
  }
};

// Export configuration for use in components
export default AppConfig;
