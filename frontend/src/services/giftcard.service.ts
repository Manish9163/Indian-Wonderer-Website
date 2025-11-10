/**
 * Gift Card Service
 * Handles all gift card related API calls
 */

interface GiftCardApplication {
  id: number;
  user_id: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  processed_at?: string;
  admin_notes?: string;
  processed_by?: string;
}

interface GiftCard {
  id: number;
  code: string;
  amount: number;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  used_at?: string;
}

interface AdminApplication extends GiftCardApplication {
  processed_by?: string;
}

class GiftCardService {
  private readonly baseUrl = 'http://localhost/fu/backend/api/giftcard.php';

  /**
   * Apply for a gift card
   */
  async applyForGiftCard(userId: string, amount: number, reason?: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          userId,
          amount,
          reason
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to apply for gift card');
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error applying for gift card');
    }
  }

  /**
   * Get user's gift card application status
   */
  async getApplicationStatus(userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}?userId=${userId}&action=get-status`,
        { method: 'GET' }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get status');
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error getting application status');
    }
  }

  /**
   * Get user's active gift cards
   */
  async getUserGiftCards(userId: string): Promise<GiftCard[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?userId=${userId}&action=user-giftcards`,
        { method: 'GET' }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get gift cards');
      return data.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Error getting gift cards');
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Get all gift card applications (admin only)
   */
  async getApplicationsList(status?: string): Promise<AdminApplication[]> {
    try {
      const url = status
        ? `${this.baseUrl}?action=admin-list&status=${status}`
        : `${this.baseUrl}?action=admin-list`;

      const response = await fetch(url, { method: 'GET' });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get applications');
      return data.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Error getting applications');
    }
  }

  /**
   * Approve a gift card application and add to wallet
   */
  async approveApplication(applicationId: number, adminId: string, adminNotes?: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-approve',
          applicationId,
          adminId,
          adminNotes
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve application');
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error approving application');
    }
  }

  /**
   * Reject a gift card application
   */
  async rejectApplication(applicationId: number, adminId: string, reason?: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-reject',
          applicationId,
          adminId,
          reason
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject application');
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error rejecting application');
    }
  }
}

export default new GiftCardService();
