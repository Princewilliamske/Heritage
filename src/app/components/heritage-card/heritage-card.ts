import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// Fix: Import Heritage type for strong typing.
import { Heritage } from '../../types';

@Component({
  selector: 'app-heritage-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heritage-card.html',
})
export class HeritageCardComponent {
  // Fix: Strongly type the heritageInfo input property.
  @Input({ required: true }) heritageInfo!: Heritage;
}
// Fix: Ensure the Heritage type is defined in src/app/types/index.ts
// Example definition:
// export interface Heritage {