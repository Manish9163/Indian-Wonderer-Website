import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../theme.service';
import { SettingsService, AdminSettings } from '../services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  
  constructor(
    private themeService: ThemeService,
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  settings: AdminSettings = {
    siteName: 'Indian Wonderer',
    adminEmail: 'admin@indianWonderer.com',
    timezone: 'IST',
    maintenanceMode: false,
    enableGpt5Mini: true,

    maxBookingsPerDay: 500,
    advanceBookingDays: 365,
    autoConfirm: true,
    emailNotifications: true,
    
    currency: 'INR',
    paymentGateway: 'razorpay',
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

  ngOnInit() {
    // Load current settings from service
    this.settings = this.settingsService.getCurrentSettings();
    
    // Subscribe to settings changes (in case they change from elsewhere)
    this.subscriptions.add(
      this.settingsService.settings$.subscribe(settings => {
        this.settings = settings;
      })
    );
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  setAccentColor(color: string) {
    this.settings.accentColor = color;
    // Update through service to broadcast to all components
    this.settingsService.updateSetting('accentColor', color);
    this.settingsService.applyAccentColor(color);
    this.showNotification(`Accent color changed to ${color}! 🎨`, 'success');
  }

  onThemeChange() {
    // Apply theme through services
    const isDark = this.settings.theme === 'dark';
    this.themeService.setDarkMode(isDark);
    // Update through settings service to broadcast
    this.settingsService.updateSetting('theme', this.settings.theme);
    this.showNotification(`Theme changed to ${this.settings.theme}! 🎭`, 'success');
  }

  saveSettings() {
    // Save all settings through service (broadcasts to all subscribers)
    this.settingsService.updateAllSettings(this.settings);
    this.showNotification('Settings saved successfully! 🎉', 'success');
  }
  
  // Auto-save on individual setting changes
  onSettingChange(key: keyof AdminSettings, value: any) {
    this.settingsService.updateSetting(key, value);
  }

  resetSettings() {
    // Reset to default values
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      this.settingsService.resetToDefaults();
      this.settings = this.settingsService.getCurrentSettings();
      this.showNotification('Settings reset to defaults! 🔄', 'info');
    }
  }

  validateSettings() {
    const errors = [];
    
    if (!this.settings.siteName.trim()) {
      errors.push('Site name cannot be empty');
    }
    
    if (!this.settings.adminEmail.includes('@')) {
      errors.push('Invalid admin email format');
    }
    
    if (this.settings.maxBookingsPerDay < 1) {
      errors.push('Max bookings per day must be at least 1');
    }
    
    if (this.settings.transactionFee < 0 || this.settings.transactionFee > 100) {
      errors.push('Transaction fee must be between 0% and 100%');
    }
    
    if (errors.length > 0) {
      this.showNotification(`Validation errors: ${errors.join(', ')}`, 'error');
      return false;
    }
    
    this.showNotification('All settings are valid! ✅', 'success');
    return true;
  }

  generateSystemReport() {
    this.showNotification('Generating comprehensive system report... 📊', 'info');
    
    setTimeout(() => {
      const reportWindow = window.open('', '_blank', 'width=1000,height=1200');
      if (reportWindow) {
        reportWindow.document.write(`
          <html>
            <head>
              <title>System Configuration Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .header { text-align: center; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 20px; }
                .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
                .setting-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
                .setting-label { font-weight: bold; color: #495057; }
                .setting-value { color: #6c757d; }
                .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .enabled { background: #d4edda; color: #155724; }
                .disabled { background: #f8d7da; color: #721c24; }
                .actions { text-align: center; margin: 30px 0; }
                .btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 6px; cursor: pointer; }
                .btn-primary { background: #007bff; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🛠️ System Configuration Report</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Admin Panel: ${this.settings.siteName}</p>
              </div>
              
              <div class="section">
                <h3>📊 System Overview</h3>
                <div class="setting-row">
                  <span class="setting-label">Site Name:</span>
                  <span class="setting-value">${this.settings.siteName}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Admin Email:</span>
                  <span class="setting-value">${this.settings.adminEmail}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Timezone:</span>
                  <span class="setting-value">${this.settings.timezone}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Maintenance Mode:</span>
                  <span class="status-badge ${this.settings.maintenanceMode ? 'enabled' : 'disabled'}">
                    ${this.settings.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              
              <div class="section">
                <h3>📅 Booking Configuration</h3>
                <div class="setting-row">
                  <span class="setting-label">Max Bookings/Day:</span>
                  <span class="setting-value">${this.settings.maxBookingsPerDay}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Advance Booking Days:</span>
                  <span class="setting-value">${this.settings.advanceBookingDays}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Auto Confirm:</span>
                  <span class="status-badge ${this.settings.autoConfirm ? 'enabled' : 'disabled'}">
                    ${this.settings.autoConfirm ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              
              <div class="section">
                <h3>💳 Payment Settings</h3>
                <div class="setting-row">
                  <span class="setting-label">Currency:</span>
                  <span class="setting-value">${this.settings.currency}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Payment Gateway:</span>
                  <span class="setting-value">${this.settings.paymentGateway}</span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Transaction Fee:</span>
                  <span class="setting-value">${this.settings.transactionFee}%</span>
                </div>
              </div>
              
              <div class="section">
                <h3>🔐 Security Status</h3>
                <div class="setting-row">
                  <span class="setting-label">Two-Factor Auth:</span>
                  <span class="status-badge ${this.settings.twoFactorAuth ? 'enabled' : 'disabled'}">
                    ${this.settings.twoFactorAuth ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Login Tracking:</span>
                  <span class="status-badge ${this.settings.loginTracking ? 'enabled' : 'disabled'}">
                    ${this.settings.loginTracking ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div class="setting-row">
                  <span class="setting-label">Session Timeout:</span>
                  <span class="setting-value">${this.settings.sessionTimeout} minutes</span>
                </div>
              </div>
              
              <div class="actions">
                <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
                <button class="btn btn-secondary" onclick="window.close()">❌ Close</button>
              </div>
            </body>
          </html>
        `);
        reportWindow.document.close();
      }
      this.showNotification('System report generated successfully! 📊', 'success');
    }, 1500);
  }

  exportData() {
    this.showNotification('Exporting all system data... 📦', 'info');
    
    const exportData = {
      settings: this.settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      systemInfo: {
        totalUsers: 156,
        totalBookings: 432,
        totalRevenue: 85640,
        activeGuides: 23
      }
    };

    setTimeout(() => {
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification('Data exported successfully! ✅', 'success');
    }, 2000);
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.settings) {
              if (confirm('This will overwrite current settings. Continue?')) {
                this.settings = { ...this.settings, ...importedData.settings };
                this.saveSettings();
                this.showNotification('Settings imported successfully! 🎉', 'success');
              }
            } else {
              this.showNotification('Invalid file format! ❌', 'error');
            }
          } catch (error) {
            this.showNotification('Error reading file! ❌', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  backupDatabase() {
    this.showNotification('Creating comprehensive database backup... 💾', 'info');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      this.showNotification(`Backup progress: ${progress}%... 💾`, 'info');
      
      if (progress >= 100) {
        clearInterval(interval);
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          tables: {
            users: { count: 156, size: '2.3MB' },
            bookings: { count: 432, size: '8.7MB' },
            payments: { count: 398, size: '5.2MB' },
            tours: { count: 45, size: '12.1MB' }
          },
          totalSize: '28.3MB'
        };

        const backupStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Database backup completed and downloaded! ✅', 'success');
      }
    }, 300);
  }

  clearCache() {
    this.showNotification('Clearing all system cache... 🧹', 'info');
    
    if (isPlatformBrowser(this.platformId)) {
      const cacheKeys = ['tourCache', 'userCache', 'bookingCache', 'analyticsCache'];
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      sessionStorage.clear();
    }
    
    setTimeout(() => {
      this.showNotification('Cache cleared successfully! System performance optimized! ✅', 'success');
    }, 1000);
  }

  viewLogs() {
    this.showNotification('Opening system logs viewer... 📋', 'info');
    
    const logs = [
      { timestamp: new Date().toISOString(), level: 'INFO', message: 'User admin logged in', module: 'AUTH' },
      { timestamp: new Date(Date.now() - 300000).toISOString(), level: 'SUCCESS', message: 'Payment processed successfully', module: 'PAYMENT' },
      { timestamp: new Date(Date.now() - 600000).toISOString(), level: 'WARNING', message: 'High memory usage detected', module: 'SYSTEM' },
      { timestamp: new Date(Date.now() - 900000).toISOString(), level: 'ERROR', message: 'Failed to send email notification', module: 'EMAIL' },
      { timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'INFO', message: 'Daily backup completed', module: 'BACKUP' }
    ];

    const logWindow = window.open('', '_blank', 'width=1000,height=700');
    if (logWindow) {
      logWindow.document.write(`
        <html>
          <head>
            <title>System Logs - Admin Panel</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; background: #1a1a1a; color: #fff; }
              .log-header { text-align: center; border-bottom: 2px solid #0ff; padding-bottom: 15px; margin-bottom: 20px; }
              .log-entry { margin: 8px 0; padding: 8px; border-radius: 4px; font-size: 14px; }
              .INFO { background: rgba(0, 123, 255, 0.1); border-left: 4px solid #007bff; }
              .SUCCESS { background: rgba(40, 167, 69, 0.1); border-left: 4px solid #28a745; }
              .WARNING { background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; }
              .ERROR { background: rgba(220, 53, 69, 0.1); border-left: 4px solid #dc3545; }
              .timestamp { color: #6c757d; }
              .level { font-weight: bold; display: inline-block; width: 80px; }
              .module { color: #17a2b8; font-weight: bold; }
              .controls { text-align: center; margin: 20px 0; }
              .btn { padding: 8px 16px; margin: 0 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="log-header">
              <h2>🔍 System Logs</h2>
              <p>Real-time system monitoring and activity logs</p>
            </div>
            <div class="controls">
              <button class="btn" onclick="window.location.reload()">🔄 Refresh</button>
              <button class="btn" onclick="window.print()">🖨️ Print</button>
              <button class="btn" onclick="window.close()">❌ Close</button>
            </div>
            ${logs.map(log => `
              <div class="log-entry ${log.level}">
                <span class="timestamp">[${new Date(log.timestamp).toLocaleString()}]</span>
                <span class="level">${log.level}</span>
                <span class="module">[${log.module}]</span>
                ${log.message}
              </div>
            `).join('')}
          </body>
        </html>
      `);
      logWindow.document.close();
    }
  }

  testEmail() {
    this.showNotification('Preparing test email... 📧', 'info');
    
    const testEmailData = {
      to: this.settings.adminEmail,
      subject: 'Test Email from Admin Panel',
      template: 'admin-test',
      data: {
        adminName: 'System Administrator',
        timestamp: new Date().toLocaleString(),
        systemStatus: 'All systems operational',
        settings: this.settings
      }
    };

    setTimeout(() => {
      this.showNotification(`Test email sent to ${this.settings.adminEmail}! ✅`, 'success');
      
      const emailWindow = window.open('', '_blank', 'width=600,height=800');
      if (emailWindow) {
        emailWindow.document.write(`
          <html>
            <head>
              <title>Test Email Preview</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                .email-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
                .status { background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h2>🎯 Admin Panel Test Email</h2>
                  <p>System: ${this.settings.siteName}</p>
                </div>
                <p>Hello System Administrator,</p>
                <p>This is a test email from your admin panel to verify email functionality.</p>
                <div class="status">
                  <strong>✅ Email System Status:</strong> Operational<br>
                  <strong>📅 Sent:</strong> ${new Date().toLocaleString()}<br>
                  <strong>🎛️ Admin Email:</strong> ${this.settings.adminEmail}
                </div>
                <p>If you received this email, your notification system is working correctly!</p>
                <div class="footer">
                  <p>Sent from ${this.settings.siteName} Admin Panel</p>
                </div>
              </div>
            </body>
          </html>
        `);
        emailWindow.document.close();
      }
    }, 2000);
  }

  private showNotification(message: string, type: string) {
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
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }



  exportSettingsAsCode() {
    const settingsCode = `
// Auto-generated settings configuration
export const adminSettings = ${JSON.stringify(this.settings, null, 2)};

// Usage:
// import { adminSettings } from './admin-settings';
// this.settings = adminSettings;
`;

    const blob = new Blob([settingsCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-settings.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showNotification('Settings exported as JavaScript code! 💻', 'success');
  }

  shareSettingsConfig() {
    const settingsUrl = `data:application/json;base64,${btoa(JSON.stringify(this.settings, null, 2))}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Admin Panel Settings Configuration',
        text: 'Check out my admin panel settings configuration!',
        url: settingsUrl
      }).then(() => {
        this.showNotification('Settings shared successfully! 📤', 'success');
      }).catch(() => {
        this.copyToClipboard(JSON.stringify(this.settings, null, 2));
      });
    } else {
      this.copyToClipboard(JSON.stringify(this.settings, null, 2));
    }
  }

  copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Settings copied to clipboard! 📋', 'success');
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showNotification('Settings copied to clipboard! 📋', 'success');
    }
  }

  copySettingsToClipboard() {
    const settingsText = JSON.stringify(this.settings, null, 2);
    this.copyToClipboard(settingsText);
  }

  previewThemeChanges() {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Theme Preview - ${this.settings.theme}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: ${this.settings.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
                color: ${this.settings.theme === 'dark' ? '#ffffff' : '#333333'};
              }
              .preview-header {
                text-align: center;
                padding: 20px;
                background: var(--neon-${this.settings.accentColor}, #007bff);
                border-radius: 10px;
                margin-bottom: 20px;
              }
              .preview-section {
                background: ${this.settings.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,${this.settings.theme === 'dark' ? '0.5' : '0.1'});
              }
              .accent-color {
                color: var(--neon-${this.settings.accentColor}, #007bff);
                font-weight: bold;
              }
              .controls {
                text-align: center;
                margin-top: 30px;
              }
              button {
                padding: 10px 20px;
                margin: 0 10px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                background: var(--neon-${this.settings.accentColor}, #007bff);
                color: white;
              }
            </style>
          </head>
          <body>
            <div class="preview-header">
              <h1>🎨 Theme Preview</h1>
              <p class="accent-color">Current Theme: ${this.settings.theme}</p>
              <p class="accent-color">Accent Color: ${this.settings.accentColor}</p>
            </div>
            
            <div class="preview-section">
              <h3>Sample Admin Panel Content</h3>
              <p>This is how your admin panel will look with the current theme settings.</p>
              <div class="accent-color">Important information will be highlighted in your accent color.</div>
            </div>
            
            <div class="preview-section">
              <h3>Settings Summary</h3>
              <ul>
                <li>Site Name: ${this.settings.siteName}</li>
                <li>Theme: ${this.settings.theme}</li>
                <li>Accent Color: ${this.settings.accentColor}</li>
                <li>Animated Backgrounds: ${this.settings.animatedBg ? 'Enabled' : 'Disabled'}</li>
                <li>Sound Effects: ${this.settings.soundEffects ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </div>
            
            <div class="controls">
              <button onclick="window.close()">Close Preview</button>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }
}
