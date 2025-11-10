import React, { useState, useEffect } from 'react';
import { Plane, Bus, Train, MapPin, Calendar, Users, Clock, IndianRupee, Search, Armchair } from 'lucide-react';
import SeatSelectionModal from './SeatSelectionModal';
import Payment from './Payment';
import { from } from 'gsap';
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
}

interface SearchParams {
    from_city: string;
    to_city: string;
    travel_date: string;
    mode: 'flight' | 'bus' | 'train' | 'all';
}

interface Booking {
    id: string;
    mode: string;
    operator_name: string;
    from_city: string;
    to_city: string;
    travel_date: string;
    travel_time: string;
    status: string;
    total_amount: number;
}

const TravelBooking: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'search' | 'bookings' | 'my-bookings'>('search');
    const [searchParams, setSearchParams] = useState<SearchParams>({
        from_city: '',
        to_city: '',
        travel_date: '',
        mode: 'all'
    });
    const [travelOptions, setTravelOptions] = useState<TravelOption[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedOption, setSelectedOption] = useState<TravelOption | null>(null);
    const [showSeatSelection, setShowSeatSelection] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // Mock popular routes (West Bengal focused)
    const popularRoutes = [
        { from: 'Delhi', to: 'Kolkata' },
        { from: 'Kolkata', to: 'Delhi' },
        { from: 'Kolkata', to: 'Siliguri' },
        { from: 'Siliguri', to: 'Darjeeling' },
        { from: 'Darjeeling', to: 'Jalpaiguri' },
        { from: 'Kolkata', to: 'Asansol' },
        {from: 'Asansol', to: 'Durgapur' }, 
        {from:'pune' , to : 'mathura'}
    ];

    // Search for travel options
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!searchParams.from_city || !searchParams.to_city || !searchParams.travel_date) {
            toast.error('Please fill in all search fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const modeParam = searchParams.mode === 'all' ? '' : `&mode=${searchParams.mode}`;
            const response = await fetch(
                `http://localhost/fu/backend/api/travel.php?action=search&from=${searchParams.from_city}&to=${searchParams.to_city}&date=${searchParams.travel_date}${modeParam}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch travel options');
            }

            const data = await response.json();
            
            if (data.success) {
                if (data.data.results && data.data.results.length > 0) {
                    setTravelOptions(data.data.results);
                    setActiveTab('bookings');
                    toast.success(`Found ${data.data.results.length} travel options!`);
                } else {
                    toast.error('No travels available for this route on this date. Try different dates or cities.');
                    setTravelOptions([]);
                }
            } else {
                toast.error(data.error || 'Search failed');
            }
        } catch (err) {
            toast.error('Unable to fetch travels from database. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Generate mock travel options for testing
    const generateMockTravelOptions = (params: SearchParams): TravelOption[] => {
        // Removed mock data - only using real database
        return [];
    };

    // Load user's bookings
    useEffect(() => {
        if (activeTab === 'my-bookings') {
            loadUserBookings();
        }
    }, [activeTab]);

    const loadUserBookings = async () => {
        setLoading(true);
        try {
            // For demo, load mock bookings
            const mockBookings: Booking[] = [
                {
                    id: '101',
                    mode: 'flight',
                    operator_name: 'IndiGo Airlines',
                    from_city: 'Delhi',
                    to_city: 'Mumbai',
                    travel_date: '2024-02-15',
                    travel_time: '08:00',
                    status: 'confirmed',
                    total_amount: 4000
                }
            ];
            setMyBookings(mockBookings);
        } catch (err) {
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Handle booking selection
    const handleSelectOption = (option: TravelOption) => {
        setSelectedOption(option);
        setShowSeatSelection(true);
    };

    // Handle seat selection completion
    const handleSeatsSelected = (seats: string[], totalCost: number) => {
        setSelectedSeats(seats);
        setTotalPrice(totalCost);
        setShowSeatSelection(false);
        setShowBookingForm(true);
    };

    // Get mode icon
    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'flight':
                return <Plane className="w-5 h-5" />;
            case 'bus':
                return <Bus className="w-5 h-5" />;
            case 'train':
                return <Train className="w-5 h-5" />;
            default:
                return null;
        }
    };

    // Get mode color
    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'flight':
                return 'bg-blue-100 text-blue-700';
            case 'bus':
                return 'bg-green-100 text-green-700';
            case 'train':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
            <Toaster position="top-right" />
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-bold mb-2">Book Your Travel</h1>
                <p className="text-slate-400">Flights, Buses, and Trains - All in One Place</p>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex gap-4 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'search'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        <Search className="w-4 h-4 inline mr-2" />
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'bookings'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Available Options
                    </button>
                    <button
                        onClick={() => setActiveTab('my-bookings')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'my-bookings'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        My Bookings
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mb-8">
                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Travel Mode Selection */}
                            <div className="flex gap-4 flex-wrap">
                                {['all', 'flight', 'bus', 'train'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setSearchParams({ ...searchParams, mode: mode as any })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                            searchParams.mode === mode
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        {mode === 'flight' && <Plane className="w-4 h-4" />}
                                        {mode === 'bus' && <Bus className="w-4 h-4" />}
                                        {mode === 'train' && <Train className="w-4 h-4" />}
                                        {mode === 'all' && <Search className="w-4 h-4" />}
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Search Form */}
                            <div className="grid md:grid-cols-4 gap-4">
                                {/* From */}
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

                                {/* To */}
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

                                {/* Date */}
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

                                {/* Search Button */}
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
                    {travelOptions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Search for travel options to see results</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-6">
                                Found {travelOptions.length} options
                            </h2>

                            {travelOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        {/* Left section */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
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

                                            <div className="flex flex-col md:flex-row gap-6 mt-4">
                                                {/* Route info */}
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold">{option.travel_time}</p>
                                                        <p className="text-xs text-slate-400">Departure</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-center text-slate-400 text-sm mb-1">
                                                            <MapPin className="w-4 h-4 inline" />
                                                        </div>
                                                        <div className="border-t border-slate-600 pt-1"></div>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-slate-400">
                                                    <p className="font-semibold text-white">{option.from_city} → {option.to_city}</p>
                                                    <p className="text-xs">{option.travel_date}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right section - Price & Button */}
                                        <div className="text-right">
                                            <div className="mb-4">
                                                <div className="text-slate-400 text-sm mb-1">Total Amount</div>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IndianRupee className="w-5 h-5 text-green-400" />
                                                    <span className="text-3xl font-bold text-green-400">
                                                        {(option.total_amount || option.cost + option.tax).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    ₹{option.cost.toLocaleString()} + ₹{option.tax} tax
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleSelectOption(option)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Bookings Tab */}
            {activeTab === 'my-bookings' && (
                <div className="max-w-7xl mx-auto">
                    {myBookings.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No bookings yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-6">My Bookings ({myBookings.length})</h2>

                            {myBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${getModeColor(booking.mode)}`}>
                                                    {getModeIcon(booking.mode)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{booking.operator_name}</h3>
                                                    <p className="text-sm text-slate-400">Booking ID: {booking.id}</p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-slate-400">Route</p>
                                                    <p className="font-semibold">{booking.from_city} → {booking.to_city}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Date & Time</p>
                                                    <p className="font-semibold">{booking.travel_date} at {booking.travel_time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Status</p>
                                                    <p className={`font-semibold ${
                                                        booking.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                                                    }`}>
                                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="mb-4">
                                                <div className="text-slate-400 text-sm mb-1">Total Amount</div>
                                                <p className="text-2xl font-bold text-green-400">
                                                    ₹{booking.total_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Booking Form Modal */}
            {showBookingForm && selectedOption && (
                <BookingFormModal
                    option={selectedOption}
                    selectedSeats={selectedSeats}
                    totalPrice={totalPrice}
                    onClose={() => {
                        setShowBookingForm(false);
                        setSelectedOption(null);
                        setSelectedSeats([]);
                    }}
                    onBookingComplete={() => {
                        setShowBookingForm(false);
                        setSelectedOption(null);
                        setSelectedSeats([]);
                        loadUserBookings();
                    }}
                />
            )}

            {/* Seat Selection Modal */}
            {showSeatSelection && selectedOption && (
                <SeatSelectionModal
                    travel_id={parseInt(selectedOption.id)}
                    travel_mode={selectedOption.mode as 'flight' | 'bus' | 'train'}
                    onClose={() => {
                        setShowSeatSelection(false);
                        setSelectedOption(null);
                    }}
                    onConfirm={handleSeatsSelected}
                    baseCost={selectedOption.total_amount || selectedOption.cost + selectedOption.tax}
                    basePrice={selectedOption.cost + selectedOption.tax}
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
    onClose: () => void;
    onBookingComplete: () => void;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({ option, selectedSeats, totalPrice, onClose, onBookingComplete }) => {
    const [passengers, setPassengers] = useState<Array<{
        seat_number: string;
        passenger_name: string;
        passenger_email: string;
        passenger_phone: string;
        passenger_age?: string;
        passenger_gender?: string;
    }>>(selectedSeats.map(seat => ({
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
        
        // Validate all passengers have required info
        const incompletePassenger = passengers.find(p => !p.passenger_name || !p.passenger_email || !p.passenger_phone);
        if (incompletePassenger) {
            toast.error('Please fill in all required fields for all passengers');
            return;
        }

        // Store booking data and show payment
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
            total_with_seats: totalPrice,
            passengers: passengers
        };

        setBookingData(preparedBookingData);
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (paymentData: any) => {
        if (!bookingData) return;

        setLoading(true);
        try {
            // Now submit booking with payment confirmation
            const finalBookingData = {
                ...bookingData,
                payment_status: 'paid',
                payment_id: paymentData.paymentId,
                payment_method: paymentData.method
            };

            const response = await fetch('http://localhost/fu/backend/api/travel/book.php?action=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalBookingData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const booking_id = data.data.booking_id;
                const booking_ref = data.data.booking_reference;
                const passenger_count = data.data.passenger_count;
                
                toast.success(
                    (t) => (
                        <div>
                            <div className="font-bold mb-2">✅ Booking Confirmed!</div>
                            <div className="text-sm space-y-1">
                                <p>Booking Reference: <strong>{booking_ref}</strong></p>
                                <p>Booking ID: <strong>#{booking_id}</strong></p>
                                <p>Passengers: <strong>{passenger_count}</strong></p>
                                <p>Seats: <strong>{selectedSeats.join(', ')}</strong></p>
                                <p>Total: <strong>₹{totalPrice.toLocaleString()}</strong></p>
                            </div>
                        </div>
                    ),
                    {
                        duration: 5000,
                        style: {
                            background: '#10b981',
                            color: '#fff',
                        }
                    }
                );
                onBookingComplete();
            } else {
                toast.error('Booking Error: ' + (data.error || 'Unknown error'));
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
                onBack={() => {
                    setShowPayment(false);
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Complete Your Booking</h2>

                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Plane className="w-4 h-4 text-blue-400" />
                        <p className="font-semibold">{option.operator_name}</p>
                    </div>
                    <p className="text-sm text-slate-400">
                        {option.from_city} → {option.to_city}
                    </p>
                    <p className="text-sm text-slate-400">
                        {option.travel_date} at {option.travel_time}
                    </p>
                    
                    {selectedSeats.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                            <p className="text-xs text-slate-400 mb-1">
                                <Armchair className="w-3 h-3 inline mr-1" />
                                Selected Seats
                            </p>
                            <p className="text-sm font-semibold text-blue-300">{selectedSeats.join(', ')}</p>
                        </div>
                    )}
                    
                    <p className="text-lg font-bold text-green-400 mt-3">
                        ₹{totalPrice.toLocaleString()}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Passenger Forms */}
                    {passengers.map((passenger, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-blue-300">
                                    Passenger {index + 1}
                                </h3>
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                    Seat: {passenger.seat_number}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {/* Passenger Name */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        value={passenger.passenger_name}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_name', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@example.com"
                                        value={passenger.passenger_email}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_email', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-400">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="9999999999"
                                        value={passenger.passenger_phone}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_phone', e.target.value)}
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                </div>

                                {/* Age & Gender (Optional) */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-slate-400">Age</label>
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            value={passenger.passenger_age}
                                            onChange={(e) => handlePassengerChange(index, 'passenger_age', e.target.value)}
                                            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-slate-400">Gender</label>
                                        <select
                                            value={passenger.passenger_gender}
                                            onChange={(e) => handlePassengerChange(index, 'passenger_gender', e.target.value)}
                                            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-400 text-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Summary */}
                    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3 text-sm">
                        <p className="text-blue-300">
                            {passengers.length} passenger{passengers.length !== 1 ? 's' : ''} • ₹{totalPrice.toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                        >
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TravelBooking;
