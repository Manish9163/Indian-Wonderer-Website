-- Tour System Database Schema
-- Complete database for Admin Panel and Agent Application System

DROP DATABASE IF EXISTS indian_wonderer_base;
CREATE DATABASE indian_wonderer_base;
USE indian_wonderer_base;

-- Admin table for admin authentication
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user with password "Admin123"
INSERT INTO admin (email, password, full_name) VALUES 
('admin@toursystem.com', '$2y$12$LQv3c1yqBzVCu35f7lQ0hOj6FnzBEeYwlrD7BPPsyKB8GQDLn6nUe', 'System Administrator');

-- Items table for product/service management
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample items data
INSERT INTO items (name, description, price, category, stock_quantity) VALUES 
('Golden Triangle Tour', 'Delhi, Agra, Jaipur 7-day tour package', 1299.99, 'Tours', 25),
('Kerala Backwaters', 'Houseboat experience in Kerala backwaters', 899.99, 'Tours', 15),
('Himalayan Trek', 'Adventure trekking in Himalayas', 1599.99, 'Adventure', 10),
('Goa Beach Holiday', 'Relaxing beach vacation in Goa', 799.99, 'Beach', 30),
('Rajasthan Heritage', 'Cultural tour of Rajasthan palaces', 1199.99, 'Cultural', 20);

-- Orders table for customer orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items table for order details
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Sample orders data
INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount, status, payment_status) VALUES 
('John Smith', 'john@example.com', '+1-555-0101', '123 Main St, New York, NY', 1299.99, 'confirmed', 'paid'),
('Sarah Johnson', 'sarah@example.com', '+1-555-0102', '456 Oak Ave, Los Angeles, CA', 899.99, 'processing', 'paid'),
('Mike Wilson', 'mike@example.com', '+1-555-0103', '789 Pine St, Chicago, IL', 1599.99, 'pending', 'pending');

-- Sample order items
INSERT INTO order_items (order_id, item_id, quantity, price) VALUES 
(1, 1, 1, 1299.99),
(2, 2, 1, 899.99),
(3, 3, 1, 1599.99);

-- Agents table for agent applications
CREATE TABLE agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    experience_years INT DEFAULT 0,
    specialization VARCHAR(200),
    languages_spoken VARCHAR(200),
    certification VARCHAR(200),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    role VARCHAR(50) DEFAULT 'agent',
    permissions JSON,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewed_by) REFERENCES admin(id)
);

-- Sample agent applications
INSERT INTO agents (name, email, phone, address, experience_years, specialization, languages_spoken, certification, status) VALUES 
('Rajesh Kumar', 'rajesh@example.com', '+91-9876543210', 'Delhi, India', 5, 'Cultural Tours, Heritage Sites', 'Hindi, English, Punjabi', 'Licensed Tour Guide', 'approved'),
('Priya Sharma', 'priya@example.com', '+91-9876543211', 'Jaipur, Rajasthan', 3, 'Adventure Tours, Trekking', 'Hindi, English, Rajasthani', 'Adventure Tourism Certificate', 'pending'),
('David Brown', 'david@example.com', '+1-555-0201', 'California, USA', 7, 'International Tours, Photography', 'English, Spanish, French', 'International Guide License', 'approved');

-- Site settings table
CREATE TABLE site_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'email', 'phone', 'url', 'json') DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES 
('site_name', 'Tour Management System', 'text', 'Website name'),
('contact_email', 'info@toursystem.com', 'email', 'Primary contact email'),
('contact_phone', '+1-800-TOURS-01', 'phone', 'Primary contact phone'),
('site_url', 'https://toursystem.com', 'url', 'Website URL'),
('company_address', '123 Tourism Plaza, Travel City, TC 12345', 'text', 'Company address'),
('business_hours', 'Monday-Friday: 9 AM - 6 PM, Saturday: 10 AM - 4 PM', 'text', 'Business hours'),
('social_media', '{"facebook": "tourcompany", "twitter": "tourcompany", "instagram": "tourcompany"}', 'json', 'Social media handles');

-- Admin activity logs table
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin(id)
);

-- Indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_active ON items(is_active);
