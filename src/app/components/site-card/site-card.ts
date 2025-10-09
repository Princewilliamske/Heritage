import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Site } from '../../types';
import { RatingService } from '../../services/rating.service';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-card.html',
  styleUrls: ['./site-card.css'],
  providers: [RatingService] // Ensure the RatingService is provided here

})
export class SiteCardComponent {
  @Input({ required: true }) site!: Site;
  ratingService = inject(RatingService);

  // A computed signal to calculate the displayed rating data dynamically.
  // It combines the base community rating with the user's own rating.
  displayData = computed(() => {
    const userRating = this.ratingService.userRatings()[this.site.id];
    const baseTotal = this.site.averageRating * this.site.ratingCount;
    
    if (userRating) {
      const newTotal = baseTotal + userRating;
      const newCount = this.site.ratingCount + 1;
      return { 
        average: parseFloat((newTotal / newCount).toFixed(1)), 
        count: newCount 
      };
    }
    
    return { 
      average: this.site.averageRating, 
      count: this.site.ratingCount 
    };
  });

  // Helper to generate an array for star rendering
  get stars() {
    return Array(5).fill(0);
  }
}
