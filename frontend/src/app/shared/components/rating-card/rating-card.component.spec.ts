import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingCardComponent } from './rating-card.component';
import { Rating } from '../../../core/models/rating.model';

describe('RatingCardComponent', () => {
  let component: RatingCardComponent;
  let fixture: ComponentFixture<RatingCardComponent>;

  const mockRating: Rating = {
    id: '1',
    user_id: 'user1',
    route_id: 'route1',
    rating_overall: 5,
    rating_cleanliness: 5,
    rating_punctuality: 4,
    rating_driver: 5,
    rating_comfort: 4,
    comment: 'Great route! Very clean and punctual.',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    route: {
      route_number: '101',
      name: 'Downtown Express'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RatingCardComponent);
    component = fixture.componentInstance;
    component.rating = mockRating;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user name', () => {
    expect(component.getUserName()).toBe('John Doe');
  });

  it('should display anonymous for user without name', () => {
    component.rating = { ...mockRating, user: undefined };
    expect(component.getUserName()).toBe('Anonymous User');
  });

  it('should display route name', () => {
    expect(component.getRouteName()).toBe('101 - Downtown Express');
  });

  it('should truncate long comments', () => {
    const longComment = 'a'.repeat(300);
    component.rating = { ...mockRating, comment: longComment };
    expect(component.shouldTruncateComment()).toBe(true);
    expect(component.getDisplayedComment().length).toBeLessThan(longComment.length);
  });

  it('should toggle comment display', () => {
    const longComment = 'a'.repeat(300);
    component.rating = { ...mockRating, comment: longComment };
    expect(component.showFullComment).toBe(false);

    component.toggleComment();
    expect(component.showFullComment).toBe(true);

    component.toggleComment();
    expect(component.showFullComment).toBe(false);
  });

  it('should emit edit event', () => {
    spyOn(component.edit, 'emit');
    component.onEdit();
    expect(component.edit.emit).toHaveBeenCalledWith(mockRating);
  });

  it('should emit delete event', () => {
    spyOn(component.delete, 'emit');
    component.onDelete();
    expect(component.delete.emit).toHaveBeenCalledWith(mockRating);
  });

  it('should emit photo click event', () => {
    spyOn(component.photoClick, 'emit');
    const photoUrl = 'https://example.com/photo.jpg';
    component.onPhotoClick(photoUrl);
    expect(component.photoClick.emit).toHaveBeenCalledWith(photoUrl);
  });

  it('should get correct status color', () => {
    component.rating = { ...mockRating, status: 'approved' };
    expect(component.getStatusColor()).toBe('primary');

    component.rating = { ...mockRating, status: 'pending' };
    expect(component.getStatusColor()).toBe('accent');

    component.rating = { ...mockRating, status: 'rejected' };
    expect(component.getStatusColor()).toBe('warn');
  });

  it('should only allow edit for pending ratings', () => {
    component.isOwner = true;
    component.rating = { ...mockRating, status: 'pending' };
    expect(component.canEdit()).toBe(true);

    component.rating = { ...mockRating, status: 'approved' };
    expect(component.canEdit()).toBe(false);
  });

  it('should only allow delete for pending ratings', () => {
    component.isOwner = true;
    component.rating = { ...mockRating, status: 'pending' };
    expect(component.canDelete()).toBe(true);

    component.rating = { ...mockRating, status: 'approved' };
    expect(component.canDelete()).toBe(false);
  });

  it('should format date correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const formatted = component.getFormattedDate(oneHourAgo.toISOString());
    expect(formatted).toContain('hour');
  });
});
