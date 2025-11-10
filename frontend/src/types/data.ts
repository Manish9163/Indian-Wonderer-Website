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
  location?: string; 
  originalPrice?: number; 
  image?: string;
  duration?: string;
  rating?: number; 
  reviews?: number; 
  highlights?: string[]; 
}

export interface Category {
  id: string;
  name: string;
  icon: any; 
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
  tour?: Tour;
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
  tour?: Tour; 
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
  user?: User; 
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
  user?: User; 
  tour?: Tour; 
}

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

export const transformTourData = (apiTour: any): Tour => {
  return {
    ...apiTour,
    location: apiTour.destination, 
    originalPrice: apiTour.price, 
    image: apiTour.image_url || '/goa.avif', 
    duration: `${apiTour.duration_days} ${apiTour.duration_days === 1 ? 'Day' : 'Days'}`, 
    rating: 4.2, 
    reviews: Math.floor(Math.random() * 50) + 10, 
    highlights: apiTour.features ? (typeof apiTour.features === 'string' ? JSON.parse(apiTour.features) : apiTour.features) : [
      'Professional guide included',
      'All meals included',
      'Transportation provided'
    ], 
    gallery: apiTour.gallery ? (typeof apiTour.gallery === 'string' ? JSON.parse(apiTour.gallery) : apiTour.gallery) : [],
    features: apiTour.features ? (typeof apiTour.features === 'string' ? JSON.parse(apiTour.features) : apiTour.features) : [],
    inclusions: apiTour.inclusions ? (typeof apiTour.inclusions === 'string' ? JSON.parse(apiTour.inclusions) : apiTour.inclusions) : [],
    exclusions: apiTour.exclusions ? (typeof apiTour.exclusions === 'string' ? JSON.parse(apiTour.exclusions) : apiTour.exclusions) : [],
  };
};

export const tourData: Tour[] = []; 
