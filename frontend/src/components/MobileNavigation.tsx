import React, { useEffect, useState } from 'react'
import { Search , Calendar, Globe, User, Package, Plane } from 'lucide-react';

type MobileNavigationProps = {
  darkMode: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  myItineraries: any[];
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ darkMode, activeTab, setActiveTab, myItineraries }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high');

  useEffect(() => {
    const checkPerformance = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
          setPerformanceMode('low');
        }
      }
      
      if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
        setPerformanceMode('low');
      }
    };
    
    checkPerformance();
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      vibrate(10); 
      setActiveTab(tab);
    }
  };

  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const tabs = ['explore', 'booking', 'itineraries', 'orders', 'agent-application'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      vibrate([5, 10]); 
      setActiveTab(tabs[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      vibrate([5, 10]);
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} z-30 shadow-2xl`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {performanceMode === 'low' && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-t opacity-60">
          ⚡ Optimized Mode
        </div>
      )}
      
      <div className="grid grid-cols-6 gap-1 p-2">
        <button
          onClick={() => handleTabChange('explore')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'explore'
              ? 'bg-blue-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Search size={20} className={activeTab === 'explore' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Explore</span>
        </button>
        <button
          onClick={() => handleTabChange('booking')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'booking'
              ? 'bg-green-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Globe size={20} className={activeTab === 'booking' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Book</span>
        </button>
        <button
          onClick={() => handleTabChange('travel')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'travel'
              ? 'bg-cyan-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Plane size={20} className={activeTab === 'travel' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Travel</span>
        </button>
        <button
          onClick={() => handleTabChange('itineraries')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation relative ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'itineraries'
              ? 'bg-purple-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Calendar size={20} className={activeTab === 'itineraries' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Tours</span>
          {myItineraries.filter(i => i.status !== 'cancelled').length > 0 && (
            <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg ${
              performanceMode === 'high' ? 'animate-bounce' : ''
            }`}>
              {myItineraries.filter(i => i.status !== 'cancelled').length > 99 ? '99+' : myItineraries.filter(i => i.status !== 'cancelled').length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('orders')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation relative ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <Package size={20} className={activeTab === 'orders' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Orders</span>
          {myItineraries.length > 0 && (
            <span className={`absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg ${
              performanceMode === 'high' ? 'animate-bounce' : ''
            }`}>
              {myItineraries.length > 99 ? '99+' : myItineraries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('agent-application')}
          className={`flex flex-col items-center p-2 rounded-lg touch-manipulation ${
            performanceMode === 'high' ? 'transition-all duration-200' : ''
          } ${
            activeTab === 'agent-application'
              ? 'bg-orange-600 text-white scale-105 shadow-lg'
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <User size={20} className={activeTab === 'agent-application' && performanceMode === 'high' ? 'animate-pulse' : ''} />
          <span className="text-xs mt-1 font-medium">Agent</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation
