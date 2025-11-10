import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, Sparkles, TrendingUp, Brain, Heart, Zap, BookOpen, Star } from 'lucide-react';
import { SmartChatbotService } from '../services/smartChatbot.service';

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  helpful?: boolean;
  userQuery?: string;
  suggestions?: string[];
  tourRecommendations?: any[];
  confidenceScore?: number;
};

type ChatBotProps = {
  darkMode: boolean;
};

const ChatBotAI: React.FC<ChatBotProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const smartChatbotRef = useRef<SmartChatbotService | null>(null);

  const welcomeMessage: Message = {
    id: 'welcome',
    text: '🌟 Hello! I\'m TravelBuddy AI - your intelligent travel companion!\n\n✨ I can help you:\n• Find perfect tours based on your preferences\n• Get personalized recommendations\n• Compare destinations & prices\n• Answer travel questions\n• Book amazing experiences\n\n💡 Tip: Tell me your mood, budget, destination, or trip duration!\n\nExample: "I\'m adventurous, want a 3-day trip under ₹20,000 in Himalayas"',
    sender: 'bot',
    timestamp: new Date(),
    suggestions: ['Show me adventure tours', 'Beach vacations', 'Cultural tours', 'Budget friendly']
  };

  useEffect(() => {
    smartChatbotRef.current = new SmartChatbotService();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const currentQuery = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentQuery,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      if (!smartChatbotRef.current) {
        smartChatbotRef.current = new SmartChatbotService();
      }

      const aiResponse = await smartChatbotRef.current.processMessage(currentQuery);

      // Create bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        sender: 'bot',
        timestamp: new Date(),
        userQuery: currentQuery,
        tourRecommendations: aiResponse.suggestedTours || [],
        suggestions: aiResponse.followUpQuestions?.length 
          ? aiResponse.followUpQuestions 
          : generateDefaultSuggestions(aiResponse.suggestedTours),
        confidenceScore: calculateConfidence(aiResponse.suggestedTours)
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '🤔 I had a moment there! Could you rephrase that?\n\n💡 Try: "I\'m adventurous, want a 3-day trip under ₹20,000" or "Show me beach tours"',
        sender: 'bot',
        timestamp: new Date(),
        userQuery: currentQuery,
        suggestions: ['Try again', 'Show all tours', 'Browse FAQs']
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateDefaultSuggestions = (tours?: any[]): string[] => {
    if (tours && tours.length > 0) {
      return ['Show more tours', 'Different mood', 'Help me choose', 'Contact support'];
    }
    return ['Ask another question', 'Browse FAQs', 'Contact support'];
  };

  const calculateConfidence = (tours?: any[]): number => {
    if (!tours || tours.length === 0) return 0;
    return Math.min(100, Math.round(tours.length * 25 + 25)); // 25-100% based on tour count
  };

  const handleTourLike = async (tourId: number, tourTitle: string) => {
    if (!smartChatbotRef.current) return;
    
    try {
      await smartChatbotRef.current.recordFeedback(tourId.toString(), 'like');
      
      // Show confirmation
      const feedbackMsg: Message = {
        id: (Date.now() + 100).toString(),
        text: `👍 Great! I've noted your interest in "${tourTitle}". This helps me give you better recommendations!`,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Show similar tours', 'Book this tour', 'Continue browsing']
      };
      setMessages(prev => [...prev, feedbackMsg]);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleTourDislike = async (tourId: number, tourTitle: string) => {
    if (!smartChatbotRef.current) return;
    
    try {
      await smartChatbotRef.current.recordFeedback(tourId.toString(), 'dislike');
      
      const feedbackMsg: Message = {
        id: (Date.now() + 100).toString(),
        text: `✓ Noted! I won't recommend tours like "${tourTitle}" as often. Let me show you something different.`,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Show different tours', 'Refine search', 'Continue browsing']
      };
      setMessages(prev => [...prev, feedbackMsg]);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-75"></div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transform hover:scale-110 transition-all duration-300 z-10 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative flex items-center space-x-1">
            <MessageCircle size={24} className="animate-bounce" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>
        
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transform opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          💬 Chat with TravelBuddy AI
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`w-96 h-[32rem] ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="flex items-center space-x-2 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse"></div>
              <Bot size={20} className="relative" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold flex items-center space-x-1">
                <span>TravelBuddy AI</span>
                <Brain size={12} className="animate-pulse" />
              </h3>
              <p className="text-xs opacity-90">AI-Powered Travel Companion</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded-lg transition-colors relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {message.sender === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {/* Message Text */}
                    <div className={`px-4 py-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : `${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'}`
                    }`}>
                      {message.text}
                    </div>

                    {/* Confidence Score */}
                    {message.confidenceScore && message.confidenceScore > 0 && message.sender === 'bot' && (
                      <div className="flex items-center space-x-1 ml-2 text-xs">
                        <Star size={10} className="text-yellow-500" />
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {message.confidenceScore}% confident match
                        </span>
                      </div>
                    )}

                    {/* Tour Recommendations */}
                    {message.tourRecommendations && message.tourRecommendations.length > 0 && (
                      <div className="mt-2 space-y-2 ml-2">
                        {message.tourRecommendations.map((tour, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              darkMode
                                ? 'border-purple-600/30 bg-gray-800'
                                : 'border-purple-200 bg-purple-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  #{idx + 1} {tour.title}
                                </h4>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  📍 {tour.destination} • ⏱ {tour.duration_days}d • 💪 {tour.difficulty_level}
                                </p>
                                <p className={`text-xs mt-2 font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                                  ₹{parseInt(tour.price).toLocaleString()} per person
                                </p>
                              </div>
                              
                              {/* Like/Dislike Buttons */}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleTourLike(tour.id, tour.title)}
                                  className={`p-2 rounded ${darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-100'} transition-colors`}
                                  title="I like this tour"
                                >
                                  <Heart size={14} className="text-red-500" />
                                </button>
                                <button
                                  onClick={() => handleTourDislike(tour.id, tour.title)}
                                  className={`p-2 rounded ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'} transition-colors`}
                                  title="Not interested"
                                >
                                  <ThumbsDown size={14} className="text-gray-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              darkMode
                                ? 'border-purple-500 text-purple-300 hover:bg-purple-900/30'
                                : 'border-purple-400 text-purple-700 hover:bg-purple-50'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>TravelBuddy is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {isTyping && (
            <div className="mb-2 text-xs text-gray-500 text-center">
              ⚡ Powered by Advanced AI
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tell me about your trip..."
              className={`flex-1 px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg transition-opacity ${
                isTyping || !inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              <Send size={16} />
            </button>
          </form>

          <div className={`text-center mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            🤖 AI learns from your preferences
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotAI;
