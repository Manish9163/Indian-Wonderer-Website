-- Tour Guide Assignments Table
CREATE TABLE IF NOT EXISTS tour_guide_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guide_id INT NOT NULL,
    booking_id INT NOT NULL,
    status ENUM('assigned', 'completed', 'cancelled') DEFAULT 'assigned',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_date DATETIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_guide (booking_id, guide_id),
    INDEX idx_guide_id (guide_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Guide Earnings Table
CREATE TABLE IF NOT EXISTS guide_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guide_id INT NOT NULL,
    assignment_id INT NOT NULL,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    status ENUM('earned', 'paid', 'pending') DEFAULT 'earned',
    earned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_date DATETIME NULL,
    payment_method VARCHAR(50) NULL,
    transaction_id VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES tour_guide_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_guide_id (guide_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    INDEX idx_earned_date (earned_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
