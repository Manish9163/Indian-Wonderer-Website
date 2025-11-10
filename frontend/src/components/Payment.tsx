import React, { useState, useEffect } from 'react';
import {  X, CreditCard, Smartphone, Building2, Wallet, Shield, CheckCircle, ArrowLeft, Lock, Info } from 'lucide-react';
import walletService from '../services/wallet.service';

interface PaymentProps {
  selectedTour: any;
  bookingData: any;
  darkMode: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentData: any) => void;
  onBack: () => void;
}

const Payment: React.FC<PaymentProps> = ({ 
  selectedTour, 
  bookingData, 
  darkMode, 
  onClose, 
  onPaymentSuccess, 
  onBack 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'details' | 'processing' | 'success' | 'error'>('selection');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    upiId: '',
    
    bankName: '',
    
    walletProvider: '',
    walletNumber: ''
  });

  const totalAmount = selectedTour?.price * bookingData?.travelers || 0;
  const taxes = Math.round(totalAmount * 0.18); // 18% GST
  const finalAmount = totalAmount + taxes;

  // Load wallet balance when wallet method is selected
  useEffect(() => {
    if (selectedMethod === 'wallet') {
      const userId = localStorage.getItem('userId') || 'guest-user';
      walletService.getWalletData(userId)
        .then((data: any) => {
          setWalletBalance(data.totalBalance || 0);
        })
        .catch((error: any) => {
          console.error('Error loading wallet balance:', error);
          setWalletBalance(0);
        });
    }
  }, [selectedMethod]);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay',
      popular: true
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'PhonePe, GPay, Paytm',
      popular: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building2,
      description: 'All major banks'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: Wallet,
      description: 'Paytm, MobiKwik, etc.'
    }
  ];

  const banks = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 
    'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
    'Canara Bank', 'Union Bank of India', 'Indian Bank'
  ];

  const walletProviders = [
    'Paytm', 'MobiKwik', 'Freecharge', 'Amazon Pay', 'PhonePe Wallet'
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentStep('details');
  };

  const validatePaymentDetails = () => {
    switch (selectedMethod) {
      case 'card':
        return paymentDetails.cardNumber.replace(/\s/g, '').length === 16 &&
               paymentDetails.expiryDate.length === 5 &&
               paymentDetails.cvv.length >= 3 &&
               paymentDetails.cardName.trim().length > 0;
      case 'upi':
        return paymentDetails.upiId.includes('@') && paymentDetails.upiId.length > 5;
      case 'netbanking':
        return paymentDetails.bankName.length > 0;
      case 'wallet':
        if (walletBalance !== null && walletBalance < finalAmount) {
          setErrorMessage(`Not enough money to proceed the payment, add money to proceed. Current balance: ₹${walletBalance}, Required: ₹${finalAmount}`);
          setPaymentStep('error');
          return false;
        }
        return true;
      default:
        return false;
    }
  };

  const processPayment = async () => {
    setErrorMessage('');
    
    if (!validatePaymentDetails()) {
      if (selectedMethod === 'wallet' && walletBalance !== null && walletBalance < finalAmount) {
        // Error already set in validatePaymentDetails
        return;
      }
      alert('Please fill in all required payment details');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      if (selectedMethod === 'wallet') {
        // Process wallet payment
        const userId = localStorage.getItem('userId') || 'guest-user';
        const bookingId = `BK_${Date.now()}`;
        
        const result = await walletService.useWalletForBooking(userId, bookingId, finalAmount);
        
        if (!result.success) {
          setErrorMessage(result.message || 'Payment failed');
          setPaymentStep('error');
          setIsProcessing(false);
          return;
        }

        const paymentData = {
          paymentId: `PAY_${Date.now()}`,
          method: selectedMethod,
          amount: finalAmount,
          currency: 'INR',
          status: 'success',
          timestamp: new Date().toISOString(),
          details: paymentDetails
        };
        
        setPaymentStep('success');
        setIsProcessing(false);
        setTimeout(() => {
          onPaymentSuccess(paymentData);
        }, 2000);
      } else {
        // Process other payment methods
        setTimeout(() => {
          const paymentData = {
            paymentId: `PAY_${Date.now()}`,
            method: selectedMethod,
            amount: finalAmount,
            currency: 'INR',
            status: 'success',
            timestamp: new Date().toISOString(),
            details: paymentDetails
          };
          
          setPaymentStep('success');
          setIsProcessing(false);
          setTimeout(() => {
            onPaymentSuccess(paymentData);
          }, 2000);
        }, 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Payment failed');
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

  const renderPaymentMethodSelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-6">Choose Payment Method</h3>
      
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        return (
          <button
            key={method.id}
            onClick={() => handlePaymentMethodSelect(method.id)}
            disabled={isProcessing} 
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
              darkMode 
                ? 'border-gray-700 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'
                : 'border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                }`}>
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{method.name}</span>
                    {method.popular && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {method.description}
                  </span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}></div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderPaymentDetails = () => {
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    const Icon = selectedMethodData?.icon || CreditCard;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button title='paymentSection'
            onClick={() => setPaymentStep('selection')}
            disabled={isProcessing} 
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
            }`}>
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold">{selectedMethodData?.name}</span>
          </div>
        </div>

        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={paymentDetails.cardNumber}
                onChange={(e) => setPaymentDetails({
                  ...paymentDetails, 
                  cardNumber: formatCardNumber(e.target.value)
                })}
                disabled={isProcessing} 
                className={`w-full p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentDetails.expiryDate}
                  onChange={(e) => setPaymentDetails({
                    ...paymentDetails, 
                    expiryDate: formatExpiryDate(e.target.value)
                  })}
                  disabled={isProcessing}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  maxLength={4}
                  value={paymentDetails.cvv}
                  onChange={(e) => setPaymentDetails({
                    ...paymentDetails, 
                    cvv: e.target.value.replace(/\D/g, '')
                  })}
                  disabled={isProcessing}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={paymentDetails.cardName}
                onChange={(e) => setPaymentDetails({
                  ...paymentDetails, 
                  cardName: e.target.value
                })}
                disabled={isProcessing}
                className={`w-full p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        )}

        {selectedMethod === 'upi' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">UPI ID</label>
              <input
                type="text"
                placeholder="yourname@paytm"
                value={paymentDetails.upiId}
                onChange={(e) => setPaymentDetails({
                  ...paymentDetails, 
                  upiId: e.target.value
                })}
                disabled={isProcessing}
                className={`w-full p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You'll be redirected to your UPI app to complete the payment
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'netbanking' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Bank</label>
              <select title='paymentDetailsBank'
                value={paymentDetails.bankName}
                onChange={(e) => setPaymentDetails({
                  ...paymentDetails, 
                  bankName: e.target.value
                })}
                disabled={isProcessing}
                className={`w-full p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Choose your bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You'll be redirected to your bank's secure login page
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'wallet' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              walletBalance !== null && walletBalance >= finalAmount
                ? (darkMode ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-300')
                : (darkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-300')
            }`}>
              <div className="flex items-start space-x-3">
                <Wallet className={`w-5 h-5 mt-0.5 ${
                  walletBalance !== null && walletBalance >= finalAmount
                    ? 'text-green-600'
                    : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    walletBalance !== null && walletBalance >= finalAmount
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    Wallet Balance
                  </p>
                  {walletBalance !== null ? (
                    <>
                      <p className={`text-2xl font-bold mt-1 ${
                        walletBalance !== null && walletBalance >= finalAmount
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        ₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className={`text-sm mt-2 ${
                        walletBalance !== null && walletBalance >= finalAmount
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        Payment Required: ₹{finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm mt-1 text-gray-500">Loading balance...</p>
                  )}
                </div>
              </div>
            </div>

            {walletBalance !== null && walletBalance < finalAmount && (
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                      Insufficient Balance
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Not enough money to proceed the payment, add money to proceed. 
                      Shortfall: ₹{(finalAmount - walletBalance).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {walletBalance !== null && walletBalance >= finalAmount && (
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You have sufficient balance. Click below to complete payment from your wallet.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={processPayment}
          disabled={!validatePaymentDetails() || isProcessing} 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock size={20} />
              <span>Pay ₹{finalAmount.toLocaleString()}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Please don't close this window
      </p>
      <div className="mt-6 flex items-center justify-center space-x-2">
        <Shield size={16} className="text-green-600" />
        <span className="text-sm text-green-600">Secure Payment Processing</span>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        Your booking has been confirmed
      </p>
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      } text-left`}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Payment ID:</span>
            <span className="font-mono">PAY_{Date.now()}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>₹{finalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-600">Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <X className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">Payment Failed</h3>
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
      } text-left mb-6`}>
        <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
          {errorMessage || 'An error occurred while processing your payment'}
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => {
            setErrorMessage('');
            setPaymentStep('selection');
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
        >
          Try Again
        </button>
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        
        <div className="sticky top-0 bg-inherit p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {paymentStep === 'success' ? 'Payment Complete' : 'Secure Payment'}
            </h3>
            <button title='Close'
              onClick={onClose}
              disabled={isProcessing} 
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {paymentStep === 'selection' && renderPaymentMethodSelection()}
          {paymentStep === 'details' && renderPaymentDetails()}
          {paymentStep === 'processing' && renderProcessing()}
          {paymentStep === 'success' && renderSuccess()}
          {paymentStep === 'error' && renderError()}
        </div>

        {(paymentStep === 'selection' || paymentStep === 'details') && (
          <div className={`sticky bottom-0 p-6 border-t border-gray-200 dark:border-gray-700 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tour Price ({bookingData?.travelers} travelers)</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>₹{taxes.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-green-600">₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
