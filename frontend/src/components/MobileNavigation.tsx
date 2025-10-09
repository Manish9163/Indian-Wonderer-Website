import React from 'react'
import { Search , Calendar, Globe, User, Package } from 'lucide-react';

type MobileNavigationProps = {
  darkMode: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  myItineraries: any[];
};



const MobileNavigation: React.FC<MobileNavigationProps> = ({ darkMode, activeTab, setActiveTab, myItineraries }) => {
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} z-30`}>
      <div className="grid grid-cols-5 gap-1 p-2">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeTab === 'explore'
              ? 'bg-blue-600 text-white'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Search size={18} />
          <span className="text-xs mt-1">Explore</span>
        </button>
        <button
          onClick={() => setActiveTab('booking')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeTab === 'booking'
              ? 'bg-green-600 text-white'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Globe size={18} />
          <span className="text-xs mt-1">Book</span>
        </button>
        <button
          onClick={() => setActiveTab('itineraries')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
            activeTab === 'itineraries'
              ? 'bg-purple-600 text-white'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Calendar size={18} />
          <span className="text-xs mt-1">Tours</span>
          {myItineraries.filter(i => i.status !== 'cancelled').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {myItineraries.filter(i => i.status !== 'cancelled').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Package size={18} />
          <span className="text-xs mt-1">Orders</span>
          {myItineraries.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {myItineraries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('agent-application')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeTab === 'agent-application'
              ? 'bg-orange-600 text-white'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <User size={18} />
          <span className="text-xs mt-1">Agent</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation
