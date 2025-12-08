import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import mapboxgl from 'mapbox-gl';
import { environment } from '@environments/environment';
import { Route, RouteStep } from '@core/services/planner.service';

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  type?: 'bus' | 'tram' | 'metro' | 'start' | 'end' | 'transfer';
  data?: unknown;
}

export interface RoutePolyline {
  id: string;
  color: string;
  stops: { lat: number; lng: number }[];
  label?: string;
  type?: 'bus' | 'tram' | 'metro';
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  @Input() markers: MapMarker[] = [];
  @Input() routes: RoutePolyline[] = [];
  @Input() center?: { lat: number; lng: number };
  @Input() zoom?: number;
  @Input() clickable = false;
  @Output() markerClick = new EventEmitter<MapMarker>();
  @Output() mapClick = new EventEmitter<mapboxgl.LngLat>();

  map?: mapboxgl.Map;
  mapboxMarkers: mapboxgl.Marker[] = [];

  // UX Design System Colors (from Task 1.1)
  private readonly ROUTE_COLORS = {
    bus: '#4CAF50',      // Material Green 500
    tram: '#FFC107',     // Material Amber 500
    metro: '#F44336',    // Material Red 500
    walking: '#2196F3'   // Material Blue 500
  };

  ngOnInit() {
    // Mapbox access token beállítása
    (mapboxgl as any).accessToken = environment.map.accessToken;
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markers'] && !changes['markers'].firstChange) {
      this.updateMarkers();
    }
    if (changes['routes'] && !changes['routes'].firstChange) {
      this.updatePolylines();
    }
  }

  ngOnDestroy() {
    this.clearMarkers();
    this.map?.remove();
  }

  private initializeMap() {
    const centerCoords = this.center || environment.map.defaultCenter;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: environment.map.style,
      center: [centerCoords.lng, centerCoords.lat], // Mapbox használ [lng, lat] sorrendet!
      zoom: this.zoom || environment.map.defaultZoom,
      maxZoom: environment.map.maxZoom
    });

    // Navigation controls (zoom in/out buttons)
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Map load event
    this.map.on('load', () => {
      this.updateMarkers();
      this.updatePolylines();
    });

    // Map click event
    if (this.clickable) {
      this.map.on('click', (e) => {
        this.mapClick.emit(e.lngLat);
      });
    }
  }

  private updateMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    // Add new markers
    this.markers.forEach(marker => {
      // Skip route markers (start, end, transfer) - handled by drawRoute
      if (marker.type === 'start' || marker.type === 'end' || marker.type === 'transfer') {
        return;
      }

      const el = this.createMarkerElement(marker);

      const mbMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<b>${marker.title}</b>`)
        )
        .addTo(this.map!);

      // Click event
      el.addEventListener('click', () => {
        this.markerClick.emit(marker);
      });

      this.mapboxMarkers.push(mbMarker);
    });

    // Fit bounds if we have markers
    if (this.markers.length > 0) {
      const validMarkers = this.markers.filter(m =>
        m.type !== 'start' && m.type !== 'end' && m.type !== 'transfer'
      );
      if (validMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validMarkers.forEach(m => bounds.extend([m.lng, m.lat]));
        this.map!.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  }

  private createMarkerElement(marker: MapMarker): HTMLElement {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.backgroundSize = 'contain';
    el.style.cursor = 'pointer';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';

    // Set icon based on type
    const iconUrls: Record<string, string> = {
      bus: 'assets/icons/bus-marker.svg',
      tram: 'assets/icons/tram-marker.svg',
      metro: 'assets/icons/metro-marker.svg',
      default: 'assets/icons/bus-marker.svg'
    };

    const iconUrl = marker.type && iconUrls[marker.type] ? iconUrls[marker.type] : iconUrls['default'];
    el.style.backgroundImage = `url(${iconUrl})`;

    return el;
  }

  private clearMarkers() {
    this.mapboxMarkers.forEach(m => m.remove());
    this.mapboxMarkers = [];
  }

  private updatePolylines() {
    if (!this.map || !this.map.isStyleLoaded()) return;

    // Remove existing route layers
    this.clearPolylines();

    // Add new routes
    this.routes.forEach((route, index) => {
      const sourceId = `route-${index}`;
      const layerId = `route-layer-${index}`;

      const coordinates = route.stops.map(stop => [stop.lng, stop.lat]);

      // Add source
      this.map!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Add layer
      this.map!.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': route.color || this.getDefaultRouteColor(route.type),
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add click event to route line
      this.map!.on('click', layerId, (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<b>${route.label || 'Route ' + route.id}</b>`)
          .addTo(this.map!);
      });
    });
  }

  private clearPolylines() {
    if (!this.map) return;

    // Remove all route layers and sources
    const style = this.map.getStyle();
    if (style && style.layers) {
      style.layers.forEach(layer => {
        if (layer.id.startsWith('route-layer-') || layer.id.startsWith('step-layer-')) {
          if (this.map!.getLayer(layer.id)) {
            this.map!.removeLayer(layer.id);
          }
        }
      });
    }

    if (style && style.sources) {
      Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('route-') || sourceId.startsWith('step-')) {
          if (this.map!.getSource(sourceId)) {
            this.map!.removeSource(sourceId);
          }
        }
      });
    }
  }

  private getDefaultRouteColor(type?: 'bus' | 'tram' | 'metro'): string {
    if (type && this.ROUTE_COLORS[type]) {
      return this.ROUTE_COLORS[type];
    }
    return this.ROUTE_COLORS.bus;
  }

  // Public methods for external control
  setCenter(lat: number, lng: number, zoom?: number) {
    if (this.map) {
      this.map.flyTo({
        center: [lng, lat],
        zoom: zoom || this.map.getZoom()
      });
    }
  }

  fitBounds(markers: MapMarker[]) {
    if (this.map && markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(m => bounds.extend([m.lng, m.lat]));
      this.map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }

  // ============================================================================
  // Route Visualization (Task 3.1 - Sprint 5-6)
  // ============================================================================

  /**
   * Draw a complete route with multimodal support (transit + walking)
   * Implements UX Design System specifications from Task 1.1
   *
   * @param route Route object from planner service
   */
  drawRoute(route: Route): void {
    if (!this.map) {
      // Map not initialized yet
      return;
    }

    // Clear previous route visualization
    this.clearRoute();

    // Draw each step
    route.steps.forEach((step, index) => {
      this.drawRouteStep(step, index);

      // Add marker for start point (first step only)
      if (index === 0) {
        this.addRouteMarker(step.start_stop, 'start');
      }

      // Add marker for end point or transfer point
      const isLastStep = index === route.steps.length - 1;
      if (isLastStep) {
        this.addRouteMarker(step.end_stop, 'end');
      } else {
        // Check if next step uses different route (transfer)
        const nextStep = route.steps[index + 1];
        if (this.isTransfer(step, nextStep)) {
          this.addRouteMarker(step.end_stop, 'transfer');
        }
      }
    });

    // Zoom to fit entire route
    this.fitRouteToView(route);
  }

  /**
   * Draw a single route step (transit or walking segment)
   * Uses all intermediate stops for accurate route visualization
   */
  private drawRouteStep(step: RouteStep, index: number): void {
    const sourceId = `step-${index}`;
    const layerId = `step-layer-${index}`;

    // USE ALL STOPS IN THE STEP for accurate route path visualization
    // Backend returns all intermediate stops in step.stops[] array
    let coordinates: number[][];

    if (step.stops && step.stops.length > 0) {
      // Use all intermediate stops to follow actual route path (not straight line)
      coordinates = step.stops.map(stop => [stop.longitude, stop.latitude]);
    } else {
      // Fallback to straight line if stops array is empty (shouldn't happen for transit)
      // This is typically only used for walking segments
      coordinates = [
        [step.start_stop.longitude, step.start_stop.latitude],
        [step.end_stop.longitude, step.end_stop.latitude]
      ];
    }

    this.map!.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    this.map!.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': this.getStepColor(step),
        'line-width': step.type === 'walking' ? 4 : 6,
        'line-opacity': 0.8,
        'line-dasharray': step.type === 'walking' ? [2, 2] : [1, 0]
      }
    });

    // Add popup on click
    this.map!.on('click', layerId, (e) => {
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(this.createStepPopupContent(step))
        .addTo(this.map!);
    });
  }

  /**
   * Get color for route step based on type and vehicle
   * Follows UX Design System from Task 1.1
   */
  private getStepColor(step: RouteStep): string {
    if (step.type === 'walking') {
      return this.ROUTE_COLORS.walking;
    }

    switch (step.vehicle_type) {
      case 'bus': return this.ROUTE_COLORS.bus;
      case 'tram': return this.ROUTE_COLORS.tram;
      case 'metro': return this.ROUTE_COLORS.metro;
      default: return '#757575'; // Grey for unknown
    }
  }

  /**
   * Create HTML content for step popup
   */
  private createStepPopupContent(step: RouteStep): string {
    if (step.type === 'walking') {
      return `
        <div class="route-segment-popup">
          <h4>🚶 Gyaloglás</h4>
          <p><strong>Távolság:</strong> ${step.distance}m</p>
          <p><strong>Idő:</strong> ~${step.duration} perc</p>
        </div>
      `;
    }

    const vehicleIcon = step.vehicle_type === 'bus' ? '🚌' :
                       step.vehicle_type === 'tram' ? '🚋' : '🚇';

    return `
      <div class="route-segment-popup">
        <h4>${vehicleIcon} ${step.route_number || ''} ${step.route_name || ''}</h4>
        <p><strong>Megállók száma:</strong> ${step.stop_count}</p>
        <p><strong>Utazási idő:</strong> ~${step.duration} perc</p>
      </div>
    `;
  }

  /**
   * Add route marker (start, end, or transfer point)
   */
  private addRouteMarker(stop: { name: string; longitude: number; latitude: number; description?: string | null }, type: 'start' | 'end' | 'transfer'): void {
    const el = this.createRouteMarkerElement(type);

    const marker = new mapboxgl.Marker(el)
      .setLngLat([stop.longitude, stop.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(this.createMarkerPopupContent(stop, type))
      )
      .addTo(this.map!);

    this.mapboxMarkers.push(marker);
  }

  /**
   * Create custom element for route markers
   */
  private createRouteMarkerElement(type: 'start' | 'end' | 'transfer'): HTMLElement {
    const colors = {
      start: '#0D47A1',    // Dark Blue
      end: '#B71C1C',      // Dark Red
      transfer: '#F57C00'  // Orange 700
    };

    const labels = {
      start: 'A',
      end: 'B',
      transfer: '⇄'
    };

    const el = document.createElement('div');
    el.style.backgroundColor = colors[type];
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '16px';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.textContent = labels[type];

    return el;
  }

  /**
   * Create HTML content for marker popup
   */
  private createMarkerPopupContent(stop: { name: string; description?: string | null }, type: 'start' | 'end' | 'transfer'): string {
    const titles = {
      start: '📍 Indulás',
      end: '🎯 Érkezés',
      transfer: '🔄 Átszállás'
    };

    return `
      <div class="marker-popup">
        <h4>${titles[type]}</h4>
        <p><strong>${stop.name}</strong></p>
        ${stop.description ? `<p>${stop.description}</p>` : ''}
      </div>
    `;
  }

  /**
   * Check if there's a transfer between two steps
   */
  private isTransfer(currentStep: RouteStep, nextStep: RouteStep): boolean {
    // Transfer if route changes or switching from transit to walking
    if (currentStep.type === 'transit' && nextStep.type === 'transit') {
      return currentStep.route_id !== nextStep.route_id;
    }
    return false;
  }

  /**
   * Clear route visualization from map
   */
  clearRoute(): void {
    // Clear polylines
    this.clearPolylines();

    // Clear route markers
    this.clearMarkers();
  }

  /**
   * Fit map view to show entire route
   */
  private fitRouteToView(route: Route): void {
    if (!this.map) return;

    const bounds = new mapboxgl.LngLatBounds();
    route.steps.forEach(step => {
      bounds.extend([step.start_stop.longitude, step.start_stop.latitude]);
      bounds.extend([step.end_stop.longitude, step.end_stop.latitude]);
    });

    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 16,
      duration: 500
    });
  }
}
