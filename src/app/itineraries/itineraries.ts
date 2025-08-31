import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-itineraries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itineraries.html',
  styleUrl: './itineraries.css'
})
export class ItinerariesComponent {
  itineraries = [
    {
        tourName: 'Bali Adventure',
        days: 7,
        schedule: [
            { day: 1, title: 'Arrival in Denpasar', description: 'Airport pickup, hotel check-in, welcome dinner', time: '3:00 PM - 8:00 PM' },
            { day: 2, title: 'Ubud Cultural Tour', description: 'Visit rice terraces, temples, and local markets', time: '8:00 AM - 6:00 PM' },
            { day: 3, title: 'Volcano Hiking', description: 'Mount Batur sunrise trek and hot springs', time: '2:00 AM - 12:00 PM' }
        ]
    },
    {
        tourName: 'Tokyo Explorer',
        days: 5,
        schedule: [
            { day: 1, title: 'Tokyo Arrival', description: 'Narita airport transfer, Shibuya exploration', time: '2:00 PM - 9:00 PM' },
            { day: 2, title: 'Traditional Tokyo', description: 'Senso-ji Temple, Asakusa district, tea ceremony', time: '9:00 AM - 6:00 PM' },
            { day: 3, title: 'Modern Tokyo', description: 'Harajuku, Shibuya crossing, Tokyo Skytree', time: '10:00 AM - 8:00 PM' }
        ]
    },
    {
        tourName: 'Paris Romance',
        days: 4,
        schedule: [
            { day: 1, title: 'Parisian Welcome', description: 'CDG airport pickup, Seine river cruise', time: '4:00 PM - 10:00 PM' },
            { day: 2, title: 'Historic Paris', description: 'Louvre Museum, Notre Dame, Latin Quarter', time: '9:00 AM - 7:00 PM' },
            { day: 3, title: 'Romantic Paris', description: 'Eiffel Tower, Montmartre, evening cabaret', time: '10:00 AM - 11:00 PM' }
        ]
    }
  ];
}
