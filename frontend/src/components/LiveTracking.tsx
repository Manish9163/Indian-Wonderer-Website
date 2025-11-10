import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Phone, MessageCircle, AlertTriangle, Battery, Signal, X, Send } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface GuideLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  altitude: number;
  battery_level: number;
  recorded_at: string;
  guide_name: string;
  guide_phone: string;
  tour_status: string;
  total_distance: number;
}

interface TourSession {
  id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_distance: number;
  guide_name: string;
  guide_phone: string;
  guide_email: string;
  customer_name: string;
  tour_name: string;
  destination: string;
  booking_reference: string;
  checkpoints?: Checkpoint[];
}

interface Checkpoint {
  id: number;
  checkpoint_name: string;
  checkpoint_description: string;
  latitude: number;
  longitude: number;
  planned_arrival: string;
  actual_arrival: string | null;
  status: 'pending' | 'reached' | 'completed' | 'skipped';
}

interface ChatMessage {
  id: number;
  sender_type: 'guide' | 'customer';
  sender_name: string;
  message: string;
  message_type: 'text' | 'image' | 'location' | 'audio';
  media_url: string | null;
  sent_at: string;
  is_read: boolean;
}

interface Props {
  bookingId: number;
  onClose: () => void;
  darkMode?: boolean;
}

const LiveTracking: React.FC<Props> = ({ bookingId, onClose, darkMode = false }) => {
  const [location, setLocation] = useState<GuideLocation | null>(null);
  const [session, setSession] = useState<TourSession | null>(null);
  const [trail, setTrail] = useState<Array<{lat: number, lng: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  // Google Maps API Key - Replace 'YOUR_API_KEY_HERE' with your actual key for production
  const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
      console.log('ℹ️ Google Maps API key not configured. Feature will be available in production.');
      setApiKeyError(true);
      setLoading(false);
      return;
    }

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script');
        setApiKeyError(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && location && !mapRef.current) {
      initializeMap();
    }
  }, [mapLoaded, location]);

  useEffect(() => {
    fetchSessionData();
    fetchCurrentLocation();
    fetchChatMessages();

    intervalRef.current = setInterval(() => {
      fetchCurrentLocation();
      fetchChatMessages();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(
        `http://localhost/fu/backend/api/realtime_tracking.php?action=session&booking_id=${bookingId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      const response = await fetch(
        `http://localhost/fu/backend/api/realtime_tracking.php?action=current_location&booking_id=${bookingId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setLocation(data.location);
        updateMap(data.location);
        
        fetchLocationTrail();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching location:', error);
      setLoading(false);
    }
  };

  const fetchLocationTrail = async () => {
    try {
      const response = await fetch(
        `http://localhost/fu/backend/api/realtime_tracking.php?action=location_history&booking_id=${bookingId}&limit=100`
      );
      const data = await response.json();
      
      if (data.success && data.trail) {
        const trailPoints = data.trail.map((point: any) => ({
          lat: parseFloat(point.latitude),
          lng: parseFloat(point.longitude)
        }));
        setTrail(trailPoints);
        updateTrailOnMap(trailPoints);
      }
    } catch (error) {
      console.error('Error fetching trail:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost/fu/backend/api/realtime_tracking.php?action=chat_messages&booking_id=${bookingId}&limit=50`
      );
      const data = await response.json();
      
      if (data.success) {
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const initializeMap = () => {
    if (!location || !window.google) return;

    const mapElement = document.getElementById('tracking-map');
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: { lat: parseFloat(location.latitude.toString()), lng: parseFloat(location.longitude.toString()) },
      zoom: 15,
      mapTypeId: 'roadmap',
      styles: darkMode ? getDarkMapStyle() : [],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: parseFloat(location.latitude.toString()), lng: parseFloat(location.longitude.toString()) },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#4F46E5',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: location.heading || 0,
      },
      title: location.guide_name,
    });

    mapRef.current = map;
    markerRef.current = marker;
  };

  const updateMap = (newLocation: GuideLocation) => {
    if (!mapRef.current || !markerRef.current || !window.google) return;

    const position = { 
      lat: parseFloat(newLocation.latitude.toString()), 
      lng: parseFloat(newLocation.longitude.toString()) 
    };

    markerRef.current.setPosition(position);
    markerRef.current.setIcon({
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 5,
      fillColor: '#4F46E5',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      rotation: newLocation.heading || 0,
    });

    mapRef.current.panTo(position);
  };

  const updateTrailOnMap = (trailPoints: Array<{lat: number, lng: number}>) => {
    if (!mapRef.current || !window.google || trailPoints.length === 0) return;

    const path = new window.google.maps.Polyline({
      path: trailPoints,
      geodesic: true,
      strokeColor: '#4F46E5',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapRef.current,
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const userId = localStorage.getItem('userId'); // Get from your auth system
      const response = await fetch('http://localhost/fu/backend/api/realtime_tracking.php?action=send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_type: 'customer',
          sender_id: userId,
          message: newMessage,
          message_type: 'text',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchChatMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const callGuide = () => {
    if (location?.guide_phone) {
      window.location.href = `tel:${location.guide_phone}`;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDistance = (km: number) => {
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(2)}km`;
  };

  const getDarkMapStyle = () => [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  ];

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-white' : 'text-gray-900'}>Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (apiKeyError) {
    return (
      <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <Navigation className="text-indigo-600" size={24} />
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Live Tracking
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Feature Preview
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
          >
            <X size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
          </button>
        </div>

        <div className="flex items-center justify-center h-[calc(100vh-80px)] p-8">
          <div className="max-w-2xl text-center">
            <div className="mb-6">
              <MapPin size={64} className="mx-auto text-indigo-600 mb-4" />
              <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🗺️ Live Tracking Feature
              </h3>
              <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Real-time guide location tracking will be available in production!
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6 mb-6`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ✨ What You'll Get:
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg`}>
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📍 Real-time Location</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Track your guide's exact position on Google Maps with live updates
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg`}>
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🛣️ Journey Trail</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    See the complete path your guide has traveled
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg`}>
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>💬 Live Chat</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Message your guide directly while tracking
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg`}>
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 Live Metrics</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Speed, distance, GPS accuracy, and battery status
                  </p>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                <strong>📝 Note:</strong> This feature requires Google Maps API key and will be fully functional in production deployment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <Navigation className="text-indigo-600" size={24} />
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Live Tracking
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {session?.tour_name || 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
        >
          <X size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
        </button>
      </div>

      <div className="relative h-[60vh]">
        <div id="tracking-map" className="w-full h-full"></div>
        
        <div className="absolute top-4 left-4 right-4 space-y-2">
          {location && (
            <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg rounded-xl p-4 shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {location.guide_name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your Tour Guide
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={callGuide}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors relative"
                  >
                    <MessageCircle size={18} />
                    {chatMessages.filter(m => !m.is_read && m.sender_type === 'guide').length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chatMessages.filter(m => !m.is_read && m.sender_type === 'guide').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-2`}>
                  <Signal size={16} className="mx-auto mb-1 text-indigo-600" />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Accuracy</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.accuracy ? `${location.accuracy.toFixed(0)}m` : 'N/A'}
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-2`}>
                  <Navigation size={16} className="mx-auto mb-1 text-indigo-600" />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Speed</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.speed ? `${location.speed.toFixed(0)} km/h` : '0 km/h'}
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-2`}>
                  <MapPin size={16} className="mx-auto mb-1 text-indigo-600" />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Distance</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.total_distance ? formatDistance(location.total_distance) : '0km'}
                  </p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-2`}>
                  <Battery size={16} className="mx-auto mb-1 text-indigo-600" />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Battery</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.battery_level || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last updated: {formatTime(location.recorded_at)}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Live
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {session?.checkpoints && session.checkpoints.length > 0 && (
        <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Tour Checkpoints
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {session.checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } ${
                  checkpoint.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    checkpoint.status === 'completed' ? 'bg-green-600' :
                    checkpoint.status === 'reached' ? 'bg-yellow-600' :
                    checkpoint.status === 'skipped' ? 'bg-red-600' :
                    'bg-gray-400'
                  }`}>
                    {checkpoint.status === 'completed' ? '✓' : '○'}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {checkpoint.checkpoint_name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {checkpoint.checkpoint_description}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  checkpoint.status === 'completed' ? 'bg-green-100 text-green-800' :
                  checkpoint.status === 'reached' ? 'bg-yellow-100 text-yellow-800' :
                  checkpoint.status === 'skipped' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {checkpoint.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showChat && (
        <div className={`absolute bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}
             style={{ height: '300px' }}>
          <div className="h-full flex flex-col">
            <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Chat with Guide
              </h3>
              <button onClick={() => setShowChat(false)} className="p-1">
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      msg.sender_type === 'customer'
                        ? 'bg-indigo-600 text-white'
                        : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_type === 'customer' ? 'text-indigo-200' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.sent_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
