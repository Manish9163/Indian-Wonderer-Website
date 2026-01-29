import React, { useState, useEffect } from 'react';
import {
    Plane, Bus, Train, X, Star, MapPin, Clock, Calendar, Users, Shield,
    Wifi, Coffee, Zap, Wind, Tv, Utensils, Check, ThumbsUp, MessageCircle,
    Award, TrendingUp, Info, AlertCircle, ChevronLeft, IndianRupee, Armchair
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TravelDetailProps {
    travelId: string;
    mode: 'flight' | 'bus' | 'train';
    onClose: () => void;
    onBookNow: (travelData: any) => void;
}

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
    helpful_count?: number;
}

interface TravelDetails {
    id: string;
    mode: 'flight' | 'bus' | 'train';
    operator_name: string;
    vehicle_number: string;
    seat_class: string;
    from_city: string;
    to_city: string;
    travel_date: string;
    travel_time: string;
    duration: string;
    cost: number;
    tax: number;
    total_amount: number;
    total_seats: number;
    available_seats: number;
    amenities: string[];
    rating: number;
    total_reviews: number;
    status: string;
    description?: string;
    images?: string[];
    cancellation_policy?: string;
    baggage_policy?: string;
}

const TravelDetailPage: React.FC<TravelDetailProps> = ({ travelId, mode, onClose, onBookNow }) => {
    const [travelDetails, setTravelDetails] = useState<TravelDetails | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'reviews' | 'policies'>('overview');
    const [showAllAmenities, setShowAllAmenities] = useState(false);

    useEffect(() => {
        loadTravelDetails();
        loadReviews();
    }, [travelId]);

    const loadTravelDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost/fu/backend/api/travel.php?action=details&id=${travelId}`
            );
            const data = await response.json();
            
            if (data.success) {
                const details = data.data;
                setTravelDetails({
                    ...details,
                    cost: parseFloat(details.cost) || 0,
                    tax: parseFloat(details.tax) || 0,
                    total_amount: parseFloat(details.total_amount || details.price) || 0,
                    rating: parseFloat(details.avg_rating) || 0,
                    total_reviews: parseInt(details.total_bookings) || 0,
                    // Mock images based on mode
                    images: getMockImages(details.mode, details.operator_name),
                    description: getMockDescription(details.mode, details.operator_name),
                    cancellation_policy: getMockCancellationPolicy(details.mode),
                    baggage_policy: getMockBaggagePolicy(details.mode)
                });
            }
        } catch (err) {
            toast.error('Failed to load travel details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        // Mock reviews for now
        setReviews([
            {
                id: '1',
                user_name: 'Rajesh Kumar',
                rating: 5,
                comment: 'Excellent service! Very comfortable journey. Staff was very helpful and professional.',
                created_at: '2026-01-25',
                helpful_count: 24
            },
            {
                id: '2',
                user_name: 'Priya Sharma',
                rating: 4,
                comment: 'Good experience overall. Clean and on time. Would recommend to others.',
                created_at: '2026-01-20',
                helpful_count: 18
            },
            {
                id: '3',
                user_name: 'Amit Patel',
                rating: 5,
                comment: 'Amazing journey! All amenities were working perfectly. Great value for money.',
                created_at: '2026-01-15',
                helpful_count: 32
            },
            {
                id: '4',
                user_name: 'Sneha Reddy',
                rating: 4,
                comment: 'Very good service. Slight delay but overall satisfied with the experience.',
                created_at: '2026-01-10',
                helpful_count: 15
            }
        ]);
    };

    const getMockImages = (mode: string, operator: string): string[] => {
        // Mock image URLs - in production, these would come from the database
        const baseUrl = 'https://images.unsplash.com/photo-';
        switch (mode) {
            case 'flight':
                return [
                    `${baseUrl}1436491741693-6f25f1360c84?w=800`,
                    `${baseUrl}1464037686479-ed0a5a8e65eb?w=800`,
                    `${baseUrl}1583500557349-fb44ce59e0b6?w=800`
                ];
            case 'bus':
                return [
                    `${baseUrl}1570125909232-eb263c188f7e?w=800`,
                    `${baseUrl}1544620347-c4fd4a3d5957?w=800`,
                    `${baseUrl}1449965325384-9e0a2ab6e0e5?w=800`
                ];
            case 'train':
                return [
                    `${baseUrl}1474487548417-781cb71495f3?w=800`,
                    `${baseUrl}1508062878650-88b52897f298?w=800`,
                    `${baseUrl}1533105079780-92b9be482077?w=800`
                ];
            default:
                return [];
        }
    };

    const getMockDescription = (mode: string, operator: string): string => {
        const descriptions: Record<string, string> = {
            flight: `Experience premium air travel with ${operator}. Our modern fleet ensures your comfort and safety throughout the journey. Enjoy complimentary refreshments, spacious seating, and professional cabin crew service.`,
            bus: `Travel in comfort with ${operator}. Our luxury buses feature reclining seats, AC, and entertainment systems. Professional drivers ensure a safe and smooth journey to your destination.`,
            train: `Journey across India with ${operator}. Experience the charm of train travel with modern amenities, comfortable berths, and scenic views. Our punctual service gets you to your destination on time.`
        };
        return descriptions[mode] || `Travel with ${operator} for a comfortable journey.`;
    };

    const getMockCancellationPolicy = (mode: string): string => {
        const policies: Record<string, string> = {
            flight: '• Full refund if cancelled 24 hours before departure\n• 50% refund if cancelled 12-24 hours before\n• No refund if cancelled within 12 hours\n• Rescheduling allowed once with ₹500 fee',
            bus: '• Full refund if cancelled 6 hours before departure\n• 75% refund if cancelled 3-6 hours before\n• 25% refund if cancelled within 3 hours\n• No rescheduling fee for same operator',
            train: '• Full refund if cancelled 24 hours before departure\n• 50% refund if cancelled 12-24 hours before\n• No refund if cancelled within 12 hours\n• TDR can be filed for train delays/cancellations'
        };
        return policies[mode] || 'Standard cancellation policy applies.';
    };

    const getMockBaggagePolicy = (mode: string): string => {
        const policies: Record<string, string> = {
            flight: '• Check-in: 15 kg per passenger\n• Cabin: 7 kg hand baggage\n• Additional baggage: ₹500 per kg\n• Special items like sports equipment allowed with prior booking',
            bus: '• One bag up to 20 kg allowed free\n• Additional luggage at extra charge\n• No fragile or hazardous items\n• Keep valuables with you',
            train: '• Up to 40 kg per passenger in sleeper class\n• Up to 50 kg in AC classes\n• Oversized luggage may require separate booking\n• Valuables should be kept with passenger'
        };
        return policies[mode] || 'Standard baggage policy applies.';
    };

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'flight': return <Plane className="w-6 h-6" />;
            case 'bus': return <Bus className="w-6 h-6" />;
            case 'train': return <Train className="w-6 h-6" />;
        }
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'flight': return 'from-blue-600 to-cyan-600';
            case 'bus': return 'from-green-600 to-emerald-600';
            case 'train': return 'from-purple-600 to-pink-600';
            default: return 'from-gray-600 to-gray-700';
        }
    };

    const getAmenityIcon = (amenity: string) => {
        const lower = amenity.toLowerCase();
        if (lower.includes('wifi')) return <Wifi className="w-4 h-4" />;
        if (lower.includes('meal') || lower.includes('food') || lower.includes('snack')) return <Utensils className="w-4 h-4" />;
        if (lower.includes('charging') || lower.includes('usb')) return <Zap className="w-4 h-4" />;
        if (lower.includes('ac') || lower.includes('air')) return <Wind className="w-4 h-4" />;
        if (lower.includes('entertainment') || lower.includes('tv')) return <Tv className="w-4 h-4" />;
        if (lower.includes('coffee') || lower.includes('tea')) return <Coffee className="w-4 h-4" />;
        return <Check className="w-4 h-4" />;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-slate-600 text-slate-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading || !travelDetails) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-white mt-4">Loading details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm overflow-y-auto z-50 p-4">
            <div className="max-w-6xl mx-auto my-8">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl border border-slate-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${getModeColor(mode)} shadow-lg`}>
                                {getModeIcon(mode)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{travelDetails.operator_name}</h1>
                                <div className="flex items-center gap-4 text-slate-300">
                                    <span className="flex items-center gap-1">
                                        {getModeIcon(mode)}
                                        <span className="text-sm">{travelDetails.vehicle_number}</span>
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-sm">{travelDetails.seat_class}</span>
                                    <span className="text-slate-500">•</span>
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{travelDetails.rating.toFixed(1)}</span>
                                        <span className="text-slate-400">({travelDetails.total_reviews} reviews)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Route Info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">From</p>
                                <p className="text-lg font-semibold text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                    {travelDetails.from_city}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">To</p>
                                <p className="text-lg font-semibold text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-400" />
                                    {travelDetails.to_city}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Departure</p>
                                <p className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    {travelDetails.travel_time}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Duration</p>
                                <p className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    {travelDetails.duration}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Price & Availability */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Seats Available</p>
                                <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
                                    <Armchair className="w-5 h-5" />
                                    {travelDetails.available_seats} / {travelDetails.total_seats}
                                </p>
                            </div>
                            <div className="h-12 w-px bg-slate-600"></div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Price per seat</p>
                                <p className="text-3xl font-bold text-white flex items-center gap-1">
                                    <IndianRupee className="w-6 h-6" />
                                    {travelDetails.total_amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-400">Inclusive of taxes</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onBookNow(travelDetails)}
                            className={`bg-gradient-to-r ${getModeColor(mode)} hover:shadow-2xl text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg`}
                        >
                            🎫 Book Now
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-slate-800 border-x border-slate-700 p-2 flex gap-2">
                    {['overview', 'amenities', 'reviews', 'policies'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                                activeTab === tab
                                    ? `bg-gradient-to-r ${getModeColor(mode)} text-white shadow-lg`
                                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-slate-900 border border-slate-700 rounded-b-2xl p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Images Gallery */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    📸 Photos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {travelDetails.images?.map((img, idx) => (
                                        <div key={idx} className="relative group overflow-hidden rounded-xl aspect-video">
                                            <img
                                                src={img}
                                                alt={`${travelDetails.operator_name} ${idx + 1}`}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-400" />
                                    About this Travel
                                </h3>
                                <p className="text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4">
                                    {travelDetails.description}
                                </p>
                            </div>

                            {/* Key Features */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                    Key Features
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                                        <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-white">Safe Journey</p>
                                        <p className="text-xs text-slate-400 mt-1">Insured travel</p>
                                    </div>
                                    <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                                        <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-white">On-Time</p>
                                        <p className="text-xs text-slate-400 mt-1">95% punctuality</p>
                                    </div>
                                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4 text-center">
                                        <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-white">Professional</p>
                                        <p className="text-xs text-slate-400 mt-1">Trained staff</p>
                                    </div>
                                    <div className="bg-orange-600/20 border border-orange-500/30 rounded-xl p-4 text-center">
                                        <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-white">High Rated</p>
                                        <p className="text-xs text-slate-400 mt-1">{travelDetails.rating}★ rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amenities Tab */}
                    {activeTab === 'amenities' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">🎯 Available Amenities</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(showAllAmenities ? travelDetails.amenities : travelDetails.amenities.slice(0, 9)).map((amenity, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 flex items-center gap-3 transition-all transform hover:scale-105"
                                    >
                                        <div className="p-2 bg-blue-600/20 rounded-lg">
                                            {getAmenityIcon(amenity)}
                                        </div>
                                        <span className="text-slate-200 font-medium">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                            {travelDetails.amenities.length > 9 && (
                                <button
                                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                                    className="text-blue-400 hover:text-blue-300 font-semibold"
                                >
                                    {showAllAmenities ? 'Show Less' : `Show All ${travelDetails.amenities.length} Amenities`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                    Customer Reviews
                                </h3>
                                <div className="flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-xl px-4 py-2">
                                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                    <span className="text-2xl font-bold text-white">{travelDetails.rating.toFixed(1)}</span>
                                    <span className="text-slate-400">/ 5.0</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-white mb-1">{review.user_name}</h4>
                                                <div className="flex items-center gap-2">
                                                    {renderStars(review.rating)}
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span className="text-sm">{review.helpful_count}</span>
                                            </button>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policies Tab */}
                    {activeTab === 'policies' && (
                        <div className="space-y-6">
                            {/* Cancellation Policy */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    Cancellation Policy
                                </h3>
                                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                    <pre className="text-slate-300 whitespace-pre-line font-sans">
                                        {travelDetails.cancellation_policy}
                                    </pre>
                                </div>
                            </div>

                            {/* Baggage Policy */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-400" />
                                    Baggage Policy
                                </h3>
                                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                    <pre className="text-slate-300 whitespace-pre-line font-sans">
                                        {travelDetails.baggage_policy}
                                    </pre>
                                </div>
                            </div>

                            {/* Important Info */}
                            <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
                                <h4 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Important Information
                                </h4>
                                <ul className="text-slate-300 space-y-2 text-sm">
                                    <li>• Valid ID proof required for boarding</li>
                                    <li>• Report at boarding point 30 minutes before departure</li>
                                    <li>• Smoking and alcohol consumption prohibited</li>
                                    <li>• Operator reserves the right to deny boarding</li>
                                    <li>• Ticket is non-transferable</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Search
                    </button>
                    <button
                        onClick={() => onBookNow(travelDetails)}
                        className={`flex-1 bg-gradient-to-r ${getModeColor(mode)} hover:shadow-2xl text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2`}
                    >
                        <Armchair className="w-5 h-5" />
                        Book This Travel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TravelDetailPage;
