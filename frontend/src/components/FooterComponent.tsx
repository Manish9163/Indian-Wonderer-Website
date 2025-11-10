import React from 'react'
import { Phone, Mail, MapPin, Globe, Heart, Star, Instagram, Facebook, Twitter, Youtube, Compass, Sparkles } from 'lucide-react';

interface FooterProps {
  darkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ darkMode }) => {
  return (
    <footer className={`relative ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} mt-20 overflow-hidden`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6 group">
              <div className="relative">
                <img 
                  src="./WhatsApp.jpg" 
                  alt='Indian_Wonderer_logo' 
                  className="h-16 w-16 rounded-3xl shadow-lg group-hover:scale-110 transition-all duration-300 ring-4 ring-orange-500/20" 
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-500 to-green-600 bg-clip-text text-transparent mb-1">
                  Indian Wonderer
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ✨ Explore. Dream. Discover. ✨
                </p>
              </div>
            </div>
            
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 max-w-md text-lg leading-relaxed`}>
              Your trusted partner in exploring the incredible diversity of India. From heritage tours to adventure expeditions, we craft unforgettable experiences that create memories for a lifetime.
            </p>
            
            <div className="space-y-4">
              <div className={`flex items-center space-x-4 p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
              }`}>
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Call us 24/7</p>
                  <a href="tel:9876543210" className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'} hover:text-green-500 transition-colors`}>
                    +91 98765 43210
                  </a>
                </div>
              </div>
              
              <div className={`flex items-center space-x-4 p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
              }`}>
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email us</p>
                  <a href="mailto:info@indianwonderer.com" className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'} hover:text-blue-500 transition-colors`}>
                    IndianWonderer.ac@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`font-black text-xl mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Compass className="mr-2 text-purple-500" size={24} />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {['About Us', 'Tour Packages', 'Custom Tours', 'Travel Guide', 'Travel Blog', 'FAQ'].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className={`flex items-center space-x-2 group ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300`}
                  >
                    <Sparkles size={14} className="text-yellow-500 group-hover:animate-pulse" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`font-black text-xl mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <MapPin className="mr-2 text-red-500" size={24} />
              Top Destinations
            </h4>
            <ul className="space-y-3">
              {['Rajasthan', 'Kerala', 'Golden Triangle', 'Himalayas', 'Goa Beaches', 'South India'].map((destination) => (
                <li key={destination}>
                  <a 
                    href="#" 
                    className={`flex items-center space-x-2 group ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300`}
                  >
                    <Heart size={14} className="text-pink-500 group-hover:animate-pulse" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{destination}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`mt-12 pt-8 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            
            <div className="flex items-center space-x-6">
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Follow us:</span>
              <div className="flex space-x-4">
                {[
                  { Icon: Instagram, color: 'from-pink-500 to-purple-500' },
                  { Icon: Facebook, color: 'from-blue-600 to-blue-500' },
                  { Icon: Twitter, color: 'from-sky-500 to-blue-500' },
                  { Icon: Youtube, color: 'from-red-500 to-red-600' }
                ].map(({ Icon, color }, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300`}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-8 text-center">
              <div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>50K+</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Happy Travelers</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>500+</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Destinations</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>4.9⭐</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rating</div>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700/30' : 'border-gray-300/30'} text-center`}>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center justify-center space-x-2`}>
              <span>© 2024 Indian Wonderer. Made with</span>
              <Heart size={16} className="text-red-500 animate-pulse" />
              <span>in India. All rights reserved.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
