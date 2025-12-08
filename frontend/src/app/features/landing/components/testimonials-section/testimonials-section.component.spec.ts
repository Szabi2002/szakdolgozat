import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestimonialsSectionComponent } from './testimonials-section.component';

describe('TestimonialsSectionComponent', () => {
  let component: TestimonialsSectionComponent;
  let fixture: ComponentFixture<TestimonialsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestimonialsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestimonialsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 testimonials', () => {
    expect(component.testimonials.length).toBe(3);
  });

  it('should generate correct stars array', () => {
    expect(component.getStars(5).length).toBe(5);
    expect(component.getStars(4).length).toBe(4);
    expect(component.getStars(3).length).toBe(3);
  });

  it('should generate correct empty stars array', () => {
    expect(component.getEmptyStars(5).length).toBe(0);
    expect(component.getEmptyStars(4).length).toBe(1);
    expect(component.getEmptyStars(3).length).toBe(2);
  });

  it('should generate correct initials', () => {
    expect(component.getInitials('Kovács Anna')).toBe('KA');
    expect(component.getInitials('Nagy Péter')).toBe('NP');
    expect(component.getInitials('Test')).toBe('TE');
  });
});
