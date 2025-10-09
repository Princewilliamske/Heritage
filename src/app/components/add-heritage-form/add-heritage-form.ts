import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeritageService } from '../../services/heritage.service';

@Component({
  selector: 'app-add-heritage-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-heritage-form.html',
  styleUrls: ['./add-heritage-form.css'],
  providers: [HeritageService]
})
export class AddHeritageFormComponent {
  community = '';
  description = '';
  imageUrl = ''; // Optional, will be generated if empty
  keyAspects: string[] = [];
  currentAspect = '';

  // Fix: Add explicit types for injected services to resolve type inference issues.
  heritageService: HeritageService = inject(HeritageService);
  router: Router = inject(Router);

  addAspect() {
    if (this.currentAspect.trim()) {
      this.keyAspects.push(this.currentAspect.trim());
      this.currentAspect = '';
    }
  }

  removeAspect(index: number) {
    this.keyAspects.splice(index, 1);
  }

  handleSubmit() {
    if (!this.community || !this.description || this.keyAspects.length === 0) {
      alert("Please fill in Community, Description, and add at least one Key Aspect.");
      return;
    }

    this.heritageService.addHeritage({
      community: this.community,
      description: this.description,
      imageUrl: this.imageUrl,
      keyAspects: this.keyAspects
    });

    this.router.navigate(['/heritage']);
  }
}