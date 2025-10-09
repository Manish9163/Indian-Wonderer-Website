-- Create Admin User for Indian Wonderer Admin Panel
-- Run this in phpMyAdmin or MySQL command line

-- Use the correct database
USE indian_wonderer_base;

-- Check if admin user already exists
SELECT 'Checking for existing admin user...' as status;
SELECT id, name, email, role FROM users WHERE email = 'admin@example.com';

-- If no result above, run this INSERT:
INSERT INTO users (name, email, password, role, phone, is_verified, created_at, updated_at)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- This hash = password "password"
  'admin',
  '1234567890',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role = 'admin',
  is_verified = 1,
  updated_at = NOW();

-- Verify the admin user was created
SELECT 'Admin user created successfully!' as status;
SELECT id, name, email, role, is_verified, created_at FROM users WHERE email = 'admin@example.com';

-- Login credentials:
SELECT '
======================================
Admin Login Credentials:
======================================
Email: admin@example.com
Password: password
======================================
' as login_info;
