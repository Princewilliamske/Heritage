// This file is intentionally empty after TypeScript compilation
// as it only contained type definitions (interfaces).

// Fix: Define interfaces for data models to enable strong typing across the app.
export interface Site {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  averageRating: number;
  ratingCount: number;
}

export interface Heritage {
  id: number;
  community: string;
  description: string;
  imageUrl: string;
  keyAspects: string[];
}