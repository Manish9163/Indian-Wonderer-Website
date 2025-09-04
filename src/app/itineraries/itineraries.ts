import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-itineraries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itineraries.html',
  styleUrl: './itineraries.css'
})
export class ItinerariesComponent {
  editingJourney: any = null;
  journeyForm: any = {
    tourName: '',
    days: 1,
    schedule: [
      { day: 1, title: '', description: '', time: '' }
    ]
  };

  itineraries = [
    {
        id: 1,
        tourName: 'Bali Adventure',
        days: 7,
        schedule: [
            { day: 1, title: 'Arrival in Denpasar', description: 'Airport pickup, hotel check-in, welcome dinner', time: '3:00 PM - 8:00 PM' },
            { day: 2, title: 'Ubud Cultural Tour', description: 'Visit rice terraces, temples, and local markets', time: '8:00 AM - 6:00 PM' },
            { day: 3, title: 'Volcano Hiking', description: 'Mount Batur sunrise trek and hot springs', time: '2:00 AM - 12:00 PM' }
        ]
    },
    {
        id: 2,
        tourName: 'Tokyo Explorer',
        days: 5,
        schedule: [
            { day: 1, title: 'Tokyo Arrival', description: 'Narita airport transfer, Shibuya exploration', time: '2:00 PM - 9:00 PM' },
            { day: 2, title: 'Traditional Tokyo', description: 'Senso-ji Temple, Asakusa district, tea ceremony', time: '9:00 AM - 6:00 PM' },
            { day: 3, title: 'Modern Tokyo', description: 'Harajuku, Shibuya crossing, Tokyo Skytree', time: '10:00 AM - 8:00 PM' }
        ]
    },
    {
        id: 3,
        tourName: 'Paris Romance',
        days: 4,
        schedule: [
            { day: 1, title: 'Parisian Welcome', description: 'CDG airport pickup, Seine river cruise', time: '4:00 PM - 10:00 PM' },
            { day: 2, title: 'Historic Paris', description: 'Louvre Museum, Notre Dame, Latin Quarter', time: '9:00 AM - 7:00 PM' },
            { day: 3, title: 'Romantic Paris', description: 'Eiffel Tower, Montmartre, evening cabaret', time: '10:00 AM - 11:00 PM' }
        ]
    }
  ];

  editJourney(journey: any) {
    this.editingJourney = journey;
    this.journeyForm = JSON.parse(JSON.stringify(journey)); // Deep copy
  }

  addDay() {
    const newDayNumber = this.journeyForm.schedule.length + 1;
    this.journeyForm.schedule.push({
      day: newDayNumber,
      title: '',
      description: '',
      time: ''
    });
    this.journeyForm.days = newDayNumber;
  }

  removeDay(index: number) {
    if (this.journeyForm.schedule.length > 1) {
      this.journeyForm.schedule.splice(index, 1);
      // Update day numbers
      this.journeyForm.schedule.forEach((day: any, i: number) => {
        day.day = i + 1;
      });
      this.journeyForm.days = this.journeyForm.schedule.length;
    }
  }

  saveJourney() {
    // Validate form
    if (!this.journeyForm.tourName.trim()) {
      alert('Please enter a journey name');
      return;
    }

    if (this.journeyForm.schedule.some((day: any) => !day.title.trim())) {
      alert('Please fill in all day titles');
      return;
    }

    if (this.editingJourney) {
      // Update existing journey
      const index = this.itineraries.findIndex(j => j.id === this.editingJourney.id);
      if (index !== -1) {
        this.itineraries[index] = { ...this.journeyForm };
      }
    } else {
      // Add new journey
      this.journeyForm.id = Math.max(...this.itineraries.map(j => j.id)) + 1;
      this.itineraries.push({ ...this.journeyForm });
    }

    // Reset form
    this.resetForm();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('journeyModal'));
    if (modal) {
      modal.hide();
    }
  }

  resetForm() {
    this.journeyForm = {
      tourName: '',
      days: 1,
      schedule: [
        { day: 1, title: '', description: '', time: '' }
      ]
    };
    this.editingJourney = null;
  }

  previewItinerary(itinerary: any) {
    // Create a preview window with itinerary details
    const previewContent = `
      <html>
        <head>
          <title>Itinerary Preview - ${itinerary.tourName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
            .day-item { margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
            .day-number { font-weight: bold; color: #007bff; }
            .day-title { font-size: 18px; font-weight: bold; margin: 5px 0; }
            .day-time { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${itinerary.tourName}</h1>
            <p><strong>Duration:</strong> ${itinerary.days} days</p>
          </div>
          <h2>Daily Schedule</h2>
          ${itinerary.schedule.map((day: any) => `
            <div class="day-item">
              <div class="day-number">Day ${day.day}</div>
              <div class="day-title">${day.title}</div>
              <div class="day-time">${day.time}</div>
              <p>${day.description}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(previewContent);
      previewWindow.document.close();
    }
  }

  exportItinerary(itinerary: any) {
    // Create downloadable itinerary file
    const exportContent = `
ITINERARY EXPORT
================

Tour: ${itinerary.tourName}
Duration: ${itinerary.days} days
Generated: ${new Date().toLocaleDateString()}

DAILY SCHEDULE:
${itinerary.schedule.map((day: any) => `
Day ${day.day}: ${day.title}
Time: ${day.time}
Description: ${day.description}
${'='.repeat(50)}
`).join('')}

Created with Indian Wonderer Tours Admin Panel
    `;

    // Create and download file
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itinerary_${itinerary.tourName.replace(/\s+/g, '_')}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    alert(`Itinerary "${itinerary.tourName}" exported successfully!`);
  }

  deleteItinerary(itinerary: any) {
    const confirmDelete = confirm(`Are you sure you want to delete the itinerary "${itinerary.tourName}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      const index = this.itineraries.findIndex(item => item.id === itinerary.id);
      if (index > -1) {
        this.itineraries.splice(index, 1);
        alert(`Itinerary "${itinerary.tourName}" has been successfully deleted.`);
      }
    }
  }
}
