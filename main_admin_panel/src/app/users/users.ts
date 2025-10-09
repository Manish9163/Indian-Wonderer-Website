import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="glass-card p-4">
            <h2 class="gradient-text mb-2">
              <i class="fas fa-users me-2"></i>Users Management
            </h2>
            <p class="text-muted">User management system - Coming soon</p>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5 mt-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">Loading users...</p>
      </div>
      
      <!-- Users Count -->
      <div *ngIf="!isLoading" class="row mt-4">
        <div class="col-md-3">
          <div class="glass-card stat-card p-4">
            <h3 class="mb-0">{{ users.length }}</h3>
            <p class="text-muted mb-0">Total Users</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card stat-card p-4">
            <h3 class="mb-0">{{ userStats.customers || 0 }}</h3>
            <p class="text-muted mb-0">Customers</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card stat-card p-4">
            <h3 class="mb-0">{{ userStats.guides || 0 }}</h3>
            <p class="text-muted mb-0">Guides</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card stat-card p-4">
            <h3 class="mb-0">{{ userStats.admins || 0 }}</h3>
            <p class="text-muted mb-0">Admins</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.1);
    }
    
    .gradient-text {
      background: linear-gradient(45deg, #667eea, #764ba2);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    
    .stat-card {
      transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
  `]
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  selectedRole: string = 'all';
  selectedFilter: string = 'all';
  isAddingUser: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  newUser: any = {
    name: '',
    email: '',
    role: 'user',
    password: ''
  };

  userStats: any = {
    totalUsers: 0,
    customers: 0,
    admins: 0,
    guides: 0,
    activeUsers: 0,
    newThisMonth: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading users from API...');
    
    this.apiService.getUsers().subscribe({
      next: (response) => {
        console.log('Users API Response:', response);
        
        if (response && response.success && response.data) {
          this.users = (response.data.users || []).map((user: any) => ({
            id: user.id,
            name: user.username || user.name,
            email: user.email,
            role: user.role || 'customer',
            status: user.status || (user.is_active ? 'active' : 'inactive'),
            lastLogin: user.last_login || user.updated_at,
            joinDate: user.created_at,
            totalBookings: user.total_bookings || 0
          }));
          
          this.userStats = response.data.stats || {
            totalUsers: 0,
            customers: 0,
            admins: 0,
            guides: 0,
            activeUsers: 0,
            newThisMonth: 0
          };
          
          console.log('Loaded users:', this.users.length);
          this.filterUsers();
          this.isLoading = false;
        } else {
          this.errorMessage = response.error || 'Failed to load users';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = error.message || 'Error loading users. Check if XAMPP is running.';
        this.isLoading = false;
      }
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      const matchesFilter = this.selectedFilter === 'all' || user.status === this.selectedFilter;
      
      return matchesSearch && matchesRole && matchesFilter;
    });
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  onRoleChange(): void {
    this.filterUsers();
  }

  onFilterChange(): void {
    this.filterUsers();
  }

  addNewUser(): void {
    this.isAddingUser = true;
  }

  saveNewUser(): void {
    if (this.newUser.name && this.newUser.email) {
      const newId = Math.max(...this.users.map(u => u.id)) + 1;
      this.users.push({
        id: newId,
        ...this.newUser,
        status: 'active',
        lastLogin: new Date().toISOString().split('T')[0],
        joinDate: new Date().toISOString().split('T')[0]
      });
      this.filterUsers();
      this.cancelAddUser();
    }
  }

  cancelAddUser(): void {
    this.isAddingUser = false;
    this.newUser = {
      name: '',
      email: '',
      role: 'user',
      password: ''
    };
  }

  exportUsers(): void {
    console.log('Exporting users...');
    // Export functionality
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  viewUserDetails(userId: number): void {
    console.log('Viewing user details:', userId);
  }

  editUser(userId: number): void {
    console.log('Editing user:', userId);
  }

  sendNotification(userId: number): void {
    console.log('Sending notification to user:', userId);
  }

  promoteUser(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.role = user.role === 'user' ? 'guide' : 'admin';
      this.filterUsers();
    }
  }

  toggleUserStatus(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'active' ? 'inactive' : 'active';
      this.filterUsers();
    }
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(u => u.id !== userId);
      this.filterUsers();
    }
  }
}
