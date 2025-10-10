

export interface Environment {
  production: boolean;
  apiUrl: string;
  backendUrl: string;
  frontendUrl: string;
  adminUrl: string;
  features: {
    analytics: boolean;
    realTimeUpdates: boolean;
    darkMode: boolean;
  };
}

declare const window: Window & {
  APP_CONFIG?: {
    API_BASE_URL: string;
    BACKEND_URL: string;
    FRONTEND_URL: string;
    ADMIN_URL: string;
    NODE_ENV: string;
  };
};

function getEnvironmentConfig(): Environment {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return {
      production: window.APP_CONFIG.NODE_ENV === 'production',
      apiUrl: window.APP_CONFIG.API_BASE_URL,
      backendUrl: window.APP_CONFIG.BACKEND_URL,
      frontendUrl: window.APP_CONFIG.FRONTEND_URL,
      adminUrl: window.APP_CONFIG.ADMIN_URL,
      features: {
        analytics: true,
        realTimeUpdates: true,
        darkMode: true
      }
    };
  }

  return {
    production: false,
    apiUrl: 'http://localhost/fu/backend/api',
    backendUrl: 'http://localhost/fu/backend',
    frontendUrl: 'http://localhost/fu/app',
    adminUrl: 'http://localhost/fu/admin',
    features: {
      analytics: true,
      realTimeUpdates: true,
      darkMode: true
    }
  };
}

export const environment: Environment = getEnvironmentConfig();
