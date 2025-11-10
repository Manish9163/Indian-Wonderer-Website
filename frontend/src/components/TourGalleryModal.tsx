import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { Tour } from '../types/data';

interface TourGalleryModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const TourGalleryModal: React.FC<TourGalleryModalProps> = ({ tour, isOpen, onClose, darkMode }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGalleryImages();
    }
  }, [isOpen, tour.id]);

  const loadGalleryImages = async () => {
    setIsLoading(true);
    try {
      // Try to fetch tour images from API
      const response = await fetch(`http://localhost/fu/backend/api/tours.php?action=gallery&tourId=${tour.id}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setGalleryImages(data.data);
      } else {
        // Fallback to default images
        setGalleryImages([
          tour.image_url || tour.image || '/goa.avif',
          '/goa.avif',
          '/shimla.avif',
          '/udaipur.avif',
          '/jaipur.avif'
        ]);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      // Fallback images
      setGalleryImages([
        tour.image_url || tour.image || '/goa.avif',
        '/goa.avif',
        '/shimla.avif',
        '/udaipur.avif',
        '/jaipur.avif'
      ]);
    }
    setIsLoading(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Gallery - {tour.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <X size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
          </button>
        </div>

        {/* Main Image */}
        <div className="relative w-full bg-black">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-white">Loading gallery...</div>
            </div>
          ) : (
            <>
              <img
                src={galleryImages[currentImageIndex]}
                alt={`Gallery ${currentImageIndex + 1}`}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/goa.avif';
                }}
              />
              
              {/* Navigation Buttons */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {galleryImages.length > 1 && (
          <div className={`flex gap-2 p-4 overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'border-blue-500 scale-105'
                    : `border-transparent ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'}`
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/goa.avif';
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-3 p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            <Download size={18} />
            Download
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-blue-500 text-blue-500 font-medium hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-300"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourGalleryModal;
