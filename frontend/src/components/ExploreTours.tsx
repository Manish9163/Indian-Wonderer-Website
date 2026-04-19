import React from 'react'
import { MapPin, Loader } from 'lucide-react';
import { HeroSection } from './HeroSection';
import TourCard from './TourCard';
import FilterCategories from './FilterCategories';
import TourItineraryPage from './TourItineraryPage';
import { Tour } from '../types/data';
import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger); 

interface ExploreToursProps {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: React.Dispatch<React.SetStateAction<string>>;
  tours: Tour[];
  onBookTour: (tour: Tour, action?: 'view' | 'book') => void;
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
  const [showItineraryDetails, setShowItineraryDetails] = useState(false);
  const [selectedTourForDetails, setSelectedTourForDetails] = useState<Tour | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tour.location || tour.destination).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tour.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTourAction = (tour: Tour, action?: 'view' | 'book') => {
    if (action === 'view') {
      setSelectedTourForDetails(tour);
      setShowItineraryDetails(true);
    } else {
      onBookTour(tour, action);
    }
  };

  // 📜 ScrollTrigger animations for ExploreTours section
  useGSAP(
    () => {
      // Filter categories slide in from top
      if (filterRef.current) {
        gsap.fromTo(
          filterRef.current,
          { y: -50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: filterRef.current,
              start: 'top 80%',
              end: 'top 50%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Tour grid stagger animation
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.tour-card-item');
        gsap.fromTo(
          cards,
          {
            y: 80,
            opacity: 0,
            scale: 0.9
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
              end: 'top 25%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    },
    { scope: mainRef, dependencies: [filteredTours] }
  );

  return (
    <>
      <HeroSection darkMode={darkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main ref={mainRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div ref={filterRef}>
          <FilterCategories
            darkMode={darkMode}
            selectedCategory={filterCategory}
            onCategoryChange={setFilterCategory}
          />
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm border ${darkMode ? 'bg-gray-900/90 border-gray-700/50' : 'bg-gray-200 border-gray-200/50'}`}>
                {/* Image Placeholder */}
                <div className={`w-full h-48 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                
                <div className="p-5">
                  {/* Title Placeholder */}
                  <div className={`h-6 w-3/4 rounded-md mb-3 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  
                  {/* Location Placeholder */}
                  <div className={`h-4 w-1/2 rounded-md mb-4 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  
                  {/* Rating/Reviews Placeholder */}
                  <div className="flex justify-between items-center mb-4">
                    <div className={`h-4 w-1/3 rounded-md animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-1/4 rounded-md animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  </div>
                  
                  {/* Highlights Placeholder */}
                  <div className="space-y-2 mb-4">
                    <div className={`h-8 w-full rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    <div className={`h-8 w-5/6 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  </div>
                  
                  {/* Buttons Placeholder */}
                  <div className="space-y-2">
                    <div className={`h-12 w-full rounded-xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`h-10 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                      <div className={`h-10 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

        {!loading && !apiError && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map(tour => (
              <div key={tour.id} className="tour-card-item">
                <TourCard tour={tour} darkMode={darkMode} onBookTour={handleTourAction} />
              </div>
            ))}
          </div>
        )}

        {!loading && !apiError && filteredTours.length === 0 && tours.length > 0 && (
          <div className="text-center py-16">
            <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tours found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

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

      {showItineraryDetails && selectedTourForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <TourItineraryPage
            tour={selectedTourForDetails as any}
            darkMode={darkMode}
            onClose={() => {
              setShowItineraryDetails(false);
              setSelectedTourForDetails(null);
            }}
            onBookNow={(tour: any) => {
              setShowItineraryDetails(false);
              setSelectedTourForDetails(null);
              onBookTour(tour, 'book');
            }}
            userDetails={null}
          />
        </div>
      )}
    </>
  );
};

export default ExploreTours
