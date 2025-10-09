import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard';
import { AnalyticsComponent } from './analytics/analytics';
import { ToursComponent } from './tours/tours';
import { BookingsComponent } from './bookings/bookings';
import { UsersComponent } from './users/users';
import { CustomersComponent } from './customers/customers';
import { ItinerariesComponent } from './itineraries/itineraries';
import { PaymentsComponent } from './payments/payments';
import { SettingsComponent } from './settings/settings';
import { GuidesComponent } from './guides/guides';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'tours', component: ToursComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'itineraries', component: ItinerariesComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'guides', component: GuidesComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
