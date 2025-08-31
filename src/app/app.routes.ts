import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { ToursComponent } from './tours/tours';
import { ItinerariesComponent } from './itineraries/itineraries';
import { BookingsComponent } from './bookings/bookings';
import { CustomersComponent } from './customers/customers';
import { GuidesComponent } from './guides/guides';
import { AnalyticsComponent } from './analytics/analytics';
import { SettingsComponent } from './settings/settings';
import { PaymentsComponent } from './payments/payments';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'tours', component: ToursComponent },
    { path: 'itineraries', component: ItinerariesComponent },
    { path: 'bookings', component: BookingsComponent },
    { path: 'customers', component: CustomersComponent },
    { path: 'guides', component: GuidesComponent },
    { path: 'analytics', component: AnalyticsComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'payments', component: PaymentsComponent }
];
