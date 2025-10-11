'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  bookingId: number;
  guideId: number;
  tourName: string;
  isActive: boolean;
  onLocationUpdate?: (location: LocationData) => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  battery_level: number | null;
}

export default function LocationSharing({ bookingId, guideId, tourName, isActive, onLocationUpdate }: Props) {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isMandatoryTracking, setIsMandatoryTracking] = useState(false);
  const [tourDates, setTourDates] = useState<{start: string, end: string} | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get battery level if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Check if tour is currently active (within travel dates)
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const response = await fetch(`http://localhost/fu/backend/api/bookings.php?id=${bookingId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          const booking = data.data;
          const travelDate = booking.travel_date;
          const tourEndDate = booking.tour_end_date;
          
          if (travelDate && tourEndDate) {
            setTourDates({ start: travelDate, end: tourEndDate });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const startDate = new Date(travelDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(tourEndDate);
            endDate.setHours(23, 59, 59, 999);
            
            // Check if today is within tour period
            const isWithinTourPeriod = today >= startDate && today <= endDate;
            
            if (isWithinTourPeriod) {
              setIsMandatoryTracking(true);
              // Auto-start tracking if tour is active
              if (!isTracking) {
                setIsTracking(true);
              }
            } else {
              setIsMandatoryTracking(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };
    
    checkTourStatus();
    // Check every 5 minutes
    const interval = setInterval(checkTourStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    if (isActive && isTracking) {
      startTracking();
    } else if (!isMandatoryTracking) {
      // Only allow stopping if not mandatory
      stopTracking();
    }

    return () => {
      if (!isMandatoryTracking) {
        stopTracking();
      }
    };
  }, [isActive, isTracking, bookingId, isMandatoryTracking]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device');
      return;
    }

    // Increased timeout and added maximumAge for better reliability
    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 5000, // Allow cached position up to 5 seconds old
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          altitude: position.coords.altitude,
          battery_level: batteryLevel,
        };

        setLocation(locationData);
        setError(null);
        
        // Send to backend
        sendLocationUpdate(locationData);
        
        // Callback
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
        
        setUpdateCount(prev => prev + 1);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Location error:', error);
        
        // Handle timeout errors more gracefully
        if (error.code === 3) {
          // Timeout - try with lower accuracy
          setError('Getting precise location... Using approximate location.');
          
          // Fallback to lower accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                heading: position.coords.heading,
                altitude: position.coords.altitude,
                battery_level: batteryLevel,
              };
              
              setLocation(locationData);
              setError(null);
              sendLocationUpdate(locationData);
              
              if (onLocationUpdate) {
                onLocationUpdate(locationData);
              }
            },
            (fallbackError) => {
              // eslint-disable-next-line no-console
              console.error('Fallback location error:', fallbackError);
              setError(getErrorMessage(fallbackError.code));
            },
            {
              enableHighAccuracy: false, // Use lower accuracy for fallback
              timeout: 15000,
              maximumAge: 10000,
            }
          );
        } else {
          setError(getErrorMessage(error.code));
        }
      },
      options
    );

    watchIdRef.current = watchId;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const sendLocationUpdate = async (locationData: LocationData) => {
    try {
      const response = await fetch('http://localhost/fu/backend/api/realtime_tracking.php?action=update_location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: guideId,
          booking_id: bookingId,
          ...locationData,
          recorded_at: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        // eslint-disable-next-line no-console
        console.error('Failed to update location:', data.message);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending location update:', error);
    }
  };

  const toggleTracking = () => {
    // Prevent stopping GPS during active tour
    if (isMandatoryTracking && isTracking) {
      setError('🚫 GPS tracking cannot be turned off during an active tour. This is required for customer safety and tour management.');
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      return;
    }
    setIsTracking(!isTracking);
  };

  const getErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return 'Location permission denied. Please enable location access in your browser settings.';
      case 2:
        return 'Location information unavailable. Check if location services are enabled on your device.';
      case 3:
        return 'Location request timed out. Trying with approximate location... Make sure you have a clear GPS signal.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSpeedInKmh = (speed: number | null) => {
    if (speed === null || speed === undefined) return 0;
    return (speed * 3.6).toFixed(1); // Convert m/s to km/h
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 shadow-lg border border-indigo-100">
      {/* Mandatory Tracking Banner */}
      {isMandatoryTracking && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center space-x-3">
          <span className="text-amber-600 text-2xl">🔒</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Mandatory Tracking Active</p>
            <p className="text-xs text-amber-700">GPS cannot be disabled during tour period for safety & security</p>
            {tourDates && (
              <p className="text-xs text-amber-600 mt-1">
                Tour: {new Date(tourDates.start).toLocaleDateString()} - {new Date(tourDates.end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg text-2xl ${isTracking ? 'bg-green-100' : 'bg-gray-100'}`}>
            {isTracking ? '📍' : '📌'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Live Location Tracking</h3>
            <p className="text-sm text-gray-600">{tourName}</p>
            {isMandatoryTracking && (
              <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1">
                <span className="mr-1">🔒</span> Required
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={toggleTracking}
          disabled={!isActive || (isMandatoryTracking && isTracking)}
          className={`p-3 rounded-lg transition-all duration-300 text-xl font-bold ${
            isMandatoryTracking && isTracking
              ? 'bg-gray-400 cursor-not-allowed text-white shadow-lg opacity-50'
              : isTracking
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed'
          }`}
          title={
            isMandatoryTracking && isTracking
              ? 'GPS locked during active tour'
              : isTracking
              ? 'Stop tracking'
              : 'Start tracking'
          }
        >
          {isMandatoryTracking && isTracking ? '🔒' : isTracking ? '⏹' : '▶'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <span className="text-red-600 text-xl">⚠️</span>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isTracking && location && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Tracking Active</span>
            <span className="text-xs text-gray-500">({updateCount} updates)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-indigo-600">📡</span>
                <span className="text-xs text-gray-600">GPS Accuracy</span>
              </div>
              <p className={`text-lg font-semibold ${getAccuracyColor(location.accuracy)}`}>
                {location.accuracy.toFixed(0)}m
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-indigo-600">🚗</span>
                <span className="text-xs text-gray-600">Speed</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {getSpeedInKmh(location.speed)} km/h
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-indigo-600">🗺️</span>
                <span className="text-xs text-gray-600">Coordinates</span>
              </div>
              <p className="text-xs font-mono text-gray-900">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-indigo-600">🔋</span>
                <span className="text-xs text-gray-600">Battery</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {location.battery_level || batteryLevel || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <p className="text-xs text-indigo-700">
              <span className="font-semibold">📍 Your location is being shared</span> with the customer in real-time. 
              They can see your current position on their map.
            </p>
          </div>
        </div>
      )}

      {!isTracking && !error && (
        <div className="text-center py-6">
          <div className="text-6xl mb-3">🧭</div>
          <p className="text-sm text-gray-600 mb-2">Location tracking is {isActive ? 'ready' : 'disabled'}</p>
          {isActive && (
            <p className="text-xs text-gray-500">
              Click the play button to start sharing your live location with the customer
            </p>
          )}
          {!isActive && (
            <p className="text-xs text-gray-500">
              Start the tour to enable location tracking
            </p>
          )}
        </div>
      )}
    </div>
  );
}
