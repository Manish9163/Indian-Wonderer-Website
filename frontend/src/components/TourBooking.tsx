import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';

interface Tour {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  destination: string;
  duration_days: number;
  max_capacity: number;
  created_at: string;
}

interface BookingItem {
  item_id: number;
  quantity: number;
}

interface BookingData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: BookingItem[];
}

const TourBooking: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    items: []
  });

  useEffect(() => {
    fetchTours();
  }, [selectedCategory, searchTerm]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTours({
        category: selectedCategory || undefined,
        search: searchTerm || undefined
      });

      if (response.success) {
        // Ensure tours is always an array, even if undefined
        const toursData = response.data?.tours || [];
        setTours(toursData);
        
        // Extract categories from tours if not provided separately
        const categoriesData = response.data?.categories || 
          Array.from(new Set(toursData.map((tour: any) => tour.category).filter(Boolean)));
        setCategories(categoriesData);
      } else {
        setError(response.message || 'Failed to fetch tours');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch tours error:', err);
      // Ensure tours is set to empty array on error
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (tourId: number) => {
    setCart(prev => ({
      ...prev,
      [tourId]: (prev[tourId] || 0) + 1
    }));
  };

  const removeFromCart = (tourId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[tourId] > 1) {
        newCart[tourId]--;
      } else {
        delete newCart[tourId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [tourId, quantity]) => {
      const tour = tours.find(t => t.id === parseInt(tourId));
      return total + (tour ? tour.price * quantity : 0);
    }, 0);
  };

  const getCartItems = () => {
    return Object.entries(cart).map(([tourId, quantity]) => ({
      item_id: parseInt(tourId),
      quantity
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(cart).length === 0) {
      setError('Please add at least one tour to your cart');
      return;
    }

    // Get authenticated user data
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      setError('Please login to book a tour');
      return;
    }

    const userData = JSON.parse(userDataStr);
    if (!userData.id) {
      setError('User ID not found. Please login again.');
      return;
    }

    try {
      // Get first tour from cart (support single tour booking)
      const tourId = Object.keys(cart)[0];
      const quantity = cart[parseInt(tourId)];
      const tour = tours.find(t => t.id === parseInt(tourId));
      
      if (!tour) {
        setError('Selected tour not found');
        return;
      }

      // Calculate total amount
      const totalAmount = tour.price * quantity;
      
      // Calculate travel dates
      const travelDate = new Date();
      travelDate.setDate(travelDate.getDate() + 7); // Default to 1 week from now
      
      const endDate = new Date(travelDate);
      endDate.setDate(endDate.getDate() + (tour.duration_days || 3));

      // Create proper booking payload
      const bookingPayload = {
        user_id: userData.id,
        tour_id: parseInt(tourId),
        booking_date: new Date().toISOString().split('T')[0],
        travel_date: travelDate.toISOString().split('T')[0],
        start_date: travelDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        guests: quantity,
        number_of_travelers: quantity,
        total_amount: totalAmount,
        special_requirements: bookingData.customer_address || null,
        status: 'pending',
        payment_status: 'pending'
      };

      console.log('📤 Sending booking payload:', bookingPayload);

      const response = await apiService.createBooking(bookingPayload);

      if (response.success) {
        setSuccess(`Booking created successfully! Booking Reference: ${response.data.booking_reference || response.data.id}`);
        setCart({});
        setShowBookingForm(false);
        setBookingData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          items: []
        });
      } else {
        setError(response.message || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error('Booking error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Your Dream Tour</h1>
        <p className="text-lg text-gray-600">Discover amazing destinations with our curated tour packages</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Tours</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowBookingForm(true)}
              disabled={Object.keys(cart).length === 0}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Book Now ({Object.keys(cart).length} items)
            </button>
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      {Object.keys(cart).length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Cart</h3>
          <div className="space-y-1">
            {Object.entries(cart).map(([tourId, quantity]) => {
              const tour = tours.find(t => t.id === parseInt(tourId));
              return tour ? (
                <div key={tourId} className="flex justify-between items-center text-sm">
                  <span>{tour.title} x {quantity}</span>
                  <span className="font-medium">${(tour.price * quantity).toFixed(2)}</span>
                </div>
              ) : null;
            })}
            <div className="border-t pt-2 font-bold text-blue-900">
              Total: ${getCartTotal().toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Tours Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {(tours || []).map(tour => (
          <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{tour.title}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {tour.category}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {tour.description || 'No description available'}
              </p>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-green-600">${tour.price}</span>
                <span className="text-sm text-gray-500">
                  {tour.max_capacity} max capacity
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cart[tour.id] ? (
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => removeFromCart(tour.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded">{cart[tour.id]}</span>
                    <button
                      onClick={() => addToCart(tour.id)}
                      disabled={cart[tour.id] >= tour.max_capacity}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(tour.id)}
                    disabled={tour.max_capacity === 0}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {tour.max_capacity === 0 ? 'Fully Booked' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tours.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tours found matching your criteria.</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Complete Your Booking</h2>
              <button
                onClick={() => setShowBookingForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={bookingData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="customer_email"
                  value={bookingData.customer_email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={bookingData.customer_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="customer_address"
                  value={bookingData.customer_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Order Summary</h4>
                {Object.entries(cart).map(([tourId, quantity]) => {
                  const tour = tours.find(t => t.id === parseInt(tourId));
                  return tour ? (
                    <div key={tourId} className="flex justify-between text-sm">
                      <span>{tour.title} x {quantity}</span>
                      <span>${(tour.price * quantity).toFixed(2)}</span>
                    </div>
                  ) : null;
                })}
                <div className="border-t mt-2 pt-2 font-bold">
                  Total: ${getCartTotal().toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourBooking;
