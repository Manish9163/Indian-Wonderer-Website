-- Travel Management System - Comprehensive Sample Data
-- This file contains rich, realistic data for all tables

USE indian_wonderer_base;

-- Clear existing data (except admin user)
DELETE FROM activity_logs;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM itinerary_days;
DELETE FROM itineraries;
DELETE FROM tours;
DELETE FROM users WHERE role != 'admin';

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 2;
ALTER TABLE tours AUTO_INCREMENT = 1;
ALTER TABLE itineraries AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE activity_logs AUTO_INCREMENT = 1;

-- Insert sample users (customers and guides)
INSERT INTO users (username, email, password, first_name, last_name, phone, role, profile_image, is_active, email_verified) VALUES
-- Customers
('john_doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', '+1-555-0101', 'customer', 'https://randomuser.me/api/portraits/men/1.jpg', TRUE, TRUE),
('sarah_wilson', 'sarah@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Wilson', '+1-555-0102', 'customer', 'https://randomuser.me/api/portraits/women/2.jpg', TRUE, TRUE),
('mike_johnson', 'mike@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Johnson', '+1-555-0103', 'customer', 'https://randomuser.me/api/portraits/men/3.jpg', TRUE, TRUE),
('emily_brown', 'emily@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emily', 'Brown', '+1-555-0104', 'customer', 'https://randomuser.me/api/portraits/women/4.jpg', TRUE, TRUE),
('david_garcia', 'david@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Garcia', '+1-555-0105', 'customer', 'https://randomuser.me/api/portraits/men/5.jpg', TRUE, TRUE),
('lisa_anderson', 'lisa@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa', 'Anderson', '+1-555-0106', 'customer', 'https://randomuser.me/api/portraits/women/6.jpg', TRUE, TRUE),
('robert_taylor', 'robert@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Robert', 'Taylor', '+1-555-0107', 'customer', 'https://randomuser.me/api/portraits/men/7.jpg', TRUE, TRUE),
('amanda_white', 'amanda@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amanda', 'White', '+1-555-0108', 'customer', 'https://randomuser.me/api/portraits/women/8.jpg', TRUE, TRUE),
('chris_martin', 'chris@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Chris', 'Martin', '+1-555-0109', 'customer', 'https://randomuser.me/api/portraits/men/9.jpg', TRUE, TRUE),
('jennifer_lee', 'jennifer@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jennifer', 'Lee', '+1-555-0110', 'customer', 'https://randomuser.me/api/portraits/women/10.jpg', TRUE, TRUE),

-- Tour Guides
('rajesh_guide', 'rajesh@guides.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rajesh', 'Kumar', '+91-98765-43210', 'guide', 'https://randomuser.me/api/portraits/men/20.jpg', TRUE, TRUE),
('priya_guide', 'priya@guides.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Priya', 'Sharma', '+91-98765-43211', 'guide', 'https://randomuser.me/api/portraits/women/21.jpg', TRUE, TRUE),
('amit_guide', 'amit@guides.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amit', 'Patel', '+91-98765-43212', 'guide', 'https://randomuser.me/api/portraits/men/22.jpg', TRUE, TRUE),
('sunita_guide', 'sunita@guides.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sunita', 'Verma', '+91-98765-43213', 'guide', 'https://randomuser.me/api/portraits/women/23.jpg', TRUE, TRUE),
('ravi_guide', 'ravi@guides.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ravi', 'Singh', '+91-98765-43214', 'guide', 'https://randomuser.me/api/portraits/men/24.jpg', TRUE, TRUE);

-- Insert comprehensive tours data
INSERT INTO tours (title, description, destination, price, duration_days, max_capacity, category, difficulty_level, image_url, gallery, features, inclusions, exclusions, is_active, created_by) VALUES
-- Rajasthan Tours
('Golden Triangle Classic', 'Experience the magnificent Golden Triangle covering Delhi, Agra, and Jaipur. Visit iconic monuments like Taj Mahal, Red Fort, and Amber Palace.', 'Rajasthan', 1299.99, 7, 25, 'Cultural', 'easy', 'rajasthan.avif', 
'["rajasthan.avif", "https://images.unsplash.com/photo-1570168007204-dfb528c6958f", "https://images.unsplash.com/photo-1564507592333-c60657eea523"]',
'["Air-conditioned transport", "Professional guide", "Heritage walks", "Cultural shows", "Photography stops"]',
'["6 nights hotel accommodation", "Daily breakfast", "Airport transfers", "Monument entry fees", "Local guide"]',
'["International flights", "Lunch and dinner", "Personal expenses", "Travel insurance", "Tips"]', TRUE, 1),

('Rajasthan Royal Heritage', 'Immerse yourself in the royal heritage of Rajasthan visiting magnificent palaces, forts, and experiencing royal hospitality in heritage hotels.', 'Rajasthan', 2499.99, 12, 20, 'Luxury', 'easy', 'rajasthan.avif',
'["rajasthan.avif", "https://images.unsplash.com/photo-1570168007204-dfb528c6958f", "https://images.unsplash.com/photo-1564507592333-c60657eea523"]',
'["Heritage hotels", "Royal experiences", "Palace visits", "Camel safari", "Cultural performances"]',
'["11 nights heritage hotel stay", "All meals", "Private transport", "Royal experiences", "Cultural shows"]',
'["International flights", "Personal expenses", "Travel insurance", "Alcoholic beverages", "Tips"]', TRUE, 1),

('Desert Safari Adventure', 'Experience the Thar Desert with camel safaris, desert camping, folk music, and traditional Rajasthani cuisine under the starlit sky.', 'Rajasthan', 899.99, 5, 30, 'Adventure', 'moderate', 'rajasthan.avif',
'["rajasthan.avif", "https://images.unsplash.com/photo-1570168007204-dfb528c6958f", "https://images.unsplash.com/photo-1564507592333-c60657eea523"]',
'["Camel safari", "Desert camping", "Folk music", "Star gazing", "Traditional cuisine"]',
'["4 nights accommodation", "All meals", "Camel safari", "Desert camp", "Cultural program"]',
'["International flights", "Personal expenses", "Travel insurance", "Extra activities", "Tips"]', TRUE, 1),

-- Kerala Tours
('Kerala Backwaters Bliss', 'Cruise through the serene backwaters of Kerala, stay in traditional houseboats, and experience the lush green landscapes of Gods Own Country.', 'Kerala', 1199.99, 8, 15, 'Nature', 'easy', 'kerala.avif',
'["kerala.avif", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944", "https://images.unsplash.com/photo-1578662996442-48f60103fc96"]',
'["Houseboat cruise", "Backwater tours", "Spice plantations", "Ayurvedic spa", "Traditional cuisine"]',
'["7 nights accommodation", "Houseboat stay", "All meals", "Backwater cruise", "Spice tour"]',
'["International flights", "Personal expenses", "Travel insurance", "Spa treatments", "Tips"]', TRUE, 1),

('Kerala Hill Station Escape', 'Explore the misty hill stations of Kerala including Munnar, Thekkady, and Wayanad with tea plantations, wildlife, and cool climate.', 'Kerala', 999.99, 6, 20, 'Nature', 'moderate', 'kerala.avif',
'["kerala.avif", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944", "https://images.unsplash.com/photo-1578662996442-48f60103fc96"]',
'["Tea plantation tours", "Wildlife sanctuary", "Trekking", "Scenic viewpoints", "Local culture"]',
'["5 nights hotel stay", "Daily breakfast", "Tea plantation tour", "Wildlife safari", "Transport"]',
'["International flights", "Lunch and dinner", "Personal expenses", "Travel insurance", "Tips"]', TRUE, 1),

-- Goa Tours
('Goa Beach Paradise', 'Relax on pristine beaches, enjoy water sports, explore Portuguese heritage, and experience vibrant nightlife in tropical Goa.', 'Goa', 799.99, 5, 25, 'Beach', 'easy', 'goa.avif',
'["goa.avif", "https://images.unsplash.com/photo-1587643889062-70d265239c8a", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2"]',
'["Beach access", "Water sports", "Heritage tours", "Nightlife", "Seafood cuisine"]',
'["4 nights beach resort", "Daily breakfast", "Airport transfers", "Beach activities", "Heritage tour"]',
'["International flights", "Lunch and dinner", "Personal expenses", "Water sports", "Tips"]', TRUE, 1),

('Goa Adventure & Culture', 'Experience the best of Goa with adventure activities, cultural tours, spice plantations, and authentic Goan cuisine.', 'Goa', 1099.99, 7, 20, 'Adventure', 'moderate', 'goa.avif',
'["goa.avif", "https://images.unsplash.com/photo-1587643889062-70d265239c8a", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2"]',
'["Adventure sports", "Cultural tours", "Spice plantation", "Cooking class", "River cruise"]',
'["6 nights accommodation", "All meals", "Adventure activities", "Cultural tours", "Transfers"]',
'["International flights", "Personal expenses", "Travel insurance", "Extra activities", "Tips"]', TRUE, 1),

-- Himalayas Tours
('Himalayan Trekking Adventure', 'Embark on an incredible trekking journey through the majestic Himalayas with stunning mountain views and local culture.', 'Himalayas', 1899.99, 14, 12, 'Adventure', 'difficult', 'himalaya.avif',
'["himalaya.avif", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a"]',
'["Trekking", "Mountain views", "Local culture", "Camping", "Professional guides"]',
'["13 nights accommodation", "All meals", "Trekking permits", "Professional guide", "Camping equipment"]',
'["International flights", "Personal gear", "Travel insurance", "Emergency evacuation", "Tips"]', TRUE, 1),

('Himalayan Spiritual Journey', 'Discover the spiritual side of the Himalayas with visits to ancient monasteries, meditation sessions, and yoga retreats.', 'Himalayas', 1599.99, 10, 15, 'Spiritual', 'moderate', 'himalaya.avif',
'["himalaya.avif", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a"]',
'["Monastery visits", "Meditation", "Yoga sessions", "Spiritual guidance", "Mountain views"]',
'["9 nights accommodation", "Vegetarian meals", "Monastery visits", "Yoga sessions", "Spiritual guide"]',
'["International flights", "Personal expenses", "Travel insurance", "Donations", "Tips"]', TRUE, 1),

-- Varanasi Tours
('Varanasi Spiritual Experience', 'Experience the spiritual capital of India with Ganga Aarti, temple visits, boat rides, and cultural immersion in the holy city.', 'Varanasi', 699.99, 4, 20, 'Spiritual', 'easy', 'varanasi.avif',
'["varanasi.avif", "https://images.unsplash.com/photo-1561361513-2d000a50f0dc", "https://images.unsplash.com/photo-1570168007204-dfb528c6958f"]',
'["Ganga Aarti", "Temple visits", "Boat rides", "Cultural tours", "Local cuisine"]',
'["3 nights hotel stay", "Daily breakfast", "Ganga Aarti", "Boat ride", "Temple tours"]',
'["International flights", "Lunch and dinner", "Personal expenses", "Travel insurance", "Tips"]', TRUE, 1),

-- Taj Mahal Tours
('Taj Mahal & Agra Heritage', 'Visit the iconic Taj Mahal and explore the rich Mughal heritage of Agra including Agra Fort and Fatehpur Sikri.', 'Agra', 599.99, 3, 30, 'Cultural', 'easy', 'tajmahal.avif',
'["tajmahal.avif", "https://images.unsplash.com/photo-1564507592333-c60657eea523", "https://images.unsplash.com/photo-1570168007204-dfb528c6958f"]',
'["Taj Mahal visit", "Agra Fort", "Fatehpur Sikri", "Mughal architecture", "Photography"]',
'["2 nights hotel stay", "Daily breakfast", "Monument entry fees", "Professional guide", "Transfers"]',
'["International flights", "Lunch and dinner", "Personal expenses", "Travel insurance", "Tips"]', TRUE, 1);

-- Insert detailed itineraries for each tour
INSERT INTO itineraries (tour_id, title, description, is_default) VALUES
(1, 'Golden Triangle Classic - 7 Days', 'Complete 7-day itinerary covering Delhi, Agra, and Jaipur', TRUE),
(2, 'Rajasthan Royal Heritage - 12 Days', 'Comprehensive royal heritage tour of Rajasthan', TRUE),
(3, 'Desert Safari Adventure - 5 Days', 'Action-packed desert adventure in Rajasthan', TRUE),
(4, 'Kerala Backwaters Bliss - 8 Days', 'Relaxing backwaters and nature tour in Kerala', TRUE),
(5, 'Kerala Hill Station Escape - 6 Days', 'Hill station and tea plantation tour in Kerala', TRUE),
(6, 'Goa Beach Paradise - 5 Days', 'Beach relaxation and fun in Goa', TRUE),
(7, 'Goa Adventure & Culture - 7 Days', 'Adventure and cultural exploration in Goa', TRUE),
(8, 'Himalayan Trekking Adventure - 14 Days', 'Challenging trekking expedition in Himalayas', TRUE),
(9, 'Himalayan Spiritual Journey - 10 Days', 'Spiritual and wellness tour in Himalayas', TRUE),
(10, 'Varanasi Spiritual Experience - 4 Days', 'Deep spiritual experience in holy Varanasi', TRUE),
(11, 'Taj Mahal & Agra Heritage - 3 Days', 'Quick heritage tour of Agra and Taj Mahal', TRUE);

-- Insert detailed itinerary days
INSERT INTO itinerary_days (itinerary_id, day_number, title, description, activities, meals, accommodation) VALUES
-- Golden Triangle Classic (7 days)
(1, 1, 'Arrival in Delhi', 'Welcome to India! Arrive in Delhi and transfer to hotel. Rest and acclimatize.', '["Airport pickup", "Hotel check-in", "Welcome briefing", "Rest"]', '["Dinner"]', 'Delhi Hotel'),
(1, 2, 'Delhi Sightseeing', 'Full day exploring Old and New Delhi including Red Fort, Jama Masjid, India Gate, and President House.', '["Red Fort", "Jama Masjid", "Chandni Chowk", "India Gate", "Parliament House"]', '["Breakfast", "Lunch"]', 'Delhi Hotel'),
(1, 3, 'Delhi to Agra', 'Drive to Agra (4 hours). Visit Agra Fort in the afternoon.', '["Drive to Agra", "Agra Fort visit", "Local market visit"]', '["Breakfast", "Dinner"]', 'Agra Hotel'),
(1, 4, 'Taj Mahal & Agra', 'Early morning visit to Taj Mahal at sunrise. Afternoon visit to Fatehpur Sikri.', '["Taj Mahal sunrise", "Taj Mahal tour", "Fatehpur Sikri"]', '["Breakfast", "Lunch"]', 'Agra Hotel'),
(1, 5, 'Agra to Jaipur', 'Drive to Jaipur (5 hours) with a stop at Fatehpur Sikri. Evening at leisure.', '["Drive to Jaipur", "City tour", "Local markets"]', '["Breakfast", "Dinner"]', 'Jaipur Hotel'),
(1, 6, 'Jaipur Sightseeing', 'Full day exploring the Pink City including Amber Fort, City Palace, and Jantar Mantar.', '["Amber Fort", "City Palace", "Jantar Mantar", "Hawa Mahal"]', '["Breakfast", "Lunch"]', 'Jaipur Hotel'),
(1, 7, 'Jaipur to Delhi Departure', 'Drive back to Delhi. Transfer to airport for departure.', '["Drive to Delhi", "Shopping", "Airport transfer"]', '["Breakfast"]', 'Flight'),

-- Kerala Backwaters (8 days)
(4, 1, 'Arrival in Kochi', 'Welcome to Kerala! Arrive in Kochi and explore the port city.', '["Airport pickup", "Chinese fishing nets", "Spice market", "Fort Kochi walk"]', '["Dinner"]', 'Kochi Hotel'),
(4, 2, 'Kochi to Munnar', 'Drive to Munnar through scenic landscapes. Check into hill station resort.', '["Drive to Munnar", "Tea plantation visit", "Nature walk"]', '["Breakfast", "Dinner"]', 'Munnar Resort'),
(4, 3, 'Munnar Exploration', 'Full day exploring tea plantations, spice gardens, and scenic viewpoints.', '["Tea factory visit", "Spice garden", "Echo Point", "Mattupetty Dam"]', '["Breakfast", "Lunch"]', 'Munnar Resort'),
(4, 4, 'Munnar to Thekkady', 'Drive to Thekkady. Afternoon spice plantation tour and cultural show.', '["Drive to Thekkady", "Spice plantation", "Cultural show"]', '["Breakfast", "Dinner"]', 'Thekkady Hotel'),
(4, 5, 'Thekkady to Alleppey', 'Drive to Alleppey. Board traditional houseboat for backwater cruise.', '["Drive to Alleppey", "Houseboat boarding", "Backwater cruise"]', '["Breakfast", "Lunch", "Dinner"]', 'Houseboat'),
(4, 6, 'Backwater Cruise', 'Full day cruising through serene backwaters, visiting villages and paddy fields.', '["Village visits", "Paddy field walks", "Local fishing", "Sunset viewing"]', '["Breakfast", "Lunch", "Dinner"]', 'Houseboat'),
(4, 7, 'Alleppey to Kochi', 'Disembark houseboat. Drive to Kochi. Afternoon Kathakali dance show.', '["Houseboat disembark", "Drive to Kochi", "Kathakali show"]', '["Breakfast", "Dinner"]', 'Kochi Hotel'),
(4, 8, 'Departure from Kochi', 'Last minute shopping and transfer to airport for departure.', '["Shopping", "Souvenir buying", "Airport transfer"]', '["Breakfast"]', 'Flight'),

-- Himalayan Trekking (14 days)
(8, 1, 'Arrival in Delhi', 'Arrive in Delhi, meet team, equipment check, and briefing.', '["Airport pickup", "Team meeting", "Equipment check", "Briefing"]', '["Dinner"]', 'Delhi Hotel'),
(8, 2, 'Delhi to Rishikesh', 'Drive to Rishikesh, the Yoga capital. Evening Ganga Aarti.', '["Drive to Rishikesh", "City tour", "Ganga Aarti"]', '["Breakfast", "Dinner"]', 'Rishikesh Hotel'),
(8, 3, 'Rishikesh to Haridwar to Dehradun', 'Visit Haridwar for holy dip, then proceed to Dehradun base camp.', '["Haridwar visit", "Holy dip", "Drive to Dehradun"]', '["Breakfast", "Lunch"]', 'Dehradun Camp');

-- Insert sample bookings
INSERT INTO bookings (user_id, tour_id, booking_date, travel_date, number_of_travelers, total_amount, status, special_requirements, emergency_contact_name, emergency_contact_phone) VALUES
(2, 1, '2025-08-15', '2025-09-20', 2, 2599.98, 'confirmed', 'Vegetarian meals only', 'Jane Doe', '+1-555-0201'),
(3, 4, '2025-08-18', '2025-10-05', 4, 4799.96, 'confirmed', 'One wheelchair accessible room', 'Mary Wilson', '+1-555-0202'),
(4, 6, '2025-08-20', '2025-09-15', 2, 1599.98, 'pending', 'Celebrating anniversary', 'Tom Johnson', '+1-555-0203'),
(5, 8, '2025-08-22', '2025-11-10', 1, 1899.99, 'confirmed', 'Experienced trekker', 'Maria Garcia', '+1-555-0204'),
(6, 2, '2025-08-25', '2025-12-01', 2, 4999.98, 'pending', 'Luxury accommodation preferred', 'Mark Anderson', '+1-555-0205'),
(7, 10, '2025-08-28', '2025-09-25', 3, 2099.97, 'confirmed', 'Spiritual guidance required', 'Susan Taylor', '+1-555-0206'),
(8, 11, '2025-08-30', '2025-09-18', 2, 1199.98, 'confirmed', 'Photography enthusiast', 'James White', '+1-555-0207'),
(9, 3, '2025-09-01', '2025-10-15', 4, 3599.96, 'pending', 'Desert camping experience', 'Linda Martin', '+1-555-0208'),
(10, 5, '2025-09-03', '2025-10-20', 2, 1999.98, 'confirmed', 'Tea plantation tour priority', 'Kevin Lee', '+1-555-0209'),
(11, 7, '2025-09-05', '2025-11-05', 3, 3299.97, 'confirmed', 'Adventure activities focus', 'Nancy Kumar', '+1-555-0210');

-- Insert payments for bookings
INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id, payment_gateway_response) VALUES
(1, 2599.98, 'credit_card', 'completed', 'TXN001234567890', '{"status": "success", "gateway": "stripe", "card_last4": "4242"}'),
(2, 4799.96, 'debit_card', 'completed', 'TXN001234567891', '{"status": "success", "gateway": "stripe", "card_last4": "5555"}'),
(3, 1599.98, 'paypal', 'pending', 'TXN001234567892', '{"status": "pending", "gateway": "paypal"}'),
(4, 1899.99, 'credit_card', 'completed', 'TXN001234567893', '{"status": "success", "gateway": "stripe", "card_last4": "4111"}'),
(5, 4999.98, 'bank_transfer', 'pending', 'TXN001234567894', '{"status": "pending", "gateway": "bank"}'),
(6, 2099.97, 'credit_card', 'completed', 'TXN001234567895', '{"status": "success", "gateway": "stripe", "card_last4": "3782"}'),
(7, 1199.98, 'debit_card', 'completed', 'TXN001234567896', '{"status": "success", "gateway": "stripe", "card_last4": "6011"}'),
(8, 3599.96, 'paypal', 'pending', 'TXN001234567897', '{"status": "pending", "gateway": "paypal"}'),
(9, 1999.98, 'credit_card', 'completed', 'TXN001234567898', '{"status": "success", "gateway": "stripe", "card_last4": "4444"}'),
(10, 3299.97, 'credit_card', 'completed', 'TXN001234567899', '{"status": "success", "gateway": "stripe", "card_last4": "5454"}');

-- Insert customer reviews
INSERT INTO reviews (tour_id, user_id, rating, title, comment) VALUES
(1, 2, 5, 'Amazing Golden Triangle Experience!', 'Perfect introduction to India! The tour was well-organized, guides were knowledgeable, and the Taj Mahal at sunrise was breathtaking. Highly recommended for first-time visitors to India.'),
(4, 3, 5, 'Kerala Backwaters - Pure Magic', 'The houseboat experience was incredible! Floating through the backwaters, amazing food, and the most peaceful environment. The spice plantation tour was educational and fun.'),
(6, 4, 4, 'Great Goa Beach Holiday', 'Lovely beaches, great seafood, and wonderful weather. The heritage tour was interesting. Only minor issue was some crowded beaches, but overall a fantastic relaxing vacation.'),
(8, 5, 5, 'Challenging but Rewarding Trek', 'This was the adventure of a lifetime! The Himalayan views were spectacular, and our guide was excellent. Physically demanding but absolutely worth every step. Professional team and great equipment.'),
(10, 7, 5, 'Spiritual Journey in Varanasi', 'Deeply moving spiritual experience. The Ganga Aarti ceremony was mesmerizing, and our guide helped us understand the cultural significance. Life-changing experience.'),
(11, 8, 4, 'Quick but Comprehensive Agra Tour', 'Perfect for a quick heritage tour. Taj Mahal was as beautiful as expected, and Agra Fort was impressive. Good value for money for a short trip.'),
(2, 6, 5, 'Royal Treatment in Rajasthan', 'Felt like royalty throughout the trip! Heritage hotels were magnificent, camel safari was fun, and the cultural shows were entertaining. Expensive but worth every penny.'),
(5, 9, 4, 'Beautiful Hill Stations', 'Munnar and the tea plantations were gorgeous. Weather was perfect, and the resort was comfortable. Great escape from city heat. Would love to visit again.'),
(3, 10, 4, 'Authentic Desert Experience', 'Desert camping under the stars was magical! Camel safari was fun, folk music was authentic, and the food was delicious. Great adventure for families.'),
(7, 11, 5, 'Perfect Mix of Adventure and Culture', 'Best of both worlds! River rafting was thrilling, spice plantation tour was educational, and Portuguese architecture was beautiful. Excellent tour design.');

-- Insert activity logs for admin tracking
INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) VALUES
(1, 'CREATE', 'tours', 1, NULL, '{"title": "Golden Triangle Classic", "price": 1299.99}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'CREATE', 'tours', 2, NULL, '{"title": "Rajasthan Royal Heritage", "price": 2499.99}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'UPDATE', 'bookings', 1, '{"status": "pending"}', '{"status": "confirmed"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'CREATE', 'users', 12, NULL, '{"username": "rajesh_guide", "role": "guide"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'UPDATE', 'tours', 1, '{"price": 1299.99}', '{"price": 1199.99}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'CREATE', 'bookings', 1, NULL, '{"tour_id": 1, "travel_date": "2025-09-20"}', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'),
(3, 'CREATE', 'reviews', 1, NULL, '{"tour_id": 1, "rating": 5}', '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

-- Update settings with more comprehensive data
UPDATE settings SET setting_value = 'Incredible India Tours' WHERE setting_key = 'site_name';
UPDATE settings SET setting_value = 'info@incredibleindiatours.com' WHERE setting_key = 'site_email';

INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('company_address', '123 Tourism Plaza, New Delhi, India 110001', 'string', 'Company physical address'),
('company_phone', '+91-11-1234-5678', 'string', 'Primary contact phone'),
('social_facebook', 'https://facebook.com/incredibleindiatours', 'string', 'Facebook page URL'),
('social_instagram', 'https://instagram.com/incredibleindiatours', 'string', 'Instagram profile URL'),
('social_twitter', 'https://twitter.com/incredibleindia', 'string', 'Twitter profile URL'),
('booking_cancellation_hours', '48', 'number', 'Hours before travel for free cancellation'),
('featured_destinations', '["Rajasthan", "Kerala", "Goa", "Himalayas", "Varanasi"]', 'json', 'Featured destinations for homepage'),
('popular_tours', '[1, 4, 6, 8, 10]', 'json', 'Popular tour IDs for homepage'),
('company_tagline', 'Discover the Magic of India', 'string', 'Company tagline'),
('min_booking_amount', '50', 'number', 'Minimum advance booking amount'),
('gst_rate', '18', 'number', 'GST rate percentage'),
('service_charge_rate', '5', 'number', 'Service charge percentage');

-- Update pricing with current pricing
UPDATE tours SET price = 1199.99 WHERE id = 1;
UPDATE tours SET price = 2299.99 WHERE id = 2;
UPDATE tours SET price = 849.99 WHERE id = 3;
UPDATE tours SET price = 1149.99 WHERE id = 4;
UPDATE tours SET price = 949.99 WHERE id = 5;
UPDATE tours SET price = 749.99 WHERE id = 6;
UPDATE tours SET price = 1049.99 WHERE id = 7;
UPDATE tours SET price = 1799.99 WHERE id = 8;
UPDATE tours SET price = 1499.99 WHERE id = 9;
UPDATE tours SET price = 649.99 WHERE id = 10;
UPDATE tours SET price = 549.99 WHERE id = 11;

-- Final status message
SELECT 'Sample data inserted successfully! Your travel management system now has:' as Status;
SELECT COUNT(*) as Total_Users FROM users;
SELECT COUNT(*) as Total_Tours FROM tours;
SELECT COUNT(*) as Total_Bookings FROM bookings;
SELECT COUNT(*) as Total_Reviews FROM reviews;
SELECT COUNT(*) as Total_Payments FROM payments;
SELECT 'Database is now fully populated with comprehensive sample data!' as Final_Status;
