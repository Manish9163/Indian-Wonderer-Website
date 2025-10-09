import React, { useState } from 'react'
import { Calendar } from 'lucide-react';
import ItineraryCard from './ItineraryCard';
import PaymentReceipt from './PaymentRecipt';

// Destination playlist keys
const DESTINATION_PLAYLISTS: Record<string, {spotify: string; youtube: string}> = {
  goa: { spotify: "Goa Party Travel Songs", youtube: "Goa Party Songs Playlist" },
  shimla: { spotify: "LoFi Chill Roadtrip", youtube: "Shimla LoFi Chill Songs" },
  rajasthan: { spotify: "Rajasthani Folk Songs", youtube: "Rajasthani Folk Songs Playlist" },
  ladakh: { spotify: "Himalayan Roadtrip Songs", youtube: "Ladakh Roadtrip Songs" },
  kerala: { spotify: "Kerala Travel Vibes", youtube: "Kerala Travel Songs" },
  tajmahal: { spotify: "Romantic Love Travel Songs", youtube: "Taj Mahal Romantic Songs" },
  kolkata: { spotify: "Bengali Travel Songs", youtube: "Kolkata Bengali Songs" },
  varanasi: { spotify: "Indian Classical Devotional", youtube: "Varanasi Ganga Aarti Songs" },
  mumbai: { spotify: "Bollywood Travel Hits", youtube: "Mumbai Bollywood Songs" },
};

interface MyItinerariesProps {
  darkMode: boolean;
  myItineraries: any[];
  setActiveTab: (tab: string) => void;
  expandedItinerary: string | null;
  setExpandedItinerary: (id: string | null) => void;
  userDetails: any; 
}

const MyItineraries: React.FC<MyItinerariesProps> = ({ darkMode, myItineraries, setActiveTab, expandedItinerary, setExpandedItinerary,userDetails}) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);

  // Debug: Log received props
  console.log('🎯 MyItineraries component rendered with:', {
    myItinerariesCount: myItineraries.length,
    myItineraries: myItineraries,
    userDetails: userDetails
  });

  // Function to map tour data to valid playlist destination
  const getPlaylistDestination = (tour: any) => {
    const DESTINATION_MAP: Record<string, string> = {
      'goa': 'goa',
      'shimla': 'shimla',
      'rajasthan': 'rajasthan',
      'jaipur': 'rajasthan',
      'jodhpur': 'rajasthan',
      'udaipur': 'rajasthan',
      'ladakh': 'ladakh',
      'kerala': 'kerala',
      'kochi': 'kerala',
      'munnar': 'kerala',
      'taj mahal': 'tajmahal',
      'agra': 'tajmahal',
      'kolkata': 'kolkata',
      'varanasi': 'varanasi',
      'mumbai': 'mumbai',
      'delhi': 'mumbai',
      'manali': 'shimla',
      'darjeeling': 'shimla',
    };

    const searchText = (tour?.destination || tour?.location || tour?.title || '').toLowerCase();
    
    for (const [key, value] of Object.entries(DESTINATION_MAP)) {
      if (searchText.includes(key)) {
        return value;
      }
    }
    
    return 'goa'; // Default fallback
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
                {/* Agent Summary Badge */}
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
                />
                <button
                  className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 z-10"
                  onClick={() => {
                    const validDest = getPlaylistDestination(itinerary.tour);
                    window.dispatchEvent(new CustomEvent('showPlaylist', { detail: { destination: validDest } }));
                  }}
                >
                  🎶 Play Travel Playlist
                </button>
              </div>
            ))}       
          </div>
        )}
      </main>

      {/* Payment Receipt Modal */}
      {showReceiptModal && selectedItinerary && (
        <PaymentReceipt
          darkMode={darkMode}
          onClose={handleCloseReceipt}
          itinerary={selectedItinerary}
          userDetails={userDetails}
        />
      )}
    </>
  );
};

export default MyItineraries
