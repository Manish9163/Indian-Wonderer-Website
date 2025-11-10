import { X ,Minus ,Plus } from "lucide-react";
import { useState } from "react";


interface BookingModalProps {
  selectedTour: any;
  darkMode: boolean;
  onClose: () => void;
  onConfirmBooking: (bookingData: any) => void;
  userDetails: any; 
}

const BookingModal: React.FC<BookingModalProps> = ({ selectedTour, darkMode, onClose, onConfirmBooking, userDetails }) => {

  const getPhoneFromUserDetails = () => {
    if (userDetails?.phone) return userDetails.phone;
    if (userDetails?.identifier && /^\d{10}$/.test(userDetails.identifier)) {
      return userDetails.identifier; 
    }
    return '';
  };

  const [bookingData, setBookingData] = useState({
    firstName: userDetails?.firstName || '',
    lastName: userDetails?.lastName || '',
    email: userDetails?.email || '',
    phone: getPhoneFromUserDetails(),
    travelers: 2,
    date: '',
    requirements: ''
  });

  const handleBooking = () => {
    if (!bookingData.firstName || !bookingData.lastName) {
      alert('Please enter your first and last name');
      return;
    }
    if (!bookingData.email) {
      alert('Please enter your email address');
      return;
    }
    if (!bookingData.phone) {
      alert('Please enter your phone number');
      return;
    }
    if (!bookingData.date) {
      alert('Please select a travel date');
      return;
    }
    if (bookingData.travelers < 1) {
      alert('Number of travelers must be at least 1');
      return;
    }

    onConfirmBooking(bookingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Book Your Tour</h3>
          <button title = "x" onClick={onClose} className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg`}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {(userDetails?.firstName || userDetails?.lastName || userDetails?.email || userDetails?.identifier) && (
            <div className={`text-sm p-3 rounded-lg ${darkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
              ✅ Your profile details have been auto-filled. You can edit them if booking for someone else.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={bookingData.firstName}
                onChange={(e) => setBookingData({...bookingData, firstName: e.target.value})}
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={bookingData.lastName}
                onChange={(e) => setBookingData({...bookingData, lastName: e.target.value})}
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={bookingData.email}
              onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={bookingData.phone}
              onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Travelers</label>
              <div className="flex items-center space-x-3">
                <button title ="minus"
                  onClick={() => setBookingData({...bookingData, travelers: Math.max(1, bookingData.travelers - 1)})}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} `}
                >
                  <Minus size={16}  />
                </button>
                <span className="font-semibold">{bookingData.travelers}</span>
                <button title = "plus"
                  onClick={() => setBookingData({...bookingData, travelers: bookingData.travelers + 1})}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}  `}
                >
                  <Plus size={16} className = "dark:bg-black" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Travel Date</label>
              <input
              placeholder="Booking Date"
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Special Requirements</label>
            <textarea
              value={bookingData.requirements}
              onChange={(e) => setBookingData({...bookingData, requirements: e.target.value})}
              rows={3}
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500`}
              placeholder="Any special requests or requirements..."
            />
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{(selectedTour?.price * bookingData.travelers).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleBooking}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal
