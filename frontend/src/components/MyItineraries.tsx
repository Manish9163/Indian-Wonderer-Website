import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react';
import ItineraryCard from './ItineraryCard';
import PaymentReceipt from './PaymentRecipt';
import LiveTracking from './LiveTracking';
import apiService from '../services/api.service';

const DEFAULT_PLAYLISTS: Record<string, {spotify: string; youtube: string}> = {
  default: { spotify: "Indian Travel Songs", youtube: "Travel Songs India Playlist" }
};

interface MyItinerariesProps {
  darkMode: boolean;
  myItineraries: any[];
  setActiveTab: (tab: string) => void;
  expandedItinerary: string | null;
  setExpandedItinerary: (id: string | null) => void;
  userDetails: any;
  showSuccess?: (title: string, message: string, duration?: number) => void;
  showError?: (title: string, message: string, duration?: number) => void;
  showWarning?: (title: string, message: string, duration?: number) => void;
  showInfo?: (title: string, message: string, duration?: number) => void;
}

const MyItineraries: React.FC<MyItinerariesProps> = ({ 
  darkMode, 
  myItineraries, 
  setActiveTab, 
  expandedItinerary, 
  setExpandedItinerary,
  userDetails,
  showSuccess,
  showError,
  showWarning,
  showInfo
}) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState<number | null>(null);
  const [destinationPlaylists, setDestinationPlaylists] = useState<Record<string, {spotify: string; youtube: string}>>(DEFAULT_PLAYLISTS);
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);

  useEffect(() => {
    loadDestinationPlaylists();
  }, []);

  const loadDestinationPlaylists = async () => {
    try {
      const response = await apiService.get('tours.php?action=all');
      
      if (response.success && response.data) {
        const tours = response.data;
        const destinationSet = new Set(tours.map((tour: any) => tour.destination));
        const uniqueDestinations = Array.from(destinationSet) as string[];
        setAvailableDestinations(uniqueDestinations);
        
        const playlists: Record<string, {spotify: string; youtube: string}> = {};
        
        uniqueDestinations.forEach((destination: string) => {
          const destLower = destination.toLowerCase();
          const destName = destination;
          
          if (destLower.includes('goa') || destLower.includes('beach')) {
            playlists[destLower] = {
              spotify: `${destName} Beach Party Songs`,
              youtube: `${destName} Beach Vibes Playlist`
            };
          } else if (destLower.includes('himalaya') || destLower.includes('ladakh') || destLower.includes('shimla') || destLower.includes('manali')) {
            playlists[destLower] = {
              spotify: `${destName} Mountain Roadtrip`,
              youtube: `${destName} Himalayan Journey Songs`
            };
          } else if (destLower.includes('rajasthan') || destLower.includes('jaipur') || destLower.includes('udaipur') || destLower.includes('jodhpur')) {
            playlists[destLower] = {
              spotify: `${destName} Folk & Cultural Music`,
              youtube: `${destName} Rajasthani Songs`
            };
          } else if (destLower.includes('kerala') || destLower.includes('backwater')) {
            playlists[destLower] = {
              spotify: `${destName} Tropical Vibes`,
              youtube: `${destName} Malayalam Travel Songs`
            };
          } else if (destLower.includes('varanasi') || destLower.includes('spiritual') || destLower.includes('temple')) {
            playlists[destLower] = {
              spotify: `${destName} Devotional & Classical`,
              youtube: `${destName} Spiritual Journey`
            };
          } else if (destLower.includes('mumbai') || destLower.includes('delhi')) {
            playlists[destLower] = {
              spotify: `${destName} Bollywood Hits`,
              youtube: `${destName} City Vibes Playlist`
            };
          } else {
            playlists[destLower] = {
              spotify: `${destName} Travel Songs`,
              youtube: `${destName} Journey Playlist`
            };
          }
        });
        
        setDestinationPlaylists({...DEFAULT_PLAYLISTS, ...playlists});
        console.log('🎵 Loaded playlists for destinations:', Object.keys(playlists));
      }
    } catch (error) {
      console.error('Error loading destination playlists:', error);
      setDestinationPlaylists(DEFAULT_PLAYLISTS);
    }
  };

  console.log('🎯 MyItineraries component rendered with:', {
    myItinerariesCount: myItineraries.length,
    myItineraries: myItineraries,
    userDetails: userDetails,
    availableDestinations: availableDestinations,
    destinationPlaylists: Object.keys(destinationPlaylists)
  });

  const handleTrackGuide = (itinerary: any) => {
    const bookingId = itinerary.bookingData?.id || 
                     itinerary.booking_id || 
                     itinerary.id || 
                     1; 
    
    console.log('📍 Opening live tracking for booking:', bookingId);
    console.log('📍 Itinerary data:', itinerary);
    setTrackingBookingId(bookingId);
    setShowLiveTracking(true);
  };

  const isTrackingAvailable = (itinerary: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const travelDate = itinerary.bookingData?.travel_date || itinerary.travel_date;
    const tourEndDate = itinerary.bookingData?.tour_end_date || itinerary.tour_end_date;
    
    if (!travelDate) return false;
    
    const startDate = new Date(travelDate);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate: Date;
    if (tourEndDate) {
      endDate = new Date(tourEndDate);
    } else {
      const duration = itinerary.tour?.duration_days || itinerary.duration_days || 1;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + parseInt(duration.toString()));
    }
    endDate.setHours(23, 59, 59, 999);
    
    return today >= startDate && today <= endDate;
  };

  const getPlaylistDestination = (tour: any): string => {
    const destination = (tour?.destination || tour?.location || tour?.title || '').toLowerCase();
    
    if (destinationPlaylists[destination]) {
      return destination;
    }
    
    for (const availableDest of availableDestinations) {
      const availableDestLower = availableDest.toLowerCase();
      if (destination.includes(availableDestLower) || availableDestLower.includes(destination)) {
        return availableDestLower;
      }
    }
    
    for (const playlistKey of Object.keys(destinationPlaylists)) {
      if (destination.includes(playlistKey) || playlistKey.includes(destination)) {
        return playlistKey;
      }
    }
    
    return 'default';
  };

  const handleShowReceipt = (itinerary: any) => {
    setSelectedItinerary(itinerary);
    setShowReceiptModal(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setSelectedItinerary(null);
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Itineraries</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your booked tours and travel plans</p>
          </div>
          {myItineraries.length > 0 && (
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                Total: {myItineraries.length} Tours
              </span>
            </div>
          )}
        </div>

        {myItineraries.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No itineraries yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start exploring tours to create your first itinerary</p>
            <button
              onClick={() => setActiveTab('explore')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Explore Tours
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {myItineraries.map((itinerary, index) => (
              <div key={`booking-${itinerary.bookingData?.booking_reference || itinerary.id}-${index}`} className="relative">
                {itinerary.selectedAgent && (
                  <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {itinerary.selectedAgent.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          🎯 Travel Guide: <span className="font-semibold">{itinerary.selectedAgent.name}</span>
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ⭐ {itinerary.selectedAgent.rating} • {itinerary.selectedAgent.specialization[0]} • {itinerary.selectedAgent.experience} years exp.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <ItineraryCard
                  itinerary={itinerary}
                  darkMode={darkMode}
                  expandedItinerary={expandedItinerary}
                  setExpandedItinerary={setExpandedItinerary}
                  userDetails={userDetails}
                  onShowReceipt={handleShowReceipt}
                  showSuccess={showSuccess}
                  showError={showError}
                  showWarning={showWarning}
                  showInfo={showInfo}
                />
                
                <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
                  {isTrackingAvailable(itinerary) && (
                    <button
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2 transition-all duration-300"
                      onClick={() => handleTrackGuide(itinerary)}
                    >
                      <span>📍</span>
                      <span className="font-semibold">Track Guide LIVE</span>
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-300 animate-pulse"></span>
                    </button>
                  )}
                  
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 flex items-center space-x-2 transition-all duration-300"
                    onClick={() => {
                      const validDest = getPlaylistDestination(itinerary.tour);
                      const playlistInfo = destinationPlaylists[validDest] || destinationPlaylists.default;
                      console.log('🎵 Opening playlist for:', validDest, playlistInfo);
                      window.dispatchEvent(new CustomEvent('showPlaylist', { 
                        detail: { 
                          destination: validDest,
                          playlistName: playlistInfo.spotify,
                          destinationName: itinerary.tour?.destination || 'Your Destination'
                        } 
                      }));
                    }}
                    title={`Listen to ${itinerary.tour?.destination || 'travel'} songs`}
                  >
                    <span>🎶</span>
                    <span className="font-semibold">Travel Playlist</span>
                  </button>
                </div>
              </div>
            ))}       
          </div>
        )}
      </main>

      {showReceiptModal && selectedItinerary && (
        <PaymentReceipt
          darkMode={darkMode}
          onClose={handleCloseReceipt}
          itinerary={selectedItinerary}
          userDetails={userDetails}
        />
      )}

      {showLiveTracking && trackingBookingId && (
        <LiveTracking
          bookingId={trackingBookingId}
          onClose={() => {
            console.log('📍 Closing live tracking');
            setShowLiveTracking(false);
            setTrackingBookingId(null);
          }}
          darkMode={darkMode}
        />
      )}
    </>
  );
};

export default MyItineraries
