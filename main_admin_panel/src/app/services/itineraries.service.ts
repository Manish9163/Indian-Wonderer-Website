import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Itinerary {
  id: number;
  title: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  status: 'active' | 'draft' | 'archived';
  image: string | null;
  bookings: number;
  destinations?: string[];
  highlights?: string[];
  included?: string[];
  excluded?: string[];
}

export interface ItineraryStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  popular: number;
}

@Injectable({
  providedIn: 'root'
})
export class ItinerariesService {
  private itinerariesSubject = new BehaviorSubject<Itinerary[]>([]);
  private statsSubject = new BehaviorSubject<ItineraryStats>({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
    popular: 0
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  public itineraries$ = this.itinerariesSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('ItinerariesService initialized');
  }

  /**
   * Get current itineraries snapshot
   */
  getCurrentItineraries(): Itinerary[] {
    return this.itinerariesSubject.value;
  }

  /**
   * Get current stats snapshot
   */
  getCurrentStats(): ItineraryStats {
    return this.statsSubject.value;
  }

  /**
   * Load all itineraries from API and broadcast
   */
  loadItineraries(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next('');

    console.log('📊 Loading itineraries from API...');

    this.apiService.getItineraries().subscribe({
      next: (response) => {
        console.log('✅ Itineraries API Response:', response);

        if (response && response.success && response.data) {
          // Backend returns response.data.itineraries (object with itineraries array)
          // Handle both response.data.itineraries and response.data as array
          const dataArray = response.data.itineraries || response.data;
          
          if (Array.isArray(dataArray)) {
            const itineraries: Itinerary[] = dataArray.map((item: any) => ({
              id: item.id,
              title: item.title || item.tour_name || item.name || 'Untitled',
              description: item.description || '',
              duration: parseInt(item.duration || item.total_days) || 1,
              price: parseFloat(item.price) || 0,
              category: item.category || 'general',
              status: item.status || 'draft',
              image: item.image || null,
              bookings: parseInt(item.bookings) || 0,
              destinations: item.destinations || [],
              highlights: item.highlights || [],
              included: item.included || [],
              excluded: item.excluded || []
            }));

            // Calculate stats
            const stats = this.calculateStats(itineraries);

            // Broadcast to all subscribers
            this.itinerariesSubject.next(itineraries);
            this.statsSubject.next(stats);
            this.loadingSubject.next(false);

            console.log(`🔔 Broadcast: ${itineraries.length} itineraries loaded`);
          } else {
            console.log('⚠️ Data is not an array, using sample data');
            this.loadSampleData();
          }
        } else {
          // If API doesn't have data, use sample data
          console.log('⚠️ No data from API, using sample data');
          this.loadSampleData();
        }
      },
      error: (error) => {
        console.error('❌ Error loading itineraries:', error);
        console.log('⚠️ Loading sample data due to error');
        this.loadSampleData();
      }
    });
  }

  /**
   * Load sample data (fallback when API not available)
   */
  private loadSampleData(): void {
    const sampleItineraries: Itinerary[] = [
      {
        id: 1,
        title: 'Golden Triangle Classic',
        description: 'Explore Delhi, Agra, and Jaipur in this amazing journey through India\'s heritage.',
        duration: 7,
        price: 25000,
        category: 'heritage',
        status: 'active',
        image: null,
        bookings: 45,
        destinations: ['Delhi', 'Agra', 'Jaipur'],
        highlights: ['Taj Mahal', 'Red Fort', 'Amber Fort']
      },
      {
        id: 2,
        title: 'Kerala Backwater Adventure',
        description: 'Experience the serene backwaters of Kerala with houseboat stays and local cuisine.',
        duration: 5,
        price: 18000,
        category: 'nature',
        status: 'active',
        image: null,
        bookings: 32,
        destinations: ['Kochi', 'Alleppey', 'Kumarakom'],
        highlights: ['Houseboat Stay', 'Backwater Cruise', 'Traditional Cuisine']
      },
      {
        id: 3,
        title: 'Goa Beach Paradise',
        description: 'Relax on pristine beaches and enjoy water sports in this tropical getaway.',
        duration: 4,
        price: 15000,
        category: 'beach',
        status: 'draft',
        image: null,
        bookings: 0,
        destinations: ['North Goa', 'South Goa'],
        highlights: ['Beach Activities', 'Water Sports', 'Nightlife']
      }
    ];

    const stats = this.calculateStats(sampleItineraries);

    this.itinerariesSubject.next(sampleItineraries);
    this.statsSubject.next(stats);
    this.loadingSubject.next(false);
    console.log('✅ Sample data loaded');
  }

  /**
   * Create new itinerary and broadcast
   */
  createItinerary(itinerary: Partial<Itinerary>): Observable<any> {
    console.log('➕ Creating new itinerary...', itinerary);

    return new Observable(observer => {
      this.apiService.createItinerary(itinerary).subscribe({
        next: (response) => {
          if (response.success) {
            // Add to local state
            const newItinerary: Itinerary = {
              id: response.data?.id || Date.now(),
              title: itinerary.title || 'New Itinerary',
              description: itinerary.description || '',
              duration: itinerary.duration || 1,
              price: itinerary.price || 0,
              category: itinerary.category || 'general',
              status: itinerary.status || 'draft',
              image: itinerary.image || null,
              bookings: 0,
              destinations: itinerary.destinations || [],
              highlights: itinerary.highlights || [],
              included: itinerary.included || [],
              excluded: itinerary.excluded || []
            };

            const currentItineraries = this.itinerariesSubject.value;
            const updatedItineraries = [...currentItineraries, newItinerary];
            const stats = this.calculateStats(updatedItineraries);

            // Broadcast updates
            this.itinerariesSubject.next(updatedItineraries);
            this.statsSubject.next(stats);

            console.log('✅ Itinerary created and broadcast!');
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Create failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error creating itinerary:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Update itinerary and broadcast changes
   */
  updateItinerary(id: number, updates: Partial<Itinerary>): Observable<any> {
    console.log(`🔄 Updating itinerary ${id}...`, updates);

    return new Observable(observer => {
      this.apiService.updateItinerary(id, updates).subscribe({
        next: (response) => {
          if (response.success) {
            // Update local state
            const currentItineraries = this.itinerariesSubject.value;
            const updatedItineraries = currentItineraries.map(itinerary =>
              itinerary.id === id ? { ...itinerary, ...updates } : itinerary
            );

            const stats = this.calculateStats(updatedItineraries);

            // Broadcast updates
            this.itinerariesSubject.next(updatedItineraries);
            this.statsSubject.next(stats);

            console.log(`✅ Itinerary ${id} updated and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Update failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error updating itinerary:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Delete itinerary and broadcast changes
   */
  deleteItinerary(id: number): Observable<any> {
    console.log(`🗑️ Deleting itinerary ${id}...`);

    return new Observable(observer => {
      this.apiService.deleteItinerary(id).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove from local state
            const currentItineraries = this.itinerariesSubject.value;
            const updatedItineraries = currentItineraries.filter(itinerary => itinerary.id !== id);

            const stats = this.calculateStats(updatedItineraries);

            // Broadcast updates
            this.itinerariesSubject.next(updatedItineraries);
            this.statsSubject.next(stats);

            console.log(`✅ Itinerary ${id} deleted and broadcast!`);
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Delete failed'));
          }
        },
        error: (error) => {
          console.error('❌ Error deleting itinerary:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Refresh itineraries (reload from API)
   */
  refresh(): void {
    console.log('🔄 Refreshing itineraries...');
    this.loadItineraries();
  }

  /**
   * Calculate itinerary statistics
   */
  private calculateStats(itineraries: Itinerary[]): ItineraryStats {
    return {
      total: itineraries.length,
      active: itineraries.filter(i => i.status === 'active').length,
      draft: itineraries.filter(i => i.status === 'draft').length,
      archived: itineraries.filter(i => i.status === 'archived').length,
      popular: itineraries.filter(i => i.bookings > 20).length
    };
  }

  /**
   * Filter itineraries by search term, status, and category
   */
  filterItineraries(searchTerm: string, statusFilter: string, categoryFilter: string): Itinerary[] {
    const currentItineraries = this.itinerariesSubject.value;

    return currentItineraries.filter(itinerary => {
      const matchesSearch = itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           itinerary.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || itinerary.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || itinerary.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next('');
  }
}
