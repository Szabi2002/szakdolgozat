import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { FeaturesShowcaseComponent } from '../../components/features-showcase/features-showcase.component';
import { TestimonialsSectionComponent } from '../../components/testimonials-section/testimonials-section.component';
import { CtaSectionComponent } from '../../components/cta-section/cta-section.component';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    FeaturesShowcaseComponent,
    TestimonialsSectionComponent,
    CtaSectionComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class LandingHomeComponent {
  // Landing page is a simple composition of sections
}
