import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoUploadComponent } from './photo-upload.component';

describe('PhotoUploadComponent', () => {
  let component: PhotoUploadComponent;
  let fixture: ComponentFixture<PhotoUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoUploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate file type', () => {
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    const error = (component as any).validateFile(invalidFile);
    expect(error).toContain('Invalid file type');
  });

  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
    const error = (component as any).validateFile(largeFile);
    expect(error).toContain('File too large');
  });

  it('should accept valid file', () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const error = (component as any).validateFile(validFile);
    expect(error).toBeNull();
  });

  it('should remove photo at index', () => {
    component.photos = [
      { file: new File([''], 'test1.jpg'), preview: '' },
      { file: new File([''], 'test2.jpg'), preview: '' }
    ];
    spyOn(component.photosChange, 'emit');

    component.removePhoto(0);

    expect(component.photos.length).toBe(1);
    expect(component.photos[0].file.name).toBe('test2.jpg');
    expect(component.photosChange.emit).toHaveBeenCalled();
  });

  it('should clear all photos', () => {
    component.photos = [
      { file: new File([''], 'test1.jpg'), preview: '' },
      { file: new File([''], 'test2.jpg'), preview: '' }
    ];
    spyOn(component.photosChange, 'emit');

    component.clearAll();

    expect(component.photos.length).toBe(0);
    expect(component.photosChange.emit).toHaveBeenCalled();
  });

  it('should check if more photos can be added', () => {
    component.maxPhotos = 5;
    component.photos = [];
    expect(component.canAddMore()).toBe(true);

    component.photos = new Array(5).fill({ file: new File([''], 'test.jpg'), preview: '' });
    expect(component.canAddMore()).toBe(false);
  });

  it('should format file size correctly', () => {
    expect(component.getFileSize(512)).toBe('512 B');
    expect(component.getFileSize(1536)).toBe('1.5 KB');
    expect(component.getFileSize(2097152)).toBe('2.0 MB');
  });

  it('should handle drag over event', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging).toBe(true);
  });

  it('should handle drag leave event', () => {
    component.isDragging = true;
    const event = new DragEvent('dragleave');
    spyOn(event, 'preventDefault');

    component.onDragLeave(event);

    expect(component.isDragging).toBe(false);
  });
});
