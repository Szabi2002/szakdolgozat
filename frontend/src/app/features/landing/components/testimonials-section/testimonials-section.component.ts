import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './testimonials-section.component.html',
  styleUrls: ['./testimonials-section.component.scss']
})
export class TestimonialsSectionComponent {
  testimonials: Testimonial[] = [
    {
      name: 'Kovács Anna',
      role: 'Rendszeres utas',
      avatar: '',
      rating: 5,
      comment: 'Fantasztikus alkalmazás! A jegyvásárlás olyan egyszerű és gyors, hogy már nem is gondolok másra. Az útvonaltervező mindig megtalálja a legjobb megoldást.'
    },
    {
      name: 'Nagy Péter',
      role: 'Diák',
      avatar: '',
      rating: 5,
      comment: 'Napi szinten használom az iskolába járáshoz. A kedvencek funkció nagyon hasznos, egy kattintással látom a szokásos útvonalam.'
    },
    {
      name: 'Szabó Eszter',
      role: 'Dolgozó',
      avatar: '',
      rating: 4,
      comment: 'Végre egy app, ami tényleg működik! A QR kódos jegy szuper, nem kell nyomtatott jeggyel bajlódni. Csak ajánlani tudom!'
    }
  ];

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
