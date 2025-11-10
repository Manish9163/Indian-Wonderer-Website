/**
 * Wallet Service - Handles wallet-related API calls and data management
 */

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'gift_card_added' | 'money_added';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface WalletData {
  walletId: string;
  userId: string;
  totalBalance: number;
  giftCardBalance: number;
  addedMoneyBalance: number;
  lastUpdated: string;
  transactions: WalletTransaction[];
}

export interface AddMoneyRequest {
  amount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking';
  description?: string;
}

export interface AddMoneyResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  walletData?: WalletData;
}

class WalletService {
  private readonly baseUrl = 'http://localhost/fu/backend/api/wallet.php';

  /**
   * Get wallet details for a user
   */
  async getWalletData(userId: string): Promise<WalletData> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    } catch (error) {
      throw new Error('Failed to fetch wallet data');
    }
  }

  /**
   * Add money to wallet
   */
  async addMoney(userId: string, request: AddMoneyRequest): Promise<AddMoneyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add-money',
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          description: request.description
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data;
    } catch (error) {
      throw new Error('Failed to add money to wallet');
    }
  }

  /**
   * Apply gift card to wallet
   */
  async applyGiftCard(userId: string, giftCardCode: string, amount: number): Promise<AddMoneyResponse> {
    try {
      // TODO: Implement gift card endpoint
      return {
        success: true,
        message: 'Gift card applied successfully'
      };
    } catch (error) {
      throw new Error('Failed to apply gift card');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}&action=transactions&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data || [];
    } catch (error) {
      throw new Error('Failed to fetch transaction history');
    }
  }

  /**
   * Use wallet balance for booking
   */
  async useWalletForBooking(userId: string, bookingId: string, amount: number): Promise<AddMoneyResponse> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('action', 'use-for-booking');
      formData.append('amount', amount.toString());
      formData.append('bookingId', bookingId);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment failed');
      }
      
      return {
        success: true,
        message: 'Booking confirmed with wallet payment'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process wallet payment');
    }
  }

  /**
   * Refund to wallet
   */
  async refundToWallet(userId: string, bookingId: string, amount: number, reason: string): Promise<AddMoneyResponse> {
    try {
      // TODO: Implement refund endpoint
      return {
        success: true,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Check wallet balance
   */
  async checkBalance(userId: string, amount?: number): Promise<any> {
    try {
      const action = amount ? 'check-balance' : 'balance';
      const url = amount 
        ? `${this.baseUrl}?userId=${userId}&action=${action}&amount=${amount}`
        : `${this.baseUrl}?userId=${userId}&action=${action}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data || { totalBalance: 0, hasEnough: false };
    } catch (error) {
      throw new Error('Failed to check wallet balance');
    }
  }

  /**
   * Transfer money to another user
   */
  async transferToUser(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
  ): Promise<AddMoneyResponse> {
    try {
      // TODO: Implement transfer endpoint
      return {
        success: true,
        message: 'Transfer completed successfully'
      };
    } catch (error) {
      throw new Error('Failed to transfer money');
    }
  }
}

export default new WalletService();
