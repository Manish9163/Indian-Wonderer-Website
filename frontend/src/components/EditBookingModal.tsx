import React, { useState } from 'react';
import { X, Calendar, Users, FileText, Save } from 'lucide-react';

interface EditBookingModalProps {
  darkMode: boolean;
  onClose: () => void;
  onSave: (updatedData: {
    travelDate: string;
    numberOfTravelers: number;
    specialRequirements: string;
  }) => void;
  currentData: {
    travelDate: string;
    numberOfTravelers: number;
    specialRequirements: string;
  };
  bookingReference: string;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({
  darkMode,
  onClose,
  onSave,
  currentData,
  bookingReference
}) => {
  const [travelDate, setTravelDate] = useState(currentData.travelDate);
  const [numberOfTravelers, setNumberOfTravelers] = useState(currentData.numberOfTravelers);
  const [specialRequirements, setSpecialRequirements] = useState(currentData.specialRequirements);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSave({
        travelDate,
        numberOfTravelers,
        specialRequirements
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasChanges = 
    travelDate !== currentData.travelDate ||
    numberOfTravelers !== currentData.numberOfTravelers ||
    specialRequirements !== currentData.specialRequirements;

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">Edit Booking</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Reference: {bookingReference}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              ℹ️ You can modify your travel date, number of travelers, and special requirements. Contact us for major changes.
            </p>
          </div>

          {/* Travel Date */}
          <div>
            <label className="block font-semibold mb-2 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>Travel Date</span>
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min={minDate}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
            {travelDate !== currentData.travelDate && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Date change may affect availability. Our team will confirm within 24 hours.
              </p>
            )}
          </div>

          {/* Number of Travelers */}
          <div>
            <label className="block font-semibold mb-2 flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <span>Number of Travelers</span>
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setNumberOfTravelers(Math.max(1, numberOfTravelers - 1))}
                className={`w-12 h-12 rounded-lg font-bold text-xl ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}
              >
                -
              </button>
              <div className={`flex-1 text-center py-3 rounded-lg font-bold text-2xl ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {numberOfTravelers}
              </div>
              <button
                onClick={() => setNumberOfTravelers(Math.min(20, numberOfTravelers + 1))}
                className={`w-12 h-12 rounded-lg font-bold text-xl ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors`}
              >
                +
              </button>
            </div>
            {numberOfTravelers !== currentData.numberOfTravelers && (
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ {numberOfTravelers > currentData.numberOfTravelers ? 'Additional' : 'Reduced'} travelers may affect the total price. Our team will contact you with updated pricing.
              </p>
            )}
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block font-semibold mb-2 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <span>Special Requirements</span>
            </label>
            <textarea
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Any dietary restrictions, accessibility needs, or special requests..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              We'll do our best to accommodate your requests
            </p>
          </div>

          {/* Summary of Changes */}
          {hasChanges && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">📝 Changes Summary</h4>
              <ul className="space-y-1 text-sm">
                {travelDate !== currentData.travelDate && (
                  <li>✓ Travel date changed from {new Date(currentData.travelDate).toLocaleDateString()} to {new Date(travelDate).toLocaleDateString()}</li>
                )}
                {numberOfTravelers !== currentData.numberOfTravelers && (
                  <li>✓ Number of travelers changed from {currentData.numberOfTravelers} to {numberOfTravelers}</li>
                )}
                {specialRequirements !== currentData.specialRequirements && (
                  <li>✓ Special requirements updated</li>
                )}
              </ul>
            </div>
          )}

          {/* Important Notes */}
          <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className="font-semibold mb-2">📋 Important Notes</h4>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Changes are subject to availability confirmation</li>
              <li>Price adjustments (if any) will be communicated within 24 hours</li>
              <li>Date changes more than 7 days before travel are usually free</li>
              <li>Changes within 7 days may incur modification fees</li>
              <li>Our team will contact you to confirm the changes</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex space-x-4`}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing || !hasChanges}
            className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
