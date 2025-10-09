// Type definitions for the Indian Wonderer application
import { MapPin, Mountain, Waves, Camera, Heart, Star } from 'lucide-react';

export interface Tour {
  id: number;
  title: string;
  description: string;
  destination: string;
  price: number;
  duration_days: number;
  max_capacity: number;
  category: string;
  difficulty_level: 'easy' | 'moderate' | 'difficult';
  image_url?: string;
  gallery?: string[];
  features?: string[];
  inclusions?: string[];
  exclusions?: string[];
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Computed/Legacy properties for compatibility
  location?: string; // Maps to destination
  originalPrice?: number; // Maps to price
  image?: string; // Maps to image_url
  duration?: string; // Computed from duration_days
  rating?: number; // Default value since not in DB yet
  reviews?: number; // Default value since not in DB yet
  highlights?: string[]; // Maps to features
}

// Categories for filtering
export interface Category {
  id: string;
  name: string;
  icon: any; // Lucide icon component
}

export const categories: Category[] = [
  { id: 'adventure', name: 'Adventure', icon: Mountain },
  { id: 'beach', name: 'Beach', icon: Waves },
  { id: 'cultural', name: 'Cultural', icon: Camera },
  { id: 'romantic', name: 'Romantic', icon: Heart },
  { id: 'spiritual', name: 'Spiritual', icon: Star },
  { id: 'city', name: 'City Tours', icon: MapPin },
];

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  profile_picture?: string;
  role: 'customer' | 'guide' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  user_id?: number;
  tour_id: number;
  itinerary_id?: number;
  number_of_travelers: number;
  total_amount: number;
  booking_date: string;
  travel_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  special_requirements?: string;
  traveler_details?: any;
  created_at: string;
  updated_at: string;
  tour?: Tour; // Populated from join
}

export interface Itinerary {
  id: number;
  tour_id: number;
  tour_name: string;
  total_days: number;
  status: 'active' | 'draft' | 'archived';
  created_by?: number;
  created_at: string;
  updated_at: string;
  tour?: Tour; // Populated from join
  schedule?: ItinerarySchedule[];
}

export interface ItinerarySchedule {
  id: number;
  itinerary_id: number;
  day_number: number;
  title: string;
  description?: string;
  time_schedule?: string;
  location?: string;
  activities?: string[];
  created_at: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  transaction_id?: string;
  payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_response?: any;
  processing_fee: number;
  payment_date: string;
  created_at: string;
}

export interface Guide {
  id: number;
  user_id: number;
  specialization?: string;
  experience_years: number;
  languages?: string[];
  certification?: string;
  bio?: string;
  rating: number;
  total_tours: number;
  hourly_rate?: number;
  availability?: any;
  status: 'available' | 'busy' | 'inactive';
  application_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: User; // Populated from join
}

export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  tour_id: number;
  guide_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: User; // Populated from join
  tour?: Tour; // Populated from join
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Form data types
export interface BookingFormData {
  tour_id: number;
  number_of_travelers: number;
  travel_date: string;
  special_requirements?: string;
  traveler_details: {
    primary_contact: {
      name: string;
      email: string;
      phone: string;
      address?: string;
    };
    travelers?: Array<{
      name: string;
      age?: number;
      passport_number?: string;
    }>;
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'general' | 'booking' | 'payment' | 'technical' | 'complaint';
}

// Helper function to transform API tour data to frontend format
export const transformTourData = (apiTour: any): Tour => {
  return {
    ...apiTour,
    location: apiTour.destination, // Map destination to location for compatibility
    originalPrice: apiTour.price, // Map price to originalPrice for compatibility
    image: apiTour.image_url || '/goa.avif', // Default image if none provided
    duration: `${apiTour.duration_days} ${apiTour.duration_days === 1 ? 'Day' : 'Days'}`, // Format duration
    rating: 4.2, // Default rating since reviews aren't implemented yet
    reviews: Math.floor(Math.random() * 50) + 10, // Random review count for demo
    highlights: apiTour.features ? (typeof apiTour.features === 'string' ? JSON.parse(apiTour.features) : apiTour.features) : [
      'Professional guide included',
      'All meals included',
      'Transportation provided'
    ], // Map features to highlights with fallback
    gallery: apiTour.gallery ? (typeof apiTour.gallery === 'string' ? JSON.parse(apiTour.gallery) : apiTour.gallery) : [],
    features: apiTour.features ? (typeof apiTour.features === 'string' ? JSON.parse(apiTour.features) : apiTour.features) : [],
    inclusions: apiTour.inclusions ? (typeof apiTour.inclusions === 'string' ? JSON.parse(apiTour.inclusions) : apiTour.inclusions) : [],
    exclusions: apiTour.exclusions ? (typeof apiTour.exclusions === 'string' ? JSON.parse(apiTour.exclusions) : apiTour.exclusions) : [],
  };
};

// Default empty arrays to prevent errors
export const tourData: Tour[] = []; // Keep for compatibility but will be loaded from API
