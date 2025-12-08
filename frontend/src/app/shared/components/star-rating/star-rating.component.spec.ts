import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent, MatIconModule, MatTooltipModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 5 stars', () => {
    const starButtons = fixture.nativeElement.querySelectorAll('.star-button');
    expect(starButtons.length).toBe(5);
  });

  it('should display filled stars based on rating', () => {
    component.rating = 3;
    fixture.detectChanges();

    expect(component.getStarIcon(1)).toBe('star');
    expect(component.getStarIcon(2)).toBe('star');
    expect(component.getStarIcon(3)).toBe('star');
    expect(component.getStarIcon(4)).toBe('star_border');
    expect(component.getStarIcon(5)).toBe('star_border');
  });

  it('should display half star for decimal ratings', () => {
    component.rating = 3.5;
    component.readonly = true;
    fixture.detectChanges();

    expect(component.getStarIcon(4)).toBe('star_half');
  });

  it('should emit rating change on star click', () => {
    component.readonly = false;
    spyOn(component.ratingChange, 'emit');

    component.onStarClick(4);

    expect(component.rating).toBe(4);
    expect(component.ratingChange.emit).toHaveBeenCalledWith(4);
  });

  it('should not emit rating change when readonly', () => {
    component.readonly = true;
    spyOn(component.ratingChange, 'emit');

    component.onStarClick(4);

    expect(component.ratingChange.emit).not.toHaveBeenCalled();
  });

  it('should update hovered rating on mouse enter', () => {
    component.readonly = false;
    component.onStarHover(4);

    expect(component.hoveredRating).toBe(4);
  });

  it('should clear hovered rating on mouse leave', () => {
    component.readonly = false;
    component.hoveredRating = 4;
    component.onStarLeave();

    expect(component.hoveredRating).toBe(0);
  });

  it('should handle keyboard navigation', () => {
    component.readonly = false;
    spyOn(component.ratingChange, 'emit');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event, 4);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.rating).toBe(4);
    expect(component.ratingChange.emit).toHaveBeenCalledWith(4);
  });

  it('should apply correct size class', () => {
    component.size = 'large';
    expect(component.getSizeClass()).toBe('star-rating-large');

    component.size = 'small';
    expect(component.getSizeClass()).toBe('star-rating-small');
  });
});
