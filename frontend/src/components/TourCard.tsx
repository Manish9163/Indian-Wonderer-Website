"use client";
import { MapPin, Star, Heart, Share2, Clock, Users, Camera, Award, Sparkles, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { Tour } from '../types/data';
import TourGalleryModal from './TourGalleryModal';
import TourReviewsModal from './TourReviewsModal';

type TourCardProps = {
  tour: Tour;
  darkMode: boolean;
  onBookTour: (tour: Tour, action?: 'view' | 'book') => void;
};

const TourCard: React.FC<TourCardProps> = ({ tour, darkMode, onBookTour }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div 
      className={`group relative ${darkMode ? 'bg-gray-900/90' : 'bg-gray-200'} rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-[1.02] backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:from-gray-800/30 hover:to-gray-700/30 hover:border-gray-600' : 'border-gray-200/50'} hover:bg-gradient-to-br hover:from-gray-50 hover:to-stone-100 hover:border-gray-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-300/15 to-stone-300/15 dark:from-gray-200/15 dark:to-gray-200/15 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
      
      <div className="relative">
        <div className="relative overflow-hidden rounded-t-3xl">
          <img 
            src={tour.image_url || tour.image || '/goa.avif'} 
            alt={tour.title} 
            className={`w-full h-48 object-cover transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src = '/goa.avif'; 
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg backdrop-blur-sm border border-white/20">
            <span className="text-sm">₹{tour.price.toLocaleString()}</span>
          </div>
          
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl font-medium border border-white/20">
            <div className="flex items-center space-x-1.5">
              <Clock size={14} />
              <span className="text-sm">{tour.duration || `${tour.duration_days} days`}</span>
            </div>
          </div>
          
          <div className="absolute top-3 left-3 flex space-x-1.5">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20 ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-700 hover:bg-red-50'
              }`}
            >
              <Heart size={16} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/90 text-gray-700 hover:bg-blue-50 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300`}>
              {tour.title}
            </h3>
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 mr-2">
                <MapPin size={16} className="text-blue-500" />
              </div>
              <span className="text-base font-medium">{tour.location || tour.destination}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${i < Math.floor(tour.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'} transition-all duration-300`}
                  />
                ))}
              </div>
              <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="font-bold text-base">{tour.rating || 0}</span>
                <span className="text-sm ml-1">({tour.reviews || 0})</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <Award className="text-orange-500" size={16} />
              <span className="text-xs font-medium text-orange-500">Verified</span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className={`font-bold mb-2 flex items-center text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="mr-1.5 text-yellow-500" size={16} />
              Experience Highlights
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {tour.highlights && tour.highlights.slice(0, 2).map((highlight: string, index: number) => (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium">✨ {highlight}</span>
                </div>
              ))}
              {tour.features && !tour.highlights && tour.features.slice(0, 2).map((feature: string, index: number) => (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium">✨ {feature}</span>
                </div>
              ))}
              {(tour.highlights && tour.highlights.length > 2) && (
                <div className={`px-3 py-1.5 rounded-lg border-2 border-dashed transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-400' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <span className="text-xs font-medium">
                    🎯 +{tour.highlights.length - 2} more experiences
                  </span>
                </div>
              )}
              {(tour.features && !tour.highlights && tour.features.length > 2) && (
                <div className={`px-3 py-1.5 rounded-lg border-2 border-dashed transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-400' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <span className="text-xs font-medium">
                    🎯 +{tour.features.length - 2} more experiences
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onBookTour(tour, 'view')}
              className="group w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:via-pink-700 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <span className="text-base">View Details</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowGallery(true)}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border-2 text-sm ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}>
                <Camera size={16} />
                <span>Gallery</span>
              </button>
              <button 
                onClick={() => setShowReviews(true)}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 border-2 text-sm ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}>
                <Users size={16} />
                <span>Reviews</span>
              </button>
            </div>
          </div>
        </div>

      {/* Modals */}
      <TourGalleryModal 
        tour={tour} 
        isOpen={showGallery} 
        onClose={() => setShowGallery(false)} 
        darkMode={darkMode}
      />
      <TourReviewsModal 
        tour={tour} 
        isOpen={showReviews} 
        onClose={() => setShowReviews(false)} 
        darkMode={darkMode}
      />
      </div>
    </div>
  );
};

export default TourCard;