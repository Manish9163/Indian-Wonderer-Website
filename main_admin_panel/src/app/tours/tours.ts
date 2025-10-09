import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tours.html',
  styleUrls: ['./tours.css'] 
})
export class ToursComponent implements OnInit {
  // State
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Data
  tours: any[] = [];
  filteredTours: any[] = [];
  
  // Filters
  searchTerm: string = '';
  selectedCategory: string = 'all';
  
  // Stats
  stats = {
    totalTours: 0,
    activeTours: 0,
    totalBookings: 0,
    avgRating: 0
  };
  
  // Modal & Form
  showModal: boolean = false;
  editingTour: any = null;
  tourForm: any = {
    title: '',
    description: '',
    destination: '',
    price: 0,
    duration_days: 0,
    category: 'adventure',
    difficulty_level: 'moderate',
    is_active: 1
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTours();
  }
  
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  loadTours(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading tours from API...');
    
    this.apiService.getTours().subscribe({
      next: (response) => {
        console.log('Tours API Response:', response);
        
        if (response && response.success && response.data) {
          this.tours = response.data.tours || [];
          this.stats = response.data.stats || {
            totalTours: 0,
            activeTours: 0,
            totalBookings: 0,
            avgRating: 0
          };
          
          console.log('Loaded tours:', this.tours.length);
          this.filterTours();
          this.isLoading = false;
        } else {
          this.errorMessage = response.error || 'Failed to load tours';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading tours:', error);
        this.errorMessage = error.message || 'Error loading tours. Check if XAMPP is running.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Filter tours by search term and category
   */
  filterTours(): void {
    let filtered = this.tours;
    
    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tour =>
        tour.title?.toLowerCase().includes(term) ||
        tour.description?.toLowerCase().includes(term) ||
        tour.destination?.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      filtered = filtered.filter(tour => tour.category === this.selectedCategory);
    }
    
    this.filteredTours = filtered;
    console.log(`🔍 Filtered: ${this.filteredTours.length} / ${this.tours.length} tours`);
  }

  /**
   * Open modal to add new tour
   */
  openAddModal(): void {
    this.editingTour = null;
    this.tourForm = {
      title: '',
      description: '',
      destination: '',
      price: 0,
      duration_days: 0,
      category: 'adventure',
      difficulty_level: 'moderate',
      is_active: 1
    };
    this.showModal = true;
    console.log('➕ Opening add tour modal');
  }

  /**
   * Open modal to edit existing tour
   */
  openEditModal(tour: any): void {
    this.editingTour = { ...tour };
    this.tourForm = {
      title: tour.title,
      description: tour.description,
      destination: tour.destination,
      price: tour.price,
      duration_days: tour.duration_days,
      category: tour.category || 'adventure',
      difficulty_level: tour.difficulty_level || 'moderate',
      is_active: tour.is_active ? 1 : 0
    };
    this.showModal = true;
    console.log('✏️ Opening edit tour modal for:', tour.title);
  }

  /**
   * Close modal and reset form
   */
  closeModal(): void {
    this.showModal = false;
    this.editingTour = null;
    this.tourForm = {
      title: '',
      description: '',
      destination: '',
      price: 0,
      duration_days: 0,
      category: 'adventure',
      difficulty_level: 'moderate',
      is_active: 1
    };
  }

  /**
   * Save tour (create or update)
   */
  saveTour(): void {
    // Validation
    if (!this.tourForm.title || !this.tourForm.description || !this.tourForm.destination) {
      alert('Please fill in all required fields (Title, Description, Destination)');
      return;
    }

    if (this.tourForm.price <= 0 || this.tourForm.duration_days <= 0) {
      alert('Price and Duration must be greater than 0');
      return;
    }

    this.isSaving = true;
    
    if (this.editingTour) {
      // Update existing tour
      console.log('📝 Updating tour:', this.editingTour.id);
      
      this.apiService.updateTour(this.editingTour.id, this.tourForm).subscribe({
        next: (response) => {
          console.log('✅ Tour updated:', response);
          this.isSaving = false;
          this.closeModal();
          this.showSuccessMessage('Tour updated successfully!');
          this.loadTours(); // Reload data
        },
        error: (error) => {
          console.error('❌ Error updating tour:', error);
          alert('Error updating tour: ' + error.message);
          this.isSaving = false;
        }
      });
    } else {
      // Create new tour
      console.log('➕ Creating new tour:', this.tourForm.title);
      
      this.apiService.createTour(this.tourForm).subscribe({
        next: (response) => {
          console.log('✅ Tour created:', response);
          this.isSaving = false;
          this.closeModal();
          this.showSuccessMessage('Tour created successfully!');
          this.loadTours(); // Reload data
        },
        error: (error) => {
          console.error('❌ Error creating tour:', error);
          alert('Error creating tour: ' + error.message);
          this.isSaving = false;
        }
      });
    }
  }

  /**
   * Confirm and delete tour
   */
  confirmDelete(tour: any): void {
    const confirmed = confirm(`Are you sure you want to delete "${tour.title}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      this.deleteTour(tour.id, tour);
    }
  }

  /**
   * Delete tour from database
   */
  deleteTour(tourId: number, tour?: any): void {
    console.log('🗑️ Deleting tour:', tourId);
    
    this.apiService.deleteTour(tourId).subscribe({
      next: (response) => {
        console.log('✅ Tour deleted:', response);
        this.showSuccessMessage('Tour deleted successfully!');
        this.loadTours(); // Reload data
      },
      error: (error) => {
        console.error('❌ Error deleting tour:', error);
        
        // Check if it's a foreign key constraint error
        if (error.message && error.message.includes('bookings')) {
          // Offer alternative action
          const deactivate = confirm(
            `Cannot delete "${tour?.title || 'this tour'}" because it has existing bookings.\n\n` +
            `Would you like to DEACTIVATE it instead?\n\n` +
            `(Deactivating will hide it from customers but preserve booking history)`
          );
          
          if (deactivate && tour) {
            this.deactivateTour(tour);
          }
        } else {
          alert('Error deleting tour: ' + error.message);
        }
      }
    });
  }

  /**
   * Deactivate tour instead of deleting
   */
  deactivateTour(tour: any): void {
    console.log('🔒 Deactivating tour:', tour.id);
    
    const updatedTour = {
      ...tour,
      is_active: 0
    };
    
    this.apiService.updateTour(tour.id, updatedTour).subscribe({
      next: (response) => {
        console.log('✅ Tour deactivated:', response);
        this.showSuccessMessage('Tour deactivated successfully!');
        this.loadTours(); // Reload data
      },
      error: (error) => {
        console.error('❌ Error deactivating tour:', error);
        alert('Error deactivating tour: ' + error.message);
      }
    });
  }

  /**
   * View tour details
   */
  viewTour(tour: any): void {
    alert(`Tour Details:\n\nTitle: ${tour.title}\nDestination: ${tour.destination}\nPrice: ₹${tour.price}\nDuration: ${tour.duration_days} days\nCategory: ${tour.category}\nBookings: ${tour.booking_count || 0}\nRating: ${tour.avg_rating || 0} ⭐`);
  }

  /**
   * Show success message
   */
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
