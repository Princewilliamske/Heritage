import { Injectable, signal } from '@angular/core';
import { mockSites } from '../data/mockData';
// Fix: Import Site type for strong typing.
import { Site } from '../types';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  // Use a signal to hold the state, making it reactive.
  // Fix: Strongly type the sites signal.
  sites = signal<Site[]>(mockSites);

  constructor() { }

  // Fix: Add types for method parameters and return value.
  getSiteById(id: number): Site | undefined {
    return this.sites().find(site => site.id === id);
  }

  // Fix: Use Omit utility type for the site parameter to enforce structure.
  addSite(site: Omit<Site, 'id' | 'imageUrl'>) {
    const newSite: Site = {
      ...site,
      id: Date.now(),
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`
    };
    
    // Update the signal's value, which automatically notifies consumers.
    this.sites.update(currentSites => [newSite, ...currentSites]);
  }
}
