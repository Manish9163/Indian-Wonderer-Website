import React from 'react';
import Seat from './Seat';

interface SeatMapProps {
    layout: { [key: string]: any };
    mode: 'flight' | 'bus' | 'train';
    selectedSeats: Set<string>;
    onSeatClick: (seatNo: string, available: boolean) => void;
    seatPrices: { [key: string]: number };
}

const SeatMap: React.FC<SeatMapProps> = ({
    layout,
    mode,
    selectedSeats,
    onSeatClick,
    seatPrices
}) => {
    if (mode === 'bus') {
        return <BusSeatLayout layout={layout} selectedSeats={selectedSeats} onSeatClick={onSeatClick} />;
    } else if (mode === 'train') {
        return <TrainSeatLayout layout={layout} selectedSeats={selectedSeats} onSeatClick={onSeatClick} />;
    } else if (mode === 'flight') {
        return <FlightSeatLayout layout={layout} selectedSeats={selectedSeats} onSeatClick={onSeatClick} />;
    }

    return <div className="text-center text-white py-8">Unknown seat layout</div>;
};

/**
 * Reusable Legend Component
 */
const SeatLegend: React.FC = () => {
    return (
        <div className="mt-8 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-300 mb-3">SEAT STATUS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded border-2 border-green-500 shadow-lg shadow-green-500/50"></div>
                    <span className="text-xs text-slate-300">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded border-2 border-red-500 shadow-lg shadow-red-500/50"></div>
                    <span className="text-xs text-slate-300">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded border-2 border-blue-500 shadow-lg shadow-blue-500/50"></div>
                    <span className="text-xs text-slate-300">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-600 rounded border-2 border-slate-500"></div>
                    <span className="text-xs text-slate-300">Unavailable</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Bus Seat Layout - Professional Design
 */
const BusSeatLayout: React.FC<{
    layout: { [key: string]: any };
    selectedSeats: Set<string>;
    onSeatClick: (seatNo: string, available: boolean) => void;
}> = ({ layout, selectedSeats, onSeatClick }) => {
    const rows = Object.keys(layout).sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">🚌 Bus Seating</h3>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                    <div className="w-4 h-4 bg-gradient-to-br from-slate-600 to-slate-700 rounded border border-slate-500"></div>
                    <span className="text-sm">Front of Bus</span>
                </div>
            </div>

            {/* Seats Container */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700">
                <div className="space-y-6">
                    {rows.map((row) => (
                        <div key={row} className="flex items-center justify-center gap-4">
                            {/* Row Number */}
                            <div className="w-12 flex justify-center">
                                <span className="text-sm font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                                    {row}
                                </span>
                            </div>

                            {/* Seats */}
                            <div className="flex gap-3 justify-center">
                                {layout[row].map((seat: any, colIndex: number) => (
                                    <div key={seat.seat_no}>
                                        <Seat
                                            seatNo={seat.seat_no}
                                            isBooked={seat.is_booked}
                                            isSelected={selectedSeats.has(seat.seat_no)}
                                            onClick={() => onSeatClick(seat.seat_no, !seat.is_booked)}
                                            seatType={seat.seat_type}
                                            price={seat.price}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Emergency Exit */}
                <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-center gap-2">
                    <div className="text-slate-400 text-sm font-semibold">Emergency Exit</div>
                </div>
            </div>

            {/* Legend */}
            <SeatLegend />
        </div>
    );
};

/**
 * Train Seat Layout - Professional Design
 */
const TrainSeatLayout: React.FC<{
    layout: { [key: string]: any };
    selectedSeats: Set<string>;
    onSeatClick: (seatNo: string, available: boolean) => void;
}> = ({ layout, selectedSeats, onSeatClick }) => {
    const berthTypes = ['lower', 'middle', 'upper', 'side'];
    const berthLabels = { 
        lower: '🛏️ Lower Berth', 
        middle: '🛏️ Middle Berth', 
        upper: '🛏️ Upper Berth', 
        side: '🛏️ Side Berth' 
    };
    const berthDescriptions = {
        lower: 'Most spacious & comfortable',
        middle: 'Good middle position',
        upper: 'Compact sleeping space',
        side: 'Beside passage - Easy access'
    };
    const berthColors = {
        lower: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30',
        middle: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30',
        upper: 'bg-pink-500/20 border-pink-500/50 hover:bg-pink-500/30',
        side: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30'
    };
    const berthBorderColors = {
        lower: 'border-blue-500',
        middle: 'border-purple-500',
        upper: 'border-pink-500',
        side: 'border-yellow-500'
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-2">🚂 Train Coach Layout</h3>
                <p className="text-slate-400 text-sm">Select your preferred berth type for a comfortable journey</p>
                <div className="mt-4 inline-block bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-600">
                    <span className="text-xs text-slate-300">📍 Indian Railways Standard Configuration</span>
                </div>
            </div>

            {/* Coach Information */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-8 border border-slate-700 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{(layout['lower'] || []).length}</div>
                        <div className="text-xs text-slate-400">Lower Berths</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{(layout['middle'] || []).length}</div>
                        <div className="text-xs text-slate-400">Middle Berths</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400">{(layout['upper'] || []).length}</div>
                        <div className="text-xs text-slate-400">Upper Berths</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{(layout['side'] || []).length}</div>
                        <div className="text-xs text-slate-400">Side Berths</div>
                    </div>
                </div>
            </div>

            {/* Berth Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {berthTypes.map((berth) => {
                    const seatsInBerth = layout[berth] || [];
                    const availableCount = seatsInBerth.filter((s: any) => !s.is_booked).length;
                    
                    return (
                        <div
                            key={berth}
                            className={`${berthColors[berth as keyof typeof berthColors]} rounded-2xl p-6 border-2 ${berthBorderColors[berth as keyof typeof berthBorderColors]} transition-all duration-300`}
                        >
                            {/* Berth Header */}
                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-white mb-1">
                                    {berthLabels[berth as keyof typeof berthLabels]}
                                </h4>
                                <p className="text-xs text-slate-300">{berthDescriptions[berth as keyof typeof berthDescriptions]}</p>
                                <div className="mt-2 flex justify-between text-xs">
                                    <span className="text-slate-400">Total: <span className="text-white font-semibold">{seatsInBerth.length}</span></span>
                                    <span className="text-green-400">Available: <span className="font-semibold">{availableCount}</span></span>
                                </div>
                            </div>

                            {/* Seats Grid */}
                            <div className="bg-slate-900/40 rounded-lg p-4 backdrop-blur">
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {seatsInBerth.length > 0 ? (
                                        seatsInBerth.map((seat: any) => (
                                            <Seat
                                                key={seat.seat_no}
                                                seatNo={seat.seat_no}
                                                isBooked={seat.is_booked}
                                                isSelected={selectedSeats.has(seat.seat_no)}
                                                onClick={() => onSeatClick(seat.seat_no, !seat.is_booked)}
                                                seatType={berth}
                                                price={seat.price}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-slate-500 text-sm">No seats available</div>
                                    )}
                                </div>
                            </div>

                            {/* Price Info */}
                            <div className="mt-3 text-xs text-slate-400 text-center">
                                {seatsInBerth.length > 0 && (
                                    <span>Price: ₹{seatsInBerth[0].price}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <SeatLegend />
        </div>
    );
};

/**
 * Flight Seat Layout - Professional Design (MakeMyTrip/BookMyShow Style)
 */
const FlightSeatLayout: React.FC<{
    layout: { [key: string]: any };
    selectedSeats: Set<string>;
    onSeatClick: (seatNo: string, available: boolean) => void;
}> = ({ layout, selectedSeats, onSeatClick }) => {
    const rows = Object.keys(layout).sort((a, b) => parseInt(a) - parseInt(b));
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">✈️ Airplane Cabin</h3>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                    <span className="text-sm font-semibold">Front of Aircraft</span>
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                </div>
            </div>

            {/* Main Seating Area */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-700">
                {/* Column Headers */}
                <div className="mb-8 px-4">
                    <div className="flex items-center justify-center">
                        <div className="w-10" />
                        <div className="flex gap-2 flex-1 justify-center">
                            {/* Left columns */}
                            <div className="flex gap-2">
                                {columns.slice(0, 3).map((col) => (
                                    <div
                                        key={`header-${col}`}
                                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-slate-200 bg-slate-600 rounded border border-slate-500"
                                    >
                                        {col}
                                    </div>
                                ))}
                            </div>
                            {/* Aisle */}
                            <div className="w-6" />
                            {/* Right columns */}
                            <div className="flex gap-2">
                                {columns.slice(3, 6).map((col) => (
                                    <div
                                        key={`header-${col}`}
                                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-slate-200 bg-slate-600 rounded border border-slate-500"
                                    >
                                        {col}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seat Rows */}
                <div className="space-y-4">
                    {rows.map((row) => (
                        <div key={row} className="flex items-center justify-center gap-6">
                            {/* Row Number */}
                            <div className="w-10 flex justify-center">
                                <span className="text-sm font-bold text-slate-300 bg-slate-700 px-3 py-1 rounded min-w-10 text-center">
                                    {row}
                                </span>
                            </div>

                            {/* Left section (A, B, C) - Window, Middle, Aisle */}
                            <div className="flex gap-2">
                                {layout[row].slice(0, 3).map((seat: any, idx: number) => (
                                    <div key={seat.seat_no} className={idx === 2 ? 'mr-4' : ''}>
                                        <Seat
                                            seatNo={seat.seat_no}
                                            isBooked={seat.is_booked}
                                            isSelected={selectedSeats.has(seat.seat_no)}
                                            onClick={() => onSeatClick(seat.seat_no, !seat.is_booked)}
                                            seatType={seat.seat_type}
                                            price={seat.price}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Aisle */}
                            <div className="w-6 h-10 flex items-center justify-center">
                                <div className="w-1 h-10 bg-gradient-to-b from-transparent via-slate-600 to-transparent rounded" />
                            </div>

                            {/* Right section (D, E, F) - Aisle, Middle, Window */}
                            <div className="flex gap-2">
                                {layout[row].slice(3, 6).map((seat: any, idx: number) => (
                                    <div key={seat.seat_no} className={idx === 0 ? 'ml-4' : ''}>
                                        <Seat
                                            seatNo={seat.seat_no}
                                            isBooked={seat.is_booked}
                                            isSelected={selectedSeats.has(seat.seat_no)}
                                            onClick={() => onSeatClick(seat.seat_no, !seat.is_booked)}
                                            seatType={seat.seat_type}
                                            price={seat.price}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Emergency Exit */}
                <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-center gap-2">
                    <div className="text-amber-400 text-sm font-semibold">🚪 Emergency Exit Row</div>
                </div>
            </div>

            {/* Legend */}
            <SeatLegend />
        </div>
    );
};

export default SeatMap;
