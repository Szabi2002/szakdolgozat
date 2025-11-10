import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent, RoutePolyline } from './map.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent, LeafletModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default options', () => {
    expect(component.options).toBeDefined();
    expect(component.options.zoom).toBe(13);
    expect(component.layers).toEqual([]);
  });

  it('should call invalidateSize after view initialization', (done) => {
    const mockMap = L.map(document.createElement('div'));
    component.onMapReady(mockMap);

    spyOn(mockMap, 'invalidateSize');
    component.ngAfterViewInit();

    setTimeout(() => {
      expect(mockMap.invalidateSize).toHaveBeenCalled();
      done();
    }, 600); // Increased from 150ms to 600ms to match new 500ms timeout
  });

  it('should call invalidateSize after map is ready', (done) => {
    const mockMap = L.map(document.createElement('div'));
    spyOn(mockMap, 'invalidateSize');

    component.onMapReady(mockMap);

    setTimeout(() => {
      expect(mockMap.invalidateSize).toHaveBeenCalled();
      done();
    }, 250);
  });

  describe('Route Polyline Rendering', () => {
    const mockRoutes: RoutePolyline[] = [
      {
        id: '1',
        color: '#FF5722',
        type: 'bus',
        label: 'Route 7',
        stops: [
          { lat: 47.4979, lng: 19.0402 },
          { lat: 47.4950, lng: 19.0500 },
          { lat: 47.4920, lng: 19.0600 }
        ]
      },
      {
        id: '2',
        color: '#FFC107',
        type: 'tram',
        label: 'Tram 2',
        stops: [
          { lat: 47.4900, lng: 19.0400 },
          { lat: 47.4880, lng: 19.0450 }
        ]
      }
    ];

    beforeEach(() => {
      // Initialize map
      const mockMap = L.map(document.createElement('div'));
      component.onMapReady(mockMap);
    });

    it('should render polylines when routes Input changes', () => {
      component.routes = mockRoutes;
      component.ngOnChanges({
        routes: {
          currentValue: mockRoutes,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component['polylineLayers'].length).toBe(2);
      expect(component['polylineLayers'][0]).toBeInstanceOf(L.Polyline);
      expect(component['polylineLayers'][1]).toBeInstanceOf(L.Polyline);
    });

    it('should use default route color when type is provided but color is not', () => {
      const routeWithoutColor: RoutePolyline = {
        id: '3',
        color: '',
        type: 'metro',
        stops: [
          { lat: 47.5000, lng: 19.0500 },
          { lat: 47.5100, lng: 19.0600 }
        ]
      };

      component.routes = [routeWithoutColor];
      component.updatePolylines();

      const color = component['getDefaultRouteColor']('metro');
      expect(color).toBe('#F44336'); // Material Red 500
    });

    it('should attach click event to polylines and open popup', () => {
      component.routes = mockRoutes;
      component.updatePolylines();

      const polyline = component['polylineLayers'][0];
      const clickEvent = {
        latlng: L.latLng(47.4979, 19.0402)
      } as L.LeafletMouseEvent;

      spyOn(L, 'popup').and.returnValue({
        setLatLng: jasmine.createSpy('setLatLng').and.returnValue({
          setContent: jasmine.createSpy('setContent').and.returnValue({
            openOn: jasmine.createSpy('openOn')
          })
        })
      } as any);

      polyline.fire('click', clickEvent);

      expect(L.popup).toHaveBeenCalled();
    });

    it('should clear existing polylines when routes change', () => {
      component.routes = mockRoutes;
      component.updatePolylines();

      const firstPolylines = [...component['polylineLayers']];
      expect(firstPolylines.length).toBe(2);

      const newRoutes: RoutePolyline[] = [
        {
          id: '3',
          color: '#3F51B5',
          type: 'metro',
          label: 'Metro M1',
          stops: [
            { lat: 47.5000, lng: 19.0500 },
            { lat: 47.5100, lng: 19.0600 }
          ]
        }
      ];

      component.routes = newRoutes;
      component.updatePolylines();

      expect(component['polylineLayers'].length).toBe(1);
      expect(component['polylineLayers'][0]).not.toBe(firstPolylines[0]);
    });

    it('should cleanup polylines on component destroy', () => {
      component.routes = mockRoutes;
      component.updatePolylines();

      expect(component['polylineLayers'].length).toBe(2);

      component.ngOnDestroy();

      expect(component['polylineLayers'].length).toBe(0);
    });

    it('should fit bounds when only routes are present (no markers)', () => {
      component.routes = mockRoutes;
      component.markers = [];

      spyOn<any>(component, 'fitRouteBounds');
      component.updatePolylines();

      expect(component['fitRouteBounds']).toHaveBeenCalled();
    });

    it('should not fit bounds when both routes and markers are present', () => {
      component.routes = mockRoutes;
      component.markers = [
        { lat: 47.4979, lng: 19.0402, title: 'Test Marker' }
      ];

      spyOn<any>(component, 'fitRouteBounds');
      component.updatePolylines();

      expect(component['fitRouteBounds']).not.toHaveBeenCalled();
    });
  });

  describe('Route Color Management', () => {
    it('should return correct default color for bus type', () => {
      const color = component['getDefaultRouteColor']('bus');
      expect(color).toBe('#4CAF50'); // Material Green 500
    });

    it('should return correct default color for tram type', () => {
      const color = component['getDefaultRouteColor']('tram');
      expect(color).toBe('#FFC107'); // Material Amber 500
    });

    it('should return correct default color for metro type', () => {
      const color = component['getDefaultRouteColor']('metro');
      expect(color).toBe('#F44336'); // Material Red 500
    });

    it('should return bus color as default when type is undefined', () => {
      const color = component['getDefaultRouteColor']();
      expect(color).toBe('#4CAF50'); // Material Green 500
    });
  });

  describe('Utility Methods', () => {
    it('should capitalize first letter of string', () => {
      expect(component['capitalizeFirst']('bus')).toBe('Bus');
      expect(component['capitalizeFirst']('tram')).toBe('Tram');
      expect(component['capitalizeFirst']('metro')).toBe('Metro');
    });
  });

  describe('Map Rendering Fixes (BUG-003)', () => {
    let mockMap: L.Map;
    let mockContainer: HTMLDivElement;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockContainer.style.width = '500px';
      mockContainer.style.height = '400px';
      document.body.appendChild(mockContainer);
      mockMap = L.map(mockContainer);
    });

    afterEach(() => {
      // Cleanup observers before removing DOM elements
      component['cleanupObservers']();

      // Remove map
      if (mockMap) {
        mockMap.remove();
      }

      // Remove container
      if (mockContainer && mockContainer.parentNode) {
        mockContainer.parentNode.removeChild(mockContainer);
      }
    });

    it('should setup ResizeObserver when map is ready', () => {
      component.onMapReady(mockMap);
      expect(component['resizeObserver']).toBeDefined();
    });

    it('should setup IntersectionObserver when map is ready', () => {
      component.onMapReady(mockMap);
      expect(component['intersectionObserver']).toBeDefined();
    });

    it('should call invalidateSize when container is resized', (done) => {
      spyOn(mockMap, 'invalidateSize');
      component.onMapReady(mockMap);

      // Simulate resize
      mockContainer.style.width = '800px';

      // Wait for ResizeObserver to trigger
      setTimeout(() => {
        expect(mockMap.invalidateSize).toHaveBeenCalled();
        done();
      }, 300);
    });

    it('should cleanup observers on destroy', () => {
      component.onMapReady(mockMap);

      const resizeObserver = component['resizeObserver'];
      const intersectionObserver = component['intersectionObserver'];

      expect(resizeObserver).toBeDefined();
      expect(intersectionObserver).toBeDefined();

      spyOn(resizeObserver!, 'disconnect');
      spyOn(intersectionObserver!, 'disconnect');

      component.ngOnDestroy();

      expect(resizeObserver!.disconnect).toHaveBeenCalled();
      expect(intersectionObserver!.disconnect).toHaveBeenCalled();
      expect(component['resizeObserver']).toBeUndefined();
      expect(component['intersectionObserver']).toBeUndefined();
    });

    it('should handle visibility changes with IntersectionObserver', (done) => {
      spyOn(mockMap, 'invalidateSize');

      // Start hidden
      mockContainer.style.display = 'none';
      component.onMapReady(mockMap);

      // Make visible
      mockContainer.style.display = 'block';

      // Wait for IntersectionObserver to trigger
      setTimeout(() => {
        expect(mockMap.invalidateSize).toHaveBeenCalled();
        done();
      }, 300);
    });
  });
});
