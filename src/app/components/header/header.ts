import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  navItems = [
    { id: 'sites', path: '/sites', label: 'Historical Sites' },
    { id: 'heritage', path: '/heritage', label: 'Cultural Heritage' },
    { id: 'add', path: '/add-site', label: 'Add Site' },
    { id: 'add-heritage', path: '/add-heritage', label: 'Add Heritage' },
    { id: 'chatbot', path: '/chatbot', label: 'AI Chatbot' },
    { id: 'about', path: '/about', label: 'About' },
    
  ];
}
