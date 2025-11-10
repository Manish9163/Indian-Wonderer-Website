import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, MessageCircle, User } from 'lucide-react';
import { Tour } from '../types/data';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface TourReviewsModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const TourReviewsModal: React.FC<TourReviewsModalProps> = ({ tour, isOpen, onClose, darkMode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen, tour.id]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost/fu/backend/api/user_feedback.php?action=get-reviews&tourId=${tour.id}`);
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setReviews(data.data);
      } else {
        // Fallback mock reviews
        setReviews([
          {
            id: '1',
            userId: '1',
            userName: 'Priya Sharma',
            rating: 5,
            title: 'Amazing Experience!',
            comment: 'Had an incredible time on this tour. The guide was knowledgeable and made the experience unforgettable. Highly recommended!',
            date: '2025-01-08',
            helpful: 12,
            verified: true
          },
          {
            id: '2',
            userId: '2',
            userName: 'Rajesh Kumar',
            rating: 4,
            title: 'Great tour, well organized',
            comment: 'Very well planned itinerary. The only minor issue was the timing, but overall it was a fantastic experience.',
            date: '2025-01-05',
            helpful: 8,
            verified: true
          },
          {
            id: '3',
            userId: '3',
            userName: 'Anjali Desai',
            rating: 5,
            title: 'Best trip ever!',
            comment: 'Everything was perfect - from the accommodations to the activities. The tour guide went above and beyond to make it special.',
            date: '2025-01-02',
            helpful: 15,
            verified: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Fallback mock reviews
      setReviews([
        {
          id: '1',
          userId: '1',
          userName: 'Priya Sharma',
          rating: 5,
          title: 'Amazing Experience!',
          comment: 'Had an incredible time on this tour. The guide was knowledgeable and made the experience unforgettable. Highly recommended!',
          date: '2025-01-08',
          helpful: 12,
          verified: true
        },
        {
          id: '2',
          userId: '2',
          userName: 'Rajesh Kumar',
          rating: 4,
          title: 'Great tour, well organized',
          comment: 'Very well planned itinerary. The only minor issue was the timing, but overall it was a fantastic experience.',
          date: '2025-01-05',
          helpful: 8,
          verified: true
        }
      ]);
    }
    setIsLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!userRating || !reviewText || !reviewTitle) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost/fu/backend/api/user_feedback.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-review',
          tourId: tour.id,
          rating: userRating,
          title: reviewTitle,
          comment: reviewText
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Review submitted successfully!');
        setUserRating(0);
        setReviewText('');
        setReviewTitle('');
        setShowReviewForm(false);
        loadReviews(); // Reload reviews
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (!isOpen) return null;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Reviews - {tour.title}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${i < Math.floor(Number(averageRating)) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {averageRating}/5
              </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                ({reviews.length} reviews)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <X size={24} className={darkMode ? 'text-white' : 'text-gray-900'} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading reviews...
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No reviews yet. Be the first to review!
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <User size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {review.userName}
                        </span>
                        {review.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(review.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-3">
                  <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {review.title}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {review.comment}
                  </p>
                </div>

                {/* Helpful Button */}
                <button className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}>
                  <ThumbsUp size={14} />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - Write Review Button */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              Write a Review
            </button>
          ) : (
            <div className="space-y-3">
              {/* Rating Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rate this tour
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="transition-transform transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`${userRating >= star ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  placeholder="Review title"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  maxLength={100}
                  className={`w-full px-3 py-2 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-blue-500 transition-colors`}
                />
              </div>

              {/* Review Text */}
              <div>
                <textarea
                  placeholder="Share your experience with this tour..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border-2 resize-none ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-blue-500 transition-colors`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors border-2 ${
                    darkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Submit Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourReviewsModal;
