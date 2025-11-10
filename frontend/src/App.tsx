import React, {useState, useEffect} from "react";
import BookingModal from "./components/BookingModal";
import ExploreTours from "./components/ExploreTours";
import Footer from "./components/FooterComponent";
import Header from "./components/Header";
import MobileNavigation from "./components/MobileNavigation";
import MyItineraries from "./components/MyItineraries";
import Orders from "./components/Orders";
import UserAuth from "./components/UserAuth";
import Payment from "./components/Payment";
import DestinationPlaylist from "./components/PlayList";
import PaymentReceipt from "./components/PaymentRecipt";
import AgentSelector from "./components/AgentSelector";
import ChatBotAI from "./components/ChatBotAI";
import UserProfile from "./components/UserProfile";
import TourBooking from "./components/TourBooking";
import AgentApplication from "./components/AgentApplication";
import Wallet from "./components/Wallet";
import TourItineraryPage from "./components/TourItineraryPage";
import { ToastContainer, useToast } from "./components/Toast";

import { Tour, transformTourData } from "./types/data";
import apiService from "./services/api.service";

const App = () => {
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTourItinerary, setShowTourItinerary] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentBookingData, setCurrentBookingData] = useState<BookingData | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [myItineraries, setMyItineraries] = useState<Itinerary[]>(() => {
    try {
      const cached = localStorage.getItem('myItineraries');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedItinerary, setExpandedItinerary] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]); 
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch tours
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        const response = await apiService.getTours();
        if (response.success && response.data && response.data.tours) {
          const transformedTours = response.data.tours.map(transformTourData);
          setTours(transformedTours);
        } else {
          console.warn('No tours data received from API');
          setApiError('No tours available at the moment');
          setTours([]);
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
        setApiError('Failed to load tours. Please check your connection.');
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userData');
    
    if (token && userProfile) {
      try {
        const parsedUser = JSON.parse(userProfile);
        setIsAuthenticated(true);
        setUserDetails(parsedUser);
        apiService.setAuthToken(token);
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    
    setAuthInitialized(true);
  }, []);

  // Fetch user bookings when authenticated
  useEffect(() => {
    const fetchBookings = async () => {
      if (!authInitialized) {
        console.log('⏳ Auth not initialized yet, skipping bookings fetch');
        return;
      }
      
      if (!isAuthenticated || !userDetails) {
        console.log('❌ User not authenticated, clearing itineraries');
        setMyItineraries([]);
        return;
      }

      console.log('📥 Fetching bookings for user:', userDetails);
      try {
        const response = await apiService.getBookings();
        console.log('📦 Bookings API response:', response);
        
        if (response.success && response.data && response.data.bookings) {
          console.log(`✅ Found ${response.data.bookings.length} bookings for user`);
          console.log('📋 Raw bookings data:', response.data.bookings);
          
          const transformedItineraries = response.data.bookings.map((booking: any) => {
            let travelerDetails = booking.traveler_details;
            if (typeof travelerDetails === 'string') {
              try {
                travelerDetails = JSON.parse(travelerDetails);
              } catch (e) {
                travelerDetails = null;
              }
            }

            const phone = travelerDetails?.[0]?.phone || travelerDetails?.phone || '';

            const tourData = {
              id: booking.tour_id,
              title: booking.tour_title,
              destination: booking.destination,
              price: booking.tour_price || booking.total_amount,
              duration_days: booking.duration_days,
              category: booking.category,
              description: booking.description,
              image: booking.image_url,
              itinerary: booking.itinerary || [] 
            };

            console.log(`🔄 Transforming booking #${booking.id}:`, { booking, tourData, travelerDetails });

            return {
              id: booking.id,
              tourId: booking.tour_id,
              tour: transformTourData(tourData), 
              bookingData: {
                name: `${booking.first_name} ${booking.last_name}`, 
                firstName: booking.first_name,
                lastName: booking.last_name,
                email: booking.email,
                phone: phone, 
                travelers: booking.number_of_travelers || 1, 
                date: booking.travel_date, 
                requirements: booking.special_requirements, 
                
                booking_reference: booking.booking_reference,
                number_of_travelers: booking.number_of_travelers,
                total_amount: booking.total_amount,
                booking_date: booking.booking_date,
                travel_date: booking.travel_date,
                special_requirements: booking.special_requirements,
                traveler_details: travelerDetails, 
                customer_name: `${booking.first_name} ${booking.last_name}`,
                customer_email: booking.email
              },
              guide_info: booking.guide_info, 
              selectedAgent: booking.guide_info ? {
                id: booking.guide_info.id || 0,
                name: booking.guide_info.name || 'Not Assigned',
                avatar: booking.guide_info.avatar || '',
                specialization: booking.guide_info.specialization ? [booking.guide_info.specialization] : [],
                languages: [],
                experience: 0,
                rating: booking.guide_info.rating || 0,
                reviews: 0,
                location: '',
                phone: booking.guide_info.phone || '',
                email: booking.guide_info.email || '',
                bio: '',
                price: 0,
                availability: [],
                badges: []
              } : null,
              status: booking.status,
              bookedAt: booking.created_at,
              paymentData: booking.payment_status ? {
                paymentId: booking.booking_reference || booking.id,
                method: 'card', 
                amount: booking.total_amount,
                currency: 'INR',
                status: booking.payment_status,
                timestamp: booking.created_at,
                details: {}
              } : undefined,
              refundData: (booking.refund_id || booking.giftcard_code) ? {
                refund_id: booking.refund_id,
                refund_amount: booking.refund_amount,
                refund_status: booking.refund_status,
                refund_method: booking.refund_method,
                refund_initiated_at: booking.refund_initiated_at,
                giftcard_code: booking.giftcard_code,
                giftcard_amount: booking.giftcard_amount,
                giftcard_balance: booking.giftcard_balance,
                giftcard_status: booking.giftcard_status,
                giftcard_expiry: booking.giftcard_expiry
              } : undefined
            };
          });
          
          console.log('✨ Transformed itineraries:', transformedItineraries);
          
          const uniqueItineraries = transformedItineraries.filter((itinerary: any, index: number, self: any[]) => {
            const bookingRef = itinerary.bookingData?.booking_reference || itinerary.id;
            return index === self.findIndex((t: any) => 
              (t.bookingData?.booking_reference || t.id) === bookingRef
            );
          });
          
          console.log('🎯 All unique itineraries (including cancelled):', uniqueItineraries);
          setMyItineraries(uniqueItineraries);
        } else {
          setMyItineraries([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setMyItineraries([]);
      }
    };

    if (isAuthenticated && userDetails) {
      fetchBookings();
    }
  }, [authInitialized, isAuthenticated, userDetails]);

  useEffect(() => {
    try {
      localStorage.setItem('myItineraries', JSON.stringify(myItineraries));
    } catch (error) {
      console.error('Error saving itineraries to localStorage:', error);
    }
  }, [myItineraries]);

  interface BookingData {
    [key: string]: any;
  }

  interface PaymentData {
    paymentId: string;
    method: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
    details: any;
  }

  interface Agent {
    id: number;
    name: string;
    full_name?: string;
    avatar: string;
    profile_photo?: string;
    specialization: string | string[];
    languages: string[];
    experience: number;
    experience_years?: number;
    rating: number;
    reviews: number;
    total_assignments?: number;
    location: string;
    phone: string;
    email: string;
    bio: string;
    availability: string[];
    badges: string[];
    status?: string;
    isOnline?: boolean;
    responseTime?: string;
  }

  interface Itinerary {
    id: number;
    tourId: number;
    tour: Tour;
    bookingData: BookingData;
    status: string;
    bookedAt: string;
    paymentData?: PaymentData;
    selectedAgent?: Agent | null;
  }

  const handleBookTour = (tour: Tour, action?: 'view' | 'book') => {
    if (action === 'view') {
      // Show the full itinerary page
      setSelectedTour(tour);
      setShowTourItinerary(true);
    } else {
      // Default: show booking modal
      setSelectedTour(tour);
      setShowBookingModal(true);
    }
  };
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistDestination, setPlaylistDestination] = useState<string>("");
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleConfirmBooking = (bookingData: BookingData) => {
    console.log('📝 Booking data confirmed:', bookingData);
    setCurrentBookingData(bookingData);
    
    localStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
    if (selectedTour) {
      localStorage.setItem('pendingTourData', JSON.stringify(selectedTour));
    }
    
    setShowBookingModal(false);
    setShowAgentSelector(true);
  };

  const handleAgentSelect = (agent: Agent | null) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
    setShowPaymentModal(true);
  };

  const handleCloseAgentSelector = () => {
    setShowAgentSelector(false);
    setShowBookingModal(true); 
  };

  const handleShowProfile = () => {
    setShowUserProfile(true);
  };

  const handleUpdateProfile = (profileData: any) => {
    const updatedUserDetails = {
      ...(userDetails || {}),
      ...profileData,
      avatar: profileData.avatar || (userDetails as any)?.avatar,
      avatarSvg: profileData.avatarSvg || (userDetails as any)?.avatarSvg,
      profilePhoto: profileData.profilePhoto || (userDetails as any)?.profilePhoto
    };
    
    setUserDetails(updatedUserDetails);
    localStorage.setItem('userData', JSON.stringify(updatedUserDetails));
  };

  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  const handlePaymentSuccess = async (paymentData: PaymentData) => {
    try {
      const userId = (userDetails as any)?.id;
      
      let bookingData = currentBookingData;
      let tourData = selectedTour;
      
      if (!bookingData) {
        const stored = localStorage.getItem('pendingBookingData');
        if (stored) {
          bookingData = JSON.parse(stored);
          console.log('🔄 Recovered booking data from localStorage');
        }
      }
      
      if (!tourData) {
        const stored = localStorage.getItem('pendingTourData');
        if (stored) {
          tourData = JSON.parse(stored);
          console.log('🔄 Recovered tour data from localStorage');
        }
      }
      
      // Debug logging
      console.log('🔍 Payment Success - Checking data:', {
        hasUserId: !!userId,
        hasSelectedTour: !!tourData,
        hasBookingData: !!bookingData,
        userDetails: userDetails,
        selectedTour: tourData,
        currentBookingData: bookingData
      });

      if (!userId) {
        console.error('❌ Missing user ID - user not logged in');
        showError('Authentication Required', 'You must be logged in to complete booking. Please login and try again.');
        return;
      }

      if (!tourData) {
        console.error('❌ Missing selected tour');
        showError('Tour Not Selected', 'No tour selected. Please select a tour and try again.');
        return;
      }

      if (!bookingData) {
        console.error('❌ Missing booking data');
        showError('Booking Data Missing', 'Booking information missing. Please fill the booking form again.');
        return;
      }

      const bookingDate = new Date().toISOString().split('T')[0];
      const travelDate = bookingData.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(new Date(travelDate).getTime() + ((tourData.duration_days || 3) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const bookingPayload = {
        user_id: userId,
        tour_id: tourData.id,
        booking_date: bookingDate,
        travel_date: travelDate,
        start_date: travelDate,
        end_date: endDate,
        guests: bookingData.travelers || 1,
        number_of_travelers: bookingData.travelers || 1,
        total_amount: tourData.price * (bookingData.travelers || 1),
        special_requirements: bookingData.requirements || null,
        status: 'confirmed', 
        payment_status: 'paid',
        payment_method: paymentData?.method || 'credit_card', 
        guide_id: selectedAgent?.id || null 
      };

      console.log('📤 Creating booking in backend:', bookingPayload);
      console.log('📤 Selected guide:', selectedAgent);

      const response = await apiService.createBooking(bookingPayload);

      if (response.success) {
        console.log('✅ Booking created in backend:', response.data);
        
        if (selectedAgent && response.data.id) {
          try {
            const assignResponse = await apiService.post('guides.php?action=assign', {
              booking_id: response.data.id,
              guide_id: selectedAgent.id,
              notes: `Guide selected by customer for tour: ${tourData.title}`
            });
            console.log('✅ Guide assigned:', assignResponse);
          } catch (error) {
            console.error('Failed to assign guide:', error);
          }
        }

        const newItinerary: Itinerary = {
          id: response.data.id || Date.now(), 
          tourId: tourData.id,
          tour: tourData,
          bookingData: bookingData,
          status: 'confirmed',
          bookedAt: new Date().toLocaleDateString(),
          paymentData: paymentData,
          selectedAgent: selectedAgent 
        };
        
        setMyItineraries([...myItineraries, newItinerary]);
        setCurrentItinerary(newItinerary);
        setShowPaymentModal(false);
        
        showSuccess(
          'Booking Confirmed! 🎉', 
          `Your tour has been booked successfully. Reference: ${response.data.booking_reference || response.data.id}`
        );
        
        setShowPlaylist(true);
        setPlaylistDestination(getPlaylistDestination(tourData));
        
        setTimeout(() => {
          setShowReceiptModal(true);
        }, 500);
        
        setSelectedTour(null);
        setCurrentBookingData(null);
        setSelectedAgent(null);
        localStorage.removeItem('pendingBookingData');
        localStorage.removeItem('pendingTourData');
        
        setTimeout(() => {
          setActiveTab('itineraries');
        }, 3000);
      } else {
        console.error('❌ Booking creation failed:', response.message);
        showError('Booking Failed', response.message || 'Unable to create booking. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Error creating booking:', error);
      showError('Booking Error', error.message || 'An unexpected error occurred. Please try again.');
    }
  };
  const handleClosePlaylist = () => {
    setShowPlaylist(false);
    setPlaylistDestination("");
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedTour(null);
  };

  const handleCloseTourItinerary = () => {
    setShowTourItinerary(false);
    setSelectedTour(null);
  };

  const handleClosePaymentModal = () => {
    console.log('⚠️ Payment modal closed by user');
    setShowPaymentModal(false);
  };

  const handleBackToBooking = () => {
    setShowPaymentModal(false);
    setShowBookingModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setCurrentItinerary(null);
  };

  const handleAuthSuccess = (userData: any) => {
    setUserDetails(userData);
    setIsAuthenticated(true);
    
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
      apiService.setAuthToken(userData.token);
    }
    localStorage.setItem('userData', JSON.stringify(userData));
    
    const userName = userData.name || userData.first_name || 'there';
    showSuccess('Welcome Back! 👋', `Great to see you again, ${userName}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserDetails(null);
    setActiveTab('explore');
    setMyItineraries([]);
    setShowBookingModal(false);
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setShowAgentSelector(false);
    setSelectedTour(null);
    setCurrentBookingData(null);
    setCurrentItinerary(null);
    setSelectedAgent(null);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('myItineraries'); 
    apiService.setAuthToken(null);
    
    localStorage.setItem('justLoggedOut', 'true');
  };

  React.useEffect(() => {
    const handler = (e: any) => {
      setShowPlaylist(true);
      setPlaylistDestination(e.detail.destination);
    };
    window.addEventListener('showPlaylist', handler);
    return () => window.removeEventListener('showPlaylist', handler);
  }, []);

  const getPlaylistDestination = (tour: Tour) => {
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

    const searchText = (tour.destination || tour.location || tour.title || '').toLowerCase();
    
    for (const [key, value] of Object.entries(DESTINATION_MAP)) {
      if (searchText.includes(key)) {
        return value;
      }
    }
    
    return 'goa';
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <UserAuth 
          onAuthSuccess={handleAuthSuccess} 
          showToast={{ showSuccess, showError, showWarning, showInfo }}
        />
        <ToastContainer 
          toasts={toasts} 
          onRemove={removeToast} 
          darkMode={false} 
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myItineraries={myItineraries}
        userDetails={userDetails}
        onLogout={handleLogout}
        onShowProfile={handleShowProfile}
        onShowWallet={() => setShowWalletModal(true)}
      />

      {activeTab === 'explore' && (
        <ExploreTours
          darkMode={darkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          tours={tours}
          onBookTour={handleBookTour}
          loading={loading}
          apiError={apiError}
        />
      )}

      {activeTab === 'booking' && (
        <TourBooking />
      )}

      {activeTab === 'agent-application' && (
        <AgentApplication />
      )}

      {activeTab === 'itineraries' && (
        <MyItineraries
          darkMode={darkMode}
          myItineraries={myItineraries.filter(i => i.status !== 'cancelled')}
          setActiveTab={setActiveTab}
          expandedItinerary={expandedItinerary}
          setExpandedItinerary={setExpandedItinerary}
          userDetails={userDetails} // Pass userDetails to MyItineraries
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showWarning}
          showInfo={showInfo}
        />
      )}

      {activeTab === 'orders' && (
        <Orders
          darkMode={darkMode}
          myItineraries={myItineraries}
          userDetails={userDetails}
        />
      )}

      <Footer darkMode={darkMode} />

      <MobileNavigation
        darkMode={darkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myItineraries={myItineraries}
      />

      {/* Booking Modal */}
      {showBookingModal && selectedTour && (
        <BookingModal
          selectedTour={selectedTour}
          darkMode={darkMode}
          onClose={handleCloseBookingModal}
          onConfirmBooking={handleConfirmBooking}
          userDetails={userDetails}
        />
      )}

      {/* Tour Itinerary Page */}
      {showTourItinerary && selectedTour && (
        <TourItineraryPage
          tour={selectedTour as any}
          darkMode={darkMode}
          onClose={handleCloseTourItinerary}
          onBookNow={(tour: any) => {
            setShowTourItinerary(false);
            handleBookTour(tour, 'book');
          }}
          userDetails={userDetails}
        />
      )}

      {/* Agent Selector Modal */}
      {showAgentSelector && selectedTour && (
        <AgentSelector
          darkMode={darkMode}
          onAgentSelect={handleAgentSelect}
          selectedDestination={selectedTour.destination || selectedTour.location}
          onClose={handleCloseAgentSelector}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTour && currentBookingData && (
        <Payment
          selectedTour={selectedTour}
          bookingData={currentBookingData}
          darkMode={darkMode}
          onClose={handleClosePaymentModal}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={handleBackToBooking}
        />
      )}

      {/* Payment Receipt Modal */}
      {showReceiptModal && currentItinerary && (
        <PaymentReceipt
          darkMode={darkMode}
          onClose={handleCloseReceiptModal}
          itinerary={currentItinerary}
          userDetails={userDetails}
        />
      )}
      {/* Destination Playlist Popup */}
      {showPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-8 relative max-w-2xl w-full">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl"
              onClick={handleClosePlaylist}
              aria-label="Close Playlist"
            >
              &times;
            </button>
            <DestinationPlaylist destination={playlistDestination} />
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile
          darkMode={darkMode}
          userDetails={userDetails}
          onUpdateProfile={handleUpdateProfile}
          onClose={handleCloseProfile}
        />
      )}

      {/* Wallet Modal */}
      {showWalletModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl`}>
            <Wallet
              darkMode={darkMode}
              userId={(userDetails as any)?.id}
              onClose={() => setShowWalletModal(false)}
            />
          </div>
        </div>
      )}

      {/* ChatBot AI */}
      <ChatBotAI darkMode={darkMode} />

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
        darkMode={darkMode} 
      />

    </div>
  );
};

export default App;
