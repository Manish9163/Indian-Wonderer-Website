import React, { useState, useEffect } from 'react';
import { 
    Plane, Bus, Train, MapPin, Calendar, Users, Clock, IndianRupee, Search, 
    Armchair, Filter, Star, Shield, Gift, TrendingDown, AlertCircle, X, 
    ChevronDown, ChevronUp, Sparkles, Award, Tag, Bell, User, Info
} from 'lucide-react';
import SeatSelectionModal from './SeatSelectionModal';
import Payment from './Payment';
import TravelDetailPage from './TravelDetailPage';
import toast, { Toaster } from 'react-hot-toast';

interface TravelOption {
    id: string;
    mode: 'flight' | 'bus' | 'train';
    operator_name: string;
    vehicle_number?: string;
    seat_class?: string;
    from_city: string;
    to_city: string;
    travel_date: string;
    travel_time: string;
    cost: number;
    tax: number;
    total_amount?: number;
    status: string;
    duration?: string;
    rating?: number;
    amenities?: string[];
    price_tag?: string;
}

interface PromoCode {
    id: string;
    code: string;
    discount_type: 'flat' | 'percentage';
    discount_value: number;
    min_booking_amount: number;
    max_discount?: number;
    applicable_mode?: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
}

interface Filters {
    priceRange: [number, number];
    departureTime: string[];
    operators: string[];
    seatClass: string[];
    sortBy: 'price' | 'duration' | 'rating' | 'departure';
}

const TravelBookingEnhanced: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'search' | 'bookings' | 'my-bookings'>('search');
    const [searchParams, setSearchParams] = useState({
        from_city: '',
        to_city: '',
        travel_date: '',
        mode: 'all' as 'flight' | 'bus' | 'train' | 'all'
    });

    const [travelOptions, setTravelOptions] = useState<TravelOption[]>([]);
    const [filteredOptions, setFilteredOptions] = useState<TravelOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [showFlexibleDates, setShowFlexibleDates] = useState(false);

    // Filter states
    const [filters, setFilters] = useState<Filters>({
        priceRange: [0, 50000],
        departureTime: [],
        operators: [],
        seatClass: [],
        sortBy: 'price'
    });

    // Promo code states
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
    
    // Flexible dates
    const [flexibleDates, setFlexibleDates] = useState<any[]>([]);
    
    // Booking states
    const [showSeatSelection, setShowSeatSelection] = useState(false);
    const [selectedOption, setSelectedOption] = useState<TravelOption | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showDetailPage, setShowDetailPage] = useState(false);

    // Statistics
    const [statistics, setStatistics] = useState({
        cheapest: 0,
        average: 0,
        highest: 0,
        count: 0
    });

    const popularRoutes = [
        { from: 'Delhi', to: 'Mumbai' },
        { from: 'Delhi', to: 'Kolkata' },
        { from: 'Mumbai', to: 'Bangalore' },
        { from: 'Chennai', to: 'Hyderabad' },
        { from: 'Kolkata', to: 'Siliguri' },
        { from: 'Pune', to: 'Goa' }
    ];

    // Load promo codes
    useEffect(() => {
        loadPromoCodes();
    }, []);

    const loadPromoCodes = async () => {
        try {
            const response = await fetch('http://localhost/fu/backend/api/travel/promo_codes.php?action=list');
            const data = await response.json();
            if (data.success) {
                setAvailablePromos(data.data.promo_codes);
            }
        } catch (err) {
            console.error('Failed to load promo codes:', err);
        }
    };

    // Enhanced search with filters
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!searchParams.from_city || !searchParams.to_city || !searchParams.travel_date) {
            toast.error('Please fill in all search fields');
            return;
        }

        setLoading(true);
        try {
            const modeParam = searchParams.mode === 'all' ? '' : `&mode=${searchParams.mode}`;
            const sortParam = `&sort_by=${filters.sortBy}`;
            
            const searchUrl = `http://localhost/fu/backend/api/travel/enhanced_search.php?action=search&from=${searchParams.from_city}&to=${searchParams.to_city}&date=${searchParams.travel_date}${modeParam}${sortParam}`;
            console.log('Search URL:', searchUrl);
            console.log('Search params:', searchParams);
            
            const response = await fetch(searchUrl);

            const data = await response.json();
            console.log('Search response:', data);
            
            if (data.success) {
                const results = (data.data.results || []).map((option: any) => ({
                    ...option,
                    id: String(option.id),
                    cost: parseFloat(option.cost) || 0,
                    tax: parseFloat(option.tax) || 0,
                    total_amount: parseFloat(option.total_amount || option.price) || 0,
                    rating: option.avg_rating ? parseFloat(option.avg_rating) : undefined
                }));
                
                console.log('Mapped results:', results);
                setTravelOptions(results);
                setFilteredOptions(results);
                
                if (data.data.statistics) {
                    setStatistics({
                        cheapest: parseFloat(data.data.statistics.cheapest) || 0,
                        average: parseFloat(data.data.statistics.average) || 0,
                        highest: parseFloat(data.data.statistics.most_expensive || data.data.statistics.highest) || 0,
                        count: data.data.statistics.total_options || results.length
                    });
                }
                
                setActiveTab('bookings');
                toast.success(`Found ${results.length} travel options!`);
            } else {
                toast.error(data.error || 'No options found');
                setTravelOptions([]);
                setFilteredOptions([]);
            }
        } catch (err) {
            toast.error('Search failed. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load flexible dates
    const loadFlexibleDates = async () => {
        if (!searchParams.from_city || !searchParams.to_city || !searchParams.travel_date) {
            toast.error('Please fill in search fields first');
            return;
        }

        setLoading(true);
        try {
            const modeParam = searchParams.mode === 'all' ? '' : `&mode=${searchParams.mode}`;
            const response = await fetch(
                `http://localhost/fu/backend/api/travel/enhanced_search.php?action=flexible&from=${searchParams.from_city}&to=${searchParams.to_city}&date=${searchParams.travel_date}${modeParam}`
            );

            const data = await response.json();
            if (data.success) {
                setFlexibleDates(data.data.flexible_dates || []);
                setShowFlexibleDates(true);
            }
        } catch (err) {
            toast.error('Failed to load flexible dates');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...travelOptions];

        // Price filter
        filtered = filtered.filter(option => {
            const price = option.total_amount || option.cost + option.tax;
            return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });

        // Departure time filter
        if (filters.departureTime.length > 0) {
            filtered = filtered.filter(option => {
                const hour = parseInt(option.travel_time.split(':')[0]);
                return filters.departureTime.some(slot => {
                    if (slot === 'morning') return hour >= 6 && hour < 12;
                    if (slot === 'afternoon') return hour >= 12 && hour < 18;
                    if (slot === 'evening') return hour >= 18 && hour < 24;
                    if (slot === 'night') return hour >= 0 && hour < 6;
                    return false;
                });
            });
        }

        // Operator filter
        if (filters.operators.length > 0) {
            filtered = filtered.filter(option => 
                filters.operators.includes(option.operator_name)
            );
        }

        // Seat class filter
        if (filters.seatClass.length > 0) {
            filtered = filtered.filter(option => 
                filters.seatClass.includes(option.seat_class || 'Standard')
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (filters.sortBy === 'price') {
                return (a.total_amount || a.cost + a.tax) - (b.total_amount || b.cost + b.tax);
            } else if (filters.sortBy === 'rating' && a.rating && b.rating) {
                return b.rating - a.rating;
            } else if (filters.sortBy === 'departure') {
                return a.travel_time.localeCompare(b.travel_time);
            }
            return 0;
        });

        setFilteredOptions(filtered);
    }, [filters, travelOptions]);

    // Validate promo code
    const validatePromoCode = async () => {
        if (!promoCode.trim()) {
            toast.error('Please enter a promo code');
            return;
        }

        try {
            const response = await fetch(
                `http://localhost/fu/backend/api/travel/promo_codes.php?action=validate&code=${promoCode}&booking_amount=1000&mode=${searchParams.mode}`
            );

            const data = await response.json();
            if (data.success && data.data.valid) {
                setAppliedPromo(data.data);
                toast.success(`Promo code applied! Save ₹${data.data.discount_value}`);
                setShowPromoModal(false);
            } else {
                toast.error('Invalid or expired promo code');
            }
        } catch (err) {
            toast.error('Failed to validate promo code');
        }
    };

    // Get available operators
    const getAvailableOperators = () => {
        return Array.from(new Set(travelOptions.map(o => o.operator_name)));
    };

    // Get available seat classes
    const getAvailableSeatClasses = () => {
        return Array.from(new Set(travelOptions.map(o => o.seat_class || 'Standard')));
    };

    // Handle booking
    const handleSelectOption = (option: TravelOption) => {
        setSelectedOption(option);
        setShowSeatSelection(true);
    };

    const handleSeatsSelected = (seats: string[], totalCost: number) => {
        setSelectedSeats(seats);
        let finalPrice = totalCost;
        
        // Apply promo discount if available
        if (appliedPromo) {
            if (appliedPromo.discount_type === 'flat') {
                finalPrice -= appliedPromo.discount_value;
            } else {
                finalPrice -= (finalPrice * appliedPromo.discount_value) / 100;
            }
        }
        
        setTotalPrice(finalPrice);
        setShowSeatSelection(false);
        setShowBookingForm(true);
    };

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'flight': return <Plane className="w-5 h-5" />;
            case 'bus': return <Bus className="w-5 h-5" />;
            case 'train': return <Train className="w-5 h-5" />;
            default: return null;
        }
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'flight': return 'bg-blue-100 text-blue-700';
            case 'bus': return 'bg-green-100 text-green-700';
            case 'train': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriceTagBadge = (tag?: string) => {
        if (!tag) return null;
        
        const badges: Record<string, { bg: string; text: string; icon: any }> = {
            cheapest: { bg: 'bg-green-500', text: 'Cheapest', icon: TrendingDown },
            'good_deal': { bg: 'bg-blue-500', text: 'Good Deal', icon: Sparkles },
            recommended: { bg: 'bg-purple-500', text: 'Recommended', icon: Award }
        };

        const badge = badges[tag];
        if (!badge) return null;

        const Icon = badge.icon;
        return (
            <span className={`${badge.bg} text-white text-xs px-2 py-1 rounded-full inline-flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {badge.text}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-4 md:p-8 pt-20 md:pt-24">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            <Sparkles className="text-yellow-400 animate-pulse" />
                            Indian Wonderer Travel Hub
                        </h1>
                        <p className="text-slate-300 text-lg"> ✨Book Flights, Trains & Buses • 🎁 Exclusive Deals • ⚡ Instant Confirmation</p>
                        <div className="flex gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">✅ Best Price Guaranteed</span>
                            <span className="flex items-center gap-1">🔒 Secure Payment</span>
                            <span className="flex items-center gap-1">🛃 24/7 Support</span>
                        </div>
                    </div>
                    {appliedPromo && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 rounded-xl px-6 py-3 shadow-lg shadow-green-500/20 animate-pulse">
                            <p className="text-green-300 text-sm font-bold flex items-center gap-2">
                                <Gift className="w-5 h-5" />
                                 Promo: {appliedPromo.code}
                            </p>
                            <p className="text-xs text-green-400 mt-1">Saving you money!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex gap-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-2">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                            activeTab === 'search'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <Search className="w-4 h-4 inline mr-2" />
                        Search Travels
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-300 relative ${
                            activeTab === 'bookings'
                                ? 'bg-gradient-to-r from-purple-400 to-pink-300 text-gray-800 shadow-lg shadow-purple-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Available Options
                        {filteredOptions.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                                {filteredOptions.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 mb-8 shadow-2xl shadow-blue-900/20">
                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Travel Mode Selection */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <span className="text-blue-400">●</span> Select Travel Mode
                                </h3>
                                <div className="flex gap-3 flex-wrap">
                                    {['all', 'flight', 'bus', 'train'].map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setSearchParams({ ...searchParams, mode: mode as any })}
                                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                                                searchParams.mode === mode
                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 border border-slate-600'
                                            }`}
                                        >
                                            {mode === 'flight' && <Plane className="w-5 h-5" />}
                                            {mode === 'bus' && <Bus className="w-5 h-5" />}
                                            {mode === 'train' && <Train className="w-5 h-5" />}
                                            {mode === 'all' && <Search className="w-5 h-5" />}
                                            {mode === 'flight' && ' Flights'}
                                            {mode === 'bus' && ' Buses'}
                                            {mode === 'train' && ' Trains'}
                                            {mode === 'all' && ' All Modes'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Form */}
                            <div className="grid md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-300">From</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Delhi, Mumbai"
                                        value={searchParams.from_city}
                                        onChange={(e) => setSearchParams({ ...searchParams, from_city: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-300">To</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Kolkata, Agra"
                                        value={searchParams.to_city}
                                        onChange={(e) => setSearchParams({ ...searchParams, to_city: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-300">Travel Date</label>
                                    <input
                                        type="date"
                                        value={searchParams.travel_date}
                                        onChange={(e) => setSearchParams({ ...searchParams, travel_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Search className="w-4 h-4" />
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={loadFlexibleDates}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Flexible Dates (±3 days)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPromoModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <Gift className="w-4 h-4" />
                                    Apply Promo Code
                                </button>
                            </div>

                            {/* Popular Routes */}
                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <p className="text-sm text-slate-400 mb-3">Popular Routes:</p>
                                <div className="flex flex-wrap gap-2">
                                    {popularRoutes.map((route, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSearchParams({
                                                ...searchParams,
                                                from_city: route.from,
                                                to_city: route.to
                                            })}
                                            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-all"
                                        >
                                            {route.from} → {route.to}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Available Options Tab */}
            {activeTab === 'bookings' && (
                <div className="max-w-7xl mx-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Search for travel options to see results</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 sticky top-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Filter className="w-5 h-5" />
                                            Filters
                                        </h3>
                                        <button
                                            onClick={() => setFilters({
                                                priceRange: [0, 50000],
                                                departureTime: [],
                                                operators: [],
                                                seatClass: [],
                                                sortBy: 'price'
                                            })}
                                            className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    {/* Sort By */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Sort By</label>
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                        >
                                            <option value="price">Price: Low to High</option>
                                            <option value="rating">Rating: High to Low</option>
                                            <option value="departure">Departure Time</option>
                                        </select>
                                    </div>

                                    {/* Price Range */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">
                                            Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50000"
                                            step="500"
                                            value={filters.priceRange[1]}
                                            onChange={(e) => setFilters({ 
                                                ...filters, 
                                                priceRange: [0, parseInt(e.target.value)] 
                                            })}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Departure Time */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Departure Time</label>
                                        {['morning', 'afternoon', 'evening', 'night'].map(slot => (
                                            <label key={slot} className="flex items-center gap-2 mb-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.departureTime.includes(slot)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFilters({ ...filters, departureTime: [...filters.departureTime, slot] });
                                                        } else {
                                                            setFilters({ ...filters, departureTime: filters.departureTime.filter(s => s !== slot) });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                                {slot === 'morning' && ' (6AM-12PM)'}
                                                {slot === 'afternoon' && ' (12PM-6PM)'}
                                                {slot === 'evening' && ' (6PM-12AM)'}
                                                {slot === 'night' && ' (12AM-6AM)'}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Operators */}
                                    {getAvailableOperators().length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold mb-2">Operators</label>
                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                {getAvailableOperators().map(operator => (
                                                    <label key={operator} className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.operators.includes(operator)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFilters({ ...filters, operators: [...filters.operators, operator] });
                                                                } else {
                                                                    setFilters({ ...filters, operators: filters.operators.filter(o => o !== operator) });
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        {operator}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Statistics */}
                                    {statistics.count > 0 && (
                                        <div className="mt-6 pt-6 border-t border-slate-700">
                                            <h4 className="text-sm font-semibold mb-3">Price Statistics</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Cheapest:</span>
                                                    <span className="text-green-400 font-semibold">₹{statistics.cheapest}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Average:</span>
                                                    <span className="text-blue-400 font-semibold">₹{statistics.average}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Highest:</span>
                                                    <span className="text-slate-400 font-semibold">₹{statistics.highest}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold">
                                        {filteredOptions.length} Options Found
                                    </h2>
                                    {appliedPromo && (
                                        <div className="bg-green-500/20 border border-green-500 rounded-lg px-3 py-2">
                                            <p className="text-green-300 text-sm">
                                                Discount: {appliedPromo.discount_type === 'flat' 
                                                    ? `₹${appliedPromo.discount_value}` 
                                                    : `${appliedPromo.discount_value}%`}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {filteredOptions.map((option) => {
                                    const totalAmount = option.total_amount || option.cost + option.tax;
                                    return (
                                        <div
                                            key={option.id}
                                            className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                {/* Left section */}
                                                <div className="flex-1 w-full">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${getModeColor(option.mode)}`}>
                                                                {getModeIcon(option.mode)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-lg">{option.operator_name}</h3>
                                                                <p className="text-sm text-slate-400">
                                                                    {option.vehicle_number && `${option.vehicle_number} • `}
                                                                    {option.seat_class || 'Standard'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {getPriceTagBadge(option.price_tag)}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">Route</p>
                                                            <p className="font-semibold text-sm">{option.from_city} → {option.to_city}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">Departure</p>
                                                            <p className="font-semibold text-sm flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {option.travel_time}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">Date</p>
                                                            <p className="font-semibold text-sm">{option.travel_date}</p>
                                                        </div>
                                                        {option.rating && (
                                                            <div>
                                                                <p className="text-xs text-slate-400 mb-1">Rating</p>
                                                                <p className="font-semibold text-sm flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                    {option.rating}/5
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Amenities */}
                                                    {option.amenities && option.amenities.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {option.amenities.slice(0, 4).map((amenity, idx) => (
                                                                <span key={idx} className="text-xs bg-slate-700 px-2 py-1 rounded">
                                                                    {amenity}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right section - Price & Button */}
                                                <div className="text-right">
                                                    <div className="mb-4">
                                                        <div className="text-slate-400 text-sm mb-1">Total Amount</div>
                                                        {appliedPromo ? (
                                                            <>
                                                                <div className="flex items-center justify-end gap-1 line-through text-slate-500">
                                                                    <IndianRupee className="w-4 h-4" />
                                                                    <span className="text-lg">{totalAmount.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <IndianRupee className="w-5 h-5 text-green-400" />
                                                                    <span className="text-3xl font-bold text-green-400">
                                                                        {appliedPromo.discount_type === 'flat' 
                                                                            ? (totalAmount - appliedPromo.discount_value).toLocaleString()
                                                                            : (totalAmount - (totalAmount * appliedPromo.discount_value / 100)).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-green-400 mt-1">
                                                                    You save ₹{appliedPromo.discount_type === 'flat' 
                                                                        ? appliedPromo.discount_value 
                                                                        : (totalAmount * appliedPromo.discount_value / 100).toFixed(0)}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <IndianRupee className="w-5 h-5 text-green-400" />
                                                                <span className="text-3xl font-bold text-green-400">
                                                                    {totalAmount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            ₹{option.cost.toLocaleString()} + ₹{option.tax} tax
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOption(option);
                                                                setShowDetailPage(true);
                                                            }}
                                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Info className="w-4 h-4" />
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleSelectOption(option)}
                                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                                                        >
                                                            <Armchair className="w-5 h-5" />
                                                            🎫 Select Seats
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Promo Code Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Gift className="w-5 h-5 text-green-400" />
                                Promo Codes
                            </h3>
                            <button onClick={() => setShowPromoModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter promo code"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={validatePromoCode}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-400">Available Promos:</h4>
                            {availablePromos.filter(p => p.is_active).map(promo => (
                                <div key={promo.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-green-400">{promo.code}</p>
                                            <p className="text-xs text-slate-400">
                                                {promo.discount_type === 'flat' 
                                                    ? `₹${promo.discount_value} OFF` 
                                                    : `${promo.discount_value}% OFF`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPromoCode(promo.code);
                                                validatePromoCode();
                                            }}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Min booking: ₹{promo.min_booking_amount}
                                        {promo.applicable_mode && ` • ${promo.applicable_mode.toUpperCase()}`}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Valid until: {new Date(promo.valid_until).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Flexible Dates Modal */}
            {showFlexibleDates && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                Flexible Dates - Best Prices
                            </h3>
                            <button onClick={() => setShowFlexibleDates(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {flexibleDates.map((dateOption, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all"
                                    onClick={() => {
                                        setSearchParams({ ...searchParams, travel_date: dateOption.search_date });
                                        setShowFlexibleDates(false);
                                        handleSearch();
                                    }}
                                >
                                    <p className="text-sm text-slate-400 mb-2">
                                        {new Date(dateOption.search_date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="text-2xl font-bold text-green-400 mb-1">
                                        ₹{parseFloat(dateOption.lowest_price).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {dateOption.options_count} option{dateOption.options_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Seat Selection Modal */}
            {showSeatSelection && selectedOption && (
                <SeatSelectionModal
                    travel_id={parseInt(selectedOption.id)}
                    travel_mode={selectedOption.mode}
                    onClose={() => {
                        setShowSeatSelection(false);
                        setSelectedOption(null);
                    }}
                    onConfirm={handleSeatsSelected}
                    baseCost={selectedOption.total_amount || selectedOption.cost + selectedOption.tax}
                    basePrice={selectedOption.cost + selectedOption.tax}
                />
            )}

            {/* Booking Form Modal */}
            {showBookingForm && selectedOption && (
                <BookingFormModal
                    option={selectedOption}
                    selectedSeats={selectedSeats}
                    totalPrice={totalPrice}
                    appliedPromo={appliedPromo}
                    onClose={() => {
                        setShowBookingForm(false);
                        setSelectedOption(null);
                        setSelectedSeats([]);
                    }}
                    onBookingComplete={() => {
                        setShowBookingForm(false);
                        setSelectedOption(null);
                        setSelectedSeats([]);
                        setAppliedPromo(null);
                        toast.success('Booking completed successfully!');
                    }}
                />
            )}

            {/* Travel Detail Page */}
            {showDetailPage && selectedOption && (
                <TravelDetailPage
                    travelId={selectedOption.id}
                    mode={selectedOption.mode}
                    onClose={() => {
                        setShowDetailPage(false);
                        setSelectedOption(null);
                    }}
                    onBookNow={(travelData) => {
                        setShowDetailPage(false);
                        handleSelectOption(travelData);
                    }}
                />
            )}
        </div>
    );
};

// Booking Form Modal Component
interface BookingFormModalProps {
    option: TravelOption;
    selectedSeats: string[];
    totalPrice: number;
    appliedPromo: any;
    onClose: () => void;
    onBookingComplete: () => void;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({ 
    option, 
    selectedSeats, 
    totalPrice, 
    appliedPromo,
    onClose, 
    onBookingComplete 
}) => {
    const [passengers, setPassengers] = useState(selectedSeats.map(seat => ({
        seat_number: seat,
        passenger_name: '',
        passenger_email: '',
        passenger_phone: '',
        passenger_age: '',
        passenger_gender: ''
    })));
    
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);
    const [addInsurance, setAddInsurance] = useState(false);
    
    const insuranceCost = 100; // ₹100 per passenger

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const updatedPassengers = [...passengers];
        updatedPassengers[index] = {
            ...updatedPassengers[index],
            [field]: value
        };
        setPassengers(updatedPassengers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const incompletePassenger = passengers.find(p => !p.passenger_name || !p.passenger_email || !p.passenger_phone);
        if (incompletePassenger) {
            toast.error('Please fill in all required fields for all passengers');
            return;
        }

        let finalTotal = totalPrice;
        if (addInsurance) {
            finalTotal += insuranceCost * passengers.length;
        }

        const preparedBookingData = {
            user_id: localStorage.getItem('user_id') || '1',
            travel_id: parseInt(option.id),
            mode: option.mode,
            from_city: option.from_city,
            to_city: option.to_city,
            travel_date: option.travel_date,
            operator_name: option.operator_name,
            vehicle_number: option.vehicle_number || null,
            seat_class: option.seat_class || null,
            cost: option.cost,
            tax: option.tax,
            selected_seats: selectedSeats,
            total_with_seats: finalTotal,
            passengers: passengers,
            promo_code: appliedPromo?.code || null,
            discount_amount: appliedPromo ? 
                (appliedPromo.discount_type === 'flat' 
                    ? appliedPromo.discount_value 
                    : (totalPrice * appliedPromo.discount_value / 100)) 
                : 0,
            insurance_opted: addInsurance,
            insurance_amount: addInsurance ? insuranceCost * passengers.length : 0
        };

        setBookingData(preparedBookingData);
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (paymentData: any) => {
        if (!bookingData) return;

        setLoading(true);
        try {
            const finalBookingData = {
                ...bookingData,
                payment_status: 'paid',
                payment_id: paymentData.paymentId,
                payment_method: paymentData.method
            };

            const response = await fetch('http://localhost/fu/backend/api/travel/book.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalBookingData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    (t) => (
                        <div>
                            <div className="font-bold mb-2">✅ Booking Confirmed!</div>
                            <div className="text-sm space-y-1">
                                <p>Reference: <strong>{data.data.booking_reference}</strong></p>
                                <p>Seats: <strong>{selectedSeats.join(', ')}</strong></p>
                                {appliedPromo && <p className="text-green-400">Promo: {appliedPromo.code} applied</p>}
                                {addInsurance && <p className="text-blue-400">Travel insurance included</p>}
                            </div>
                        </div>
                    ),
                    { duration: 5000 }
                );
                onBookingComplete();
            } else {
                toast.error(data.error || 'Booking failed');
            }
        } catch (err) {
            console.error('Booking error:', err);
            toast.error('Booking failed. Please try again.');
        } finally {
            setLoading(false);
            setShowPayment(false);
        }
    };

    if (showPayment) {
        return (
            <Payment
                selectedTour={{ price: totalPrice / selectedSeats.length }}
                bookingData={{ travelers: selectedSeats.length }}
                darkMode={false}
                onClose={() => {
                    setShowPayment(false);
                    setBookingData(null);
                }}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => setShowPayment(false)}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 my-8">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-400" />
                    Passenger Details
                </h2>

                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        {getModeIcon(option.mode)}
                        <p className="font-semibold">{option.operator_name}</p>
                    </div>
                    <p className="text-sm text-slate-400">
                        {option.from_city} → {option.to_city} • {option.travel_date}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-xs text-slate-400 mb-1">Selected Seats</p>
                        <p className="text-sm font-semibold text-blue-300">{selectedSeats.join(', ')}</p>
                    </div>
                    
                    {appliedPromo && (
                        <div className="mt-3 pt-3 border-t border-slate-600 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">
                                Promo {appliedPromo.code} applied - Save ₹
                                {appliedPromo.discount_type === 'flat' 
                                    ? appliedPromo.discount_value 
                                    : (totalPrice * appliedPromo.discount_value / 100).toFixed(0)}
                            </span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {passengers.map((passenger, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-blue-300">Passenger {index + 1}</h3>
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                    Seat: {passenger.seat_number}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        value={passenger.passenger_name}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_name', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@example.com"
                                        value={passenger.passenger_email}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_email', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="9999999999"
                                        value={passenger.passenger_phone}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_phone', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Age</label>
                                    <input
                                        type="number"
                                        placeholder="Age"
                                        value={passenger.passenger_age}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_age', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Gender</label>
                                    <select
                                        value={passenger.passenger_gender}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_gender', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Travel Insurance */}
                    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addInsurance}
                                onChange={(e) => setAddInsurance(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <span className="font-semibold text-blue-300">Add Travel Insurance</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Covers trip cancellation, medical emergencies, and baggage loss
                                </p>
                                <p className="text-sm text-blue-300 mt-1">
                                    ₹{insuranceCost} per passenger (Total: ₹{insuranceCost * passengers.length})
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Total Summary */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Base Amount</span>
                                <span>₹{(option.cost * selectedSeats.length).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tax & Fees</span>
                                <span>₹{(option.tax * selectedSeats.length).toLocaleString()}</span>
                            </div>
                            {appliedPromo && (
                                <div className="flex justify-between text-green-400">
                                    <span>Promo Discount ({appliedPromo.code})</span>
                                    <span>
                                        - ₹{appliedPromo.discount_type === 'flat' 
                                            ? appliedPromo.discount_value 
                                            : (totalPrice * appliedPromo.discount_value / 100).toFixed(0)}
                                    </span>
                                </div>
                            )}
                            {addInsurance && (
                                <div className="flex justify-between text-blue-400">
                                    <span>Travel Insurance</span>
                                    <span>+ ₹{(insuranceCost * passengers.length).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-slate-600 flex justify-between text-lg font-bold">
                                <span>Total Amount</span>
                                <span className="text-green-400">
                                    ₹{(totalPrice + (addInsurance ? insuranceCost * passengers.length : 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                        >
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const getModeIcon = (mode: string) => {
    switch (mode) {
        case 'flight': return <Plane className="w-5 h-5" />;
        case 'bus': return <Bus className="w-5 h-5" />;
        case 'train': return <Train className="w-5 h-5" />;
        default: return null;
    }
};

export default TravelBookingEnhanced;
