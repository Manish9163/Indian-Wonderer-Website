import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guides.html'
})
export class GuidesComponent implements OnInit {
  // Loading and error states
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Additional stubs for template compatibility
  showEditModal: boolean = false;
  editingGuide: any = null;
  showPendingModal: boolean = false;
  pendingApplications: any[] = [];
  // Methods for modal and application actions
  closeEditModal() { 
    this.showEditModal = false;
    this.editingGuide = null;
  }

  saveGuideEdit() {
    if (!this.editingGuide) return;
    
    console.log('Saving guide edit:', this.editingGuide);
    
    this.apiService.updateGuide(this.editingGuide.id, this.editingGuide).subscribe({
      next: (response) => {
        if (response && response.success) {
          alert('✅ Guide updated successfully!');
          this.closeEditModal();
          this.loadGuides(); // Refresh the list
        } else {
          alert('❌ Failed to update guide');
        }
      },
      error: (error) => {
        console.error('Error updating guide:', error);
        alert('❌ Failed to update guide: ' + error.message);
      }
    });
  }

  closePendingModal() { 
    this.showPendingModal = false;
  }

  exportApplicationData() {
    console.log('Exporting application data...');
    const data = JSON.stringify(this.pendingApplications, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pending_applications_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  previewApplication(application: any) {
    console.log('Previewing application:', application);
    alert(`Application Preview:\nName: ${application.name}\nEmail: ${application.email}`);
  }

  approveApplication(application: any) {
    if (confirm(`Approve application from ${application.name}?`)) {
      console.log('Approving application:', application);
      
      this.apiService.updateGuide(application.id, { application_status: 'approved', status: 'available' }).subscribe({
        next: (response) => {
          if (response && response.success) {
            alert(`✅ Application approved for ${application.name}!`);
            this.loadGuides();
          } else {
            alert('❌ Failed to approve application');
          }
        },
        error: (error) => {
          console.error('Error approving application:', error);
          alert('❌ Failed to approve application');
        }
      });
    }
  }

  rejectApplication(application: any) {
    const reason = prompt(`Reject application from ${application.name}?\nReason:`);
    if (reason) {
      console.log('Rejecting application:', application, 'Reason:', reason);
      
      this.apiService.updateGuide(application.id, { application_status: 'rejected', status: 'inactive' }).subscribe({
        next: (response) => {
          if (response && response.success) {
            alert(`✅ Application rejected for ${application.name}`);
            this.loadGuides();
          } else {
            alert('❌ Failed to reject application');
          }
        },
        error: (error) => {
          console.error('Error rejecting application:', error);
          alert('❌ Failed to reject application');
        }
      });
    }
  }

  suspendGuide(guide: any) {
    const reason = prompt(`Suspend ${guide.name}?\nReason:`);
    if (reason) {
      console.log('Suspending guide:', guide.name, 'Reason:', reason);
      
      this.updateGuideStatus(guide.id, 'inactive');
    }
  }

  activateGuide(guide: any) {
    if (confirm(`Activate ${guide.name}?`)) {
      console.log('Activating guide:', guide.name);
      
      this.updateGuideStatus(guide.id, 'available');
    }
  }

  addSpecialtyToEdit(val: string) {
    if (this.editingGuide && val) {
      if (!this.editingGuide.specialization) {
        this.editingGuide.specialization = val;
      } else {
        this.editingGuide.specialization += ', ' + val;
      }
    }
  }

  // Helper method to update guide status
  updateGuideStatus(guideId: number, status: string) {
    this.apiService.updateGuide(guideId, { status }).subscribe({
      next: (response) => {
        if (response && response.success) {
          alert('✅ Guide status updated successfully!');
          this.loadGuides(); // Refresh the list
          if (this.showGuideModal) {
            this.closeGuideModal();
          }
        } else {
          alert('❌ Failed to update guide status');
        }
      },
      error: (error) => {
        console.error('Error updating guide status:', error);
        alert('❌ Failed to update guide status');
      }
    });
  }
  // Stub properties for template compatibility
  guideAnalytics = {
    totalGuides: 0,
    activeGuides: 0,
    averageRating: 0,
    totalEarnings: 0,
    pendingApplications: 0
  };
  filterStatus: string = '';
  sortBy: string = '';
  sortOrder: string = 'asc';
  showGuideModal: boolean = false;
  selectedGuide: any = null;
  showAssignBookingModal: boolean = false;
  availableBookings: any[] = [];
  selectedGuideForAssignment: any = null;
  selectedBookingId: number | null = null;

  // Active methods with database integration
  exportGuideData() {
    console.log('Exporting guide data...');
    const data = JSON.stringify(this.guides, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guides_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  openPendingApplications() {
    this.showPendingModal = true;
    console.log('Opening pending applications...');
    this.loadPendingApplications();
  }

  loadPendingApplications() {
    console.log('📋 Loading pending applications...');
    
    this.apiService.getGuides('pending').subscribe({
      next: (response) => {
        console.log('✅ Pending Applications Response:', response);
        
        if (response && response.success) {
          if (response.data && response.data.guides) {
            this.pendingApplications = response.data.guides.map((guide: any) => ({
              ...guide,
              status: guide.application_status || 'pending',
              applicationDate: guide.created_at,
              // Parse languages from string to array
              languages: this.parseLanguages(guide.languages),
              // Parse certifications/specialization to array
              certifications: guide.certification 
                ? guide.certification.split(',').map((c: string) => c.trim())
                : [],
              specialties: guide.specialization 
                ? (typeof guide.specialization === 'string' 
                    ? guide.specialization.split(',').map((s: string) => s.trim())
                    : guide.specialization)
                : []
            }));
            console.log(`✅ Loaded ${this.pendingApplications.length} pending applications`);
          } else {
            this.pendingApplications = [];
            console.warn('⚠️ No pending applications found');
          }
        } else {
          this.pendingApplications = [];
          console.error('❌ Failed to load pending applications');
        }
      },
      error: (error) => {
        console.error('❌ Error loading pending applications:', error);
        this.pendingApplications = [];
      }
    });
  }

  setSortBy(val: string) { 
    this.sortBy = val;
    this.filterGuides();
  }

  setRating(guide: any, star: number) {
    console.log(`Setting rating for ${guide.name} to ${star}`);
    
    this.apiService.updateGuide(guide.id, { rating: star }).subscribe({
      next: (response) => {
        if (response && response.success) {
          guide.rating = star;
          alert(`✅ Rating updated to ${star} stars!`);
          this.loadGuides(); // Refresh to get updated stats
        } else {
          alert('❌ Failed to update rating');
        }
      },
      error: (error) => {
        console.error('Error updating rating:', error);
        alert('❌ Failed to update rating');
      }
    });
  }

  viewGuideDetails(guide: any) {
    console.log('Viewing guide details:', guide);
    
    // Process guide data for display
    this.selectedGuide = {
      ...guide,
      // Parse languages if it's a string
      languages: this.parseLanguages(guide.languages),
      // Convert specialization to array
      specialties: guide.specialization ? guide.specialization.split(',').map((s: string) => s.trim()) : [],
      // Convert certification to array
      certifications: guide.certification ? [guide.certification] : [],
      // Use created_at as joinDate
      joinDate: guide.created_at,
      // Add emergency contact placeholder
      emergencyContact: guide.emergency_contact || guide.phone || 'Not provided',
      // Ensure totalEarnings exists
      totalEarnings: guide.total_earnings || 0,
      // Ensure trips exists
      trips: guide.tours_completed || guide.trips || 0,
      // Ensure availability exists
      availability: guide.availability || this.getAvailabilityFromStatus(guide.status)
    };
    
    this.showGuideModal = true;
  }

  // Helper method to parse languages
  parseLanguages(languages: any): string[] {
    if (!languages) return [];
    
    // If it's already an array, return it
    if (Array.isArray(languages)) return languages;
    
    // If it's a JSON string, parse it
    if (typeof languages === 'string') {
      try {
        const parsed = JSON.parse(languages);
        if (Array.isArray(parsed)) return parsed;
        // If it's a comma-separated string
        return languages.split(',').map(l => l.trim());
      } catch (e) {
        // If parsing fails, split by comma
        return languages.split(',').map(l => l.trim());
      }
    }
    
    return [];
  }

  // Helper method to get availability text from status
  getAvailabilityFromStatus(status: string): string {
    if (status === 'available') return 'Available';
    if (status === 'busy') return 'Busy';
    if (status === 'inactive') return 'Inactive';
    return 'Unknown';
  }

  assignTour(guide: any) {
    console.log('Assigning booking to guide:', guide.name);
    this.selectedGuideForAssignment = guide;
    this.selectedBookingId = null;
    this.loadAvailableBookings();
    this.showAssignBookingModal = true;
  }

  loadAvailableBookings() {
    // Load bookings that don't have a guide assigned yet
    this.apiService.getBookings().subscribe({
      next: (response: any) => {
        console.log('Bookings API response:', response);
        if (response && response.success) {
          // Get bookings from response.data.bookings
          const allBookings = response.data?.bookings || [];
          console.log('All bookings:', allBookings);
          
          // Filter bookings that are pending or confirmed (show all for now since we don't track guide assignment yet)
          this.availableBookings = allBookings.filter((booking: any) => 
            booking.status === 'pending' || booking.status === 'confirmed'
          );
          
          console.log('Available bookings:', this.availableBookings);
        }
      },
      error: (error: any) => {
        console.error('Error loading bookings:', error);
        this.availableBookings = [];
      }
    });
  }

  confirmBookingAssignment() {
    if (!this.selectedBookingId || !this.selectedGuideForAssignment) {
      alert('Please select a booking to assign');
      return;
    }

    const booking = this.availableBookings.find(b => b.id === this.selectedBookingId);
    
    if (confirm(`Assign booking #${this.selectedBookingId} (${booking?.tour_name || 'Tour'}) to ${this.selectedGuideForAssignment.name}?`)) {
      // Create tour guide assignment
      const assignmentData = {
        guide_id: this.selectedGuideForAssignment.id,
        booking_id: this.selectedBookingId,
        tour_id: booking?.tour_id || null,
        assigned_date: new Date().toISOString().split('T')[0]
      };

      // Use the tours API to create assignment
      this.apiService.assignGuideToTour(assignmentData).subscribe({
        next: (response) => {
          if (response && response.success) {
            alert(`✅ Booking #${this.selectedBookingId} assigned to ${this.selectedGuideForAssignment.name}!`);
            
            // Add notification
            if (this.selectedBookingId) {
              this.notificationService.addGuideAssignmentNotification(
                this.selectedGuideForAssignment.name,
                this.selectedBookingId
              );
            }
            
            this.updateGuideStatus(this.selectedGuideForAssignment.id, 'busy');
            this.closeAssignBookingModal();
            this.loadGuides();
          } else {
            alert('❌ Failed to assign booking: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error assigning booking:', error);
          alert('❌ Failed to assign booking. Please try again.');
        }
      });
    }
  }

  closeAssignBookingModal() {
    this.showAssignBookingModal = false;
    this.selectedGuideForAssignment = null;
    this.selectedBookingId = null;
    this.availableBookings = [];
  }

  completeTour(guide: any) {
    if (confirm(`Mark ${guide.name}'s current tour as completed?\n\nThis will:\n- Mark the tour as complete\n- Set guide status to Available\n- Make guide available for new bookings`)) {
      console.log('Completing tour for guide:', guide.name);
      // Update status back to available
      this.updateGuideStatus(guide.id, 'available');
    }
  }

  sendMessage(guide: any) {
    const message = prompt(`Send message to ${guide.name}:`);
    if (message) {
      console.log(`Sending message to ${guide.name}:`, message);
      alert(`✅ Message sent to ${guide.name}!`);
    }
  }

  viewLocation(guide: any) {
    const location = guide.location || 'Location not available';
    alert(`📍 ${guide.name}'s Location:\n${location}`);
    console.log('Viewing location for:', guide.name, location);
  }

  reportGuide(guide: any) {
    const reason = prompt(`Report ${guide.name} for:`);
    if (reason) {
      console.log(`Reporting guide ${guide.name}:`, reason);
      alert(`✅ Report submitted for ${guide.name}`);
    }
  }

  closeGuideModal() { 
    this.showGuideModal = false;
    this.selectedGuide = null;
  }

  exportGuideProfile(guide: any) {
    console.log('Exporting guide profile:', guide.name);
    const data = JSON.stringify(guide, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide_${guide.name.replace(/\s+/g, '_')}_profile.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  guides: any[] = [];
  filteredGuides: any[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  isAddingGuide: boolean = false;
  
  newGuide: any = {
    name: '',
    email: '',
    phone: '',
    languages: '',
    specialization: '',
    experience: 0
  };

  stats: any = {
    totalGuides: 0,
    activeGuides: 0,
    avgRating: 0,
    totalBookings: 0
  };

  guideStats: any = {
    totalGuides: 45,
    activeGuides: 38,
    averageRating: 4.6,
    totalTours: 1245
  };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadGuides();
  }

  autoCompleteExpiredBookings(): void {
    // Check and complete expired bookings silently in the background
    this.apiService.autoCompleteExpiredBookings().subscribe({
      next: (response: any) => {
        if (response && response.success && response.completed_count > 0) {
          console.log(`🔄 Auto-completed ${response.completed_count} expired booking(s)`);
          console.log('Details:', response.completed_bookings);
          
          // Add notification
          this.notificationService.addTourCompletedNotification(response.completed_count);
        }
      },
      error: (error: any) => {
        // Fail silently, don't interrupt the user experience
        console.warn('⚠️ Failed to auto-complete bookings:', error);
      }
    });
  }

  loadGuides(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('📊 Loading guides from API...');
    
    // First, auto-complete any expired bookings
    this.autoCompleteExpiredBookings();
    
    this.apiService.getGuides().subscribe({
      next: (response) => {
        console.log('✅ Guides API Response:', response);
        
        if (response && response.success) {
          if (response.data && response.data.guides) {
            this.guides = response.data.guides;
            
            // Update stats if available
            if (response.data.stats) {
              this.stats = {
                totalGuides: response.data.stats.totalGuides || 0,
                activeGuides: response.data.stats.availableGuides || 0,
                avgRating: response.data.stats.averageRating || 0,
                totalBookings: 0 // Not provided by API yet
              };
            }
            
            console.log(`✅ Loaded ${this.guides.length} guides`);
            
            // Calculate pending applications count
            this.guideAnalytics.pendingApplications = this.guides.filter(
              (g: any) => g.application_status === 'pending'
            ).length;
          } else {
            this.guides = [];
            console.warn('⚠️ No guides data in response');
          }
          
          this.filterGuides();
        } else {
          this.errorMessage = response.message || 'Failed to load guides';
          console.error('❌ API returned error:', this.errorMessage);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading guides:', error);
        this.errorMessage = 'Failed to load guides. Please try again.';
        this.isLoading = false;
        
        // Load fallback data for development
        this.loadFallbackData();
      }
    });
  }

  loadFallbackData(): void {
    console.log('📋 Loading fallback guide data...');
    this.guides = [
      {
        id: 1,
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91-9876543210',
        languages: 'Hindi, English, French',
        specialization: 'Heritage Tours',
        experience_years: 8,
        rating: 4.8,
        status: 'active',
        tours_completed: 156,
        total_earnings: 450000,
        traveler: 0,
        trips: 156,
        photo: 'https://i.pravatar.cc/150?img=12',
        activity: 'Leading Golden Triangle Tour',
        availability: 'Busy',
        location: 'Agra, India'
      },
      {
        id: 2,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91-9876543211',
        languages: 'Hindi, English, German',
        specialization: 'Adventure Tours',
        experience_years: 5,
        rating: 4.5,
        status: 'active',
        tours_completed: 89,
        total_earnings: 280000,
        traveler: 0,
        trips: 89,
        photo: 'https://i.pravatar.cc/150?img=5',
        activity: 'Mountain Trek Ladakh',
        availability: 'Available',
        location: 'Leh, India'
      }
    ];
    this.filterGuides();
  }

  filterGuides(): void {
    this.filteredGuides = this.guides.filter(guide => {
      const matchesSearch = guide.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           guide.specialization.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || guide.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterGuides();
  }

  onStatusFilterChange(): void {
    this.filterGuides();
  }

  addNewGuide(): void {
    this.isAddingGuide = true;
  }

  saveNewGuide(): void {
    if (this.newGuide.name && this.newGuide.email) {
      const newId = Math.max(...this.guides.map(g => g.id)) + 1;
      this.guides.push({
        id: newId,
        ...this.newGuide,
        rating: 0,
        status: 'active',
        toursCompleted: 0
      });
      this.filterGuides();
      this.cancelAddGuide();
    }
  }

  cancelAddGuide(): void {
    this.isAddingGuide = false;
    this.newGuide = {
      name: '',
      email: '',
      phone: '',
      languages: '',
      specialization: '',
      experience: 0
    };
  }

  editGuide(guide: any): void {
    console.log('Editing guide:', guide);
    this.editingGuide = { ...guide }; // Create a copy
    this.showEditModal = true;
  }

  toggleGuideStatus(guideId: number): void {
    const guide = this.guides.find(g => g.id === guideId);
    if (guide) {
      const newStatus = guide.status === 'available' ? 'inactive' : 'available';
      this.updateGuideStatus(guideId, newStatus);
    }
  }

  viewGuideProfile(guideId: number): void {
    const guide = this.guides.find(g => g.id === guideId);
    if (guide) {
      this.viewGuideDetails(guide);
    }
  }

  deleteGuide(guide: any): void {
    if (confirm(`Are you sure you want to delete ${guide.name}?\n\nThis action cannot be undone.`)) {
      console.log('Deleting guide:', guide.name);
      
      this.apiService.deleteGuide(guide.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            alert(`✅ ${guide.name} has been deleted successfully!`);
            this.loadGuides(); // Refresh the list
          } else {
            alert('❌ ' + (response.error || 'Failed to delete guide'));
          }
        },
        error: (error) => {
          console.error('Error deleting guide:', error);
          if (error.error && error.error.error) {
            alert('❌ ' + error.error.error);
          } else {
            alert('❌ Failed to delete guide. The guide may have active bookings.');
          }
        }
      });
    }
  }

  exportGuides(): void {
    console.log('Exporting guides...');
  }

  refreshGuides(): void {
    this.loadGuides();
  }
}
