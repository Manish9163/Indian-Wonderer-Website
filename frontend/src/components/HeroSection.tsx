import { Search, MapPin, Calendar, Users, Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const tourSlides = [
  {
    image: "/tajmahal.avif",
    title: " Majestic Taj Mahal",
    subtitle: "✨ Witness the eternal symbol of love 🕌",
    description: "Experience the breathtaking beauty of this UNESCO World Heritage Site at sunrise",
    ctaTitle: "✨ Love Stories Begin Here ✨",
    ctaSubtitle: "Book your romantic getaway and create memories that last forever",
    stats: { visitors: "8M+", rating: "4.9", duration: "1-2 Days" }
  },
  {
    image: "/himalaya.avif",
    title: " Himalayan Adventures",
    subtitle: "⛰️ Conquer the world's highest peaks 🏔️",
    description: "Trek through pristine valleys and witness snow-capped mountains that touch the sky",
    ctaTitle: "🏔️ Adventure Calls You ✨",
    ctaSubtitle: "Join elite adventurers who've conquered the impossible with our expert guides",
    stats: { visitors: "2M+", rating: "4.8", duration: "7-14 Days" }
  },
  {
    image: "/kerala.avif",
    title: " Kerala Backwaters",
    subtitle: "🛶 Sail through God's Own Country 🌴",
    description: "Glide through emerald waterways in traditional houseboats surrounded by lush greenery",
    ctaTitle: "🌿 Paradise Found ✨",
    ctaSubtitle: "Escape to tranquility where nature's beauty meets luxury comfort",
    stats: { visitors: "5M+", rating: "4.7", duration: "3-5 Days" }
  },
  {
    image: "/rajasthan.avif",
    title: " Rajasthan Royalty",
    subtitle: "🏰 Live like maharajas in golden cities 👑",
    description: "Explore magnificent palaces, vibrant markets, and experience royal hospitality",
    ctaTitle: "👑 Royal Treatment Awaits ✨",
    ctaSubtitle: "Experience luxury like never before in India's most majestic palaces",
    stats: { visitors: "6M+", rating: "4.9", duration: "5-7 Days" }
  },
  {
    image: "/goa.avif",
    title: " Goa Beach Paradise",
    subtitle: "🌅 Sun, sand, and endless bliss 🏖️",
    description: "Relax on pristine beaches with golden sand and crystal-clear waters",
    ctaTitle: "🏖️ Beach Vibes Only ✨",
    ctaSubtitle: "Dive into the ultimate beach vacation where every sunset is magical",
    stats: { visitors: "10M+", rating: "4.6", duration: "3-7 Days" }
  },
  {
    image: "/varanasi.avif",
    title: " Spiritual Varanasi",
    subtitle: "🙏 Journey to the soul of India 🕉️",
    description: "Experience ancient rituals and spiritual awakening on the sacred Ganges",
    ctaTitle: "🕉️ Find Your Inner Peace ✨",
    ctaSubtitle: "Transform your soul with spiritual experiences thousands of years in the making",
    stats: { visitors: "3M+", rating: "4.8", duration: "2-4 Days" }
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ darkMode, searchQuery, setSearchQuery }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % tourSlides.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentTour = tourSlides[currentSlide];

  return (
    <section className="relative h-[700px] overflow-hidden">
      {/* Background Image with Transition */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out ${
          isAnimating ? 'scale-100 blur-sm' : 'scale-110 blur-none'
        }`}
        style={{ 
          backgroundImage: `url(${currentTour.image})`,
        }}
      />
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-purple-900/20 to-black/60"></div>
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-white max-w-6xl mx-auto px-4">
          {/* Tour Stats Bar */}
          <div className={`transition-all duration-800 ease-in-out transform mb-8 ${
            isAnimating ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            <div className="flex justify-center mb-6">
              <div className="flex space-x-6 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">{currentTour.stats.visitors} Visitors</span>
                </div>
                <div className="w-px bg-white/30"></div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">{currentTour.stats.rating} Rating</span>
                </div>
                <div className="w-px bg-white/30"></div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">{currentTour.stats.duration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with Slide Animation */}
          <div className={`transition-all duration-800 ease-in-out transform ${
            isAnimating ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-black mb-4 text-white">
                {currentTour.title}
              </h1>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-white/90">
                {currentTour.subtitle}
              </h2>
              <p className="text-base md:text-lg mb-6 text-gray-200 max-w-3xl mx-auto leading-relaxed">
                {currentTour.description}
              </p>
              
              {/* CTA Section */}
              <div className="mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
                  <p className="text-xl font-bold text-white mb-2">
                    {currentTour.ctaTitle}
                  </p>
                  <p className="text-base text-gray-300">
                    {currentTour.ctaSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex justify-center mb-8">
            <div className={`${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} p-16 px-32 bg-transparent opacity-80 rounded-3xl shadow-2xl max-w-4xl w-full backdrop-blur-xl border-2 ${darkMode ? 'border-gray-700/50' : 'border-white/30'} transform hover:scale-105 transition-all duration-300`}>
              <div className="flex flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                  <input
                    type="text"
                    placeholder="Where do you want to explore?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-10/20 pl-16 pr-10 py-6 rounded-2xl border-2 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 caret-white' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 caret-black'
                    } focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-xl font-medium placeholder:text-lg`}
                  />
                </div>
                <button className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 rounded-2xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 text-lg whitespace-nowrap">
                  <Search size={24} className="mr-2 group-hover:animate-pulse" />
                  <span>Search</span>
                </button>
              </div>
              
              {/* Quick Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Taj Mahal', 'Kerala', 'Goa', 'Rajasthan', 'Himalayas'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Slide Indicators */}
          <div className="flex justify-center space-x-4">
            {tourSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`relative w-4 h-4 rounded-full transition-all duration-300 transform hover:scale-125 ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 scale-125 shadow-xl shadow-yellow-400/50'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              >
                {index === currentSlide && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-ping"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
