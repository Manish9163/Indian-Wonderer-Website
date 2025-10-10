'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import LocationSharing from '../components/LocationSharing';

interface Guide {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  specialization: string;
}

interface Stats {
  active_bookings: number;
  completed_tours: number;
  total_earnings: number;
}

interface Booking {
  booking_id: number;
  booking_reference: string;
  travel_date: string;
  number_of_travelers: number;
  total_amount: number;
  booking_status: string;
  tour_name: string;
  destination: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  assignment_status: string;
  earning_amount: number;
  tour_started?: boolean;
  tour_start_time?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'completed'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [tourStatuses, setTourStatuses] = useState<{[key: number]: {started: boolean, startTime: string}}>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'success' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    // Check if logged in
    const guideData = localStorage.getItem('guide');
    const statsData = localStorage.getItem('guideStats');

    if (!guideData) {
      router.push('/');
      return;
    }

    const parsedGuide = JSON.parse(guideData);
    const parsedStats = statsData ? JSON.parse(statsData) : null;

    setGuide(parsedGuide);
    setStats(parsedStats);

    // Load tour statuses from localStorage
    const savedStatuses = localStorage.getItem('tourStatuses');
    if (savedStatuses) {
      setTourStatuses(JSON.parse(savedStatuses));
    }

    // Fetch bookings
    fetchBookings(parsedGuide.id);
  }, [router]);

  const fetchBookings = async (guideId: number) => {
    try {
      console.log('Fetching bookings for guide ID:', guideId);
      const response = await fetch(`http://localhost/fu/backend/api/guide_bookings.php?guide_id=${guideId}`);
      console.log('Bookings response status:', response.status);
      const data = await response.json();
      console.log('Bookings data:', data);

      if (data.success) {
        setBookings(data.bookings || []);
        console.log('Bookings loaded:', data.bookings?.length || 0);
      } else {
        console.error('Failed to fetch bookings:', data.message);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('guide');
    localStorage.removeItem('guideStats');
    router.push('/');
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleStartTour = async (booking: Booking) => {
    const isStarted = tourStatuses[booking.booking_id]?.started;
    
    if (isStarted) {
      // End/Complete Tour
      setConfirmModal({
        isOpen: true,
        title: 'Complete Tour?',
        message: `Complete tour for ${booking.customer_name}?\n\nTour: ${booking.tour_name}\n\nThis will mark the tour as completed and process your payment.`,
        type: 'success',
        onConfirm: () => {
          // Remove from active tours
          const newStatuses = {...tourStatuses};
          delete newStatuses[booking.booking_id];
          setTourStatuses(newStatuses);
          localStorage.setItem('tourStatuses', JSON.stringify(newStatuses));
          
          setConfirmModal({...confirmModal, isOpen: false});
          setToast({
            message: '✅ Tour completed successfully!\n\n💰 Your earnings will be processed within 24 hours.\n📧 Customer will receive a feedback request.',
            type: 'success'
          });
          
          // Refresh bookings
          if (guide) {
            setTimeout(() => fetchBookings(guide.id), 500);
          }
        }
      });
    } else {
      // Start Tour
      setConfirmModal({
        isOpen: true,
        title: 'Start Tour?',
        message: `Start tour for ${booking.customer_name}?\n\nTour: ${booking.tour_name}\nDestination: ${booking.destination}\nTravelers: ${booking.number_of_travelers}\n\nReady to begin?`,
        type: 'info',
        onConfirm: () => {
          const startTime = new Date().toISOString();
          const newStatuses = {
            ...tourStatuses,
            [booking.booking_id]: {
              started: true,
              startTime: startTime
            }
          };
          setTourStatuses(newStatuses);
          localStorage.setItem('tourStatuses', JSON.stringify(newStatuses));
          
          setConfirmModal({...confirmModal, isOpen: false});
          setToast({
            message: '🚀 Tour started successfully!\n\n✓ Status updated to "In Progress"\n✓ Customer has been notified\n✓ GPS tracking enabled',
            type: 'success'
          });
        }
      });
    }
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'assigned') return booking.assignment_status === 'assigned';
    if (filter === 'completed') return booking.assignment_status === 'completed';
    return true;
  });

  // Calculate today's earnings from bookings with today's travel date
  const todayEarnings = bookings
    .filter(b => {
      const travelDate = new Date(b.travel_date).toDateString();
      const today = new Date().toDateString();
      return travelDate === today;
    })
    .reduce((sum, b) => sum + parseFloat(b.earning_amount?.toString() || '0'), 0);

  // Calculate total pending earnings from assigned bookings (30% commission)
  const totalPendingEarnings = bookings
    .filter(b => b.assignment_status === 'assigned')
    .reduce((sum, b) => {
      const bookingAmount = parseFloat(b.total_amount?.toString() || '0');
      const commission = bookingAmount * 0.30; // 30% commission
      return sum + commission;
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{guide?.name}</h1>
            <p className="text-gray-600">{guide?.specialization}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              guide?.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {guide?.status}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-3xl font-bold mb-2">₹{totalPendingEarnings.toFixed(2)}</div>
          <div className="text-sm opacity-90">Pending Earnings</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold mb-2">₹{parseFloat(stats?.total_earnings?.toString() || '0').toFixed(2)}</div>
          <div className="text-sm opacity-90">Total Paid</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold mb-2">{stats?.active_bookings || 0}</div>
          <div className="text-sm opacity-90">Active Tours</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold mb-2">{stats?.completed_tours || 0}</div>
          <div className="text-sm opacity-90">Completed Tours</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'assigned' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Assigned ({bookings.filter(b => b.assignment_status === 'assigned').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'completed' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Completed ({bookings.filter(b => b.assignment_status === 'completed').length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isTourStarted = tourStatuses[booking.booking_id]?.started || false;
            const bookingAmount = parseFloat(booking.total_amount?.toString() || '0');
            const commission = bookingAmount * 0.30; // 30% commission
            
            return (
              <div key={booking.booking_id} className="card hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{booking.tour_name}</h3>
                        <p className="text-purple-600 font-medium">{booking.destination}</p>
                      </div>
                      <div className="flex gap-2">
                        {isTourStarted && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 animate-pulse">
                            🚀 In Progress
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.assignment_status === 'assigned' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {booking.assignment_status}
                        </span>
                      </div>
                    </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{booking.customer_email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm">{booking.customer_phone}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{new Date(booking.travel_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm">{booking.number_of_travelers} travelers</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-mono">{booking.booking_reference}</span>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{commission.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Your Commission (30%)</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewDetails(booking)}
                          className="btn-secondary text-sm"
                        >
                          View Details
                        </button>
                        {booking.assignment_status === 'assigned' && (
                          <button 
                            onClick={() => handleStartTour(booking)}
                            className={`text-sm px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-xl ${
                              isTourStarted 
                                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            }`}
                          >
                            {isTourStarted ? '✓ Complete Tour' : '🚀 Start Tour'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Location Sharing - Shows when tour is started */}
                    {isTourStarted && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <LocationSharing
                          bookingId={booking.booking_id}
                          guideId={guide!.id}
                          tourName={booking.tour_name}
                          isActive={true}
                          onLocationUpdate={(location) => {
                            console.log('📍 Location updated:', location);
                          }}
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Tour Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Tour Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Name:</span>
                    <span className="font-medium">{selectedBooking.tour_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination:</span>
                    <span className="font-medium">{selectedBooking.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Reference:</span>
                    <span className="font-mono text-sm">{selectedBooking.booking_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Travel Date:</span>
                    <span className="font-medium">{new Date(selectedBooking.travel_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Travelers:</span>
                    <span className="font-medium">{selectedBooking.number_of_travelers} people</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Customer Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedBooking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${selectedBooking.customer_email}`} className="text-purple-600 hover:underline">
                      {selectedBooking.customer_email}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <a href={`tel:${selectedBooking.customer_phone}`} className="text-purple-600 hover:underline">
                      {selectedBooking.customer_phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Payment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Booking Amount:</span>
                    <span className="font-medium">₹{parseFloat(selectedBooking.total_amount?.toString() || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Commission (30%):</span>
                    <span className="font-bold text-green-600 text-xl">₹{(parseFloat(selectedBooking.total_amount?.toString() || '0') * 0.30).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Status:</span>
                    <div className="flex gap-2">
                      {tourStatuses[selectedBooking.booking_id]?.started && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                          🚀 In Progress
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.assignment_status === 'assigned' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedBooking.assignment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <a
                  href={`tel:${selectedBooking.customer_phone}`}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all text-center"
                >
                  📞 Call Customer
                </a>
                <a
                  href={`mailto:${selectedBooking.customer_email}`}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all text-center"
                >
                  ✉️ Email Customer
                </a>
              </div>

              {selectedBooking.assignment_status === 'assigned' && (
                <button
                  onClick={() => {
                    closeModal();
                    handleStartTour(selectedBooking);
                  }}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-xl ${
                    tourStatuses[selectedBooking.booking_id]?.started
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {tourStatuses[selectedBooking.booking_id]?.started ? '✓ Complete Tour Now' : '🚀 Start Tour Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.type === 'success' ? 'Complete Tour' : 'Start Tour'}
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({...confirmModal, isOpen: false})}
      />
    </div>
  );
}
