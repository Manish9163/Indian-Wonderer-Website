import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Playlist {
  id?: number;
  destination: string;
  destination_display_name: string;
  spotify_playlist_name: string;
  spotify_playlist_url?: string;
  youtube_playlist_name: string;
  youtube_playlist_url?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playlists.component.html',
  styleUrls: ['./playlists.component.css']
})
export class PlaylistsComponent implements OnInit {
  playlists: Playlist[] = [];
  filteredPlaylists: Playlist[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  
  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  
  currentPlaylist: Playlist = {
    destination: '',
    destination_display_name: '',
    spotify_playlist_name: '',
    spotify_playlist_url: '',
    youtube_playlist_name: '',
    youtube_playlist_url: '',
    description: '',
    is_active: true
  };
  
  private apiUrl = 'http://localhost/fu/backend/api/admin_playlists.php';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.isLoading = true;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (response) => {
        if (response.success) {
          this.playlists = response.playlists;
          this.filteredPlaylists = [...this.playlists];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading playlists:', error);
        this.isLoading = false;
      }
    });
  }

  filterPlaylists(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredPlaylists = this.playlists.filter(p =>
      p.destination.toLowerCase().includes(term) ||
      p.destination_display_name.toLowerCase().includes(term) ||
      p.spotify_playlist_name.toLowerCase().includes(term) ||
      p.youtube_playlist_name.toLowerCase().includes(term)
    );
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.currentPlaylist = {
      destination: '',
      destination_display_name: '',
      spotify_playlist_name: '',
      spotify_playlist_url: '',
      youtube_playlist_name: '',
      youtube_playlist_url: '',
      description: '',
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(playlist: Playlist): void {
    this.modalMode = 'edit';
    this.currentPlaylist = { ...playlist };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePlaylist(): void {
    if (this.modalMode === 'add') {
      this.createPlaylist();
    } else {
      this.updatePlaylist();
    }
  }

  createPlaylist(): void {
    this.http.post<any>(this.apiUrl, this.currentPlaylist).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Playlist created successfully!');
          this.loadPlaylists();
          this.closeModal();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error creating playlist:', error);
        alert('Failed to create playlist');
      }
    });
  }

  updatePlaylist(): void {
    this.http.put<any>(this.apiUrl, this.currentPlaylist).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Playlist updated successfully!');
          this.loadPlaylists();
          this.closeModal();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error updating playlist:', error);
        alert('Failed to update playlist');
      }
    });
  }

  toggleStatus(playlist: Playlist): void {
    const data = {
      id: playlist.id,
      toggle_status: true
    };
    
    this.http.put<any>(this.apiUrl, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPlaylists();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        alert('Failed to update status');
      }
    });
  }

  deletePlaylist(playlist: Playlist): void {
    if (!confirm(`Are you sure you want to delete the playlist for ${playlist.destination_display_name}?`)) {
      return;
    }
    
    this.http.request<any>('delete', this.apiUrl, {
      body: { id: playlist.id }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Playlist deleted successfully!');
          this.loadPlaylists();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error deleting playlist:', error);
        alert('Failed to delete playlist');
      }
    });
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-inactive';
  }
}
