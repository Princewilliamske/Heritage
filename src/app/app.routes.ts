// Fix: Import Routes for explicit typing of the routes array.
import { Routes } from '@angular/router';
import { SiteListComponent } from './components/site-list/site-list';
import { HeritageListComponent } from './components/heritage-list/heritage-list';
import { AddSiteFormComponent } from './components/add-site-form/add-site-form';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { SiteDetailComponent } from './components/site-detail/site-detail';
import { AboutComponent } from './components/about/about';
import { AddHeritageFormComponent } from './components/add-heritage-form/add-heritage-form';

// Fix: Explicitly type the routes array with Routes to fix type inference issues.
export const routes: Routes = [
  { path: 'sites/:id', component: SiteDetailComponent, title: 'Site Details' },
  { path: 'sites', component: SiteListComponent, title: 'Historical Sites' },
  { path: 'heritage', component: HeritageListComponent, title: 'Cultural Heritage' },
  { path: 'add-site', component: AddSiteFormComponent, title: 'Add New Site' },
  { path: 'add-heritage', component: AddHeritageFormComponent, title: 'Add Cultural Heritage' },
  { path: 'about', component: AboutComponent, title: 'About Us' },
  { path: 'chatbot', component: ChatbotComponent, title: 'AI Chatbot Guide' },
  { path: '', redirectTo: '/sites', pathMatch: 'full' },
  { path: '**', redirectTo: '/sites' } // Fallback route
];
