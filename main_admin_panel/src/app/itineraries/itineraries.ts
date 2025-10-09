import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Subscription } from 'rxjs';

interface Tour {
  id: number;
  title: string;
  destination: string;
  duration_days: number;
  price: number;
  category: string;
}

interface ScheduleDay {
  id?: number;
  day_number: number;
  title: string;
  description: string;
  time_schedule: string;
  location: string;
  activities: string[];
}

interface Itinerary {
  id: number;
  tour_id: number;
  tour_name: string;
  total_days: number;
  status: 'active' | 'draft' | 'archived';
  schedule: ScheduleDay[];
  schedule_count?: number;
  booking_count?: number;
  creator_name?: string;
  created_at?: string;
}

@Component({
  selector: 'app-itineraries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itineraries.html'
})
export class ItinerariesComponent implements OnInit, OnDestroy {
  itineraries: Itinerary[] = [];
  filteredItineraries: Itinerary[] = [];
  tours: Tour[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  isLoading: boolean = true;
  errorMessage: string = '';

  // Stats
  stats = {
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
    withSchedule: 0
  };

  // Modal state
  showModal: boolean = false;
  isEditMode: boolean = false;
  currentItinerary: Partial<Itinerary> = {};

  // Form data
  formData = {
    tour_id: 0,
    tour_name: '',
    total_days: 1,
    status: 'draft' as 'active' | 'draft' | 'archived',
    schedule: [] as ScheduleDay[]
  };

  // Day editor
  editingDay: ScheduleDay | null = null;
  newActivity: string = '';

  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.ensureAuthenticationAndLoad();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Ensure we have a valid token before loading data
   */
  private ensureAuthenticationAndLoad(): void {
    console.log('🔐 Checking authentication before loading itineraries...');
    
    let token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    
    if (token) {
      console.log('✅ Token found, loading data');
      this.loadAll();
      return;
    }

    // Try to get token using remembered credentials
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail && rememberedPassword) {
      console.log('🔄 No token found, attempting silent login...');
      this.authService.login(rememberedEmail, atob(rememberedPassword), true).subscribe({
        next: (response) => {
          if (response.success && response.token) {
            console.log('✅ Silent login successful, loading data');
            this.loadAll();
          } else {
            this.handleAuthFailure();
          }
        },
        error: (error) => {
          console.error('❌ Silent login failed:', error);
          this.handleAuthFailure();
        }
      });
    } else {
      // Check for frontend authentication
      const frontendAuth = localStorage.getItem('adminAuthenticated');
      if (frontendAuth === 'true') {
        console.log('🔑 Frontend authentication detected, attempting to get token...');
        this.authService.login('admin@indianwonderer.com', 'Admin@123', true).subscribe({
          next: (response) => {
            if (response.success) {
              console.log('✅ Token obtained from frontend auth, loading data');
              this.loadAll();
            } else {
              this.handleAuthFailure();
            }
          },
          error: () => {
            this.handleAuthFailure();
          }
        });
      } else {
        this.handleAuthFailure();
      }
    }
  }

  private handleAuthFailure(): void {
    console.warn('⚠️ No authentication found');
    this.isLoading = false;
    this.errorMessage = 'Please login to view itineraries';
  }

  /**
   * Load all data (tours and itineraries)
   */
  loadAll(): void {
    this.loadTours();
    this.loadItineraries();
  }

  /**
   * Load available tours for selection
   */
  loadTours(): void {
    this.apiService.getTours().subscribe({
      next: (response) => {
        if (response && response.success) {
          // API returns { success: true, data: { tours: [...], stats: {...} } }
          this.tours = response.data?.tours || response.data || [];
          console.log(`✅ Loaded ${this.tours.length} tours`, this.tours);
        }
      },
      error: (error) => {
        console.error('❌ Error loading tours:', error);
      }
    });
  }

  /**
   * Load itineraries
   */
  loadItineraries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getItineraries().subscribe({
      next: (response) => {
        console.log('✅ Itineraries API Response:', response);

        if (response && response.success && response.data) {
          const dataArray = response.data.itineraries || response.data;
          
          if (Array.isArray(dataArray)) {
            this.itineraries = dataArray.map((item: any) => ({
              id: item.id,
              tour_id: item.tour_id,
              tour_name: item.tour_name,
              total_days: parseInt(item.total_days) || 1,
              status: item.status || 'draft',
              schedule: item.schedule || [],
              schedule_count: parseInt(item.schedule_count) || 0,
              booking_count: parseInt(item.booking_count) || 0,
              creator_name: item.creator_name || '',
              created_at: item.created_at || ''
            }));

            this.calculateStats();
            this.filterItineraries();
            console.log(`🔔 Loaded ${this.itineraries.length} itineraries`);
          }
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading itineraries:', error);
        this.errorMessage = 'Failed to load itineraries';
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculate statistics
   */
  calculateStats(): void {
    this.stats = {
      total: this.itineraries.length,
      active: this.itineraries.filter(i => i.status === 'active').length,
      draft: this.itineraries.filter(i => i.status === 'draft').length,
      archived: this.itineraries.filter(i => i.status === 'archived').length,
      withSchedule: this.itineraries.filter(i => (i.schedule_count || 0) > 0).length
    };
  }

  /**
   * Filter itineraries based on search and filters
   */
  filterItineraries(): void {
    this.filteredItineraries = this.itineraries.filter(itinerary => {
      const matchesSearch = itinerary.tour_name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || itinerary.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterItineraries();
  }

  onFilterChange(): void {
    this.filterItineraries();
  }

  /**
   * Get badge class for status
   */
  getBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'draft': return 'bg-warning';
      case 'archived': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  /**
   * Add new itinerary
   */
  addNewItinerary(): void {
    this.isEditMode = false;
    this.formData = {
      tour_id: 0,
      tour_name: '',
      total_days: 1,
      status: 'draft',
      schedule: []
    };
    this.showModal = true;
  }

  /**
   * Edit itinerary
   */
  editItinerary(itineraryId: number): void {
    this.isLoading = true;
    
    // Fetch full itinerary with schedule
    this.apiService.getItineraryById(itineraryId).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const itinerary = response.data;
          
          this.isEditMode = true;
          this.currentItinerary = itinerary;
          this.formData = {
            tour_id: itinerary.tour_id,
            tour_name: itinerary.tour_name,
            total_days: itinerary.total_days,
            status: itinerary.status,
            schedule: itinerary.schedule || []
          };
          
          this.showModal = true;
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading itinerary:', error);
        this.errorMessage = 'Failed to load itinerary details';
        this.isLoading = false;
      }
    });
  }

  /**
   * Delete itinerary
   */
  deleteItinerary(itineraryId: number): void {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    this.apiService.deleteItinerary(itineraryId).subscribe({
      next: (response) => {
        if (response && response.success) {
          alert('✅ Itinerary deleted successfully!');
          this.loadItineraries();
        }
      },
      error: (error) => {
        console.error('❌ Error deleting itinerary:', error);
        alert('Failed to delete itinerary: ' + error.message);
      }
    });
  }

  /**
   * Save itinerary (create or update)
   */
  saveItinerary(): void {
    // Validation
    if (!this.formData.tour_name || this.formData.total_days < 1) {
      alert('Please enter tour name and valid duration');
      return;
    }

    if (this.formData.schedule.length === 0) {
      if (!confirm('No day-by-day schedule added. Continue saving?')) {
        return;
      }
    }

    const payload = {
      ...this.formData,
      id: this.isEditMode ? this.currentItinerary.id : undefined
    };

    const saveObservable = this.isEditMode && this.currentItinerary.id
      ? this.apiService.updateItinerary(this.currentItinerary.id, payload)
      : this.apiService.createItinerary(payload);

    saveObservable.subscribe({
      next: (response) => {
        if (response && response.success) {
          alert(this.isEditMode ? '✅ Itinerary updated!' : '✅ Itinerary created!');
          this.closeModal();
          this.loadItineraries();
        }
      },
      error: (error) => {
        console.error('❌ Error saving itinerary:', error);
        alert('Failed to save itinerary: ' + error.message);
      }
    });
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentItinerary = {};
    this.editingDay = null;
  }

  /**
   * When tour is selected, update tour name and days
   */
  onTourSelected(): void {
    const selectedTour = this.tours.find(t => t.id === this.formData.tour_id);
    if (selectedTour) {
      this.formData.tour_name = selectedTour.title;
      this.formData.total_days = selectedTour.duration_days;
    }
  }

  /**
   * Add a new day to schedule
   */
  addDay(): void {
    const newDay: ScheduleDay = {
      day_number: this.formData.schedule.length + 1,
      title: `Day ${this.formData.schedule.length + 1}`,
      description: '',
      time_schedule: '',
      location: '',
      activities: []
    };
    this.formData.schedule.push(newDay);
    this.editDay(newDay);
  }

  /**
   * Edit a day
   */
  editDay(day: ScheduleDay): void {
    this.editingDay = { ...day };
    this.newActivity = '';
  }

  /**
   * Save edited day
   */
  saveDayEdits(): void {
    if (this.editingDay) {
      const index = this.formData.schedule.findIndex(d => d.day_number === this.editingDay!.day_number);
      if (index !== -1) {
        this.formData.schedule[index] = { ...this.editingDay };
      }
      this.editingDay = null;
    }
  }

  /**
   * Cancel day editing
   */
  cancelDayEdits(): void {
    this.editingDay = null;
    this.newActivity = '';
  }

  /**
   * Delete a day from schedule
   */
  deleteDay(dayNumber: number): void {
    if (confirm(`Delete Day ${dayNumber}?`)) {
      this.formData.schedule = this.formData.schedule
        .filter(d => d.day_number !== dayNumber)
        .map((d, index) => ({ ...d, day_number: index + 1, title: d.title || `Day ${index + 1}` }));
      
      if (this.editingDay && this.editingDay.day_number === dayNumber) {
        this.editingDay = null;
      }
    }
  }

  /**
   * Add activity to day
   */
  addActivity(): void {
    if (this.editingDay && this.newActivity.trim()) {
      if (!this.editingDay.activities) {
        this.editingDay.activities = [];
      }
      this.editingDay.activities.push(this.newActivity.trim());
      this.newActivity = '';
    }
  }

  /**
   * Remove activity from day
   */
  removeActivity(index: number): void {
    if (this.editingDay && this.editingDay.activities) {
      this.editingDay.activities.splice(index, 1);
    }
  }

  /**
   * Refresh itineraries
   */
  refreshItineraries(): void {
    this.loadItineraries();
  }

  /**
   * Export itineraries (placeholder)
   */
  exportItineraries(): void {
    console.log('Export itineraries - TODO');
    alert('Export functionality coming soon!');
  }
}
