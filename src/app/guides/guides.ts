import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GuideReport {
  id: number;
  name: string;
  activity: string;
  location: string;
  traveler: string;
  rating: number;
  trips: number;
  photo: string;
  email: string;
  phone: string;
  joinDate: string;
  specialties: string[];
  languages: string[];
  certifications: string[];
  totalEarnings: number;
  availability: string;
  emergencyContact: string;
  notes: string;
  recentReviews: Array<{
    reviewer: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guides.html',
})
export class GuidesComponent implements OnInit {
  selectedGuide: GuideReport | null = null;
  showGuideModal: boolean = false;
  searchTerm: string = '';
  filterStatus: string = 'all';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Enhanced functionality properties
  editingGuide: GuideReport | null = null;
  showEditModal: boolean = false;
  showPendingModal: boolean = false;
  
  // Pending guide applications
  pendingApplications: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    photo: string;
    specialties: string[];
    languages: string[];
    certifications: string[];
    applicationDate: string;
    experience: string;
    motivation: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  }> = [
    {
      id: 1,
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@email.com',
      phone: '+1 (555) 567-8901',
      photo: 'https://randomuser.me/api/portraits/men/10.jpg',
      specialties: ['Adventure Tours', 'Mountain Hiking', 'Rock Climbing'],
      languages: ['English', 'Spanish'],
      certifications: ['Wilderness First Aid', 'Mountain Guide License'],
      applicationDate: '2024-08-30',
      experience: '5 years of professional outdoor guiding experience',
      motivation: 'Passionate about sharing the beauty of nature with travelers',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Sophie Chen',
      email: 'sophie.chen@email.com',
      phone: '+1 (555) 678-9012',
      photo: 'https://randomuser.me/api/portraits/women/8.jpg',
      specialties: ['Cultural Tours', 'Art History', 'Photography'],
      languages: ['English', 'Mandarin', 'Japanese'],
      certifications: ['Art History Degree', 'Professional Photography'],
      applicationDate: '2024-08-28',
      experience: '3 years in cultural tourism and art education',
      motivation: 'Love connecting people with local culture and history',
      status: 'reviewing'
    },
    {
      id: 3,
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      phone: '+1 (555) 789-0123',
      photo: 'https://randomuser.me/api/portraits/men/15.jpg',
      specialties: ['Food Tours', 'Local Cuisine', 'Market Tours'],
      languages: ['English', 'Arabic', 'French'],
      certifications: ['Culinary Arts Certificate', 'Food Safety Certified'],
      applicationDate: '2024-08-25',
      experience: '4 years in hospitality and food service industry',
      motivation: 'Want to showcase authentic local flavors and cuisine',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Emma Thompson',
      email: 'emma.thompson@email.com',
      phone: '+1 (555) 890-1234',
      photo: 'https://randomuser.me/api/portraits/women/12.jpg',
      specialties: ['Historical Tours', 'Architecture', 'Museum Visits'],
      languages: ['English', 'German', 'Italian'],
      certifications: ['History Degree', 'Museum Guide Certification'],
      applicationDate: '2024-08-22',
      experience: '6 years as a museum educator and historical researcher',
      motivation: 'Passionate about bringing history to life for visitors',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@email.com',
      phone: '+1 (555) 901-2345',
      photo: 'https://randomuser.me/api/portraits/men/20.jpg',
      specialties: ['Beach Tours', 'Water Sports', 'Snorkeling'],
      languages: ['English', 'Spanish', 'Portuguese'],
      certifications: ['Dive Master', 'Water Safety Instructor'],
      applicationDate: '2024-08-20',
      experience: '7 years in marine tourism and water sports',
      motivation: 'Love sharing the ocean and marine life with guests',
      status: 'reviewing'
    }
  ];
  
  // Analytics data
  guideAnalytics = {
    totalGuides: 0,
    activeGuides: 0,
    totalTrips: 0,
    totalEarnings: 0,
    averageRating: 0,
    topPerformer: '',
    pendingApplications: 0,
    suspendedGuides: 0
  };

  guideReports: GuideReport[] = [
    {
      id: 1,
      name: 'Alice Smith',
      activity: 'Guiding city tour',
      location: 'Downtown',
      traveler: 'John Doe',
      rating: 4.8,
      trips: 125,
      photo: 'https://randomuser.me/api/portraits/women/1.jpg',
      email: 'alice.smith@tourguides.com',
      phone: '+1 (555) 123-4567',
      joinDate: '2022-03-15',
      specialties: ['City Tours', 'Historical Sites', 'Photography Tours'],
      languages: ['English', 'Spanish', 'French'],
      certifications: ['Licensed Tour Guide', 'First Aid Certified', 'CPR Certified'],
      totalEarnings: 45620,
      availability: 'Available',
      emergencyContact: 'Emergency Services: +1 (911)',
      notes: 'Excellent guide with great customer feedback. Specializes in downtown historical tours.',
      recentReviews: [
        { reviewer: 'John D.', rating: 5, comment: 'Amazing tour! Alice was very knowledgeable.', date: '2024-08-28' },
        { reviewer: 'Maria L.', rating: 4, comment: 'Great experience, highly recommend.', date: '2024-08-25' },
        { reviewer: 'David K.', rating: 5, comment: 'Professional and friendly guide.', date: '2024-08-22' }
      ]
    },
    {
      id: 2,
      name: 'Bob Johnson',
      activity: 'Museum visit',
      location: 'History Museum',
      traveler: 'Jane Roe',
      rating: 4.9,
      trips: 89,
      photo: 'https://randomuser.me/api/portraits/men/2.jpg',
      email: 'bob.johnson@tourguides.com',
      phone: '+1 (555) 234-5678',
      joinDate: '2021-11-20',
      specialties: ['Museum Tours', 'Art History', 'Cultural Tours'],
      languages: ['English', 'German', 'Italian'],
      certifications: ['Art History Degree', 'Museum Guide License', 'Cultural Heritage Specialist'],
      totalEarnings: 38920,
      availability: 'Busy',
      emergencyContact: 'Emergency Services: +1 (911)',
      notes: 'Expert in art and cultural history. Highly rated by museum visitors.',
      recentReviews: [
        { reviewer: 'Jane R.', rating: 5, comment: 'Bob made the museum come alive with his stories.', date: '2024-08-29' },
        { reviewer: 'Tom W.', rating: 5, comment: 'Incredible knowledge of art history.', date: '2024-08-26' },
        { reviewer: 'Lisa M.', rating: 4, comment: 'Very informative and engaging tour.', date: '2024-08-23' }
      ]
    },
    {
      id: 3,
      name: 'Charlie Lee',
      activity: 'Hiking',
      location: 'Green Hills',
      traveler: 'Sam Lee',
      rating: 4.6,
      trips: 156,
      photo: 'https://randomuser.me/api/portraits/men/3.jpg',
      email: 'charlie.lee@tourguides.com',
      phone: '+1 (555) 345-6789',
      joinDate: '2020-07-08',
      specialties: ['Hiking Tours', 'Nature Photography', 'Wildlife Spotting'],
      languages: ['English', 'Mandarin'],
      certifications: ['Wilderness First Aid', 'Mountain Guide License', 'Wildlife Expert'],
      totalEarnings: 52180,
      availability: 'Available',
      emergencyContact: 'Mountain Rescue: +1 (555) 911-HELP',
      notes: 'Experienced outdoor guide with excellent safety record. Great for adventure seekers.',
      recentReviews: [
        { reviewer: 'Sam L.', rating: 4, comment: 'Great hiking experience, Charlie knows the trails well.', date: '2024-08-27' },
        { reviewer: 'Anna P.', rating: 5, comment: 'Amazing wildlife spotting opportunities!', date: '2024-08-24' },
        { reviewer: 'Mike R.', rating: 4, comment: 'Safe and enjoyable hiking adventure.', date: '2024-08-21' }
      ]
    },
    {
      id: 4,
      name: 'Diana Patel',
      activity: 'Food tour',
      location: 'Old Town',
      traveler: 'Alex Kim',
      rating: 4.9,
      trips: 203,
      photo: 'https://randomuser.me/api/portraits/women/4.jpg',
      email: 'diana.patel@tourguides.com',
      phone: '+1 (555) 456-7890',
      joinDate: '2019-05-12',
      specialties: ['Food Tours', 'Local Cuisine', 'Restaurant Recommendations'],
      languages: ['English', 'Hindi', 'Gujarati'],
      certifications: ['Food Safety Certified', 'Culinary Arts Degree', 'Local Cuisine Expert'],
      totalEarnings: 67340,
      availability: 'Available',
      emergencyContact: 'Emergency Services: +1 (911)',
      notes: 'Outstanding food tour guide with extensive knowledge of local cuisine and hidden gems.',
      recentReviews: [
        { reviewer: 'Alex K.', rating: 5, comment: 'Diana showed us the best local food spots!', date: '2024-08-30' },
        { reviewer: 'Sarah B.', rating: 5, comment: 'Incredible food tour, discovered amazing restaurants.', date: '2024-08-28' },
        { reviewer: 'Chris T.', rating: 4, comment: 'Great variety of food and excellent explanations.', date: '2024-08-25' }
      ]
    },
  ];

  ngOnInit() {
    this.calculateAnalytics();
  }

  calculateAnalytics() {
    this.guideAnalytics.totalGuides = this.guideReports.length;
    this.guideAnalytics.activeGuides = this.guideReports.filter(g => g.availability === 'Available').length;
    this.guideAnalytics.suspendedGuides = this.guideReports.filter(g => g.availability === 'Suspended').length;
    this.guideAnalytics.totalTrips = this.guideReports.reduce((sum, g) => sum + g.trips, 0);
    this.guideAnalytics.totalEarnings = this.guideReports.reduce((sum, g) => sum + g.totalEarnings, 0);
    this.guideAnalytics.averageRating = this.guideReports.reduce((sum, g) => sum + g.rating, 0) / this.guideReports.length;
    this.guideAnalytics.pendingApplications = this.pendingApplications.filter(app => app.status === 'pending' || app.status === 'reviewing').length;
    
    const topGuide = this.guideReports.reduce((prev, current) => 
      (prev.totalEarnings > current.totalEarnings) ? prev : current
    );
    this.guideAnalytics.topPerformer = topGuide.name;
  }

  get filteredGuides(): GuideReport[] {
    let filtered = this.guideReports.filter(guide => {
      const matchesSearch = guide.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           guide.specialties.some(s => s.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                           guide.location.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.filterStatus === 'all' || guide.availability.toLowerCase() === this.filterStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (this.sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'rating':
          compareValue = a.rating - b.rating;
          break;
        case 'trips':
          compareValue = a.trips - b.trips;
          break;
        case 'earnings':
          compareValue = a.totalEarnings - b.totalEarnings;
          break;
        case 'joinDate':
          compareValue = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
          break;
      }
      
      return this.sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }

  setSortBy(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
  }

  setRating(report: GuideReport, rating: number) {
    report.rating = rating;
    alert(`Rating updated to ${rating}/5 for ${report.name}`);
  }

  viewGuideDetails(guide: GuideReport) {
    this.selectedGuide = guide;
    this.showGuideModal = true;
  }

  closeGuideModal() {
    this.showGuideModal = false;
    this.selectedGuide = null;
  }

  editGuide(guide: GuideReport) {
    this.editingGuide = { ...guide };
    this.showEditModal = true;
    console.log('Editing guide:', guide.name);
  }

  saveGuideEdit() {
    if (this.editingGuide) {
      const index = this.guideReports.findIndex(g => g.id === this.editingGuide!.id);
      if (index !== -1) {
        this.guideReports[index] = { ...this.editingGuide };
        this.calculateAnalytics();
        this.closeEditModal();
        alert(`${this.editingGuide.name}'s profile has been updated successfully!`);
      }
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingGuide = null;
  }

  addSpecialtyToEdit(value: string) {
    if (this.editingGuide && value.trim()) {
      if (!this.editingGuide.specialties) {
        this.editingGuide.specialties = [];
      }
      this.editingGuide.specialties.push(value.trim());
    }
  }

  // Pending Applications Management
  openPendingApplications() {
    this.showPendingModal = true;
  }

  closePendingModal() {
    this.showPendingModal = false;
  }

  approveApplication(application: any) {
    if (confirm(`🎉 Are you sure you want to APPROVE ${application.name}'s guide application?\n\nThis will:\n• Add them to the active guides list\n• Send approval email and SMS notifications\n• Grant them access to accept tour bookings`)) {
      
      // Show loading state
      this.showNotification(`⏳ Processing ${application.name}'s approval...`, 'info');
      
      // Create a new guide from the application
      const newId = Math.max(...this.guideReports.map(g => g.id)) + 1;
      const newGuide: GuideReport = {
        id: newId,
        name: application.name,
        email: application.email,
        phone: application.phone,
        photo: application.photo,
        activity: 'Available for new tours',
        location: 'TBD',
        traveler: 'None',
        rating: 5.0, // New guides start with perfect rating
        trips: 0,
        specialties: application.specialties,
        languages: application.languages,
        certifications: application.certifications,
        totalEarnings: 0,
        availability: 'Available',
        joinDate: new Date().toISOString().split('T')[0],
        emergencyContact: 'Emergency Services: +1 (911)',
        notes: `Approved on ${new Date().toLocaleDateString()}. ${application.motivation}`,
        recentReviews: []
      };

      // Add to guides list
      this.guideReports.push(newGuide);
      
      // Remove from pending applications
      const index = this.pendingApplications.findIndex(app => app.id === application.id);
      if (index !== -1) {
        this.pendingApplications.splice(index, 1);
      }

      // Send approval notifications
      this.sendApprovalNotification(application);

      this.calculateAnalytics();
      this.showNotification(`✅ ${application.name} has been approved and notified! They are now an active guide.`, 'success');
    }
  }

  rejectApplication(application: any) {
    if (confirm(`❌ Are you sure you want to REJECT ${application.name}'s guide application?\n\nThis will:\n• Remove them from pending applications\n• Send rejection email and SMS notifications\n• They can reapply in the future`)) {
      
      const reason = prompt('💬 Please provide a reason for rejection (optional - will be included in the notification):');
      
      // Show loading state
      this.showNotification(`⏳ Processing ${application.name}'s rejection...`, 'info');
      
      // Remove from pending applications
      const index = this.pendingApplications.findIndex(app => app.id === application.id);
      if (index !== -1) {
        this.pendingApplications.splice(index, 1);
      }

      // Send rejection notifications
      this.sendRejectionNotification(application, reason || undefined);

      this.calculateAnalytics();
      this.showNotification(`❌ ${application.name}'s application has been rejected and they have been notified.`, 'warning');
    }
  }

  // Preview application method (new)
  previewApplication(application: any): void {
    this.selectedGuide = {
      id: application.id,
      name: application.name,
      email: application.email,
      phone: application.phone,
      photo: application.photo,
      activity: 'Pending Application',
      location: 'Applicant',
      traveler: 'None',
      rating: 0,
      trips: 0,
      specialties: application.specialties,
      languages: application.languages,
      certifications: application.certifications,
      totalEarnings: 0,
      availability: 'Pending',
      joinDate: application.applicationDate,
      emergencyContact: application.phone,
      notes: application.motivation,
      recentReviews: []
    };
    this.showGuideModal = true;
  }

  // Send approval notification (Email + SMS)
  sendApprovalNotification(application: any): void {
    // Email notification
    this.sendEmail({
      to: application.email,
      subject: '🎉 Congratulations! Your Guide Application has been Approved',
      body: `
        Dear ${application.name},

        Congratulations! We are pleased to inform you that your application to become a tour guide has been APPROVED.

        Here are your next steps:
        1. You will receive login credentials within 24 hours
        2. Complete your profile setup in our guide portal
        3. Attend our orientation session (details to follow)
        4. Start accepting tour bookings!

        Your specialties: ${application.specialties.join(', ')}
        Experience level: ${application.experience} years

        We're excited to have you join our team of professional tour guides!

        Best regards,
        Tourism Admin Team
        
        Contact us: admin@tourismplatform.com | +1 (555) 123-4567
      `
    });

    // SMS notification
    this.sendSMS({
      to: application.phone,
      message: `🎉 Great news ${application.name}! Your tour guide application has been APPROVED. Check your email for next steps. Welcome to our team! - Tourism Platform`
    });
  }

  // Send rejection notification (Email + SMS)
  sendRejectionNotification(application: any, reason?: string): void {
    // Email notification
    this.sendEmail({
      to: application.email,
      subject: 'Update on Your Tour Guide Application',
      body: `
        Dear ${application.name},

        Thank you for your interest in becoming a tour guide with our platform.

        After careful review, we regret to inform you that we cannot proceed with your application at this time.

        ${reason ? `Reason: ${reason}` : `This decision was based on:
        - Current capacity in your specialty areas
        - Specific experience requirements for our current needs
        - Regional coverage considerations`}

        We encourage you to:
        - Gain additional experience in tourism or hospitality
        - Consider specializing in high-demand areas
        - Reapply in 6 months when new positions may be available

        We appreciate your interest and wish you the best in your career endeavors.

        Best regards,
        Tourism Admin Team
        
        Contact us: admin@tourismplatform.com | +1 (555) 123-4567
      `
    });

    // SMS notification
    this.sendSMS({
      to: application.phone,
      message: `Hi ${application.name}, thank you for applying to be a tour guide. Unfortunately, we cannot proceed with your application at this time. Please check your email for details. - Tourism Platform`
    });
  }

  // Email service simulation
  sendEmail(emailData: {to: string, subject: string, body: string}): void {
    console.log('📧 Sending Email to:', emailData.to);
    console.log('📧 Subject:', emailData.subject);
    console.log('📧 Email Body:');
    console.log(emailData.body);
    
    // Create a mock email preview for demo purposes
    this.showEmailPreview(emailData);
    
    // Simulate email sending with realistic delay
    setTimeout(() => {
      console.log(`✅ Email sent successfully to ${emailData.to}`);
      this.showNotification(`📧 Email sent to ${emailData.to}`, 'info');
    }, 1500);

    // In production, integrate with actual email service:
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // sgMail.send({
    //   to: emailData.to,
    //   from: 'admin@tourismplatform.com',
    //   subject: emailData.subject,
    //   html: this.formatEmailTemplate(emailData.body)
    // });
  }

  // SMS service simulation  
  sendSMS(smsData: {to: string, message: string}): void {
    console.log('📱 Sending SMS to:', smsData.to);
    console.log('📱 SMS Message:', smsData.message);
    
    // Simulate SMS sending with realistic delay
    setTimeout(() => {
      console.log(`✅ SMS sent successfully to ${smsData.to}`);
      this.showNotification(`📱 SMS sent to ${smsData.to}`, 'info');
    }, 2000);

    // In production, integrate with actual SMS service:
    // Example with Twilio:
    // const twilio = require('twilio')(accountSid, authToken);
    // twilio.messages.create({
    //   body: smsData.message,
    //   from: '+1234567890',
    //   to: smsData.to
    // });
  }

  // Show email preview in console (for demo purposes)
  showEmailPreview(emailData: {to: string, subject: string, body: string}): void {
    const emailPreview = `
    ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
    ║                                    📧 EMAIL PREVIEW                                              ║
    ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ TO: ${emailData.to.padEnd(84)} ║
    ║ FROM: admin@tourismplatform.com                                                                  ║
    ║ SUBJECT: ${emailData.subject.substring(0, 80).padEnd(80)} ║
    ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ BODY:                                                                                            ║
    ║                                                                                                  ║
    ${emailData.body.split('\n').map(line => `║ ${line.substring(0, 94).padEnd(94)} ║`).join('\n')}
    ║                                                                                                  ║
    ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
    `;
    console.log(emailPreview);
  }

  // Enhanced notification system
  showNotification(message: string, type: 'success' | 'warning' | 'info' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show notification-toast`;
    notification.style.cssText = `
      position: relative;
      margin-bottom: 1rem;
      min-width: 350px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-radius: 0.75rem;
      font-weight: 500;
    `;
    
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
    
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="me-2" style="font-size: 1.2rem;">${icon}</span>
        <div class="flex-grow-1">${message}</div>
        <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    // Get or create notification container
    let container = document.getElementById('notification-area');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-area';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => notification.remove(), 400);
      }
    }, 6000);
  }

  setApplicationStatus(application: any, status: string) {
    application.status = status;
    this.calculateAnalytics();
    alert(`${application.name}'s application status updated to: ${status}`);
  }

  exportApplicationData() {
    const csvContent = [
      'Name,Email,Phone,Application Date,Specialties,Languages,Experience,Status',
      ...this.pendingApplications.map(app => 
        `"${app.name}","${app.email}","${app.phone}","${app.applicationDate}","${app.specialties.join('; ')}","${app.languages.join('; ')}","${app.experience}","${app.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pending_applications_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Pending applications data exported successfully!');
  }

  suspendGuide(guide: GuideReport) {
    if (confirm(`Are you sure you want to suspend ${guide.name}? This will prevent them from taking new tours.`)) {
      guide.availability = 'Suspended';
      alert(`${guide.name} has been suspended from taking new tours.`);
    }
  }

  activateGuide(guide: GuideReport) {
    guide.availability = 'Available';
    alert(`${guide.name} is now available for tours.`);
  }

  exportGuideProfile(guide: GuideReport) {
    const profileData = {
      'Guide Information': {
        'Name': guide.name,
        'Email': guide.email,
        'Phone': guide.phone,
        'Join Date': guide.joinDate,
        'Current Activity': guide.activity,
        'Location': guide.location,
        'Rating': `${guide.rating}/5`,
        'Total Trips': guide.trips,
        'Total Earnings': `$${guide.totalEarnings.toLocaleString()}`,
        'Availability': guide.availability
      },
      'Specialties': guide.specialties.join(', '),
      'Languages': guide.languages.join(', '),
      'Certifications': guide.certifications.join(', '),
      'Emergency Contact': guide.emergencyContact,
      'Notes': guide.notes
    };

    const jsonContent = JSON.stringify(profileData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.name.replace(/\s+/g, '_')}_profile.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert(`Profile data for ${guide.name} exported successfully!`);
  }

  deleteGuide(guide: GuideReport) {
    if (confirm(`Are you sure you want to permanently delete ${guide.name}? This action cannot be undone.`)) {
      const index = this.guideReports.findIndex(g => g.id === guide.id);
      if (index !== -1) {
        this.guideReports.splice(index, 1);
        this.calculateAnalytics();
        alert(`${guide.name} has been removed from the system.`);
      }
    }
  }

  assignTour(guide: GuideReport) {
    const tours = ['City Historical Tour', 'Museum Visit', 'Food Exploration', 'Adventure Hiking', 'Photography Walk', 'Cultural Experience'];
    const randomTour = tours[Math.floor(Math.random() * tours.length)];
    const travelers = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'David Wilson', 'Emma Davis'];
    const randomTraveler = travelers[Math.floor(Math.random() * travelers.length)];
    
    guide.activity = randomTour;
    guide.traveler = randomTraveler;
    guide.availability = 'Busy';
    
    alert(`${guide.name} has been assigned to "${randomTour}" with traveler ${randomTraveler}`);
  }

  completeTour(guide: GuideReport) {
    if (guide.availability === 'Busy') {
      guide.trips += 1;
      guide.totalEarnings += Math.floor(Math.random() * 300) + 100; // Random earnings between $100-$400
      guide.activity = 'Available for new tours';
      guide.traveler = 'None';
      guide.availability = 'Available';
      
      // Add a new review
      const reviewers = ['Happy Customer', 'Satisfied Traveler', 'Tour Enthusiast', 'Adventure Seeker'];
      const comments = [
        'Excellent guide with great knowledge!',
        'Very professional and friendly service.',
        'Amazing experience, highly recommend!',
        'Great tour, learned so much!'
      ];
      
      const newReview = {
        reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
        rating: Math.floor(Math.random() * 2) + 4, // Rating between 4-5
        comment: comments[Math.floor(Math.random() * comments.length)],
        date: new Date().toISOString().split('T')[0]
      };
      
      guide.recentReviews.unshift(newReview);
      if (guide.recentReviews.length > 3) {
        guide.recentReviews.pop();
      }
      
      // Recalculate rating based on recent reviews
      guide.rating = guide.recentReviews.reduce((sum, r) => sum + r.rating, 0) / guide.recentReviews.length;
      
      this.calculateAnalytics();
      alert(`Tour completed! ${guide.name} is now available for new assignments.`);
    } else {
      alert(`${guide.name} is not currently on a tour.`);
    }
  }

  sendMessage(guide: GuideReport) {
    const message = prompt(`Send a message to ${guide.name}:`);
    if (message) {
      alert(`Message sent to ${guide.name}: "${message}"`);
      // In a real app, this would send an actual message/notification
    }
  }

  viewLocation(guide: GuideReport) {
    if (guide.location && guide.location !== 'TBD') {
      alert(`Opening map for ${guide.name}'s current location: ${guide.location}`);
      // In a real app, this would open a map or GPS tracking
    } else {
      alert(`${guide.name}'s location is not available.`);
    }
  }

  reportGuide(guide: GuideReport) {
    if (confirm(`Are you sure you want to report ${guide.name}? This will flag their profile for review.`)) {
      alert(`Report submitted for ${guide.name}. Our team will review this guide's activity.`);
    }
  }

  exportGuideData() {
    const csvContent = [
      'Name,Activity,Location,Traveler,Rating,Trips',
      ...this.guideReports.map(guide => 
        `"${guide.name}","${guide.activity}","${guide.location}","${guide.traveler}",${guide.rating},${guide.trips}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guides_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Guide activity report exported successfully!');
  }
}
