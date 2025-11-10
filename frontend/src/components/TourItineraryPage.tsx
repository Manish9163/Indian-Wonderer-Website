import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Camera,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  MapPinned,
  Navigation,
  Hotel,
  Utensils,
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';

interface Tour {
  id: string | number;
  title: string;
  destination: string;
  location?: string;
  duration_days: number;
  price: number;
  rating?: number;
  reviews?: number;
  image_url?: string;
  image?: string;
  description?: string;
  highlights?: string[];
  features?: string[];
  category?: string;
  difficulty_level?: string;
  best_time?: string;
  included?: string[];
  excluded?: string[];
  cancellation_policy?: string;
  [key: string]: any; // Allow other properties like max_capacity, is_active, etc
}

interface TourItineraryPageProps {
  tour: Tour | any;
  darkMode: boolean;
  onClose: () => void;
  onBookNow: (tour: Tour | any) => void;
  userDetails?: any;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string;
  accommodation: string;
}

const TourItineraryPage: React.FC<TourItineraryPageProps> = ({ tour, darkMode, onClose, onBookNow, userDetails }) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    overview: true,
    itinerary: true,
    highlights: false,
    gallery: false,
    reviews: false,
    bestPlaces: false,
    inclusion: false,
    policies: false,
    contact: false
  });

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    loadGalleryImages();
    loadReviews();
  }, [tour.id]);

  const loadGalleryImages = async () => {
    try {
      const response = await fetch(`http://localhost/fu/backend/api/tours.php?action=gallery&tourId=${tour.id}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setGalleryImages(data.data);
      } else {
        setGalleryImages([
          tour.image_url || tour.image || '/goa.avif',
          '/shimla.avif',
          '/udaipur.avif',
          '/jaipur.avif',
          '/manali.avif'
        ]);
      }
    } catch (error) {
      setGalleryImages([
        tour.image_url || tour.image || '/goa.avif',
        '/shimla.avif',
        '/udaipur.avif'
      ]);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`http://localhost/fu/backend/api/user_feedback.php?action=get-reviews&tourId=${tour.id}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      } else {
        setReviews([
          {
            id: '1',
            userName: 'Priya Sharma',
            rating: 5,
            title: 'Absolutely Amazing!',
            comment: 'Best trip ever. Guide was knowledgeable and friendly. Highly recommended!',
            date: '2025-01-08',
            verified: true,
            helpful: 12
          },
          {
            id: '2',
            userName: 'Rajesh Kumar',
            rating: 4,
            title: 'Great Experience',
            comment: 'Well planned itinerary. Only minor issue with timing.',
            date: '2025-01-05',
            verified: true,
            helpful: 8
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Sample itinerary data
  const itineraryDays: ItineraryDay[] = Array.from({ length: tour.duration_days }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1}: Explore ${tour.destination}`,
    description: `Experience the beauty and culture of ${tour.destination} on day ${i + 1}. Witness stunning landscapes and local attractions.`,
    activities: ['Guided tour of local attractions', 'Photography session', 'Cultural experience', 'Local market visit'],
    meals: 'Breakfast, Lunch, Dinner included',
    accommodation: 'Luxury 3-star hotel'
  }));

  const bestPlaces = [
    { name: 'Main Market', distance: '2 km', rating: 4.5, description: 'Traditional shopping hub' },
    { name: 'Central Park', distance: '1.5 km', rating: 4.8, description: 'Perfect for morning walks' },
    { name: 'Local Restaurant', distance: '0.5 km', rating: 4.6, description: 'Authentic local cuisine' },
    { name: 'Temple', distance: '3 km', rating: 4.9, description: 'Sacred historical site' },
    { name: 'Beach', distance: '5 km', rating: 4.7, description: 'Scenic sunset views' }
  ];

  const SectionHeader = ({ title, icon: Icon, section }: { title: string; icon: any; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
        darkMode
          ? 'bg-gray-800 hover:bg-gray-700'
          : 'bg-white hover:bg-gray-50'
      } border-l-4 ${
        expandedSections[section]
          ? 'border-l-blue-500'
          : darkMode
          ? 'border-l-gray-600'
          : 'border-l-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="text-blue-500" size={24} />
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="text-blue-500" size={24} />
      ) : (
        <ChevronDown className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={24} />
      )}
    </button>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-lg`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowLeft size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {tour.title}
              </h1>
              <p className={`flex items-center gap-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <MapPin size={16} />
                {tour.destination || tour.location}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-lg transition-all ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart size={24} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Overview Section */}
            {expandedSections.overview && (
              <div>
                <SectionHeader title="Tour Overview" icon={MapPin} section="overview" />
                {expandedSections.overview && (
                  <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} space-y-4`}>
                    <div className="relative w-full rounded-lg overflow-hidden h-96">
                      <img
                        src={tour.image_url || tour.image || '/goa.avif'}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/goa.avif';
                        }}
                      />
                    </div>
                    <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {tour.description || 'Experience an unforgettable journey through stunning landscapes and cultural attractions.'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={20} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {tour.duration_days}D
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={20} className="text-green-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price</span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          ₹{tour.price.toLocaleString()}
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={20} className="text-yellow-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating</span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {tour.rating || 0}
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle size={20} className="text-purple-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reviews</span>
                        </div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {tour.reviews || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Itinerary Section */}
            <div>
              <SectionHeader title="Day by Day Itinerary" icon={Calendar} section="itinerary" />
              {expandedSections.itinerary && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} space-y-4`}>
                  {itineraryDays.map((day: ItineraryDay, index: number) => (
                    <div
                      key={day.day}
                      className={`p-5 rounded-lg border-l-4 border-blue-500 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {day.title}
                          </h3>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {day.description}
                          </p>
                        </div>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Day {day.day}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Activities */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-orange-500" />
                            <span className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Activities
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-6">
                            {day.activities.map((activity: string, i: number) => (
                              <span
                                key={i}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  darkMode
                                    ? 'bg-gray-600 text-gray-200'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Meals */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Utensils size={16} className="text-green-500" />
                            <span className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Meals
                            </span>
                          </div>
                          <p className={`ml-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {day.meals}
                          </p>
                        </div>

                        {/* Accommodation */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Hotel size={16} className="text-blue-500" />
                            <span className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Accommodation
                            </span>
                          </div>
                          <p className={`ml-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {day.accommodation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights Section */}
            <div>
              <SectionHeader title="Highlights" icon={CheckCircle} section="highlights" />
              {expandedSections.highlights && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} grid grid-cols-1 md:grid-cols-2 gap-3`}>
                  {(tour.highlights || [
                    'Stunning mountain views',
                    'Local culture experience',
                    'Adventure activities',
                    'Authentic cuisine',
                    'Professional guides',
                    'Comfortable accommodations'
                  ]).map((highlight: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-1" />
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Section */}
            <div>
              <SectionHeader title="Photo Gallery" icon={Camera} section="gallery" />
              {expandedSections.gallery && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {galleryImages.slice(0, 6).map((image: string, index: number) => (
                      <div key={index} className="relative rounded-lg overflow-hidden h-40 group cursor-pointer">
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/goa.avif';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                          <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {galleryImages.length > 6 && (
                    <button className="w-full mt-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
                      View All {galleryImages.length} Photos
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Best Places Around Section */}
            <div>
              <SectionHeader title="Best Places Around" icon={MapPinned} section="bestPlaces" />
              {expandedSections.bestPlaces && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} space-y-4`}>
                  {bestPlaces.map((place: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      } flex items-start justify-between`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {place.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_: any, i: number) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < Math.floor(place.rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {place.description}
                        </p>
                      </div>
                      <div className={`text-right ml-4 flex-shrink-0 p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                        <Navigation size={20} className="text-blue-500 mb-1" />
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {place.distance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div>
              <SectionHeader title="Reviews & Ratings" icon={MessageCircle} section="reviews" />
              {expandedSections.reviews && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} space-y-4`}>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} mb-6`}>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-4xl font-bold text-blue-500">{tour.rating || 0}</div>
                        <div className="flex gap-1 mt-2">
                          {[...Array(5)].map((_: any, i: number) => (
                            <Star
                              key={i}
                              size={18}
                              className={i < Math.floor(tour.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-400'}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Based on {tour.reviews || 0} verified reviews
                        </p>
                      </div>
                    </div>
                  </div>

                  {reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {review.userName}
                            </h4>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_: any, i: number) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                      <h5 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {review.title}
                      </h5>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                        {review.comment}
                      </p>
                      <button className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded transition-colors ${
                        darkMode
                          ? 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}>
                        👍 Helpful ({review.helpful})
                      </button>
                    </div>
                  ))}

                  <button className="w-full py-2 rounded-lg border-2 border-blue-500 text-blue-500 font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                    Write a Review
                  </button>
                </div>
              )}
            </div>

            {/* Inclusions Section */}
            <div>
              <SectionHeader title="What's Included & Excluded" icon={CheckCircle} section="inclusion" />
              {expandedSections.inclusion && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} grid grid-cols-1 md:grid-cols-2 gap-8`}>
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                      ✓ Included
                    </h3>
                    <ul className="space-y-2">
                      {(tour.included || [
                        'Accommodations',
                        'Meals (B/L/D)',
                        'Guided tours',
                        'Transportation',
                        'Entry fees'
                      ]).map((item: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                      ✗ Not Included
                    </h3>
                    <ul className="space-y-2">
                      {(tour.excluded || [
                        'Flight tickets',
                        'Personal expenses',
                        'Travel insurance',
                        'Tips & gratuities',
                        'Optional activities'
                      ]).map((item: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Policies Section */}
            <div>
              <SectionHeader title="Cancellation & Policies" icon={AlertCircle} section="policies" />
              {expandedSections.policies && (
                <div className={`p-6 rounded-b-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} space-y-4`}>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border`}>
                    <h4 className={`font-bold mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                      Cancellation Policy
                    </h4>
                    <ul className={`text-sm space-y-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      <li>• Full refund if cancelled 7+ days before tour</li>
                      <li>• 50% refund if cancelled 3-7 days before</li>
                      <li>• No refund if cancelled within 3 days</li>
                      <li>• Emergency cancellations may be considered case by case</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
                    <h4 className={`font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                      Important Notes
                    </h4>
                    <ul className={`text-sm space-y-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      <li>• Valid passport required</li>
                      <li>• Weather may affect certain activities</li>
                      <li>• Physical fitness level: Moderate</li>
                      <li>• Backup dates available upon request</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg sticky top-20 space-y-4`}>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Price per person
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ₹{tour.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-b border-gray-600 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Group or individual tours available
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-green-500" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Flexible departure dates
                  </span>
                </div>
              </div>

              <button
                onClick={() => onBookNow(tour)}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Book Now
              </button>

              <button className={`w-full py-3 rounded-lg border-2 font-bold transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Add to Wishlist
              </button>

              {/* Contact Section */}
              <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
                <SectionHeader title="Contact & Support" icon={Phone} section="contact" />
                {expandedSections.contact && (
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-blue-500 flex-shrink-0" />
                      <div className="text-sm">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>+91-9876543210</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-green-500 flex-shrink-0" />
                      <div className="text-sm">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>support@tour.com</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
                <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  🛡️ TRUST & SAFETY
                </p>
                <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>✓ Verified tours since 2015</p>
                  <p>✓ 24/7 customer support</p>
                  <p>✓ Money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourItineraryPage;
