import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Check, Loader, RefreshCw } from 'lucide-react';
import SeatMap from './SeatMap';

interface Seat {
    id: string;
    seat_no: string;
    seat_type: string;
    is_booked: boolean;
    price: number;
    row?: number;
    column?: string;
}

interface SeatLayout {
    [key: string]: any;
}

interface SeatSelectionModalProps {
    travel_id: number;
    travel_mode: 'flight' | 'bus' | 'train';
    onClose: () => void;
    onConfirm: (seats: string[], totalPrice: number) => void;
    baseCost: number;
    basePrice?: number; // Base fare per person (before seat charges)
}

const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
    travel_id,
    travel_mode,
    onClose,
    onConfirm,
    baseCost,
    basePrice
}) => {
    const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seatPrices, setSeatPrices] = useState<{ [key: string]: number }>({});
    const [allSeats, setAllSeats] = useState<Seat[]>([]);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
    const [seatsUpdated, setSeatsUpdated] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousSeatsRef = useRef<string>('');

    // Function to fetch seat map
    const fetchSeatMap = async (isPolling: boolean = false) => {
        try {
            if (!isPolling) {
                setLoading(true);
                setError(null);
            }

            const response = await fetch(
                `http://localhost/fu/backend/api/travel/seats/get_seat_map.php?travel_id=${travel_id}&mode=${travel_mode}&t=${Date.now()}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch seat map');
            }

            const data = await response.json();
            if (data.success) {
                // Check if seats have changed during polling
                const currentSeatsJson = JSON.stringify(data.data.seats.map((s: Seat) => ({ seat_no: s.seat_no, is_booked: s.is_booked })));
                if (isPolling && previousSeatsRef.current && previousSeatsRef.current !== currentSeatsJson) {
                    // Seats have been updated - show notification
                    setSeatsUpdated(true);
                    setTimeout(() => setSeatsUpdated(false), 3000); // Hide notification after 3 seconds
                }
                previousSeatsRef.current = currentSeatsJson;

                setSeatLayout(data.data.layout);
                setAllSeats(data.data.seats);
                setLastUpdateTime(new Date());
                
                // Store seat prices
                const prices: { [key: string]: number } = {};
                data.data.seats.forEach((seat: Seat) => {
                    prices[seat.seat_no] = seat.price;
                });
                setSeatPrices(prices);
            } else {
                if (!isPolling) {
                    setError(data.error || 'Failed to load seat map');
                }
            }
        } catch (err) {
            if (!isPolling) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            if (!isPolling) {
                setLoading(false);
            }
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchSeatMap();
    }, [travel_id, travel_mode]);

    // Setup polling to refresh seats every 5 seconds
    useEffect(() => {
        pollingIntervalRef.current = setInterval(() => {
            fetchSeatMap(true);
        }, 5000); // Poll every 5 seconds

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [travel_id, travel_mode]);

    // Toggle seat selection
    const toggleSeat = (seatNo: string, seatAvailable: boolean) => {
        if (!seatAvailable) return; // Can't select booked seats

        const newSelected = new Set(selectedSeats);
        if (newSelected.has(seatNo)) {
            newSelected.delete(seatNo);
        } else {
            newSelected.add(seatNo);
        }
        setSelectedSeats(newSelected);
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        // Use basePrice (per person base fare) if provided, otherwise use baseCost as the single travel cost
        const perPersonCost = basePrice || baseCost;
        
        // For multiple seats, calculate: (base_fare * number_of_seats) + seat_charges
        let total = perPersonCost * selectedSeats.size;
        
        selectedSeats.forEach(seat => {
            const seatPrice = seatPrices[seat] || 0;
            total += seatPrice;
        });
        return total;
    };

    const totalPrice = calculateTotalPrice();

    // Handle confirm
    const handleConfirm = () => {
        if (selectedSeats.size === 0) {
            setError('Please select at least one seat');
            return;
        }
        onConfirm(Array.from(selectedSeats), totalPrice);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-700 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Select Your Seat(s)</h2>
                        <p className="text-slate-400 text-sm">
                            {travel_mode.charAt(0).toUpperCase() + travel_mode.slice(1)} • 
                            {selectedSeats.size > 0 && ` ${selectedSeats.size} seat(s) selected`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchSeatMap(false)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-300 hover:text-white"
                            title="Refresh seat availability"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Seat Update Notification */}
                {seatsUpdated && (
                    <div className="bg-blue-500/20 border-b border-blue-500/50 px-6 py-3 flex items-center gap-2 text-blue-300">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Seats updated - someone just booked a seat!</span>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                            <p className="text-slate-400">Loading seat map...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : seatLayout ? (
                        <>
                            {/* Seat Map */}
                            <div className="mb-8 bg-slate-700/50 rounded-lg p-6">
                                <SeatMap
                                    layout={seatLayout}
                                    mode={travel_mode}
                                    selectedSeats={selectedSeats}
                                    onSeatClick={toggleSeat}
                                    seatPrices={seatPrices}
                                />
                            </div>

                            {/* Legend */}
                            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                                <p className="text-sm font-semibold text-slate-300 mb-3">Seat Status</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                                            <span className="text-sm">✓</span>
                                        </div>
                                        <span className="text-sm text-slate-300">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                                            <span className="text-sm">✗</span>
                                        </div>
                                        <span className="text-sm text-slate-300">Booked</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-slate-300">Selected</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-500 rounded flex items-center justify-center">
                                            <span className="text-sm">-</span>
                                        </div>
                                        <span className="text-sm text-slate-300">Unavailable</span>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Seats Summary */}
                            {selectedSeats.size > 0 && (
                                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
                                    <p className="text-sm font-semibold text-blue-300 mb-2">Selected Seats</p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {Array.from(selectedSeats).map((seat) => (
                                            <span
                                                key={seat}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                                            >
                                                {seat}
                                                <button
                                                    onClick={() => toggleSeat(seat, true)}
                                                    className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-300">Seat Charges:</span>
                                        <span className="text-blue-300 font-semibold">
                                            ₹{Array.from(selectedSeats).reduce((sum, seat) => sum + (seatPrices[seat] || 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Price Breakdown */}
                            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Base Fare:</span>
                                        <span>₹{baseCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Seat Charges:</span>
                                        <span>₹{(totalPrice - baseCost).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-600 pt-2 flex items-center justify-between font-bold text-lg">
                                        <span className="text-white">Total:</span>
                                        <span className="text-green-400">₹{totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <p>No seat data available</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-700/50 border-t border-slate-700 p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedSeats.size === 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirm {selectedSeats.size > 0 && `(${selectedSeats.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatSelectionModal;
