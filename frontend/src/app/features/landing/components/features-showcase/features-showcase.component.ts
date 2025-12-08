import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material/material.module';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features-showcase',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './features-showcase.component.html',
  styleUrls: ['./features-showcase.component.scss']
})
export class FeaturesShowcaseComponent {
  features: Feature[] = [
    {
      icon: 'route',
      title: 'Gyors jegyvásárlás',
      description: 'Vásárolj jegyet pár kattintással, Google fiókkal fizetve. Gyors, egyszerű és biztonságos.'
    },
    {
      icon: 'map',
      title: 'Okos útvonaltervezés',
      description: 'Találd meg a leggyorsabb útvonalat A-ból B-be multimodális javaslatokkal és valós idejű adatokkal.'
    },
    {
      icon: 'star',
      title: 'Közösségi értékelések',
      description: 'Olvasd el utasok véleményét, és oszd meg saját tapasztalataidat a járatokról.'
    },
    {
      icon: 'place',
      title: 'Térkép Navigáció',
      description: 'Interaktív térkép megállókkal, útvonalakkal és valós idejű információkkal.'
    },
    {
      icon: 'bookmark',
      title: 'Kedvenc Útvonalak',
      description: 'Mentsd el gyakran használt útvonalaid gyors eléréshez.'
    },
    {
      icon: 'notifications',
      title: 'Értesítések',
      description: 'Kapj emailt jegyvásárlásról és fontos frissítésekről.'
    }
  ];
}
