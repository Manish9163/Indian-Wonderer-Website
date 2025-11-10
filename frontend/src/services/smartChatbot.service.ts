/**
 * Smart AI Integration for ChatBot
 * Connects Frontend with Advanced AI Backend
 */

import apiService from '../services/api.service';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  suggestedTours?: any[];
}

export interface UserPreferences {
  favoriteDestinations?: string[];
  preferredBudgetRange?: { min: number; max: number };
  travelFrequency?: 'often' | 'sometimes' | 'rarely';
  groupTravelPreference?: 'solo' | 'couple' | 'family' | 'group';
  lastBooking?: { tour: string; rating: number; date: string };
  dislikedTours?: string[];
  likedTours?: string[];
}

/**
 * Smart AI Chatbot Service
 * Like ChatGPT: understands context, learns preferences, makes smart decisions
 */
export class SmartChatbotService {
  private conversationHistory: ConversationMessage[] = [];
  private userPreferences: UserPreferences = {};
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadConversationHistory();
    this.loadUserPreferences();
  }

  /**
   * Main API call to advanced AI backend
   */
  async processMessage(userMessage: string): Promise<{
    message: string;
    suggestedTours?: any[];
    clarificationNeeded?: boolean;
    followUpQuestions?: string[];
    action?: string;
  }> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Call advanced AI backend
      const response = await apiService.post('advanced_ai_chatbot.php', {
        message: userMessage,
        conversationHistory: this.conversationHistory,
        userPreferences: this.userPreferences,
        sessionId: this.sessionId
      });

      if (!response.success) {
        throw new Error(response.message || 'API call failed');
      }

      const aiData = response.data;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiData.message,
        timestamp: new Date(),
        suggestedTours: aiData.suggested_tours
      });

      // Save conversation
      this.saveConversationHistory();

      return {
        message: aiData.message,
        suggestedTours: aiData.suggested_tours || [],
        clarificationNeeded: aiData.clarification_needed || false,
        followUpQuestions: aiData.follow_up_questions || [],
        action: aiData.action
      };

    } catch (error) {
      // Fallback response
      return {
        message: '😊 Sorry, I had a moment there. Could you rephrase that?\n\nI\'m here to help you find the perfect tour!',
        suggestedTours: [],
        clarificationNeeded: true,
        followUpQuestions: ['What kind of tour are you looking for?']
      };
    }
  }

  /**
   * Learn from user interaction (feedback)
   */
  async recordFeedback(tourId: string, feedback: 'like' | 'dislike' | 'booked'): Promise<void> {
    try {
      await apiService.post('user_feedback.php', {
        sessionId: this.sessionId,
        tourId,
        feedback,
        timestamp: new Date()
      });

      // Update local preferences
      if (feedback === 'like') {
        if (!this.userPreferences.likedTours) {
          this.userPreferences.likedTours = [];
        }
        this.userPreferences.likedTours.push(tourId);
      } else if (feedback === 'dislike') {
        if (!this.userPreferences.dislikedTours) {
          this.userPreferences.dislikedTours = [];
        }
        this.userPreferences.dislikedTours.push(tourId);
      }

      this.saveUserPreferences();

    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Get conversation context (for memory)
   */
  getConversationContext() {
    return {
      turnCount: this.conversationHistory.length,
      lastUserMessage: this.conversationHistory.find(m => m.role === 'user')?.content,
      suggestedTourIds: this.conversationHistory
        .flatMap(m => m.suggestedTours || [])
        .map(t => t.id),
      conversationTopic: this.detectTopic()
    };
  }

  /**
   * Detect main topic of conversation
   */
  private detectTopic(): string {
    const messages = this.conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase());

    const topics = {
      booking: ['book', 'reserve', 'confirm', 'payment'],
      comparison: ['compare', 'vs', 'which', 'better', 'difference'],
      information: ['what', 'how', 'tell me', 'info', 'details'],
      complaint: ['problem', 'issue', 'complain', 'refund'],
      recommendation: ['suggest', 'recommend', 'find', 'looking']
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (messages.some(msg => keywords.some(kw => msg.includes(kw)))) {
        return topic;
      }
    }

    return 'general';
  }

  /**
   * Local storage persistence
   */
  private saveConversationHistory(): void {
    const key = `chat_history_${this.sessionId}`;
    localStorage.setItem(key, JSON.stringify(this.conversationHistory));
  }

  private loadConversationHistory(): void {
    const key = `chat_history_${this.sessionId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      this.conversationHistory = JSON.parse(saved);
    }
  }

  private saveUserPreferences(): void {
    localStorage.setItem(`user_prefs_${this.sessionId}`, JSON.stringify(this.userPreferences));
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem(`user_prefs_${this.sessionId}`);
    if (saved) {
      this.userPreferences = JSON.parse(saved);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.sessionId = this.generateSessionId();
    localStorage.removeItem(`chat_history_${this.sessionId}`);
  }

  /**
   * Get full conversation history
   */
  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  /**
   * Get user preferences (for dashboard/analytics)
   */
  getPreferences(): UserPreferences {
    return this.userPreferences;
  }
}

// Export singleton
export const smartChatbot = new SmartChatbotService();
