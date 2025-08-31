import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tours.html',
})
export class ToursComponent {
  tours = [
    { id: 1, name: 'Bali Adventure', destination: 'Bali, Indonesia', duration: '7 days', price: 1200, status: 'active', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=100&h=100&fit=crop', maxGuests: 10 },
    { id: 2, name: 'Tokyo Explorer', destination: 'Tokyo, Japan', duration: '5 days', price: 890, status: 'active', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop', maxGuests: 12 },
    { id: 3, name: 'Paris Romance', destination: 'Paris, France', duration: '4 days', price: 1500, status: 'active', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=100&h=100&fit=crop', maxGuests: 8 },
    { id: 4, name: 'Safari Kenya', destination: 'Nairobi, Kenya', duration: '10 days', price: 2100, status: 'draft', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=100&h=100&fit=crop', maxGuests: 15 },
    { id: 5, name: 'Swiss Alps', destination: 'Interlaken, Switzerland', duration: '6 days', price: 1800, status: 'active', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=100&h=100&fit=crop', maxGuests: 10 },
    { id: 6, name: 'Maldives Escape', destination: 'Male, Maldives', duration: '8 days', price: 2800, status: 'inactive', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=100&h=100&fit=crop', maxGuests: 6 }
  ];
  editingTour: any = null;
  tourForm: any = {};

  editTour(tour: any) {
    this.editingTour = tour;
    this.tourForm = { ...tour };
  }

  saveTour() {
    if (this.editingTour) {
      const index = this.tours.findIndex(t => t.id === this.editingTour.id);
      if (index !== -1) {
        this.tours[index] = { ...this.tourForm };
      }
    } else {
      this.tourForm.id = Math.max(...this.tours.map(t => t.id)) + 1;
      this.tourForm.image = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop';
      this.tours.push({ ...this.tourForm });
    }
    this.tourForm = {};
    this.editingTour = null;
    const modal = bootstrap.Modal.getInstance(document.getElementById('tourModal'));
    if (modal) {
      modal.hide();
    }
  }

  deleteTour(tourId: number) {
    if (confirm('Are you sure you want to delete this tour?')) {
      this.tours = this.tours.filter(tour => tour.id !== tourId);
    }
  }
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tourForm.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
