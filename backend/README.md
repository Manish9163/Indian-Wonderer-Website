# Travel Management System - Backend Setup Guide

## Overview
This backend provides a RESTful API for the Travel Management System, serving both the React frontend and Angular admin panel with MySQL database integration.

## Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx) or PHP built-in server
- Composer (optional, for additional packages)

## Installation Steps

### 1. Database Setup
```sql
-- Import the database schema
mysql -u root -p < database_schema.sql

-- Or manually create database and run the SQL commands
```

### 2. Configuration
Update the following files with your settings:

**config/database.php**
```php
private $host = "localhost";           // Your MySQL host
private $database_name = "travel_management_system";  // Database name
private $username = "root";            // MySQL username
private $password = "";                // MySQL password
```

**config/api_config.php**
```php
private static $secret_key = "your_secret_key_here_change_in_production";
```

### 3. File Permissions
Ensure web server has read access to all files:
```bash
chmod -R 755 backend/
```

### 4. Web Server Setup

#### Option A: Apache
Create `.htaccess` in backend folder:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [QSA,L]

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
```

#### Option B: PHP Built-in Server (Development)
```bash
cd backend
php -S localhost:8000
```

#### Option C: Nginx
```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
}
```

## API Endpoints

### Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://yourdomain.com/backend/api/`

### Authentication Endpoints
- `POST /auth.php?action=register` - User registration
- `POST /auth.php?action=login` - User login
- `GET /auth.php?action=profile` - Get user profile
- `PUT /auth.php?action=profile` - Update profile
- `POST /auth.php?action=change-password` - Change password

### Tours Endpoints
- `GET /tours.php?action=all` - Get all tours
- `GET /tours.php?action=single&id={id}` - Get tour by ID
- `POST /tours.php` - Create tour (admin)
- `PUT /tours.php?id={id}` - Update tour (admin)
- `DELETE /tours.php?id={id}` - Delete tour (admin)

### Itineraries Endpoints
- `GET /itineraries.php?action=all` - Get all itineraries (admin)
- `GET /itineraries.php?action=single&id={id}` - Get itinerary by ID
- `POST /itineraries.php` - Create itinerary (admin)
- `PUT /itineraries.php?id={id}` - Update itinerary (admin)
- `DELETE /itineraries.php?id={id}` - Delete itinerary (admin)

## Frontend Integration

### React Frontend
Update your API base URL in frontend:
```javascript
// src/config/api.js
const API_BASE_URL = 'http://localhost:8000/api';

// Example API call
const response = await fetch(`${API_BASE_URL}/tours.php?action=all`);
const data = await response.json();
```

### Angular Admin Panel
Update your API service:
```typescript
// src/app/services/api.service.ts
private baseUrl = 'http://localhost:8000/api';

// Example service method
getTours() {
  return this.http.get(`${this.baseUrl}/tours.php?action=all`);
}
```

## Authentication Flow

### 1. Login/Register
```javascript
const loginData = {
  email: 'user@example.com',
  password: 'password'
};

const response = await fetch('/api/auth.php?action=login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
});

const result = await response.json();
const token = result.data.token;
```

### 2. Authenticated Requests
```javascript
const response = await fetch('/api/tours.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(tourData)
});
```

## Database Schema

### Main Tables
- **users** - User accounts (customers, admins, guides)
- **tours** - Tour/destination information
- **itineraries** - Tour itineraries with daily schedules
- **bookings** - Customer bookings
- **payments** - Payment transactions
- **reviews** - Tour reviews and ratings

### Default Admin Account
- Email: `admin@travelmanagement.com`
- Password: `password` (change in production)

## Security Features
- JWT token authentication
- Password hashing
- SQL injection prevention
- CORS handling
- Input validation
- Activity logging

## Testing

### 1. Test API Endpoints
```bash
# Test basic connectivity
curl http://localhost:8000/api/

# Test tours endpoint
curl http://localhost:8000/api/tours.php?action=all

# Test authentication
curl -X POST http://localhost:8000/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travelmanagement.com","password":"password"}'
```

### 2. Frontend Connection Test
Update your frontend to point to the backend API and test:
- User registration/login
- Tours listing
- Admin panel functionality

## Production Deployment

### 1. Security Checklist
- [ ] Change JWT secret key
- [ ] Update database credentials
- [ ] Enable HTTPS
- [ ] Set proper file permissions
- [ ] Configure firewall
- [ ] Set up database backups

### 2. Performance Optimization
- Enable PHP OPcache
- Configure MySQL query cache
- Use CDN for static assets
- Implement API rate limiting

## Troubleshooting

### Common Issues
1. **CORS errors** - Check web server CORS configuration
2. **Database connection failed** - Verify database credentials
3. **JWT token invalid** - Check secret key and token format
4. **Permission denied** - Check file permissions

### Debug Mode
Add debug output in development:
```php
// In api_config.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

## Support
For issues and questions, check the following:
1. Error logs in your web server
2. MySQL error logs
3. PHP error logs
4. Network connectivity between frontend and backend

## Next Steps
1. Set up the database using the provided schema
2. Configure the API endpoints in your frontend applications
3. Test all functionality end-to-end
4. Deploy to production with proper security measures
