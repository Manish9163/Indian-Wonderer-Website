import { Environment } from './environment';

export const environment: Environment = {
  production: true,
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
