import React from 'react'
import { MapPin, Loader } from 'lucide-react';
import { HeroSection } from './HeroSection';
import TourCard from './TourCard';
import FilterCategories from './FilterCategories';
import { Tour } from '../types/data'; 

interface ExploreToursProps {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: React.Dispatch<React.SetStateAction<string>>;
  tours: Tour[];
  onBookTour: (tour: Tour) => void;
  loading?: boolean;
  apiError?: string | null;
}

const ExploreTours: React.FC<ExploreToursProps> = ({ 
  darkMode, 
  searchQuery, 
  setSearchQuery, 
  filterCategory, 
  setFilterCategory, 
  tours, 
  onBookTour,
  loading = false,
  apiError = null
}) => {
  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tour.location || tour.destination).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tour.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <HeroSection darkMode={darkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FilterCategories
          darkMode={darkMode}
          selectedCategory={filterCategory}
          onCategoryChange={setFilterCategory}
        />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <Loader size={64} className="mx-auto text-blue-500 mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Loading Tours...</h3>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the latest tours</p>
          </div>
        )}

        {/* Error state */}
        {!loading && apiError && (
          <div className="text-center py-16">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">Error Loading Tours</h3>
              <p className="text-red-600 dark:text-red-300 mb-4">{apiError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Tours grid */}
        {!loading && !apiError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tour={tour} darkMode={darkMode} onBookTour={onBookTour} />
            ))}
          </div>
        )}

        {/* No tours found */}
        {!loading && !apiError && filteredTours.length === 0 && tours.length > 0 && (
          <div className="text-center py-16">
            <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tours found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

        {/* No tours available at all */}
        {!loading && !apiError && tours.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 max-w-md mx-auto">
              <MapPin size={64} className="mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-400">No Tours Available</h3>
              <p className="text-blue-600 dark:text-blue-300">Check back later for exciting new tours!</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ExploreTours
