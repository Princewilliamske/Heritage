import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private readonly RATING_STORAGE_KEY = 'siteRatings';
  
  // A signal to hold the user's ratings, with the key being the site ID.
  userRatings = signal<{[key: string]: number}>({});

  constructor() { 
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedRatings = window.localStorage.getItem(this.RATING_STORAGE_KEY);
      if (savedRatings) {
        this.userRatings.set(JSON.parse(savedRatings));
      }
    }
  }

  /**
   * Sets or updates a user's rating for a specific site.
   * @param siteId The ID of the site to rate.
   * @param rating The rating value (1-5).
   */
  rateSite(siteId: number, rating: number): void {
    this.userRatings.update(currentRatings => {
      const newRatings = { ...currentRatings, [siteId]: rating };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.RATING_STORAGE_KEY, JSON.stringify(newRatings));
      }
      return newRatings;
    });
  }
}
