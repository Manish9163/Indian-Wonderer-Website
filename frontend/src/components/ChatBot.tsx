import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, HelpCircle, Clock, MapPin, CreditCard, Shield, ThumbsUp, ThumbsDown } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  helpful?: boolean;
  userQuery?: string;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: 'booking' | 'travel' | 'payment' | 'general';
  icon: React.ReactNode;
  popularity?: number;
};

type LearningData = {
  userQueries: { [key: string]: number };
  unhelpfulResponses: { query: string; response: string; timestamp: Date }[];
  popularFAQs: { [key: string]: number };
  commonKeywords: { [key: string]: number };
};

type ConversationContext = {
  topic?: string;
  previousQueries: string[];
  userIntent?: 'booking' | 'inquiry' | 'support' | 'complaint' | 'urgent';
  sentiment?: 'positive' | 'neutral' | 'negative';
};

type ChatBotProps = {
  darkMode: boolean;
};

const ChatBot: React.FC<ChatBotProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showFAQs, setShowFAQs] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSuggestions, setTypingSuggestions] = useState<string[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    previousQueries: []
  });
  const [learningData, setLearningData] = useState<LearningData>({
    userQueries: {},
    unhelpfulResponses: [],
    popularFAQs: {},
    commonKeywords: {}
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseCache = useRef<Map<string, string>>(new Map());

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I book a tour?',
      answer: 'To book a tour, simply browse our tours, click on your preferred tour card, and click the "Book Your Adventure" button. You\'ll be guided through our secure booking process with payment options.',
      category: 'booking',
      icon: <MapPin size={16} className="text-blue-500" />
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, UPI payments, net banking, and digital wallets like Paytm, PhonePe, and Google Pay.',
      category: 'payment',
      icon: <CreditCard size={16} className="text-green-500" />
    },
    {
      id: '3',
      question: 'Can I cancel or modify my booking?',
      answer: 'Yes! You can cancel or modify your booking up to 24 hours before the tour date. Cancellations made 24+ hours in advance receive a full refund. Changes may be subject to availability.',
      category: 'booking',
      icon: <Clock size={16} className="text-orange-500" />
    },
    {
      id: '4',
      question: 'Are your tours safe and insured?',
      answer: 'Absolutely! All our tours are fully insured and conducted by certified guides. We follow strict safety protocols and provide emergency support throughout your journey.',
      category: 'general',
      icon: <Shield size={16} className="text-purple-500" />
    },
    {
      id: '5',
      question: 'What should I bring on the tour?',
      answer: 'Generally, bring comfortable walking shoes, weather-appropriate clothing, sunscreen, water bottle, and a camera. Specific requirements will be mentioned in your tour details and confirmation email.',
      category: 'travel',
      icon: <MapPin size={16} className="text-teal-500" />
    },
    {
      id: '6',
      question: 'Do you offer group discounts?',
      answer: 'Yes! We offer special rates for groups of 6 or more people. Contact our support team with your group details for a customized quote and special group pricing.',
      category: 'booking',
      icon: <CreditCard size={16} className="text-indigo-500" />
    },
    {
      id: '7',
      question: 'What if the weather is bad?',
      answer: 'Tours typically run rain or shine, but in case of severe weather conditions, we may reschedule or offer a full refund. You\'ll be notified at least 2 hours before the tour start time.',
      category: 'travel',
      icon: <Clock size={16} className="text-blue-500" />
    },
    {
      id: '8',
      question: 'How do I contact support?',
      answer: 'You can reach our 24/7 support team via this chatbot, email at support@traveler.com, or call our helpline at +91-9876543210. We typically respond within 30 minutes.',
      category: 'general',
      icon: <HelpCircle size={16} className="text-pink-500" />
    },
    {
      id: '9',
      question: 'What is your refund policy?',
      answer: 'Full refunds for cancellations 24+ hours before tour. 50% refund for 12-24 hours notice. No refund for same-day cancellations except in emergencies or severe weather conditions.',
      category: 'payment',
      icon: <CreditCard size={16} className="text-red-500" />
    },
    {
      id: '10',
      question: 'Do you provide hotel pickup?',
      answer: 'Yes! We offer complimentary hotel pickup and drop-off within city limits for most tours. Pickup times vary by location and will be confirmed in your booking details.',
      category: 'travel',
      icon: <MapPin size={16} className="text-cyan-500" />
    },
    {
      id: '11',
      question: 'Are meals included in tours?',
      answer: 'Meal inclusion varies by tour. Full-day tours typically include lunch, while half-day tours may include snacks. Check individual tour descriptions for specific meal details.',
      category: 'travel',
      icon: <MapPin size={16} className="text-orange-500" />
    },
    {
      id: '12',
      question: 'What languages do your guides speak?',
      answer: 'Our guides are multilingual and speak English, Hindi, and local regional languages. For specific language requests, please mention during booking or contact support.',
      category: 'general',
      icon: <HelpCircle size={16} className="text-blue-500" />
    },
    {
      id: '13',
      question: 'Can I customize my tour itinerary?',
      answer: 'Absolutely! We offer customizable private tours. Contact our team with your preferences, and we\'ll create a personalized itinerary tailored to your interests and budget.',
      category: 'booking',
      icon: <MapPin size={16} className="text-purple-500" />
    },
    {
      id: '14',
      question: 'What is the minimum age for tours?',
      answer: 'Age requirements vary by tour type. Adventure tours typically require participants to be 12+, while cultural tours are family-friendly with no age restrictions. Check tour details for specifics.',
      category: 'general',
      icon: <Shield size={16} className="text-green-500" />
    },
    {
      id: '15',
      question: 'Do you offer student discounts?',
      answer: 'Yes! Students with valid ID cards get 10% off on most tours. Senior citizens (60+) also receive special pricing. Present valid ID during booking to avail discounts.',
      category: 'payment',
      icon: <CreditCard size={16} className="text-teal-500" />
    },
    {
      id: '16',
      question: 'How far in advance should I book?',
      answer: 'We recommend booking at least 3-7 days in advance to ensure availability, especially during peak seasons. Last-minute bookings are subject to availability.',
      category: 'booking',
      icon: <Clock size={16} className="text-indigo-500" />
    },
    {
      id: '17',
      question: 'What happens if I\'m late for the tour?',
      answer: 'Please arrive 15 minutes before departure. Tours depart on schedule and we cannot guarantee waiting for late arrivals. Contact us immediately if you\'re running late.',
      category: 'travel',
      icon: <Clock size={16} className="text-red-500" />
    },
    {
      id: '18',
      question: 'Are tours wheelchair accessible?',
      answer: 'We offer several wheelchair-accessible tours and can accommodate special needs. Please inform us during booking so we can ensure proper arrangements are made.',
      category: 'general',
      icon: <Shield size={16} className="text-blue-500" />
    },
    {
      id: '19',
      question: 'Can I get a tour certificate?',
      answer: 'Yes! We provide digital certificates of completion for all tours. These can be downloaded from your account or emailed to you within 24 hours of tour completion.',
      category: 'general',
      icon: <HelpCircle size={16} className="text-green-500" />
    },
    {
      id: '20',
      question: 'What is your dress code policy?',
      answer: 'Dress comfortably and weather-appropriately. For religious sites, modest clothing is required. We\'ll provide specific dress guidelines in your pre-tour information.',
      category: 'travel',
      icon: <MapPin size={16} className="text-pink-500" />
    },
    {
      id: '21',
      question: 'Do you offer photography services?',
      answer: 'Yes! Professional photography packages are available for an additional fee. Our photographers can capture your memorable moments throughout the tour.',
      category: 'general',
      icon: <HelpCircle size={16} className="text-purple-500" />
    },
    {
      id: '22',
      question: 'What if I lose something during the tour?',
      answer: 'Contact our support immediately. We maintain a lost & found database and work with tour locations to recover lost items. We\'ll help track down your belongings.',
      category: 'general',
      icon: <HelpCircle size={16} className="text-orange-500" />
    },
    {
      id: '23',
      question: 'Are there any hidden charges?',
      answer: 'No hidden fees! All costs are transparent and mentioned upfront. The only additional charges might be for optional activities, meals not included, or personal purchases.',
      category: 'payment',
      icon: <CreditCard size={16} className="text-cyan-500" />
    },
    {
      id: '24',
      question: 'Can I bring my pet on tours?',
      answer: 'Pets are allowed on select outdoor tours only. Please check tour descriptions or contact support to confirm pet-friendly options. Service animals are always welcome.',
      category: 'travel',
      icon: <MapPin size={16} className="text-green-500" />
    },
    {
      id: '25',
      question: 'How do I leave a review?',
      answer: 'After your tour, you\'ll receive an email with a review link. You can also log into your account and rate your experience. We value your feedback for continuous improvement!',
      category: 'general',
      icon: <HelpCircle size={16} className="text-indigo-500" />
    }
  ];

  const welcomeMessage: Message = {
    id: 'welcome',
    text: 'Hello! 👋 I\'m TravelBuddy, your AI travel companion with learning capabilities. I improve my responses based on your feedback and help fellow travelers like you! How can I assist you today?',
    sender: 'bot',
    timestamp: new Date()
  };

  // ============= AI-POWERED HELPER FUNCTIONS =============
  
  // Intent Detection
  const detectIntent = (query: string): ConversationContext['userIntent'] => {
    const lowercaseQuery = query.toLowerCase();
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'problem', 'issue', 'stuck', 'help now'];
    const bookingWords = ['book', 'reserve', 'booking', 'reservation', 'schedule', 'availability'];
    const complaintWords = ['complaint', 'issue', 'problem', 'bad', 'terrible', 'disappointed', 'angry', 'worst'];
    const supportWords = ['help', 'support', 'contact', 'call', 'email', 'speak to'];
    
    if (urgentWords.some(w => lowercaseQuery.includes(w))) return 'urgent';
    if (complaintWords.some(w => lowercaseQuery.includes(w))) return 'complaint';
    if (bookingWords.some(w => lowercaseQuery.includes(w))) return 'booking';
    if (supportWords.some(w => lowercaseQuery.includes(w))) return 'support';
    return 'inquiry';
  };

  // Sentiment Analysis
  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const textLower = text.toLowerCase();
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'love', 'happy', 'perfect', 'awesome', 'fantastic', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'angry', 'disappointed', 'frustrat', 'poor', 'horrible'];
    
    const positiveCount = positiveWords.filter(w => textLower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => textLower.includes(w)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  };

  // Get Cached Response
  const getCachedResponse = (query: string): string | null => {
    const normalized = query.toLowerCase().trim();
    return responseCache.current.get(normalized) || null;
  };

  // Cache Response
  const cacheResponse = (query: string, response: string) => {
    const normalized = query.toLowerCase().trim();
    responseCache.current.set(normalized, response);
    // Limit cache size to 100 entries
    if (responseCache.current.size > 100) {
      const firstKey = responseCache.current.keys().next().value;
      if (firstKey) responseCache.current.delete(firstKey);
    }
  };

  // Simulate Typing
  const simulateTyping = async (response: string) => {
    setIsTyping(true);
    const typingTime = Math.min(response.length * 15, 1500); // Max 1.5 seconds
    await new Promise(resolve => setTimeout(resolve, typingTime));
    setIsTyping(false);
    return response;
  };

  // Get Typing Suggestions
  const getTypingSuggestions = (input: string): string[] => {
    if (input.length < 2) return [];
    
    const allQueries = [
      ...Object.keys(learningData.userQueries),
      ...faqs.map(f => f.question)
    ];
    
    const suggestions = allQueries
      .filter(q => q.toLowerCase().includes(input.toLowerCase()))
      .sort((a, b) => (learningData.userQueries[b] || 0) - (learningData.userQueries[a] || 0))
      .slice(0, 3);
    
    return suggestions;
  };

  // Load learning data from localStorage
  useEffect(() => {
    const savedLearningData = localStorage.getItem('chatbot-learning-data');
    if (savedLearningData) {
      try {
        const parsed = JSON.parse(savedLearningData);
        setLearningData(parsed);
      } catch (error) {
        console.error('Error loading learning data:', error);
      }
    }
  }, []);

  // Save learning data to localStorage
  const saveLearningData = (newData: LearningData) => {
    setLearningData(newData);
    localStorage.setItem('chatbot-learning-data', JSON.stringify(newData));
  };

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const currentQuery = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentQuery,
      sender: 'user',
      timestamp: new Date()
    };

    // AI: Detect intent and sentiment
    const intent = detectIntent(currentQuery);
    const sentiment = analyzeSentiment(currentQuery);

    // Update conversation context
    setConversationContext(prev => ({
      ...prev,
      previousQueries: [...prev.previousQueries, currentQuery].slice(-5), // Keep last 5
      userIntent: intent,
      sentiment: sentiment
    }));

    // Learn from user query
    learnFromUserQuery(currentQuery);

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTypingSuggestions([]);
    setShowFAQs(false);

    // Check cache first for instant response
    const cached = getCachedResponse(currentQuery);
    if (cached) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cached,
        sender: 'bot',
        timestamp: new Date(),
        userQuery: currentQuery
      };
      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // Generate response with realistic typing delay
    const response = generateResponse(currentQuery, intent, sentiment);
    await simulateTyping(response);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      sender: 'bot',
      timestamp: new Date(),
      userQuery: currentQuery
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    // Cache the response
    cacheResponse(currentQuery, response);
  };

  const learnFromUserQuery = (query: string) => {
    const newLearningData = { ...learningData };
    
    // Track query frequency
    newLearningData.userQueries[query.toLowerCase()] = 
      (newLearningData.userQueries[query.toLowerCase()] || 0) + 1;
    
    // Extract and track keywords
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    keywords.forEach(keyword => {
      newLearningData.commonKeywords[keyword] = 
        (newLearningData.commonKeywords[keyword] || 0) + 1;
    });

    saveLearningData(newLearningData);
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful: isHelpful } : msg
    ));

    // Learn from negative feedback
    if (!isHelpful) {
      const message = messages.find(msg => msg.id === messageId);
      if (message && message.userQuery) {
        const newLearningData = { ...learningData };
        newLearningData.unhelpfulResponses.push({
          query: message.userQuery,
          response: message.text,
          timestamp: new Date()
        });
        saveLearningData(newLearningData);
      }
    }
  };

  const generateResponse = (
    input: string, 
    intent?: ConversationContext['userIntent'], 
    sentiment?: ConversationContext['sentiment']
  ): string => {
    const lowercaseInput = input.toLowerCase();
    
    // AI: Priority handling for urgent/negative sentiment
    if (intent === 'urgent' || sentiment === 'negative') {
      return `🚨 I understand this is ${intent === 'urgent' ? 'urgent' : 'frustrating'}. Let me connect you with our priority support team immediately. Call: +91-9876543210 or WhatsApp us for instant help. We're here to resolve this! 💪`;
    }

    // AI: Personalized greeting for positive sentiment
    if (sentiment === 'positive' && conversationContext.previousQueries.length > 0) {
      // User is happy, continue conversation warmly
    }
    
    // Check if this query has been asked before and was marked unhelpful
    const similarUnhelpfulResponse = learningData.unhelpfulResponses.find(ur => 
      ur.query.toLowerCase().includes(lowercaseInput.substring(0, 10)) ||
      lowercaseInput.includes(ur.query.toLowerCase().substring(0, 10))
    );

    if (similarUnhelpfulResponse) {
      return `I notice I may not have answered this well before. Let me try a different approach: Our support team at +91-9876543210 or support@traveler.com can provide detailed assistance with "${input}". They're available 24/7! 🤝`;
    }

    // Use learning data to improve keyword matching
    const userKeywords = lowercaseInput.split(' ').filter(word => word.length > 3);
    const commonUserKeywords = Object.keys(learningData.commonKeywords)
      .filter(keyword => userKeywords.includes(keyword))
      .sort((a, b) => learningData.commonKeywords[b] - learningData.commonKeywords[a]);

    // Check for FAQ matches with popularity boosting
    for (const faq of faqs) {
      const faqWords = faq.question.toLowerCase().split(' ');
      const matchCount = userKeywords.filter(word => faqWords.includes(word)).length;
      
      if (matchCount >= 2 || 
          lowercaseInput.includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' '))) {
        
        // Track popular FAQ
        const newLearningData = { ...learningData };
        newLearningData.popularFAQs[faq.id] = (newLearningData.popularFAQs[faq.id] || 0) + 1;
        saveLearningData(newLearningData);
        
        return faq.answer;
      }
    }

    // Enhanced keyword-based responses with learning insights
    if (lowercaseInput.includes('book') || lowercaseInput.includes('reservation') || lowercaseInput.includes('how to book')) {
      const bookingQueries = learningData.userQueries['booking'] || 0;
      if (bookingQueries > 5) {
        return 'I notice booking is a popular topic! Browse tours and click "Book Your Adventure". Pro tip: Book 3-7 days ahead for best availability. Need help with a specific destination? 🗺️';
      }
      return 'To book a tour, browse our collection and click "Book Your Adventure" on your chosen tour. We recommend booking 3-7 days in advance for best availability! 🗺️';
    }
    
    if (lowercaseInput.includes('payment') || lowercaseInput.includes('pay') || lowercaseInput.includes('cost') || lowercaseInput.includes('price')) {
      return 'We accept cards, UPI, net banking, and digital wallets. All transactions are secure and encrypted. No hidden charges - everything is transparent! 💳';
    }
    
    if (lowercaseInput.includes('cancel') || lowercaseInput.includes('refund') || lowercaseInput.includes('modify')) {
      return 'You can cancel up to 24 hours in advance for a full refund. 12-24 hours gets 50% refund. Contact support for modifications! ⏰';
    }
    
    if (lowercaseInput.includes('contact') || lowercaseInput.includes('support') || lowercaseInput.includes('help') || lowercaseInput.includes('phone')) {
      return 'Our support team is available 24/7! Email: support@traveler.com | Phone: +91-9876543210 | Or chat with me anytime! 📞';
    }

    if (lowercaseInput.includes('discount') || lowercaseInput.includes('student') || lowercaseInput.includes('group') || lowercaseInput.includes('senior')) {
      return 'Yes! We offer 10% student discounts, senior citizen rates, and special group pricing for 6+ people. Bring valid ID to avail! 🎓';
    }

    if (lowercaseInput.includes('pickup') || lowercaseInput.includes('hotel') || lowercaseInput.includes('transport')) {
      return 'We provide complimentary hotel pickup and drop-off within city limits for most tours. Pickup times will be confirmed in your booking! 🚗';
    }

    if (lowercaseInput.includes('meal') || lowercaseInput.includes('food') || lowercaseInput.includes('lunch') || lowercaseInput.includes('breakfast')) {
      return 'Meal inclusion varies by tour. Full-day tours typically include lunch, half-day tours may include snacks. Check individual tour descriptions! 🍽️';
    }

    if (lowercaseInput.includes('weather') || lowercaseInput.includes('rain') || lowercaseInput.includes('storm')) {
      return 'Tours run rain or shine, but severe weather may cause rescheduling or full refunds. You\'ll get 2+ hours notice for any changes! 🌤️';
    }

    if (lowercaseInput.includes('age') || lowercaseInput.includes('child') || lowercaseInput.includes('kid') || lowercaseInput.includes('family')) {
      return 'Age requirements vary by tour. Adventure tours are typically 12+, cultural tours are family-friendly. Check specific tour details! 👨‍👩‍👧‍👦';
    }

    if (lowercaseInput.includes('guide') || lowercaseInput.includes('language') || lowercaseInput.includes('english') || lowercaseInput.includes('hindi')) {
      return 'Our multilingual guides speak English, Hindi, and local languages. For specific language requests, mention during booking! 🗣️';
    }

    if (lowercaseInput.includes('custom') || lowercaseInput.includes('private') || lowercaseInput.includes('personalize')) {
      return 'Absolutely! We offer customizable private tours. Contact our team with your preferences for a personalized itinerary! ✨';
    }

    if (lowercaseInput.includes('photo') || lowercaseInput.includes('camera') || lowercaseInput.includes('picture')) {
      return 'Professional photography packages available for additional fee. Our photographers will capture your memorable moments! 📸';
    }

    if (lowercaseInput.includes('wheelchair') || lowercaseInput.includes('accessible') || lowercaseInput.includes('disability')) {
      return 'We offer wheelchair-accessible tours and accommodate special needs. Please inform us during booking for proper arrangements! ♿';
    }

    if (lowercaseInput.includes('late') || lowercaseInput.includes('time') || lowercaseInput.includes('departure')) {
      return 'Please arrive 15 minutes before departure. Tours leave on schedule - contact us immediately if you\'re running late! ⏰';
    }

    if (lowercaseInput.includes('dress') || lowercaseInput.includes('clothing') || lowercaseInput.includes('wear')) {
      return 'Dress comfortably and weather-appropriately. Modest clothing required for religious sites. Specific guidelines in pre-tour info! 👕';
    }

    if (lowercaseInput.includes('pet') || lowercaseInput.includes('dog') || lowercaseInput.includes('animal')) {
      return 'Pets allowed on select outdoor tours only. Service animals always welcome. Check tour descriptions for pet-friendly options! 🐕';
    }

    if (lowercaseInput.includes('review') || lowercaseInput.includes('feedback') || lowercaseInput.includes('rating')) {
      return 'After your tour, you\'ll get an email with review link. You can also rate through your account. We value your feedback! ⭐';
    }

    if (lowercaseInput.includes('lost') || lowercaseInput.includes('found') || lowercaseInput.includes('forget')) {
      return 'Contact support immediately for lost items. We maintain a lost & found database and work with locations to recover belongings! 🔍';
    }

    if (lowercaseInput.includes('certificate') || lowercaseInput.includes('completion') || lowercaseInput.includes('proof')) {
      return 'Yes! Digital certificates provided for all tours. Download from your account or get emailed within 24 hours of completion! 🏆';
    }

    // Learning-based fallback
    if (commonUserKeywords.length > 0) {
      return `I'm learning from user interactions! I noticed keywords like "${commonUserKeywords[0]}" are commonly asked about. Let me connect you with our support team at +91-9876543210 for detailed help with "${input}". 📚`;
    }
    
    return 'I\'m continuously learning to help you better! You can ask me about bookings, payments, tour details, cancellations, discounts, accessibility, or browse the FAQ suggestions below. What specific information do you need? 🤔';
  };

  const handleFAQClick = (faq: FAQ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: faq.question,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: faq.answer,
      sender: 'bot',
      timestamp: new Date(),
      userQuery: faq.question
    };

    // Track FAQ popularity
    const newLearningData = { ...learningData };
    newLearningData.popularFAQs[faq.id] = (newLearningData.popularFAQs[faq.id] || 0) + 1;
    saveLearningData(newLearningData);

    setMessages(prev => [...prev, userMessage, botMessage]);
    setShowFAQs(false);
  };

  // Get popular FAQs for display
  const getPopularFAQs = () => {
    return faqs
      .map(faq => ({
        ...faq,
        popularity: learningData.popularFAQs[faq.id] || 0
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Pulsing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-75"></div>
        
        {/* Main button */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transform hover:scale-110 transition-all duration-300 z-10 group overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Icon container */}
          <div className="relative flex items-center space-x-1">
            <MessageCircle size={24} className="animate-bounce" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>
        
        {/* Floating tooltip */}
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transform opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="relative">
            💬 Chat with TravelBuddy AI
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`w-80 h-96 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bot size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold">TravelBuddy AI</h3>
              <p className="text-xs opacity-90">🌍 Your Smart Travel Companion</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[75%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                  {message.sender === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                </div>
                <div className="flex flex-col space-y-1">
                  <div className={`px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : `${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`
                  }`}>
                    {message.text}
                  </div>
                  {/* Feedback buttons for bot messages */}
                  {message.sender === 'bot' && message.helpful === undefined && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                        title="Helpful"
                      >
                        <ThumbsUp size={12} className="text-green-500" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={12} className="text-red-500" />
                      </button>
                    </div>
                  )}
                  {/* Feedback confirmation */}
                  {message.helpful !== undefined && (
                    <div className="flex items-center space-x-1 ml-2">
                      {message.helpful ? (
                        <><ThumbsUp size={10} className="text-green-500" /><span className="text-xs text-green-500">Thanks!</span></>
                      ) : (
                        <><ThumbsDown size={10} className="text-red-500" /><span className="text-xs text-red-500">I'll improve!</span></>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* FAQ Suggestions */}
          {showFAQs && (
            <div className="space-y-2">
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.keys(learningData.popularFAQs).length > 0 ? 'Popular questions:' : 'Frequently asked questions:'}
              </p>
              {getPopularFAQs().map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleFAQClick(faq)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  } transition-colors text-sm flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-2">
                    {faq.icon}
                    <span>{faq.question}</span>
                  </div>
                  {faq.popularity > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {faq.popularity}
                    </span>
                  )}
                </button>
              ))}
              <div className={`text-center py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-xs">
                  🧠 Learning from {Object.keys(learningData.userQueries).length} conversations | 
                  {faqs.length - 6} more FAQs available
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* AI: Typing Suggestions */}
          {typingSuggestions.length > 0 && (
            <div className="mb-2 space-y-1">
              {typingSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(suggestion);
                    setTypingSuggestions([]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  } transition-colors`}
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {/* AI: Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 mb-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>TravelBuddy is typing...</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                // AI: Update typing suggestions
                if (e.target.value.length >= 2) {
                  setTypingSuggestions(getTypingSuggestions(e.target.value));
                } else {
                  setTypingSuggestions([]);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your question..."
              className={`flex-1 px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg transition-opacity ${
                isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
          
          {/* AI: Context Indicator */}
          {conversationContext.userIntent && (
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
              <span>
                {conversationContext.userIntent === 'urgent' && '🚨 Priority Support Mode'}
                {conversationContext.userIntent === 'booking' && '📅 Booking Assistant'}
                {conversationContext.userIntent === 'complaint' && '⚠️ Issue Resolution Mode'}
                {conversationContext.userIntent === 'support' && '🤝 Support Mode'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
