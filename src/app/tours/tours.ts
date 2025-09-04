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
        alert('Tour updated successfully!');
      }
    } else {
      this.tourForm.id = Math.max(...this.tours.map(t => t.id)) + 1;
      this.tourForm.image = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop';
      this.tours.push({ ...this.tourForm });
      alert('New tour created successfully!');
    }
    this.tourForm = {};
    this.editingTour = null;
    const modal = bootstrap.Modal.getInstance(document.getElementById('tourModal'));
    if (modal) {
      modal.hide();
    }
  }

  deleteTour(tourId: number) {
    const tour = this.tours.find(t => t.id === tourId);
    if (confirm(`Are you sure you want to delete "${tour?.name}"? This action cannot be undone.`)) {
      this.tours = this.tours.filter(tour => tour.id !== tourId);
      alert('Tour deleted successfully!');
    }
  }

  duplicateTour(tour: any) {
    const newTour = {
      ...tour,
      id: Math.max(...this.tours.map(t => t.id)) + 1,
      name: tour.name + ' (Copy)',
      status: 'draft'
    };
    this.tours.push(newTour);
    alert(`Tour "${tour.name}" duplicated successfully!`);
  }

  toggleTourStatus(tour: any) {
    const statusFlow = ['draft', 'active', 'inactive'];
    const currentIndex = statusFlow.indexOf(tour.status);
    const nextIndex = (currentIndex + 1) % statusFlow.length;
    tour.status = statusFlow[nextIndex];
    alert(`Tour status changed to "${tour.status}"`);
  }

  previewTour(tour: any) {
    const previewWindow = window.open('', '_blank', 'width=800,height=1000');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Tour Preview - ${tour.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; }
              .hero { background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${tour.image}'); 
                     background-size: cover; color: white; padding: 60px 20px; text-align: center; }
              .content { padding: 30px; max-width: 800px; margin: 0 auto; }
              .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
              .detail-item { padding: 15px; background: #f8f9fa; border-radius: 8px; }
              .price { font-size: 2em; color: #28a745; font-weight: bold; }
              .status { padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
              .active { background: #d4edda; color: #155724; }
              .draft { background: #d1ecf1; color: #0c5460; }
              .inactive { background: #f8d7da; color: #721c24; }
            </style>
          </head>
          <body>
            <div class="hero">
              <h1>${tour.name}</h1>
              <h3>${tour.destination}</h3>
            </div>
            <div class="content">
              <div class="detail-grid">
                <div class="detail-item">
                  <h4>Duration</h4>
                  <p>${tour.duration}</p>
                </div>
                <div class="detail-item">
                  <h4>Max Guests</h4>
                  <p>${tour.maxGuests} people</p>
                </div>
                <div class="detail-item">
                  <h4>Price</h4>
                  <div class="price">$${tour.price}</div>
                </div>
                <div class="detail-item">
                  <h4>Status</h4>
                  <span class="status ${tour.status}">${tour.status.toUpperCase()}</span>
                </div>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; margin: 0 10px;">Print</button>
                <button onclick="window.close()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; margin: 0 10px;">Close</button>
              </div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }

  exportTours() {
    const csvContent = [
      'ID,Name,Destination,Duration,Price,Status,Max Guests',
      ...this.tours.map(tour => 
        `${tour.id},"${tour.name}","${tour.destination}","${tour.duration}",${tour.price},${tour.status},${tour.maxGuests}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tours_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Tours data exported successfully!');
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
