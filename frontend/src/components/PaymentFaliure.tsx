import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, X } from 'lucide-react';

interface PaymentFailureProps {
  darkMode: boolean;
  onClose: () => void;
  onRetry: () => void;
  onBackToBooking: () => void;
  errorMessage?: string;
  selectedTour: any;
  bookingData: any;
}

const PaymentFailure: React.FC<PaymentFailureProps> = ({
  darkMode,
  onClose,
  onRetry,
  onBackToBooking,
  errorMessage = "Payment could not be processed",
  selectedTour,
  bookingData
}) => {
  const commonReasons = [
    "Insufficient funds in your account",
    "Network connectivity issues",
    "Card expired or blocked",
    "Incorrect payment details",
    "Bank server temporarily unavailable"
  ];

  const totalAmount = selectedTour?.price * bookingData?.travelers || 0;
  const taxes = Math.round(totalAmount * 0.18);
  const finalAmount = totalAmount + taxes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
            <button title='Close'
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Icon and Message */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Payment Unsuccessful</h4>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              {errorMessage}
            </p>
          </div>

          {/* Booking Summary */}
          <div className={`p-4 rounded-lg mb-6 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h5 className="font-semibold mb-3">Booking Summary</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tour:</span>
                <span className="font-medium">{selectedTour?.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Travelers:</span>
                <span>{bookingData?.travelers}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-bold text-red-600">₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div className={`p-4 rounded-lg mb-6 ${
            darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h5 className="font-semibold mb-3 text-yellow-700 dark:text-yellow-300">
              Common reasons for payment failure:
            </h5>
            <ul className="text-sm space-y-1">
              {commonReasons.map((reason, index) => (
                <li key={index} className="flex items-start space-x-2 text-yellow-700 dark:text-yellow-300">
                  <span>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={onBackToBooking}
              className="w-full border-2 border-gray-300 dark:border-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Booking</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 dark:text-gray-400 py-2 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Help Text */}
          <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Need help? Contact our support team</p>
            <p className="font-medium text-blue-600">+91 98765 43210</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
