import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SiteService } from '../../services/site.service';

@Component({
  selector: 'app-add-site-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-site-form.html',
  styleUrls: ['./add-site-form.css'],
  providers: [SiteService]
})

export class AddSiteFormComponent {
  name = '';
  description = '';
  location = '';
  latitude: number | null = null;
  longitude: number | null = null;

  // Fix: Add explicit types for injected services to resolve type inference issues.
  siteService: SiteService = inject(SiteService);
  router: Router = inject(Router);

  handleSubmit() {
    if (!this.name || !this.description || !this.location || this.latitude === null || this.longitude === null) {
      alert("Please fill in all fields, including latitude and longitude.");
      return;
    }
    // Fix: Add missing properties `averageRating` and `ratingCount` to satisfy the type required by the `addSite` method. New sites will start with no ratings.
    this.siteService.addSite({
      name: this.name,
      description: this.description,
      location: this.location,
      latitude: this.latitude,
      longitude: this.longitude,
      averageRating: 0,
      ratingCount: 0
    });

    // Navigate back to the sites list after successful submission
    this.router.navigate(['/sites']);
  }
}
