import React, { useState } from 'react';
import { X, AlertTriangle, Gift, CreditCard } from 'lucide-react';

interface CancellationModalProps {
  darkMode: boolean;
  onClose: () => void;
  onConfirm: (refundType: 'refund' | 'giftcard', reason: string) => void;
  bookingAmount: number;
  bookingReference: string;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  darkMode,
  onClose,
  onConfirm,
  bookingAmount,
  bookingReference
}) => {
  const [refundType, setRefundType] = useState<'refund' | 'giftcard'>('refund');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(refundType, cancellationReason);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Cancel Booking</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
              <strong>⚠️ Important:</strong> Cancelling this booking will stop all tour arrangements. Please read the cancellation policy before proceeding.
            </p>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-2">Booking Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Reference:</strong> {bookingReference}</p>
              <p><strong>Amount Paid:</strong> <span className="text-green-600 font-bold">₹{bookingAmount.toLocaleString()}</span></p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Choose Refund Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setRefundType('refund')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  refundType === 'refund'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${refundType === 'refund' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">Bank Refund</h4>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get money back to your account
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      ₹{bookingAmount.toLocaleString()}
                    </p>
                  </div>
                  {refundType === 'refund' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Refund processed in 5-7 business days
                </p>
              </button>

              <button
                onClick={() => setRefundType('giftcard')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  refundType === 'giftcard'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${refundType === 'giftcard' ? 'bg-purple-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">Gift Card</h4>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get a gift voucher + 10% bonus
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      ₹{(bookingAmount * 1.1).toLocaleString()} + Bonus!
                    </p>
                  </div>
                  {refundType === 'giftcard' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Instant credit • Valid for 1 year
                </p>
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${refundType === 'giftcard' ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700' : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'}`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {refundType === 'giftcard' ? '🎁 Gift Card Value:' : '💳 Refund Amount:'}
              </span>
              <span className="text-2xl font-bold text-green-600">
                ₹{(refundType === 'giftcard' ? bookingAmount * 1.1 : bookingAmount).toLocaleString()}
              </span>
            </div>
            {refundType === 'giftcard' && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                ✨ Includes 10% bonus! Use it for your next adventure!
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please tell us why you're cancelling (e.g., Change of plans, Personal emergency, Found better option, etc.)"
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              required
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              This helps us improve our service
            </p>
          </div>

          <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className="font-semibold mb-2">📋 Cancellation Policy</h4>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Cancellation processed immediately</li>
              <li>Bank refunds take 5-7 business days</li>
              <li>Gift cards are issued instantly with 10% bonus</li>
              <li>Gift cards valid for 12 months from issue date</li>
              <li>Non-refundable booking fees may apply (₹500)</li>
            </ul>
          </div>
        </div>

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
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !cancellationReason.trim()}
            className="flex-1 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Cancellation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
