import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent {
  settings = {
    // System Settings
    siteName: 'Travel Admin Pro',
    adminEmail: 'admin@travel.com',
    timezone: 'UTC',
    maintenanceMode: false,
    
    // Booking Settings
    maxBookingsPerDay: 50,
    advanceBookingDays: 365,
    autoConfirm: true,
    emailNotifications: true,
    
    // Payment Settings
    currency: 'USD',
    paymentGateway: 'stripe',
    transactionFee: 2.5,
    partialPayments: true,
    
    // Security Settings
    twoFactorAuth: false,
    loginTracking: true,
    sessionTimeout: 30,
    gdprCompliance: true,
    
    // Notification Settings
    newBookingAlerts: true,
    paymentNotifications: true,
    dailyReports: false,
    reportTime: '09:00',
    
    // Appearance Settings
    theme: 'cyber',
    accentColor: 'blue',
    animatedBg: true,
    soundEffects: false
  };

  setAccentColor(color: string) {
    this.settings.accentColor = color;
    // Apply color theme immediately
    document.documentElement.style.setProperty('--primary-accent', `var(--neon-${color})`);
  }

  saveSettings() {
    // Save settings to localStorage or backend
    localStorage.setItem('adminSettings', JSON.stringify(this.settings));
    this.showNotification('Settings saved successfully! 🎉', 'success');
  }

  resetSettings() {
    // Reset to default values
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = {
        siteName: 'Travel Admin Pro',
        adminEmail: 'admin@travel.com',
        timezone: 'UTC',
        maintenanceMode: false,
        maxBookingsPerDay: 50,
        advanceBookingDays: 365,
        autoConfirm: true,
        emailNotifications: true,
        currency: 'USD',
        paymentGateway: 'stripe',
        transactionFee: 2.5,
        partialPayments: true,
        twoFactorAuth: false,
        loginTracking: true,
        sessionTimeout: 30,
        gdprCompliance: true,
        newBookingAlerts: true,
        paymentNotifications: true,
        dailyReports: false,
        reportTime: '09:00',
        theme: 'cyber',
        accentColor: 'blue',
        animatedBg: true,
        soundEffects: false
      };
      this.showNotification('Settings reset to defaults! 🔄', 'info');
    }
  }

  // Quick Actions
  exportData() {
    this.showNotification('Exporting data... 📦', 'info');
    // Simulate export
    setTimeout(() => {
      this.showNotification('Data exported successfully! ✅', 'success');
    }, 2000);
  }

  importData() {
    this.showNotification('Import functionality coming soon! 🚀', 'info');
  }

  backupDatabase() {
    this.showNotification('Creating database backup... 💾', 'info');
    setTimeout(() => {
      this.showNotification('Database backup completed! ✅', 'success');
    }, 3000);
  }

  clearCache() {
    this.showNotification('Clearing cache... 🧹', 'info');
    setTimeout(() => {
      this.showNotification('Cache cleared successfully! ✅', 'success');
    }, 1000);
  }

  viewLogs() {
    this.showNotification('Opening system logs... 📋', 'info');
  }

  testEmail() {
    this.showNotification('Sending test email... 📧', 'info');
    setTimeout(() => {
      this.showNotification('Test email sent successfully! ✅', 'success');
    }, 2000);
  }

  private showNotification(message: string, type: string) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      color: var(--text-primary);
      padding: 1rem 2rem;
      border-radius: 10px;
      border: 2px solid var(--neon-blue);
      box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  ngOnInit() {
    // Load saved settings
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }
}
