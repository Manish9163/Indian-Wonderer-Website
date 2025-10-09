import React from 'react';
import { X, Download, Share2, CheckCircle, Calendar, MapPin, Users, CreditCard, Mail, Phone, Clock, IndianRupee, AlertCircle } from 'lucide-react';

const DESTINATION_PLAYLISTS: Record<string, {spotify: string; youtube: string}> = {
  goa: { spotify: "Goa Party Travel Songs", youtube: "Goa Party Songs Playlist" },
  shimla: { spotify: "LoFi Chill Roadtrip", youtube: "Shimla LoFi Chill Songs" },
  rajasthan: { spotify: "Rajasthani Folk Songs", youtube: "Rajasthani Folk Songs Playlist" },
  ladakh: { spotify: "Himalayan Roadtrip Songs", youtube: "Ladakh Roadtrip Songs" },
  kerala: { spotify: "Kerala Travel Vibes", youtube: "Kerala Travel Songs" },
  tajmahal: { spotify: "Romantic Love Travel Songs", youtube: "Taj Mahal Romantic Songs" },
  kolkata: { spotify: "Bengali Travel Songs", youtube: "Kolkata Bengali Songs" },
  varanasi: { spotify: "Indian Classical Devotional", youtube: "Varanasi Ganga Aarti Songs" },
  mumbai: { spotify: "Bollywood Travel Hits", youtube: "Mumbai Bollywood Songs" },
};

interface PaymentReceiptProps {
  darkMode: boolean;
  onClose: () => void;
  itinerary: any;
  userDetails: any;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ 
  darkMode, 
  onClose, 
  itinerary,
  userDetails
}) => {
  // Safety checks to prevent undefined errors
  if (!itinerary) {
    return null;
  }

  // Function to map tour data to valid playlist destination
  const getPlaylistDestination = (tour: any) => {
    const DESTINATION_MAP: Record<string, string> = {
      'goa': 'goa',
      'shimla': 'shimla',
      'rajasthan': 'rajasthan',
      'jaipur': 'rajasthan',
      'jodhpur': 'rajasthan',
      'udaipur': 'rajasthan',
      'ladakh': 'ladakh',
      'kerala': 'kerala',
      'kochi': 'kerala',
      'munnar': 'kerala',
      'taj mahal': 'tajmahal',
      'agra': 'tajmahal',
      'kolkata': 'kolkata',
      'varanasi': 'varanasi',
      'mumbai': 'mumbai',
      'delhi': 'mumbai',
      'manali': 'shimla',
      'darjeeling': 'shimla',
    };

    const searchText = (tour?.destination || tour?.location || tour?.title || '').toLowerCase();
    
    for (const [key, value] of Object.entries(DESTINATION_MAP)) {
      if (searchText.includes(key)) {
        return value;
      }
    }
    
    return 'goa'; // Default fallback
  };

  const tour = itinerary.tour || {};
  const bookingData = itinerary.bookingData || {};
  const paymentData = itinerary.paymentData || {};

  const totalAmount = (tour.price || 0) * (bookingData.travelers || 1);
  const taxes = Math.round(totalAmount * 0.18);

  const generateReceiptHTML = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Indian Wonderer - Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
    .receipt-id { color: #059669; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #374151; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total { font-weight: bold; font-size: 18px; color: #059669; border-top: 1px solid #e5e5e5; padding-top: 10px; }
    .status { color: #059669; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏛️ INDIAN WONDERER</div>
    <p>Your Gateway to Incredible India</p>
    <p class="receipt-id">Receipt #${paymentData.paymentId || 'N/A'}</p>
  </div>
  
  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="row"><span>Tour:</span> <span>${tour.title || 'N/A'}</span></div>
    <div class="row"><span>Location:</span> <span>${tour.location || 'N/A'}</span></div>
    <div class="row"><span>Duration:</span> <span>${tour.duration || 'N/A'}</span></div>
    <div class="row"><span>Booking Date:</span> <span>${itinerary.bookedAt || 'N/A'}</span></div>
    <div class="row"><span>Travel Date:</span> <span>${bookingData.date || 'TBD'}</span></div>
    <div class="row"><span>Status:</span> <span class="status">${(itinerary.status || 'N/A').toUpperCase()}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Traveler Details</div>
    <div class="row"><span>Name:</span> <span>${(bookingData.firstName && bookingData.lastName) ? `${bookingData.firstName} ${bookingData.lastName}` : bookingData.name || 'N/A'}</span></div>
    <div class="row"><span>Email:</span> <span>${bookingData.email || 'N/A'}</span></div>
    <div class="row"><span>Phone:</span> <span>${bookingData.phone || 'N/A'}</span></div>
    <div class="row"><span>Number of Travelers:</span> <span>${bookingData.travelers || 'N/A'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span>Payment Method:</span> <span>${(paymentData.method || 'N/A').toUpperCase()}</span></div>
    <div class="row"><span>Payment ID:</span> <span>${paymentData.paymentId || 'N/A'}</span></div>
    <div class="row"><span>Transaction Date:</span> <span>${paymentData.timestamp ? new Date(paymentData.timestamp).toLocaleDateString() : 'N/A'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Amount Breakdown</div>
    <div class="row"><span>Tour Cost (${bookingData.travelers || 1} travelers):</span> <span>₹${totalAmount.toLocaleString()}</span></div>
    <div class="row"><span>Taxes & Fees:</span> <span>₹${taxes.toLocaleString()}</span></div>
    <div class="row total"><span>Total Paid:</span> <span>₹${(paymentData.amount || (totalAmount + taxes)).toLocaleString()}</span></div>
  </div>
  
  <div class="footer">
    <p>Thank you for choosing Indian Wonderer!</p>
    <p>For support, contact us at: support@indianwonderer.com | +91 98765 43210</p>
    <p>© 2025 Indian Wonderer. All rights reserved.</p>
  </div>
</body>
</html>`;
  };

  const handleDownloadReceipt = () => {
    const receiptContent = generateReceiptHTML();
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Indian_Wonderer_Receipt_${paymentData.paymentId || 'RECEIPT'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Indian Wonderer - Booking Receipt',
          text: `Tour booking confirmed! ${tour.title || 'Tour'} - Payment ID: ${paymentData.paymentId || 'N/A'}`,
          url: window.location.href
        });
      } catch (error) {
      }
    } else {
      const receiptText = `🏛️ INDIAN WONDERER - BOOKING RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tour: ${tour.title || 'N/A'}
Location: ${tour.location || 'N/A'}
Payment ID: ${paymentData.paymentId || 'N/A'}
Amount: ₹${paymentData.amount?.toLocaleString() || 'N/A'}
Status: CONFIRMED ✅

Booking Details:
• Travelers: ${bookingData.travelers || 'N/A'}
• Date: ${bookingData.date || 'TBD'}
• Duration: ${tour.duration || 'N/A'}

Thank you for choosing Indian Wonderer! 🇮🇳`;

      navigator.clipboard.writeText(receiptText).then(() => {
        alert('Receipt copied to clipboard!');
      }).catch(() => {
        alert('Receipt details:\n\n' + receiptText);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-inherit p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold flex items-center space-x-2">
                <CheckCircle className="text-green-600" />
                <span>Payment Receipt</span>
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Booking confirmed successfully
              </p>
            </div>
            <button title='close'
              onClick={onClose} 
              className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          
          {/* Receipt Header */}
          <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <img src="./WhatsApp.jpg" alt="Indian Wonderer" className="h-16 w-16 rounded-2xl" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-900 via-gray-200 to-green-600 bg-clip-text text-transparent mb-2">
              INDIAN WONDERER
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
              Your Gateway to Incredible India
            </p>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'
            }`}>
              <span className="font-mono text-sm">
                Receipt #{paymentData.paymentId || 'N/A'}
              </span>
            </div>
          </div>

          {/* Refund Status Banner */}
          {itinerary.status === 'cancelled' && (itinerary as any).refundData && (
            <div className={`p-4 rounded-xl border-2 ${
              (itinerary as any).refundData.refund_status === 'pending' 
                ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-600' 
                : (itinerary as any).refundData.giftcard_code
                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-600'
                : 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`w-6 h-6 flex-shrink-0 ${
                  (itinerary as any).refundData.refund_status === 'pending' 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-green-600 dark:text-green-400'
                }`} />
                <div className="flex-1">
                  {(itinerary as any).refundData.giftcard_code ? (
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
                          {(itinerary as any).refundData.giftcard_code}
                        </p>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Amount: <strong className="text-green-600">₹{(itinerary as any).refundData.giftcard_amount?.toLocaleString()}</strong>
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Balance: <strong className="text-green-600">₹{(itinerary as any).refundData.giftcard_balance?.toLocaleString()}</strong>
                          </span>
                        </div>
                        {(itinerary as any).refundData.giftcard_expiry && (
                          <p className="text-xs text-gray-500 mt-2">
                            Valid until: {new Date((itinerary as any).refundData.giftcard_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (itinerary as any).refundData.refund_status === 'completed' ? (
                    <>
                      <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">
                        ✅ Refund Completed
                      </h4>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your refund of <strong className="text-green-700 dark:text-green-300">
                          ₹{(itinerary as any).refundData.refund_amount?.toLocaleString()}
                        </strong> has been processed successfully!
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Initiated: {(itinerary as any).refundData.refund_initiated_at 
                          ? new Date((itinerary as any).refundData.refund_initiated_at).toLocaleDateString() 
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
                          ₹{(itinerary as any).refundData.refund_amount?.toLocaleString()}
                        </strong> is being processed via {(itinerary as any).refundData.refund_method || 'bank transfer'}.
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Initiated on: {(itinerary as any).refundData.refund_initiated_at 
                          ? new Date((itinerary as any).refundData.refund_initiated_at).toLocaleDateString() 
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

          {/* Booking Information */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <MapPin size={18} className="text-blue-600" />
              <span>Booking Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tour Name:</span>
                  <p className="font-semibold">{tour.title || 'N/A'}</p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location:</span>
                  <p className="font-semibold">{tour.location || 'N/A'}</p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                  <p className="font-semibold flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{tour.duration || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Booking Date:</span>
                  <p className="font-semibold flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{itinerary.bookedAt || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Travel Date:</span>
                  <p className="font-semibold">{bookingData.date || 'To be decided'}</p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-semibold">
                    {(itinerary.status || 'N/A').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Traveler Details */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <Users size={18} className="text-blue-600" />
              <span>Traveler Details</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Primary Contact:</span>
                  <p className="font-semibold">
                    {(bookingData.firstName && bookingData.lastName) 
                      ? `${bookingData.firstName} ${bookingData.lastName}` 
                      : bookingData.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                  <p className="font-semibold flex items-center space-x-1">
                    <Mail size={16} />
                    <span>{bookingData.email || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone Number:</span>
                  <p className="font-semibold flex items-center space-x-1">
                    <Phone size={16} />
                    <span>{bookingData.phone || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Number of Travelers:</span>
                  <p className="font-semibold">{bookingData.travelers || 'N/A'} person(s)</p>
                </div>
              </div>
            </div>
            {bookingData.requirements && (
              <div className="mt-4">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Special Requirements:</span>
                <p className="font-semibold mt-1">{bookingData.requirements}</p>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={18} className="text-blue-600" />
              <span>Payment Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method:</span>
                  <p className="font-semibold uppercase">{paymentData.method || 'N/A'}</p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaction ID:</span>
                  <p className={`font-mono text-sm ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded`}>
                    {paymentData.paymentId || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Date:</span>
                  <p className="font-semibold">
                    {paymentData.timestamp ? new Date(paymentData.timestamp).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Status:</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-semibold ml-2">
                    SUCCESS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className={`p-4 rounded-xl border-2 ${
            darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
          }`}>
            <h4 className="font-semibold mb-4 flex items-center space-x-2">
              <IndianRupee size={18} className="text-green-600" />
              <span>Payment Summary</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tour Cost ({bookingData.travelers || 1} travelers)</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Service Charges (18%)</span>
                <span>₹{taxes.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg text-green-600">
                <span>Total Amount Paid</span>
                <span>₹{(paymentData.amount || (totalAmount + taxes)).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleDownloadReceipt}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download size={20} />
              <span>Download Receipt</span>
            </button>
            <button
              onClick={handleShareReceipt}
              className={`flex-1 border-2 ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2`}
            >
              <Share2 size={20} />
              <span>Share Receipt</span>
            </button>
            <button
              onClick={() => {
                const validDest = getPlaylistDestination(itinerary.tour);
                window.dispatchEvent(new CustomEvent('showPlaylist', { detail: { destination: validDest } }));
              }}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span role="img" aria-label="music">🎶</span>
              <span>Play Travel Playlist</span>
            </button>
          </div>

          {/* Footer */}
          <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} pt-6 border-t border-gray-200 dark:border-gray-700`}>
            <p>Thank you for choosing Indian Wonderer!</p>
            <p>For support, contact us at: support@indianwonderer.com | +91 98765 43210</p>
            <p className="mt-2">© 2025 Indian Wonderer. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
