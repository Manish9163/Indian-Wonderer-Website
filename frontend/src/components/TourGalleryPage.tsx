import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2, ZoomIn } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

interface TourGalleryPageProps {
  tourId: string;
  tourTitle: string;
  darkMode: boolean;
  onBack: () => void;
}

const TourGalleryPage: React.FC<TourGalleryPageProps> = ({ tourId, tourTitle, darkMode, onBack }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    loadGalleryImages();
  }, [tourId]);

  const loadGalleryImages = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from API
      const response = await fetch(`http://localhost/fu/backend/api/tours.php?action=gallery&tourId=${tourId}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const images = data.data.map((url: string, index: number) => ({
          id: `img-${index}`,
          url,
          title: `Image ${index + 1}`,
          caption: `Tour destination photo`
        }));
        setGalleryImages(images);
        setSelectedImage(images[0]);
      } else {
        // Fallback images
        const fallbackImages: GalleryImage[] = [
          { id: '1', url: '/goa.avif', title: 'Beach Destination', caption: 'Beautiful coastal views' },
          { id: '2', url: '/shimla.avif', title: 'Mountain Retreat', caption: 'Scenic hill station' },
          { id: '3', url: '/udaipur.avif', title: 'Lake Palace', caption: 'Historic landmarks' },
          { id: '4', url: '/jaipur.avif', title: 'City Palace', caption: 'Cultural architecture' },
          { id: '5', url: '/goa.avif', title: 'Local Market', caption: 'Authentic experiences' }
        ];
        setGalleryImages(fallbackImages);
        setSelectedImage(fallbackImages[0]);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      // Fallback images on error
      const fallbackImages: GalleryImage[] = [
        { id: '1', url: '/goa.avif', title: 'Beach Destination', caption: 'Beautiful coastal views' },
        { id: '2', url: '/shimla.avif', title: 'Mountain Retreat', caption: 'Scenic hill station' },
        { id: '3', url: '/udaipur.avif', title: 'Lake Palace', caption: 'Historic landmarks' }
      ];
      setGalleryImages(fallbackImages);
      setSelectedImage(fallbackImages[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(galleryImages[prevIndex]);
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(galleryImages[index]);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowLeft size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Gallery
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {tourTitle}
              </p>
            </div>
          </div>
          <div className={`text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-xl font-semibold mb-2">Loading gallery...</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Please wait while we load the tour images
            </div>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-xl font-semibold mb-2">No images available</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This tour doesn't have any gallery images yet
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Main Image Display */}
            <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
                {selectedImage && (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/goa.avif';
                    }}
                  />
                )}

                {/* Navigation Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}

                {/* Zoom Button */}
                <button
                  onClick={() => setShowZoom(!showZoom)}
                  className="absolute top-4 right-4 p-3 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-all duration-300 backdrop-blur-sm"
                >
                  <ZoomIn size={24} />
                </button>
              </div>

              {/* Image Info */}
              {selectedImage && (
                <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedImage.title}
                  </h2>
                  <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedImage.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2">
                <Download size={20} />
                <span>Download</span>
              </button>
              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2">
                <Share2 size={20} />
                <span>Share</span>
              </button>
              <button className={`w-full py-3 rounded-lg font-medium transition-all duration-300 border-2 ${
                darkMode
                  ? 'border-blue-500 text-blue-400 hover:bg-blue-500/20'
                  : 'border-blue-500 text-blue-600 hover:bg-blue-50'
              }`}>
                Add to Favorites
              </button>
              <button className={`w-full py-3 rounded-lg font-medium transition-all duration-300 border-2 ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Print
              </button>
            </div>

            {/* Thumbnail Grid */}
            {galleryImages.length > 1 && (
              <div>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  All Images
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => handleImageClick(index)}
                      className={`relative group rounded-lg overflow-hidden aspect-square transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'ring-4 ring-blue-500 scale-105'
                          : `ring-2 ${darkMode ? 'ring-gray-600' : 'ring-gray-300'}`
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/goa.avif';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                        {index === currentImageIndex ? (
                          <div className="text-white font-bold text-sm">{index + 1}</div>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Statistics */}
            <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Gallery Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-blue-500">{galleryImages.length}</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Images
                  </div>
                </div>
                <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-green-500">🖼️</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    High Quality
                  </div>
                </div>
                <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-purple-500">📸</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Professional
                  </div>
                </div>
                <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-orange-500">⭐</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Latest Photos
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className={`rounded-lg p-6 ${darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                💡 Gallery Tips
              </h3>
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                <li>• Hover over thumbnails for a quick preview</li>
                <li>• Use arrow buttons to navigate through images</li>
                <li>• Click on any image to view it in full detail</li>
                <li>• Download high-quality images for your records</li>
                <li>• Share photos with friends and family</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourGalleryPage;
