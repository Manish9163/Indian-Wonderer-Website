import React from 'react'
import { MapPin, Sun, Moon, User, LogOut, ChevronDown, Compass, Heart, Calendar, Package, Wallet as WalletIcon } from "lucide-react"
import * as avatars from '@dicebear/avatars';
import * as style from '@dicebear/avatars-avataaars-sprites';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  myItineraries: any[];
  userDetails?: any;
  onLogout: () => void;
  onShowProfile: () => void;
  onShowWallet?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode, 
  activeTab, 
  setActiveTab, 
  myItineraries, 
  userDetails,
  onLogout,
  onShowProfile,
  onShowWallet
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const getAvatarSvg = (seed: string) => avatars.createAvatar(style, { seed });

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      onLogout();
    }
    setShowUserMenu(false);
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-900/80 border-gray-700/50 shadow-lg shadow-purple-500/10' 
        : 'bg-white/80 border-gray-200/50 shadow-lg shadow-blue-500/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center group">
              <div className="relative">
                <img 
                  src="./WhatsApp.jpg" 
                  alt='Indian_Wonderer_logo' 
                  className="h-14 w-14 rounded-2xl shadow-lg transform group-hover:scale-110 transition-all duration-300 ring-2 ring-orange-500/20" 
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-green-600 bg-clip-text text-transparent">
                  Indian Wonderer
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Explore. Dream. Discover.</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex space-x-2">
            <button
              onClick={() => setActiveTab('explore')}
              className={`group px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : `${darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} hover:shadow-md`
              }`}
            >
              <div className="flex items-center space-x-2">
                <Compass size={18} className={`${activeTab === 'explore' ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                <span>Explore Tours</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('agent-application')}
              className={`group px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'agent-application'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                  : `${darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} hover:shadow-md`
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={18} className={`${activeTab === 'agent-application' ? 'animate-bounce' : 'group-hover:animate-pulse'}`} />
                <span>Become Agent</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('itineraries')}
              className={`group px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 relative ${
                activeTab === 'itineraries'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : `${darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} hover:shadow-md`
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={18} className={`${activeTab === 'itineraries' ? 'animate-bounce' : 'group-hover:animate-pulse'}`} />
                <span>My Itineraries</span>
              </div>
              {myItineraries.filter(i => i.status !== 'cancelled').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse shadow-lg">
                  {myItineraries.filter(i => i.status !== 'cancelled').length}
                </span>
              )}
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            {onShowWallet && (
              <button
                onClick={onShowWallet}
                className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 flex items-center space-x-2 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-green-100 shadow-lg shadow-green-700/50' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/50'
                }`}
              >
                <WalletIcon size={20} />
                <span className="text-sm font-semibold">Wallet</span>
              </button>
            )}
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-yellow-400 shadow-lg shadow-gray-700/50' 
                  : 'bg-gradient-to-r from-gray-200 to-gray-100 hover:from-gray-300 hover:to-gray-200 text-gray-700 shadow-lg shadow-gray-300/50'
              }`}
            >
              {darkMode ? <Sun size={20} className="animate-spin" /> : <Moon size={20} className="animate-pulse" />}
            </button>

            {userDetails && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    darkMode 
                      ? 'hover:bg-gray-700/50 backdrop-blur-sm border border-gray-700/50' 
                      : 'hover:bg-gray-100 backdrop-blur-sm border border-gray-200/50'
                  } shadow-lg`}
                >
                  <div className={`relative p-1 rounded-full bg-gradient-to-r from-orange-500 to-green-500 shadow-lg`}>
                    {userDetails.profilePhoto ? (
                      <img 
                        src={userDetails.profilePhoto} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : userDetails.avatar ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: userDetails.avatarSvg || getAvatarSvg(userDetails.avatar) }} 
                        className="w-8 h-8 rounded-full bg-white p-0.5"
                      />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                      {userDetails.firstName && userDetails.lastName 
                        ? `${userDetails.firstName} ${userDetails.lastName}` 
                        : userDetails.identifier || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userDetails.email || userDetails.identifier}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-fadeIn ${
                    darkMode 
                      ? 'bg-gray-900/95 border-gray-700/50 shadow-purple-500/20' 
                      : 'bg-white/95 border-gray-200/50 shadow-blue-500/20'
                  } z-50`}>
                    <div className="p-6 border-b border-gray-200/20 dark:border-gray-700/30">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center shadow-lg p-1">
                            {userDetails.profilePhoto ? (
                              <img 
                                src={userDetails.profilePhoto} 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : userDetails.avatar ? (
                              <div 
                                dangerouslySetInnerHTML={{ __html: userDetails.avatarSvg || getAvatarSvg(userDetails.avatar) }} 
                                className="w-full h-full rounded-full bg-white p-1"
                              />
                            ) : (
                              <User size={24} className="text-white" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Heart size={12} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                            {userDetails.firstName && userDetails.lastName 
                              ? `${userDetails.firstName} ${userDetails.lastName}` 
                              : userDetails.identifier || 'User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{userDetails.email || userDetails.identifier}</p>
                          {userDetails.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{userDetails.phone}</p>}
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium shadow-md ${
                            userDetails.authLevel === 'VERIFIED' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          }`}>
                            {userDetails.authLevel === 'VERIFIED' ? '✅ Verified Explorer' : '� Pending Verification'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <button
                        onClick={() => {
                          onShowProfile();
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                        } flex items-center space-x-3 group`}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md group-hover:shadow-lg transition-all">
                          <User size={16} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">My Profile</span>
                          <p className="text-xs text-gray-500">Customize your travel experience</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('itineraries');
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                        } flex items-center space-x-3 group`}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md group-hover:shadow-lg transition-all">
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">My Itineraries</span>
                          <p className="text-xs text-gray-500">({myItineraries.length} trips planned)</p>
                        </div>
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {myItineraries.length}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                        } flex items-center space-x-3 group`}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md group-hover:shadow-lg transition-all">
                          <Package size={16} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">My Orders</span>
                          <p className="text-xs text-gray-500">View all your bookings</p>
                        </div>
                        {myItineraries.length > 0 && (
                          <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                            {myItineraries.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'
                        } flex items-center space-x-3 group border-t border-gray-200/20 dark:border-gray-700/30 mt-3`}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md group-hover:shadow-lg transition-all">
                          <LogOut size={16} />
                        </div>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header
