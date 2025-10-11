import React, { useState, useEffect } from 'react';
import { User, Star, MapPin, Award, Languages, Shuffle, Heart, Zap, Clock, CheckCircle } from 'lucide-react';
import apiService from '../services/api.service';

interface Agent {
  id: number;
  name: string;
  full_name?: string;
  avatar: string;
  profile_image?: string;
  specialization: string | string[];
  languages: string[];
  experience: number;
  experience_years?: number;
  rating: number;
  reviews: number;
  total_assignments?: number;
  location: string;
  phone: string;
  email: string;
  bio: string;
  availability: string[];
  badges: string[];
  profileColor: string;
  isOnline?: boolean;
  responseTime?: string;
  status?: string;
}

interface AgentSelectorProps {
  darkMode: boolean;
  onAgentSelect: (agent: Agent | null) => void;
  selectedDestination?: string;
  onClose: () => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  darkMode, 
  onAgentSelect, 
  selectedDestination,
  onClose 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSelectionToast, setShowSelectionToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get('guides.php?status=available');
      
      if (response.success && response.data && response.data.length > 0) {
        const transformedGuides = response.data.map((guide: any, index: number) => ({
          id: guide.id,
          name: guide.full_name || `${guide.first_name || ''} ${guide.last_name || ''}`.trim() || 'Guide',
          avatar: guide.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.full_name || 'Guide')}&size=150&background=random`,
          specialization: Array.isArray(guide.specialization) ? guide.specialization : [guide.specialization || 'Tour Guide'],
          languages: Array.isArray(guide.languages) ? guide.languages : ['English', 'Hindi'],
          experience: guide.experience_years || 5,
          rating: parseFloat(guide.rating) || 4.5,
          reviews: guide.total_assignments || 0,
          location: guide.location || 'India',
          phone: guide.phone || '',
          email: guide.email || '',
          bio: guide.bio || 'Experienced tour guide',
          availability: Array.isArray(guide.availability) ? guide.availability : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          badges: guide.certification ? [guide.certification] : ['Certified Guide'],
          profileColor: ['from-purple-500 to-pink-500', 'from-blue-500 to-teal-500', 'from-orange-500 to-red-500', 'from-green-500 to-emerald-600', 'from-yellow-500 to-orange-600'][index % 5],
          isOnline: guide.status === 'available',
          responseTime: '< 15 min',
          status: guide.status
        }));
        
        setAgents(transformedGuides);
      } else {
        setAgents([]);
        setError('No guides available at the moment');
      }
    } catch (error) {
      console.error('Error loading guides:', error);
      setError('Failed to load guides. Please try again.');
      setAgents([]);
    } finally {
      setIsLoading(false);
      setIsAnimating(true);
    }
  };

  const handleRandomSelect = () => {
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    setSelectedAgent(randomAgent);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'experience':
        return b.experience - a.experience;
      default:
        return 0;
    }
  });

  const filteredAgents = filterSpecialization === 'all' 
    ? sortedAgents 
    : sortedAgents.filter(agent => {
        const specs = Array.isArray(agent.specialization) ? agent.specialization : [agent.specialization];
        return specs.some((spec: string) => 
          spec.toLowerCase().includes(filterSpecialization.toLowerCase())
        );
      });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`${
        darkMode ? 'bg-gray-900/95 text-white border-gray-700' : 'bg-white/95 text-gray-900 border-gray-200'
      } rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border backdrop-blur-lg glass transform transition-all duration-500 animate-slideIn`}>
        
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-10 animate-shimmer"></div>
          <div className="relative p-6 border-b border-gray-200/20 dark:border-gray-700/30">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold flex items-center space-x-3 animate-slideIn">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl animate-float">
                    <User className="text-white w-5 h-5" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent gradient-text">
                    Choose Your Expert Guide
                  </span>
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center space-x-2 animate-fadeIn`}>
                  <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                  <span>Connect with verified local experts for unforgettable experiences</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 ${
                  darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'
                } rounded-xl transition-all duration-300 hover:scale-110 group`}
              >
                <div className="w-5 h-5 flex items-center justify-center text-xl group-hover:rotate-90 transition-transform duration-300">
                  ✕
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-gray-800/30 dark:to-gray-700/30">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Specialization</label>
                <select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 glass`}
                >
                  <option value="all">All Specializations</option>
                  <option value="cultural">Cultural Tours</option>
                  <option value="adventure">Adventure</option>
                  <option value="beach">Beach & Water</option>
                  <option value="desert">Desert Safari</option>
                  <option value="wildlife">Wildlife</option>
                  <option value="backwater">Backwater Tours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 glass`}
                >
                  <option value="rating">Highest Rating</option>
                  <option value="experience">Most Experience</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRandomSelect}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg card-hover"
              >
                <Shuffle className="w-3 h-3" />
                <span>Random Pick</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 min-h-0 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading expert guides...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {error}
              </p>
              <button
                onClick={loadGuides}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No guides match your filters
              </p>
              <button
                onClick={() => setFilterSpecialization('all')}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {filteredAgents.length > 4 && (
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-transparent pointer-events-none z-10">
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center animate-bounce">
                    <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                      darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white/90 text-gray-600'
                    } shadow-lg border border-purple-200`}>
                      ⬇ Scroll to see {filteredAgents.length} guides ⬇
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {filteredAgents.map((agent, index) => (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setIsAnimating(true);
                  setShowSelectionToast(true);
                  setTimeout(() => setIsAnimating(false), 300);
                  setTimeout(() => setShowSelectionToast(false), 3000);
                  setTimeout(() => {
                    onAgentSelect(agent);
                  }, 1500);
                }}
                style={{ animationDelay: `${index * 0.1}s` }}
                className={`relative group cursor-pointer transition-all duration-500 animate-fadeIn ${
                  selectedAgent?.id === agent.id 
                    ? 'ring-4 ring-purple-500 ring-offset-2 shadow-2xl scale-[1.05] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 transform-gpu animate-pulse-glow' 
                    : 'hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-purple-300 hover:ring-offset-1'
                }`}
              >
                {selectedAgent?.id === agent.id && (
                  <div className="absolute -top-2 -right-2 z-20 bg-green-500 text-white rounded-full p-1 shadow-lg animate-bounce-in">
                    <CheckCircle size={20} />
                  </div>
                )}
                
                {selectedAgent?.id === agent.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl z-10 pointer-events-none animate-fadeIn" />
                )}
                <div className={`rounded-xl overflow-hidden ${
                  darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } border backdrop-blur-sm glass transition-all duration-300 ${
                  selectedAgent?.id === agent.id ? 'border-purple-400' : ''
                }`}>
                  
                  <div className={`relative h-20 bg-gradient-to-r ${agent.profileColor} p-3`}>
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      {agent.isOnline && (
                        <div className="flex items-center space-x-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs animate-pulse">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          <span>Online</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-6 left-3">
                      <div className="relative">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className={`w-12 h-12 rounded-xl border-3 border-white shadow-lg object-cover transition-all duration-300 ${
                            selectedAgent?.id === agent.id ? 'ring-2 ring-purple-400 scale-110' : 'hover:scale-105'
                          }`}
                        />
                        {agent.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                        )}
                        {selectedAgent?.id === agent.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 p-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold transition-colors duration-300 ${
                          selectedAgent?.id === agent.id ? 'text-purple-600 dark:text-purple-400' : ''
                        }`}>{agent.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="font-semibold text-xs">{agent.rating}</span>
                          <span className="text-xs text-gray-500">({agent.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{agent.location}</span>
                      </div>
                      
                      {agent.responseTime && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                          <Clock className="w-3 h-3" />
                          <span>Responds {agent.responseTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(agent.specialization) ? agent.specialization : [agent.specialization]).slice(0, 1).map((spec: string, index: number) => (
                        <span
                          key={index}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                            selectedAgent?.id === agent.id 
                              ? 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {spec}
                        </span>
                      ))}
                      {(Array.isArray(agent.specialization) ? agent.specialization : [agent.specialization]).length > 1 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">
                          +{(Array.isArray(agent.specialization) ? agent.specialization : [agent.specialization]).length - 1}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3 text-blue-500" />
                        <span className="font-medium">{agent.experience} years</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Languages className="w-3 h-3 text-green-500" />
                        <span className="font-medium">{agent.languages.length} languages</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {agent.badges[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAgent?.id === agent.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border-2 border-purple-400 animate-fadeIn">
                    <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1.5 animate-pulse shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                      Selected
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                  selectedAgent?.id === agent.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl border border-purple-300/50">
                    <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1 opacity-80">
                      <Heart className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-md text-xs font-medium opacity-80">
                      Click to Select
                    </div>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-60">
        <div className="flex space-x-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4">
          <button
            onClick={() => onAgentSelect(null)}
            className={`group px-6 py-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:shadow-lg' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shuffle size={18} className="group-hover:animate-wiggle" />
              <span className="font-medium">Skip (Auto-assign)</span>
            </div>
          </button>
          
          <button
            onClick={() => {
              if (selectedAgent) {
                setIsAnimating(true);
                setTimeout(() => {
                  onAgentSelect(selectedAgent);
                }, 200);
              }
            }}
            disabled={!selectedAgent}
            className={`group relative px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              selectedAgent
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl hover:from-purple-600 hover:to-pink-600 hover:shadow-2xl animate-pulse-glow border-2 border-purple-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 border-2 border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {selectedAgent ? (
                <>
                  <CheckCircle size={18} className="group-hover:animate-bounce-in" />
                  <span className="font-semibold">Continue with {selectedAgent.name}</span>
                  <span className="group-hover:animate-wiggle">→</span>
                </>
              ) : (
                <>
                  <User size={18} />
                  <span className="font-medium">Select an Agent First</span>
                </>
              )}
            </div>
            
            {isAnimating && selectedAgent && (
              <div className="absolute inset-0 bg-white/20 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </div>
      </div>
      
      {showSelectionToast && selectedAgent && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-xl z-60 animate-slideIn">
          <div className="flex items-center space-x-3">
            <CheckCircle size={24} className="animate-bounce-in" />
            <div>
              <p className="font-semibold">Agent Selected!</p>
              <p className="text-sm opacity-90">{selectedAgent.name} will be auto-selected in 1.5s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
