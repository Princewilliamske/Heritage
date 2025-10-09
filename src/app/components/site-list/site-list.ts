import { Component, inject, signal, OnInit, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteService } from '../../services/site.service';
import { SiteCardComponent } from '../site-card/site-card'; // Fixed import path
import { RouterLink } from '@angular/router';
import { Site } from '../../types';
import { isPlatformBrowser } from '@angular/common';

// ✅ Import CSS globally (safe for SSR)
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-site-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteCardComponent],
  templateUrl: './site-list.html',
})
export class SiteListComponent implements OnInit, AfterViewInit {
  siteService = inject(SiteService);
  sites = this.siteService.sites;
  loading = signal(true);
  viewMode = signal<'list' | 'map'>('list');
  private map: any; // Use dynamic type since Leaflet loads lazily

  skeletonItems = Array(6).fill(0);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    setTimeout(() => {
      this.loading.set(false);
      if (this.viewMode() === 'map') {
        this.initializeMap();
      }
    }, 1500);
  }

  ngAfterViewInit() {
    // Optional: Initialize if default viewMode is 'map'
    if (this.viewMode() === 'map') {
      this.initializeMap();
    }
  }

  setViewMode(mode: 'list' | 'map') {
    this.viewMode.set(mode);
    if (mode === 'map') {
      setTimeout(() => this.initializeMap(), 0);
    }
  }

  private async initializeMap() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // ✅ Prevent Leaflet from running on the server
    }

    try {
      const L = await import('leaflet'); // ✅ Lazy import for SSR safety

      if (this.map) {
        this.map.invalidateSize();
        return;
      }

      // Initialize the map centered on Kenya
      this.map = L.map('map').setView([-0.0236, 37.9062], 7);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Add markers for each site
      this.sites().forEach((site: Site) => {
        if (site.latitude && site.longitude) {
          const popupContent = `
            <div class="font-sans">
              <h3 class="font-bold text-lg text-amber-900 mb-1">${site.name}</h3>
              <a href="/sites/${site.id}" class="text-amber-700 font-semibold hover:underline">View Details &rarr;</a>
            </div>
          `;
          L.marker([site.latitude, site.longitude])
            .addTo(this.map)
            .bindPopup(popupContent);
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }
}
