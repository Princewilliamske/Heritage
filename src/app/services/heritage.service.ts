import { Injectable, signal } from '@angular/core';
import { mockHeritage } from '../data/mockData';
import { Heritage } from '../types';

@Injectable({
  providedIn: 'root'
})
export class HeritageService {
  heritage = signal<Heritage[]>(mockHeritage);

  constructor() { }

  addHeritage(heritageItem: Omit<Heritage, 'id'>) {
    const newHeritageItem: Heritage = {
      ...heritageItem,
      id: Date.now(),
      // Use provided imageUrl or generate a new one if it's empty
      imageUrl: heritageItem.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`
    };
    
    // Add the new item to the beginning of the array
    this.heritage.update(currentHeritage => [newHeritageItem, ...currentHeritage]);
  }
}
