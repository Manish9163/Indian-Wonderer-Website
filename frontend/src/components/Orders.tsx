import React, { useState } from 'react';
import { Package, Filter, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import ItineraryCard from './ItineraryCard';

interface OrdersProps {
  darkMode: boolean;
  myItineraries: any[];
  userDetails: any;
  onShowReceipt?: (itinerary: any) => void;
}

const Orders: React.FC<OrdersProps> = ({ darkMode, myItineraries, userDetails, onShowReceipt }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedItinerary, setExpandedItinerary] = useState<string | null>(null);

  // Filter itineraries based on status and search
  const filteredItineraries = myItineraries.filter(itinerary => {
    const matchesStatus = filterStatus === 'all' || itinerary.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      itinerary.tour?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.tour?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (itinerary.bookingData?.booking_reference || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    all: myItineraries.length,
    confirmed: myItineraries.filter(i => i.status === 'confirmed').length,
    pending: myItineraries.filter(i => i.status === 'pending').length,
    cancelled: myItineraries.filter(i => i.status === 'cancelled').length,
    completed: myItineraries.filter(i => i.status === 'completed').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Package className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              My Orders
            </h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage all your booking orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-xl transition-all ${
              filterStatus === 'all'
                ? darkMode
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-blue-600 text-white shadow-lg'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Package className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.all}</span>
            </div>
            <p className="text-xs font-medium">All Orders</p>
          </button>

          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`p-4 rounded-xl transition-all ${
              filterStatus === 'confirmed'
                ? 'bg-green-600 text-white shadow-lg'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.confirmed}</span>
            </div>
            <p className="text-xs font-medium">Confirmed</p>
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`p-4 rounded-xl transition-all ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white shadow-lg'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-xs font-medium">Pending</p>
          </button>

          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`p-4 rounded-xl transition-all ${
              filterStatus === 'cancelled'
                ? 'bg-red-600 text-white shadow-lg'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <XCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.cancelled}</span>
            </div>
            <p className="text-xs font-medium">Cancelled</p>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`p-4 rounded-xl transition-all ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white shadow-lg'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.completed}</span>
            </div>
            <p className="text-xs font-medium">Completed</p>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search by tour name, location, or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredItineraries.length === 0 ? (
          <div className={`text-center py-16 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <Package className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {searchTerm || filterStatus !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start exploring and book your first tour!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItineraries.map((itinerary) => (
              <div
                key={itinerary.bookingData?.booking_reference || itinerary.id}
                className={`rounded-xl overflow-hidden transition-all ${
                  darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}
              >
                {/* Order Header */}
                <div className={`px-6 py-3 flex flex-wrap items-center justify-between gap-3 ${
                  darkMode ? 'bg-gray-750 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Order ID
                      </p>
                      <p className={`font-mono font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {itinerary.bookingData?.booking_reference || itinerary.id}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Booked On
                      </p>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(itinerary.bookedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                      getStatusColor(itinerary.status)
                    }`}>
                      {getStatusIcon(itinerary.status)}
                      <span className="capitalize">{itinerary.status}</span>
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-2">
                  <ItineraryCard
                    itinerary={itinerary}
                    darkMode={darkMode}
                    expandedItinerary={expandedItinerary}
                    setExpandedItinerary={setExpandedItinerary}
                    userDetails={userDetails}
                    onShowReceipt={onShowReceipt}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
