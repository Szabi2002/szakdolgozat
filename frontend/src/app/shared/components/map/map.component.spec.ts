import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize map after view init', () => {
    spyOn<any>(component, 'initializeMap');
    component.ngAfterViewInit();
    expect((component as any).initializeMap).toHaveBeenCalled();
  });

  it('should have correct route colors defined', () => {
    const colors = (component as any).ROUTE_COLORS;
    expect(colors.bus).toBe('#4CAF50');
    expect(colors.tram).toBe('#FFC107');
    expect(colors.metro).toBe('#F44336');
    expect(colors.walking).toBe('#2196F3');
  });

  it('should emit markerClick when marker is clicked', () => {
    spyOn(component.markerClick, 'emit');
    const mockMarker = { lat: 47.4979, lng: 19.0402, title: 'Test' };
    component.markerClick.emit(mockMarker);
    expect(component.markerClick.emit).toHaveBeenCalledWith(mockMarker);
  });

  describe('Route Color Management', () => {
    it('should return correct default color for bus type', () => {
      const color = (component as any).getDefaultRouteColor('bus');
      expect(color).toBe('#4CAF50');
    });

    it('should return correct default color for tram type', () => {
      const color = (component as any).getDefaultRouteColor('tram');
      expect(color).toBe('#FFC107');
    });

    it('should return correct default color for metro type', () => {
      const color = (component as any).getDefaultRouteColor('metro');
      expect(color).toBe('#F44336');
    });

    it('should return bus color as default when type is undefined', () => {
      const color = (component as any).getDefaultRouteColor();
      expect(color).toBe('#4CAF50');
    });
  });

  describe('Step Color Management', () => {
    it('should return walking color for walking step', () => {
      const step = { type: 'walking', vehicle_type: undefined };
      const color = (component as any).getStepColor(step);
      expect(color).toBe('#2196F3');
    });

    it('should return bus color for bus step', () => {
      const step = { type: 'transit', vehicle_type: 'bus' };
      const color = (component as any).getStepColor(step);
      expect(color).toBe('#4CAF50');
    });

    it('should return tram color for tram step', () => {
      const step = { type: 'transit', vehicle_type: 'tram' };
      const color = (component as any).getStepColor(step);
      expect(color).toBe('#FFC107');
    });

    it('should return metro color for metro step', () => {
      const step = { type: 'transit', vehicle_type: 'metro' };
      const color = (component as any).getStepColor(step);
      expect(color).toBe('#F44336');
    });

    it('should return grey for unknown vehicle type', () => {
      const step = { type: 'transit', vehicle_type: 'unknown' };
      const color = (component as any).getStepColor(step);
      expect(color).toBe('#757575');
    });
  });

  describe('Transfer Detection', () => {
    it('should detect transfer when route IDs differ', () => {
      const currentStep = { type: 'transit', route_id: '7' };
      const nextStep = { type: 'transit', route_id: '9' };
      const isTransfer = (component as any).isTransfer(currentStep, nextStep);
      expect(isTransfer).toBe(true);
    });

    it('should not detect transfer when route IDs are same', () => {
      const currentStep = { type: 'transit', route_id: '7' };
      const nextStep = { type: 'transit', route_id: '7' };
      const isTransfer = (component as any).isTransfer(currentStep, nextStep);
      expect(isTransfer).toBe(false);
    });

    it('should not detect transfer when transitioning to walking', () => {
      const currentStep = { type: 'transit', route_id: '7' };
      const nextStep = { type: 'walking', route_id: undefined };
      const isTransfer = (component as any).isTransfer(currentStep, nextStep);
      expect(isTransfer).toBe(false);
    });
  });

  describe('Clear Markers', () => {
    it('should clear all markers', () => {
      (component as any).mapboxMarkers = [
        { remove: jasmine.createSpy('remove') },
        { remove: jasmine.createSpy('remove') }
      ];

      (component as any).clearMarkers();

      expect((component as any).mapboxMarkers.length).toBe(0);
    });
  });

  describe('Popup Content Generation', () => {
    it('should create walking step popup content', () => {
      const step = {
        type: 'walking',
        distance: 500,
        duration: 6
      };
      const html = (component as any).createStepPopupContent(step);
      expect(html).toContain('Gyaloglás');
      expect(html).toContain('500m');
      expect(html).toContain('6 perc');
    });

    it('should create transit step popup content', () => {
      const step = {
        type: 'transit',
        vehicle_type: 'bus',
        route_number: '7',
        route_name: 'Bosnyák tér - Kelenföld vasútállomás',
        stop_count: 15,
        duration: 25
      };
      const html = (component as any).createStepPopupContent(step);
      expect(html).toContain('7');
      expect(html).toContain('Bosnyák tér - Kelenföld vasútállomás');
      expect(html).toContain('15');
      expect(html).toContain('25 perc');
    });

    it('should create marker popup content for start point', () => {
      const stop = { name: 'Bosnyák tér M', description: 'M2 metro station' };
      const html = (component as any).createMarkerPopupContent(stop, 'start');
      expect(html).toContain('Indulás');
      expect(html).toContain('Bosnyák tér M');
      expect(html).toContain('M2 metro station');
    });

    it('should create marker popup content for end point', () => {
      const stop = { name: 'Kelenföld vasútállomás' };
      const html = (component as any).createMarkerPopupContent(stop, 'end');
      expect(html).toContain('Érkezés');
      expect(html).toContain('Kelenföld vasútállomás');
    });

    it('should create marker popup content for transfer point', () => {
      const stop = { name: 'Blaha Lujza tér M' };
      const html = (component as any).createMarkerPopupContent(stop, 'transfer');
      expect(html).toContain('Átszállás');
      expect(html).toContain('Blaha Lujza tér M');
    });
  });

  describe('Marker Element Creation', () => {
    it('should create start marker element with correct styling', () => {
      const el = (component as any).createRouteMarkerElement('start');
      expect(el.style.backgroundColor).toBe('rgb(13, 71, 161)');
      expect(el.textContent).toBe('A');
      expect(el.style.borderRadius).toBe('50%');
    });

    it('should create end marker element with correct styling', () => {
      const el = (component as any).createRouteMarkerElement('end');
      expect(el.style.backgroundColor).toBe('rgb(183, 28, 28)');
      expect(el.textContent).toBe('B');
    });

    it('should create transfer marker element with correct styling', () => {
      const el = (component as any).createRouteMarkerElement('transfer');
      expect(el.style.backgroundColor).toBe('rgb(245, 124, 0)');
      expect(el.textContent).toBe('⇄');
    });
  });

  describe('Custom Marker Element', () => {
    it('should create bus marker element', () => {
      const marker = { lat: 47.4979, lng: 19.0402, title: 'Bus Stop', type: 'bus' as const };
      const el = (component as any).createMarkerElement(marker);
      expect(el.style.backgroundImage).toContain('bus-marker.svg');
      expect(el.style.width).toBe('32px');
      expect(el.style.height).toBe('32px');
    });

    it('should create tram marker element', () => {
      const marker = { lat: 47.4979, lng: 19.0402, title: 'Tram Stop', type: 'tram' as const };
      const el = (component as any).createMarkerElement(marker);
      expect(el.style.backgroundImage).toContain('tram-marker.svg');
    });

    it('should create metro marker element', () => {
      const marker = { lat: 47.4979, lng: 19.0402, title: 'Metro Station', type: 'metro' as const };
      const el = (component as any).createMarkerElement(marker);
      expect(el.style.backgroundImage).toContain('metro-marker.svg');
    });

    it('should use default marker for unknown type', () => {
      const marker = { lat: 47.4979, lng: 19.0402, title: 'Stop' };
      const el = (component as any).createMarkerElement(marker);
      expect(el.style.backgroundImage).toContain('bus-marker.svg');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup markers on destroy', () => {
      spyOn<any>(component, 'clearMarkers');
      component.ngOnDestroy();
      expect((component as any).clearMarkers).toHaveBeenCalled();
    });

    it('should remove map on destroy', () => {
      const mockMap = { remove: jasmine.createSpy('remove') };
      (component as any).map = mockMap;
      component.ngOnDestroy();
      expect(mockMap.remove).toHaveBeenCalled();
    });
  });

  describe('Input Changes', () => {
    it('should update markers when markers input changes', () => {
      spyOn<any>(component, 'updateMarkers');
      const changes = {
        markers: {
          currentValue: [{ lat: 47.4979, lng: 19.0402, title: 'Test' }],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      };
      component.ngOnChanges(changes);
      expect((component as any).updateMarkers).toHaveBeenCalled();
    });

    it('should update routes when routes input changes', () => {
      spyOn<any>(component, 'updatePolylines');
      const changes = {
        routes: {
          currentValue: [{ id: '1', color: '#FF0000', stops: [] }],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      };
      component.ngOnChanges(changes);
      expect((component as any).updatePolylines).toHaveBeenCalled();
    });

    it('should not update on first change', () => {
      spyOn<any>(component, 'updateMarkers');
      spyOn<any>(component, 'updatePolylines');
      const changes = {
        markers: {
          currentValue: [],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      };
      component.ngOnChanges(changes);
      expect((component as any).updateMarkers).not.toHaveBeenCalled();
      expect((component as any).updatePolylines).not.toHaveBeenCalled();
    });
  });

  describe('Route Step Polyline Visualization', () => {
    it('should use all intermediate stops when stops array is provided', () => {
      const mockStop1 = { id: '1', name: 'Stop 1', latitude: 47.5, longitude: 19.0, type: 'bus' as const, is_accessible: true, description: null };
      const mockStop2 = { id: '2', name: 'Stop 2', latitude: 47.51, longitude: 19.01, type: 'bus' as const, is_accessible: true, description: null };
      const mockStop3 = { id: '3', name: 'Stop 3', latitude: 47.52, longitude: 19.02, type: 'bus' as const, is_accessible: true, description: null };

      const mockStep = {
        type: 'transit' as const,
        start_stop: mockStop1,
        end_stop: mockStop3,
        route_id: '7',
        route_number: '7',
        route_name: 'Test Route',
        vehicle_type: 'bus' as const,
        duration: 15,
        stop_count: 3,
        stops: [mockStop1, mockStop2, mockStop3]
      };

      const mockMap = {
        addSource: jasmine.createSpy('addSource'),
        addLayer: jasmine.createSpy('addLayer'),
        on: jasmine.createSpy('on'),
        isStyleLoaded: jasmine.createSpy('isStyleLoaded').and.returnValue(true),
        getStyle: jasmine.createSpy('getStyle').and.returnValue({ layers: [], sources: {} }),
        getSource: jasmine.createSpy('getSource'),
        getLayer: jasmine.createSpy('getLayer'),
        remove: jasmine.createSpy('remove')
      };

      (component as any).map = mockMap;

      // Call the private method
      (component as any).drawRouteStep(mockStep, 0);

      // Verify addSource was called with all 3 stops' coordinates
      expect(mockMap.addSource).toHaveBeenCalled();
      const addSourceCall = mockMap.addSource.calls.first();
      const sourceData = addSourceCall.args[1];

      expect(sourceData.data.geometry.type).toBe('LineString');
      expect(sourceData.data.geometry.coordinates.length).toBe(3);
      expect(sourceData.data.geometry.coordinates[0]).toEqual([19.0, 47.5]);
      expect(sourceData.data.geometry.coordinates[1]).toEqual([19.01, 47.51]);
      expect(sourceData.data.geometry.coordinates[2]).toEqual([19.02, 47.52]);
    });

    it('should fallback to straight line when stops array is empty', () => {
      const mockStop1 = { id: '1', name: 'Stop 1', latitude: 47.5, longitude: 19.0, type: 'bus' as const, is_accessible: true, description: null };
      const mockStop2 = { id: '2', name: 'Stop 2', latitude: 47.52, longitude: 19.02, type: 'bus' as const, is_accessible: true, description: null };

      const mockStep = {
        type: 'walking' as const,
        start_stop: mockStop1,
        end_stop: mockStop2,
        duration: 5,
        stop_count: 2,
        distance: 300,
        stops: [] // Empty stops array
      };

      const mockMap = {
        addSource: jasmine.createSpy('addSource'),
        addLayer: jasmine.createSpy('addLayer'),
        on: jasmine.createSpy('on'),
        remove: jasmine.createSpy('remove')
      };

      (component as any).map = mockMap;

      // Call the private method
      (component as any).drawRouteStep(mockStep, 0);

      // Verify addSource was called with only 2 coordinates (start and end)
      expect(mockMap.addSource).toHaveBeenCalled();
      const addSourceCall = mockMap.addSource.calls.first();
      const sourceData = addSourceCall.args[1];

      expect(sourceData.data.geometry.coordinates.length).toBe(2);
      expect(sourceData.data.geometry.coordinates[0]).toEqual([19.0, 47.5]);
      expect(sourceData.data.geometry.coordinates[1]).toEqual([19.02, 47.52]);
    });

    it('should apply correct styling for transit steps', () => {
      const mockStop1 = { id: '1', name: 'Stop 1', latitude: 47.5, longitude: 19.0, type: 'bus' as const, is_accessible: true, description: null };
      const mockStop2 = { id: '2', name: 'Stop 2', latitude: 47.52, longitude: 19.02, type: 'bus' as const, is_accessible: true, description: null };

      const mockStep = {
        type: 'transit' as const,
        start_stop: mockStop1,
        end_stop: mockStop2,
        route_id: '7',
        vehicle_type: 'bus' as const,
        duration: 10,
        stop_count: 2,
        stops: [mockStop1, mockStop2]
      };

      const mockMap = {
        addSource: jasmine.createSpy('addSource'),
        addLayer: jasmine.createSpy('addLayer'),
        on: jasmine.createSpy('on'),
        remove: jasmine.createSpy('remove')
      };

      (component as any).map = mockMap;
      (component as any).drawRouteStep(mockStep, 0);

      // Verify layer styling
      expect(mockMap.addLayer).toHaveBeenCalled();
      const addLayerCall = mockMap.addLayer.calls.first();
      const layerConfig = addLayerCall.args[0];

      expect(layerConfig.paint['line-width']).toBe(6); // Transit line width
      expect(layerConfig.paint['line-opacity']).toBe(0.8);
      expect(layerConfig.paint['line-dasharray']).toEqual([1, 0]); // Solid line for transit
    });

    it('should apply correct styling for walking steps', () => {
      const mockStop1 = { id: '1', name: 'Stop 1', latitude: 47.5, longitude: 19.0, type: 'bus' as const, is_accessible: true, description: null };
      const mockStop2 = { id: '2', name: 'Stop 2', latitude: 47.52, longitude: 19.02, type: 'bus' as const, is_accessible: true, description: null };

      const mockStep = {
        type: 'walking' as const,
        start_stop: mockStop1,
        end_stop: mockStop2,
        duration: 5,
        stop_count: 2,
        distance: 300,
        stops: [mockStop1, mockStop2]
      };

      const mockMap = {
        addSource: jasmine.createSpy('addSource'),
        addLayer: jasmine.createSpy('addLayer'),
        on: jasmine.createSpy('on'),
        remove: jasmine.createSpy('remove')
      };

      (component as any).map = mockMap;
      (component as any).drawRouteStep(mockStep, 0);

      // Verify layer styling
      expect(mockMap.addLayer).toHaveBeenCalled();
      const addLayerCall = mockMap.addLayer.calls.first();
      const layerConfig = addLayerCall.args[0];

      expect(layerConfig.paint['line-width']).toBe(4); // Walking line width
      expect(layerConfig.paint['line-dasharray']).toEqual([2, 2]); // Dashed line for walking
    });
  });
});
