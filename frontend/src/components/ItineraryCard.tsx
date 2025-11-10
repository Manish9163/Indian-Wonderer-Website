import React, { useState } from 'react'
import { Users, Calendar, Clock, ChevronDown, ChevronRight, CreditCard,Receipt,Download,  AlertCircle,CheckCircle,Clock4,XCircle, Edit, X as XIcon } from 'lucide-react';
import CancellationModal from './CancellationModal';
import EditBookingModal from './EditBookingModal';

interface Tour {
  id: string;
  title: string;
  location: string;
  image: string;
  duration: string;
  price: number;
  itinerary: {
    day: number;
    title: string;
    activities: string[];
  }[];
}

interface BookingData {
  travelers: number;
  date?: string;
  firstName: string;
  lastName: string;
  name?: string; 
  email: string;
  phone: string;
  requirements?: string;
}

interface PaymentData {
  paymentId: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  details: any;
}

interface RefundData {
  refund_id?: string;
  refund_amount?: number;
  refund_status?: string;
  refund_method?: string;
  refund_initiated_at?: string;
  giftcard_code?: string;
  giftcard_amount?: number;
  giftcard_balance?: number;
  giftcard_status?: string;
  giftcard_expiry?: string;
}

interface Itinerary {
  id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
  tour: Tour;
  bookingData: BookingData;
  paymentData?: PaymentData;
  refundData?: RefundData;
  selectedAgent?: {
    id: number;
    name: string;
    avatar: string;
    specialization: string[];
    languages: string[];
    experience: number;
    rating: number;
    reviews: number;
    location: string;
    phone: string;
    email: string;
    bio: string;
    price: number;
    availability: string[];
    badges: string[];
  } | null;
}

interface ItineraryCardProps {
  itinerary: Itinerary;
  darkMode: boolean;
  expandedItinerary: string | null;
  setExpandedItinerary: (id: string | null) => void;
  userDetails: any;
  onShowReceipt?: (itinerary: Itinerary) => void;
  showSuccess?: (title: string, message: string, duration?: number) => void;
  showError?: (title: string, message: string, duration?: number) => void;
  showWarning?: (title: string, message: string, duration?: number) => void;
  showInfo?: (title: string, message: string, duration?: number) => void;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ 
  itinerary, 
  darkMode, 
  expandedItinerary, 
  setExpandedItinerary,
  userDetails,
  onShowReceipt,
  showSuccess,
  showError,
  showWarning,
  showInfo
}) => {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!itinerary || !itinerary.tour) {
    return null;
  }

  const handleCancelBooking = async (refundType: 'refund' | 'giftcard', reason: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost/fu/backend/api/bookings.php?action=cancel&id=${itinerary.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          refund_type: refundType,
          cancellation_reason: reason
        })
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.log('Response not OK, status:', response.status);
        try {
          const errorData = JSON.parse(responseText);
          console.error('Error response:', errorData);
          
          if (response.status === 401 || errorData.message?.includes('Authorization')) {
            if (showWarning) {
              showWarning('Session Expired', 'Your session has expired. Please log out and log in again to continue.', 6000);
            } else {
              alert('Your session has expired. Please log out and log in again to continue.');
            }
          } else {
            if (showError) {
              showError('Cancellation Failed', errorData.message || 'Unknown error occurred', 5000);
            } else {
              alert('Failed to cancel booking: ' + (errorData.message || 'Unknown error'));
            }
          }
        } catch {
          console.error('Server returned HTML error:', responseText);
          if (showError) {
            showError('Server Error', 'The booking cancellation failed. Please check if the database tables exist and try again.', 5000);
          } else {
            alert('Server error: The booking cancellation failed. Please check if the database tables exist and try again.');
          }
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        
        if (responseText.includes('"success":true') || responseText.includes('Booking cancelled successfully')) {
          if (showSuccess) {
            showSuccess('Booking Cancelled Successfully! ✅', 'The page will reload to reflect the changes.', 3000);
          } else {
            alert('Booking cancelled successfully! The page will reload to reflect the changes.');
          }
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
        
        throw new Error('Invalid response format from server');
      }

      if (data.success) {
        const message = refundType === 'giftcard' 
          ? `Your gift card code: ${data.giftcard_code} | Value: ₹${(data.refund_amount || 0).toLocaleString()} | A confirmation email has been sent.` 
          : `Refund amount: ₹${(data.refund_amount || 0).toLocaleString()} | Processing time: 5-7 business days | Confirmation email sent.`;
        
        if (showSuccess) {
          showSuccess('Booking Cancelled Successfully! ✅', message, 8000);
        } else {
          alert('Booking cancelled successfully!\n\n' + message);
        }
        
        setShowCancellationModal(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        if (showError) {
          showError('Cancellation Failed', data.message || 'Unknown error occurred', 5000);
        } else {
          alert('Failed to cancel booking: ' + (data.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorDetails);
      
      if (showError) {
        showError('Error Cancelling Booking', errorDetails, 5000);
      } else {
        alert(`An error occurred while cancelling the booking.\n\nError: ${errorDetails}\n\nPlease check the console for more details.`);
      }
    }
  };

  const handleEditBooking = async (updatedData: {
    travelDate: string;
    numberOfTravelers: number;
    specialRequirements: string;
  }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost/fu/backend/api/bookings.php?action=edit&id=${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Booking updated successfully! Our team will confirm the changes within 24 hours.');
        setShowEditModal(false);
        window.location.reload(); 
      } else {
        alert('Failed to update booking: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('An error occurred while updating the booking. Please try again.');
    }
  };

  const handleShowReceipt = () => {
    if (onShowReceipt) {
      onShowReceipt(itinerary);
    } else {
      const receiptText = `
🏛️ INDIAN WONDERER - BOOKING RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tour: ${itinerary.tour?.title || 'N/A'}
Location: ${itinerary.tour?.location || 'N/A'}
Payment ID: ${itinerary.paymentData?.paymentId || 'N/A'}
Amount: ₹${itinerary.paymentData?.amount?.toLocaleString() || 'N/A'}
Status: CONFIRMED ✅

Booking Details:
• Travelers: ${itinerary.bookingData?.travelers || 'N/A'}
• Date: ${itinerary.bookingData?.date || 'TBD'}
• Duration: ${itinerary.tour?.duration || 'N/A'}

Contact: ${itinerary.bookingData?.name || 'N/A'}
Email: ${itinerary.bookingData?.email || 'N/A'}
Phone: ${itinerary.bookingData?.phone || 'N/A'}

Thank you for choosing Indian Wonderer! 🇮🇳
      `.trim();

      navigator.clipboard.writeText(receiptText).then(() => {
        alert('Receipt details copied to clipboard!');
      }).catch(() => {
        alert('Receipt details:\n\n' + receiptText);
      });
    }
  };

  interface DayItinerary {
    day: number;
    title: string;
    activities: string[];
  }
  
  const dayItineraryList: DayItinerary[] = itinerary.tour?.itinerary || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock4 className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock4 className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'IN PROGRESS';
      case 'confirmed':
        return 'CONFIRMED';
      case 'pending':
        return 'PENDING';
      case 'cancelled':
        return 'CANCELLED';
      case 'completed':
        return 'COMPLETED';
      default:
        return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'in_progress':
        return 'bg-blue-600 text-white animate-pulse';
      case 'completed':
        return 'bg-purple-600 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'upi':
        return 'UPI';
      case 'netbanking':
        return 'Net Banking';
      case 'wallet':
        return 'Digital Wallet';
      default:
        return method?.toUpperCase() || 'N/A';
    }
  };

  const getHoverEffect = (status: string) => {
    switch (status) {
      case 'confirmed':
        return `${darkMode ? 'hover:from-emerald-900/30 hover:to-teal-800/30 hover:border-emerald-500' : 'hover:bg-gradient-to-br hover:from-emerald-100 hover:to-teal-200 hover:border-emerald-400'}`;
      case 'pending':
        return `${darkMode ? 'hover:border-orange-500 hover:to-pink-800/30 hover:from-orange-900/30' : 'hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-100  hover:to-pink-200 '}`;
      case 'cancelled':
        return `${darkMode ? 'hover:border-rose-500 hover:from-rose-900/30 hover:to-purple-800/30' : 'hover:bg-gradient-to-br hover:from-rose-100 hover:to-purple-200 hover:border-rose-400'}`;
      default:
        return `${darkMode ? 'hover:from-cyan-900/30 hover:to-blue-800/30 hover:border-cyan-500' : 'hover:bg-gradient-to-br hover:from-cyan-100 hover:to-blue-200 hover:border-cyan-400'}`;
    }
  };

  return (
    <>
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border-2 border-transparent ${getHoverEffect(itinerary.status)} ${itinerary.status === 'cancelled' ? 'opacity-75' : ''}`}>
        <div className="relative">
          <img 
            src={itinerary.tour?.image || '/goa.avif'} 
            alt={itinerary.tour?.title || 'Tour image'} 
            className={`w-full h-32 object-cover ${itinerary.status === 'cancelled' ? 'grayscale' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/goa.avif';
            }}
          />
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(itinerary.status)}`}>
              {getStatusIcon(itinerary.status)}
              <span>{getStatusText(itinerary.status)}</span>
            </span>
          </div>
          {itinerary.paymentData && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white flex items-center space-x-1">
                <CreditCard className="w-3 h-3" />
                <span>PAID</span>
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{itinerary.tour?.title || 'Untitled Tour'}</h3>
              <p className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} text-sm mb-1`}>{itinerary.tour?.location || 'Location not specified'}</p>
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{new Date(itinerary.bookedAt).toLocaleDateString()}</span>
                </span>
                {itinerary.paymentData && (
                  <span className={`flex items-center space-x-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    <CreditCard className="w-3 h-3" />
                    <span>Paid</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpandedItinerary(expandedItinerary === itinerary.id ? null : itinerary.id)}
              className={`p-1.5 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              {expandedItinerary === itinerary.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
            <div className="flex items-center space-x-1">
              <Users size={14} className="text-gray-500" />
              <span>{itinerary.bookingData?.travelers || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={14} className="text-gray-500" />
              <span>{itinerary.bookingData?.date ? new Date(itinerary.bookingData.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'}) : 'TBD'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} className="text-gray-500" />
              <span>{itinerary.tour?.duration || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-base font-bold text-green-600">
                ₹{(itinerary.paymentData?.amount || ((itinerary.tour?.price || 0) * (itinerary.bookingData?.travelers || 1))).toLocaleString()}
              </span>
            </div>
          </div>

          {(itinerary as any).guide_info ? (
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-green-50'}`}>
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <Users className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Assigned Guide</span>
              </h4>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  {(itinerary as any).guide_info.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-semibold">{(itinerary as any).guide_info.name}</h5>
                    {(itinerary as any).guide_info.rating && (
                      <div className="flex items-center space-x-1 text-sm text-yellow-500">
                        <span>⭐</span>
                        <span>{(itinerary as any).guide_info.rating}</span>
                      </div>
                    )}
                  </div>
                  {(itinerary as any).guide_info.specialization && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Specialization: {(itinerary as any).guide_info.specialization}
                    </p>
                  )}
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    📧 {(itinerary as any).guide_info.email} • 📞 {(itinerary as any).guide_info.phone}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Status: {(itinerary as any).guide_info.assignment_status || 'assigned'} 
                    {(itinerary as any).guide_info.assignment_date && ` on ${new Date((itinerary as any).guide_info.assignment_date).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-yellow-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                🔄 Guide assignment pending - will be assigned soon
              </p>
            </div>
          )}

          {itinerary.status === 'cancelled' && itinerary.refundData && (
            <div className={`p-4 rounded-xl mb-4 border-2 ${
              itinerary.refundData.refund_status === 'pending' 
                ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-600' 
                : itinerary.refundData.giftcard_code
                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-600'
                : 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`w-6 h-6 flex-shrink-0 ${
                  itinerary.refundData.refund_status === 'pending' 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-green-600 dark:text-green-400'
                }`} />
                <div className="flex-1">
                  {itinerary.refundData.giftcard_code ? (
                    <>
                      <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">
                        🎁 Gift Card Issued
                      </h4>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your gift card has been issued and is ready to use!
                      </p>
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-2 border-dashed border-green-400`}>
                        <p className="text-xs text-gray-500 mb-1">Gift Card Code:</p>
                        <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                          {itinerary.refundData.giftcard_code}
                        </p>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Amount: <strong className="text-green-600">₹{itinerary.refundData.giftcard_amount?.toLocaleString()}</strong>
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Balance: <strong className="text-green-600">₹{itinerary.refundData.giftcard_balance?.toLocaleString()}</strong>
                          </span>
                        </div>
                        {itinerary.refundData.giftcard_expiry && (
                          <p className="text-xs text-gray-500 mt-2">
                            Valid until: {new Date(itinerary.refundData.giftcard_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </>
                  ) : itinerary.refundData.refund_status === 'completed' ? (
                    <>
                      <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">
                        ✅ Refund Completed
                      </h4>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your refund of <strong className="text-green-700 dark:text-green-300">
                          ₹{itinerary.refundData.refund_amount?.toLocaleString()}
                        </strong> has been processed successfully!
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Initiated: {itinerary.refundData.refund_initiated_at 
                          ? new Date(itinerary.refundData.refund_initiated_at).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                      <p className={`text-xs mt-1 font-medium text-green-600 dark:text-green-400`}>
                        The amount has been credited to your original payment method.
                        Please allow 5-7 business days for it to reflect in your account.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                        💰 Refund Pending
                      </h4>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your refund of <strong className="text-yellow-700 dark:text-yellow-300">
                          ₹{itinerary.refundData.refund_amount?.toLocaleString()}
                        </strong> is being processed via {itinerary.refundData.refund_method || 'bank transfer'}.
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Initiated on: {itinerary.refundData.refund_initiated_at 
                          ? new Date(itinerary.refundData.refund_initiated_at).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your refund will be processed by our team shortly.
                        Refunds typically take 5-7 business days to reflect in your account.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span>Traveler Information</span>
            </h4>
            
            {(itinerary as any).bookingData?.traveler_details ? (
              <>
                {(itinerary as any).bookingData.traveler_details.primary_traveler && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2 text-green-600 dark:text-green-400">Primary Traveler</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Name:</strong> {(itinerary as any).bookingData.traveler_details.primary_traveler.name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Age:</strong> {(itinerary as any).bookingData.traveler_details.primary_traveler.age} years
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Email:</strong> {(itinerary as any).bookingData.traveler_details.primary_traveler.email}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Phone:</strong> {(itinerary as any).bookingData.traveler_details.primary_traveler.phone}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>ID:</strong> {(itinerary as any).bookingData.traveler_details.primary_traveler.id_type?.toUpperCase()} - {(itinerary as any).bookingData.traveler_details.primary_traveler.id_number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {(itinerary as any).bookingData.traveler_details.additional_travelers && 
                 (itinerary as any).bookingData.traveler_details.additional_travelers.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2 text-purple-600 dark:text-purple-400">Additional Travelers</h5>
                    {(itinerary as any).bookingData.traveler_details.additional_travelers.map((traveler: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg mb-2 ${darkMode ? 'bg-gray-600/30' : 'bg-white/70'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>{traveler.name}</strong> - {traveler.age} years ({traveler.relation})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {(itinerary as any).bookingData.traveler_details.emergency_contact && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2 text-red-600 dark:text-red-400">Emergency Contact</h5>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Name:</strong> {(itinerary as any).bookingData.traveler_details.emergency_contact.name} ({(itinerary as any).bookingData.traveler_details.emergency_contact.relation})
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Phone:</strong> {(itinerary as any).bookingData.traveler_details.emergency_contact.phone}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Primary Guest:</strong> {(itinerary as any).bookingData.customer_name}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Email:</strong> {(itinerary as any).bookingData.customer_email}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-300 dark:border-gray-600 mt-4">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Total Travelers:</strong> {(itinerary as any).bookingData.number_of_travelers} person(s)
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Booking Reference:</strong> {(itinerary as any).bookingData.booking_reference}
                </p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Travel Date:</strong> {new Date((itinerary as any).bookingData.travel_date).toLocaleDateString()}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Booking Date:</strong> {new Date((itinerary as any).bookingData.booking_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {(itinerary as any).bookingData.special_requirements && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Special Requirements:</strong> {(itinerary as any).bookingData.special_requirements}
                </p>
              </div>
            )}
          </div>

          {itinerary.selectedAgent ? (
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Your Travel Guide</span>
              </h4>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {itinerary.selectedAgent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-semibold">{itinerary.selectedAgent.name}</h5>
                    <div className="flex items-center space-x-1 text-sm text-yellow-500">
                      <span>⭐</span>
                      <span>{itinerary.selectedAgent.rating}</span>
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ({itinerary.selectedAgent.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {itinerary.selectedAgent.specialization.slice(0, 2).join(', ')} • {itinerary.selectedAgent.experience} years exp.
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    📧 {itinerary.selectedAgent.email} • 📞 {itinerary.selectedAgent.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    ₹{(itinerary.selectedAgent.price || 0).toLocaleString()}/day
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                No travel guide selected for this trip
              </p>
            </div>
          )}

          {itinerary.paymentData && (
            <div className={`mb-4 p-3 rounded-lg ${
              darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Paid via {getPaymentMethodDisplay(itinerary.paymentData.method)}
                  </span>
                </div>
                <button
                  onClick={handleShowReceipt}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          )}

          {expandedItinerary === itinerary.id && (
            <div className="border-t dark:border-gray-700 pt-4 space-y-6">
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Day-by-day Itinerary</span>
                </h4>
                <div className="space-y-4">
                  {dayItineraryList.map((day: DayItinerary, index: number) => (
                    <div key={`day-${day.day || index}`} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h5 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        Day {day.day}: {day.title}
                      </h5>
                      <ul className={`list-disc list-inside text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {day.activities.map((activity: string, actIndex: number) => (
                          <li key={`day-${day.day}-activity-${actIndex}`} className={` ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Booking Details</span>
                </h4>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Primary Contact:</span>
                      <span className="ml-2 font-medium">{itinerary.bookingData?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Email:</span>
                      <span className="ml-2 font-medium">{itinerary.bookingData?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Phone:</span>
                      <span className="ml-2 font-medium">{itinerary.bookingData?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Travelers:</span>
                      <span className="ml-2 font-medium">{itinerary.bookingData?.travelers || 0} person(s)</span>
                    </div>
                    {itinerary.bookingData?.requirements && (
                      <div className="col-span-2">
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Special Requirements:</span>
                        <p className="ml-2 mt-1 font-medium">{itinerary.bookingData.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {itinerary.paymentData && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Payment Information</span>
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} dark:text-gray-400`}>Payment Method:</span>
                        <span className="ml-2 font-medium">{getPaymentMethodDisplay(itinerary.paymentData?.method || '')}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Transaction ID:</span>
                        <span className={`ml-2 font-mono text-xs ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded`}>
                          {itinerary.paymentData?.paymentId || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} dark:text-gray-400`}>Amount Paid:</span>
                        <span className="ml-2 font-bold text-green-600">₹{itinerary.paymentData?.amount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} dark:text-gray-400`}>Payment Date:</span>
                        <span className="ml-2 font-medium">
                          {itinerary.paymentData?.timestamp ? new Date(itinerary.paymentData.timestamp).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} dark:text-gray-400`}>Status:</span>
                        <span className="ml-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            SUCCESS
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Currency:</span>
                        <span className="ml-2 font-medium">{itinerary.paymentData?.currency || 'INR'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                      <button
                        onClick={handleShowReceipt}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>View Payment Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {itinerary.status === 'cancelled' ? (
              <>
                <button 
                  onClick={() => setExpandedItinerary(expandedItinerary === itinerary.id ? null : itinerary.id)}
                  className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  {expandedItinerary === itinerary.id ? 'Less' : 'View Details'}
                </button>
                {itinerary.paymentData && (
                  <button
                    onClick={handleShowReceipt}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1"
                    title="View Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>
                )}
                <div className="px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-semibold flex items-center space-x-1">
                  <XIcon className="w-3.5 h-3.5" />
                  <span>Cancelled</span>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setExpandedItinerary(expandedItinerary === itinerary.id ? null : itinerary.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  {expandedItinerary === itinerary.id ? 'Less' : 'Details'}
                </button>
                {itinerary.status === 'confirmed' && (
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className={`flex-1 border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1`}
                    title="Modify Booking"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                <button 
                  onClick={() => setShowCancellationModal(true)}
                  className={`px-3 py-2 border ${darkMode ? 'border-red-600 hover:bg-red-900/20' : 'border-red-300 hover:bg-red-50'} text-red-600 rounded-lg text-sm transition-colors flex items-center space-x-1`}
                  title="Cancel Booking"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                {itinerary.paymentData && (
                  <button
                    onClick={handleShowReceipt}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                    title="View Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showCancellationModal && (
        <CancellationModal
          darkMode={darkMode}
          onClose={() => setShowCancellationModal(false)}
          onConfirm={handleCancelBooking}
          bookingAmount={itinerary.paymentData?.amount || (itinerary.tour?.price || 0) * (itinerary.bookingData?.travelers || 1)}
          bookingReference={(itinerary as any).bookingData?.booking_reference || itinerary.id}
        />
      )}

      {showEditModal && (
        <EditBookingModal
          darkMode={darkMode}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditBooking}
          currentData={{
            travelDate: (itinerary as any).bookingData?.travel_date || itinerary.bookingData?.date || '',
            numberOfTravelers: (itinerary as any).bookingData?.number_of_travelers || itinerary.bookingData?.travelers || 1,
            specialRequirements: (itinerary as any).bookingData?.special_requirements || itinerary.bookingData?.requirements || ''
          }}
          bookingReference={(itinerary as any).bookingData?.booking_reference || itinerary.id}
        />
      )}
    </>
  );
};

export default ItineraryCard
