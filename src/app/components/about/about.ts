import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrls: ['./about.css'],
})
export class AboutComponent {
  features = [
    {
      id: 'sites',
      title: 'Explore Historical Sites',
      description: 'Journey through a curated list of Kenya’s most significant historical landmarks, from ancient ruins to colonial-era forts.'
    },
    {
      id: 'heritage',
      title: 'Discover Cultural Heritage',
      description: 'Learn about the diverse traditions, music, art, and customs of Kenya’s many communities, including the Maasai, Kikuyu, and Swahili people.'
    },
    {
      id: 'chatbot',
      title: 'Meet Kazi, Your AI Guide',
      description: 'Chat with our AI-powered historian, Kazi, to get in-depth knowledge, ask questions, and hear fascinating stories about any site or culture.'
    },
    {
      id: 'add',
      title: 'Contribute Your Knowledge',
      description: 'Our heritage is a shared story. Use the "Add Site" feature to contribute new locations and help us grow this digital archive for everyone.'
    }
  ];
}