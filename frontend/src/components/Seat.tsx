import React from 'react';
import { Check } from 'lucide-react';

interface SeatProps {
    seatNo: string;
    isBooked: boolean;
    isSelected: boolean;
    onClick: () => void;
    seatType: string;
    price: number;
}

const Seat: React.FC<SeatProps> = ({
    seatNo,
    isBooked,
    isSelected,
    onClick,
    seatType,
    price
}) => {
    // Determine seat color and styling based on state
    let seatColor = 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 hover:from-green-500 hover:to-green-700'; // Available
    let cursorStyle = 'cursor-pointer';
    let borderStyle = 'border-2 border-green-700';

    if (isBooked) {
        seatColor = 'bg-gradient-to-br from-red-400 to-red-600 opacity-60';
        borderStyle = 'border-2 border-red-700';
        cursorStyle = 'cursor-not-allowed opacity-60';
    } else if (isSelected) {
        seatColor = 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/80 scale-110';
        borderStyle = 'border-2 border-blue-700';
    }

    return (
        <button
            onClick={onClick}
            disabled={isBooked}
            title={`${seatNo} - ₹${price}`}
            className={`
                relative w-10 h-10 md:w-11 md:h-11 rounded-lg
                transition-all duration-200 transform
                flex items-center justify-center
                text-xs md:text-sm font-bold text-white
                ${seatColor} ${borderStyle} ${cursorStyle}
                ${!isBooked && !isSelected ? 'hover:scale-105 hover:shadow-md' : ''}
                active:scale-95
                flex-shrink-0
            `}
        >
            {isSelected && <Check className="w-4 h-4 md:w-5 md:h-5" />}
            {!isSelected && !isBooked && <span className="text-xs md:text-sm">{seatNo}</span>}
            {!isSelected && isBooked && <span className="text-sm">✗</span>}

            {/* Tooltip */}
            {!isBooked && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
                    {seatType}
                </div>
            )}
        </button>
    );
};

export default Seat;
