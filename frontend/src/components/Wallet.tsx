import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Send, History, Gift, TrendingUp, Eye, EyeOff, CreditCard, Loader, X } from 'lucide-react';
import walletService from '../services/wallet.service';

type WalletData = {
  walletId: string;
  userId: string;
  totalBalance: number;
  giftCardBalance: number;
  addedMoneyBalance: number;
  lastUpdated: string;
  transactions: Transaction[];
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'gift_card_added' | 'money_added';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
};

type AddMoneyForm = {
  amount: string;
  paymentMethod: 'card' | 'upi' | 'netbanking';
};

type WalletProps = {
  darkMode: boolean;
  userId: string | null;
  onClose: () => void;
};

const WalletComponent: React.FC<WalletProps> = ({ darkMode, userId, onClose }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'addMoney' | 'history'>('overview');
  const [addMoneyForm, setAddMoneyForm] = useState<AddMoneyForm>({
    amount: '',
    paymentMethod: 'card'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadWalletData();
    }
  }, [userId]);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await walletService.getWalletData(userId as string);
      setWalletData({
        walletId: data.walletId,
        userId: data.userId,
        totalBalance: data.totalBalance || 0,
        giftCardBalance: data.giftCardBalance || 0,
        addedMoneyBalance: data.addedMoneyBalance || 0,
        lastUpdated: data.lastUpdated,
        transactions: data.transactions || []
      });
    } catch (err) {
      setError('Failed to load wallet data');
      console.error('Error loading wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!addMoneyForm.amount || parseFloat(addMoneyForm.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const amount = parseFloat(addMoneyForm.amount);
      const response = await walletService.addMoney(userId as string, {
        amount,
        paymentMethod: addMoneyForm.paymentMethod as 'card' | 'upi' | 'netbanking'
      });
      
      if (response.success) {
        // Reload wallet data to ensure accuracy
        await loadWalletData();
        setSuccess(`₹${amount} successfully added to your wallet!`);
        setAddMoneyForm({ amount: '', paymentMethod: 'card' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to add money');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add money. Please try again.');
      console.error('Error adding money:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isLoading && !walletData) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'}`}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Wallet</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your balance & transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Balance Cards */}
        {walletData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium opacity-90">Total Balance</h3>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 hover:bg-blue-400 rounded-lg transition-colors"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-3xl font-bold mb-2">
                {showBalance ? formatCurrency(walletData.totalBalance) : '••••••'}
              </p>
              <p className="text-xs opacity-75">Available for bookings</p>
            </div>

            {/* Gift Card Balance */}
            <div className={`rounded-xl p-6 shadow-lg border-2 ${darkMode ? 'bg-gray-800 border-purple-500' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Gift className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gift Card Balance</h3>
              </div>
              <p className={`text-3xl font-bold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {showBalance ? formatCurrency(walletData.giftCardBalance) : '••••••'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>From gift cards & rewards</p>
            </div>

            {/* Added Money Balance */}
            <div className={`rounded-xl p-6 shadow-lg border-2 ${darkMode ? 'bg-gray-800 border-green-500' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Plus className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Added Money</h3>
              </div>
              <p className={`text-3xl font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {showBalance ? formatCurrency(walletData.addedMoneyBalance) : '••••••'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Money you've added</p>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-3">
            <span className="text-xl">✅</span>
            <p>{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Overview
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('addMoney')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'addMoney'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Money
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && walletData && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Wallet ID</p>
                <p className={`font-mono text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{walletData.walletId}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Last Updated</p>
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(walletData.lastUpdated)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('addMoney')}
                className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Money Now
              </button>
              <button
                className="w-full p-4 rounded-lg border-2 border-blue-500 text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send to Friend
              </button>
            </div>
          </div>
        )}

        {activeTab === 'addMoney' && (
          <div className={`max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add Money to Wallet</h2>
            
            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-3 text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>₹</span>
                  <input
                    type="number"
                    value={addMoneyForm.amount}
                    onChange={(e) => setAddMoneyForm({ ...addMoneyForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="100"
                    max="100000"
                    className={`w-full pl-8 pr-4 py-3 rounded-lg border-2 transition-colors ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none`}
                  />
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Minimum ₹100 • Maximum ₹1,00,000</p>
              </div>

              {/* Preset Amounts */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Or select preset amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAddMoneyForm({ ...addMoneyForm, amount: preset.toString() })}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        addMoneyForm.amount === preset.toString()
                          ? 'bg-blue-500 text-white'
                          : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                    { value: 'upi', label: 'UPI', icon: '📱' },
                    { value: 'netbanking', label: 'Net Banking', icon: '🏦' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setAddMoneyForm({ ...addMoneyForm, paymentMethod: method.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        addMoneyForm.paymentMethod === method.value
                          ? `border-blue-500 ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'}`
                          : `border-gray-300 ${darkMode ? 'bg-gray-700 text-gray-300 hover:border-gray-500' : 'bg-gray-50 text-gray-600 hover:border-gray-400'}`
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Money Button */}
              <button
                onClick={handleAddMoney}
                disabled={isLoading}
                className={`w-full p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg transition-all ${
                  isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg active:scale-95'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Add ₹${addMoneyForm.amount || '0'} to Wallet`
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && walletData && (
          <div className="space-y-4">
            {walletData.transactions.length > 0 ? (
              walletData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      transaction.type === 'credit' || transaction.type.includes('added')
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {transaction.type === 'gift_card_added' ? (
                        <Gift className={`w-5 h-5 text-green-600`} />
                      ) : transaction.type === 'money_added' ? (
                        <Plus className={`w-5 h-5 text-green-600`} />
                      ) : transaction.type === 'credit' ? (
                        <TrendingUp className={`w-5 h-5 text-green-600`} />
                      ) : (
                        <Send className={`w-5 h-5 text-red-600`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {transaction.description}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'credit' || transaction.type.includes('added')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' || transaction.type.includes('added') ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                    </p>
                    <p className={`text-xs ${
                      transaction.status === 'completed'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <History className={`w-12 h-12 mx-auto mb-3 opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No transactions yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletComponent;
