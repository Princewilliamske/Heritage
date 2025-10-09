import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeritageCardComponent } from '../heritage-card/heritage-card';
import { HeritageService } from '../../services/heritage.service';

@Component({
  selector: 'app-heritage-list',
  standalone: true,
  imports: [CommonModule, HeritageCardComponent],
  templateUrl: './heritage-list.html',
})
export class HeritageListComponent implements OnInit {
  heritageService = inject(HeritageService);
  heritageInfos = this.heritageService.heritage;
  loading = true;

  // Dummy array for skeleton loaders
  skeletonItems = Array(3).fill(0);

  ngOnInit() {
    // Simulate a network delay for fetching data
    setTimeout(() => {
      this.loading = false;
    }, 1500); // 1.5 second delay
  }
}
