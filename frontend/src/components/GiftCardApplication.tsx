import React, { useState, useEffect } from 'react';
import { Gift, Check, Clock, X, AlertCircle } from 'lucide-react';
import giftCardService from '../services/giftcard.service';

interface GiftCardApplicationProps {
  darkMode: boolean;
  userId: string | null;
}

const GiftCardApplication: React.FC<GiftCardApplicationProps> = ({ darkMode, userId }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (userId) {
      checkApplicationStatus();
    }
  }, [userId]);

  const checkApplicationStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await giftCardService.getApplicationStatus(userId as string);
      setApplicationStatus(response.application || null);
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!userId) {
      setError('User ID required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await giftCardService.applyForGiftCard(
        userId,
        parseFloat(amount),
        reason || undefined
      );

      setSuccess('Gift card application submitted successfully! Admin will review it.');
      setAmount('');
      setReason('');
      
      // Refresh status
      await checkApplicationStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (applicationStatus && applicationStatus.status === 'pending') {
    return (
      <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border-2 border-yellow-500`}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-yellow-500">Application Pending</h3>
        </div>
        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your gift card application for <strong>₹{applicationStatus.amount}</strong> is pending admin review.
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Applied on: {new Date(applicationStatus.applied_at).toLocaleDateString()}
        </p>
        {applicationStatus.reason && (
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Reason: {applicationStatus.reason}
          </p>
        )}
      </div>
    );
  }

  if (applicationStatus && applicationStatus.status === 'approved') {
    return (
      <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border-2 border-green-500`}>
        <div className="flex items-center gap-3 mb-4">
          <Check className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-semibold text-green-500">Application Approved!</h3>
        </div>
        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your gift card of <strong>₹{applicationStatus.amount}</strong> has been approved!
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Amount has been added to your wallet.
        </p>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Approved on: {new Date(applicationStatus.processed_at).toLocaleDateString()}
        </p>
      </div>
    );
  }

  if (applicationStatus && applicationStatus.status === 'rejected') {
    return (
      <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border-2 border-red-500`}>
        <div className="flex items-center gap-3 mb-4">
          <X className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-500">Application Rejected</h3>
        </div>
        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your gift card application has been rejected.
        </p>
        {applicationStatus.admin_notes && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Reason: {applicationStatus.admin_notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
      <div className="flex items-center gap-2 mb-6">
        <Gift className="w-6 h-6 text-purple-500" />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Apply for Gift Card
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-500">{success}</p>
        </div>
      )}

      <form onSubmit={handleApply} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Amount (₹)
          </label>
          <input
            type="number"
            min="100"
            max="100000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (e.g., 1000)"
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            disabled={isLoading}
          />
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Minimum: ₹100 | Maximum: ₹100,000
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why do you need this gift card? (e.g., Travel, Gifting a friend)"
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      <div className={`mt-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
          ℹ️ How It Works
        </h3>
        <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <li>1. Fill in the amount you need</li>
          <li>2. Submit your application</li>
          <li>3. Admin will review your request</li>
          <li>4. Once approved, the amount is added to your wallet</li>
          <li>5. Use it for bookings or tours</li>
        </ul>
      </div>
    </div>
  );
};

export default GiftCardApplication;
