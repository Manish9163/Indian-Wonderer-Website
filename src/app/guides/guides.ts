import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GuideReport {
  name: string;
  activity: string;
  location: string;
  traveler: string;
  rating: number;
  trips: number;
  photo: string;
}

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guides.html',
})
export class GuidesComponent {
  guideReports: GuideReport[] = [
    {
      name: 'Alice Smith',
      activity: 'Guiding city tour',
      location: 'Downtown',
      traveler: 'John Doe',
      rating: 4,
      trips: 12,
      photo: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    {
      name: 'Bob Johnson',
      activity: 'Museum visit',
      location: 'History Museum',
      traveler: 'Jane Roe',
      rating: 5,
      trips: 20,
      photo: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
    {
      name: 'Charlie Lee',
      activity: 'Hiking',
      location: 'Green Hills',
      traveler: 'Sam Lee',
      rating: 3,
      trips: 8,
      photo: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
      name: 'Diana Patel',
      activity: 'Food tour',
      location: 'Old Town',
      traveler: 'Alex Kim',
      rating: 5,
      trips: 15,
      photo: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
  ];

  setRating(report: GuideReport, rating: number) {
    report.rating = rating;
  }
}
