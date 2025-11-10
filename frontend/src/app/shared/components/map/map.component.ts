import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { environment } from '@environments/environment';
import { Route, RouteStep } from '@core/services/planner.service';

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  type?: 'bus' | 'tram' | 'metro' | 'start' | 'end' | 'transfer';
  data?: any;
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
  imports: [CommonModule, LeafletModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() markers: MapMarker[] = [];
  @Input() routes: RoutePolyline[] = [];
  @Input() center?: { lat: number; lng: number };
  @Input() zoom?: number;
  @Input() clickable = false;
  @Output() markerClick = new EventEmitter<MapMarker>();
  @Output() mapClick = new EventEmitter<L.LatLng>();

  options: L.MapOptions = {
    layers: [],
    zoom: 13,
    center: L.latLng(47.4979, 19.0402)
  };

  layers: L.Layer[] = [];
  map?: L.Map;

  // UX Design System Colors (from Task 1.1)
  private readonly ROUTE_COLORS = {
    bus: '#4CAF50',      // Material Green 500
    tram: '#FFC107',     // Material Amber 500
    metro: '#F44336',    // Material Red 500
    walking: '#2196F3'   // Material Blue 500
  };

  private polylineLayers: L.Polyline[] = [];
  private routeMarkersLayer?: L.LayerGroup;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  ngOnInit() {
    this.initializeMap();
    this.updateMarkers();
    this.updatePolylines();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markers'] && !changes['markers'].firstChange) {
      this.updateMarkers();
    }
    if (changes['routes'] && !changes['routes'].firstChange) {
      this.updatePolylines();
    }
  }

  ngAfterViewInit() {
    // Ensure map tiles render correctly after view initialization
    // This fixes the tile misalignment issue when map container becomes visible
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 500); // Increased from 100ms to 500ms for better reliability
  }

  ngOnDestroy() {
    this.clearPolylines();
    this.cleanupObservers();
  }

  initializeMap() {
    this.options = {
      layers: [
        L.tileLayer(environment.map.tileLayer, {
          attribution: environment.map.attribution,
          maxZoom: environment.map.maxZoom
        })
      ],
      zoom: this.zoom || environment.map.defaultZoom,
      center: L.latLng(
        this.center?.lat || environment.map.defaultCenter.lat,
        this.center?.lng || environment.map.defaultCenter.lng
      )
    };
  }

  onMapReady(map: L.Map) {
    this.map = map;

    // Fix Leaflet marker icon issue
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Fix tile alignment after map is ready
    // This ensures tiles render correctly when container dimensions are finalized
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Setup modern observers for reliable map rendering
    this.setupResizeObserver(map);
    this.setupIntersectionObserver(map);
  }

  onMapClick(event: L.LeafletMouseEvent) {
    if (this.clickable) {
      this.mapClick.emit(event.latlng);
    }
  }

  updateMarkers() {
    this.layers = this.markers.map(marker => {
      // Skip route markers (start, end, transfer) - handled by drawRoute
      if (marker.type === 'start' || marker.type === 'end' || marker.type === 'transfer') {
        return L.marker([0, 0]); // Dummy marker, will be filtered
      }

      const icon = this.getMarkerIcon(marker.type);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon });

      leafletMarker.bindPopup(`<b>${marker.title}</b>`);
      leafletMarker.on('click', () => this.markerClick.emit(marker));

      return leafletMarker;
    }).filter((_, index) => {
      const marker = this.markers[index];
      return marker.type !== 'start' && marker.type !== 'end' && marker.type !== 'transfer';
    });

    // Fit bounds if we have markers
    if (this.map && this.markers.length > 0) {
      const validMarkers = this.markers.filter(m =>
        m.type !== 'start' && m.type !== 'end' && m.type !== 'transfer'
      );
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }

  private getMarkerIcon(type?: 'bus' | 'tram' | 'metro'): L.Icon {
    const iconUrls = {
      bus: 'assets/icons/bus-marker.svg',
      tram: 'assets/icons/tram-marker.svg',
      metro: 'assets/icons/metro-marker.svg',
      default: 'assets/icons/bus-marker.svg'
    };

    return L.icon({
      iconUrl: iconUrls[type || 'default'],
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  updatePolylines() {
    if (!this.map) {
      return;
    }

    // Clear existing polylines
    this.clearPolylines();

    // Create new polylines
    this.polylineLayers = this.routes.map(route => {
      const coordinates: L.LatLngExpression[] = route.stops.map(stop => [stop.lat, stop.lng]);
      const color = route.color || this.getDefaultRouteColor(route.type);

      const polyline = L.polyline(coordinates, {
        color: color,
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
      });

      polyline.on('click', (e: L.LeafletMouseEvent) => {
        const popupContent = `
          <div class="route-popup">
            <b>${route.label || 'Route ' + route.id}</b>
            ${route.type ? `<br><span class="route-type">Type: ${this.capitalizeFirst(route.type)}</span>` : ''}
          </div>
        `;

        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(this.map!);
      });

      polyline.addTo(this.map!);
      return polyline;
    });

    // Fit bounds if we have routes
    if (this.routes.length > 0 && this.markers.length === 0) {
      this.fitRouteBounds();
    }
  }

  private clearPolylines() {
    this.polylineLayers.forEach(polyline => {
      if (this.map) {
        this.map.removeLayer(polyline);
      }
    });
    this.polylineLayers = [];
  }

  private getDefaultRouteColor(type?: 'bus' | 'tram' | 'metro'): string {
    if (type && this.ROUTE_COLORS[type]) {
      return this.ROUTE_COLORS[type];
    }
    return this.ROUTE_COLORS.bus;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private fitRouteBounds() {
    if (!this.map || this.polylineLayers.length === 0) {
      return;
    }

    const allBounds: L.LatLngBounds[] = this.polylineLayers
      .map(polyline => polyline.getBounds())
      .filter(bounds => bounds.isValid());

    if (allBounds.length > 0) {
      const combinedBounds = allBounds.reduce((acc, bounds) => {
        return acc.extend(bounds);
      }, allBounds[0]);

      this.map.fitBounds(combinedBounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  // Public methods for external control
  setCenter(lat: number, lng: number, zoom?: number) {
    if (this.map) {
      this.map.setView([lat, lng], zoom || this.map.getZoom());
    }
  }

  fitBounds(markers: MapMarker[]) {
    if (this.map && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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
      console.warn('Map not initialized yet');
      return;
    }

    // Clear previous route visualization
    this.clearRoute();

    // Create layer group for route markers
    this.routeMarkersLayer = L.layerGroup().addTo(this.map);

    // Draw each step
    route.steps.forEach((step, index) => {
      this.drawRouteStep(step);

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
    this.fitRouteToView();
  }

  /**
   * Draw a single route step (transit or walking segment)
   */
  private drawRouteStep(step: RouteStep): void {
    const coordinates: L.LatLngExpression[] = [
      [step.start_stop.latitude, step.start_stop.longitude],
      [step.end_stop.latitude, step.end_stop.longitude]
    ];

    const color = this.getStepColor(step);
    const options: L.PolylineOptions = {
      color: color,
      weight: step.type === 'walking' ? 4 : 6,
      opacity: 0.8,
      dashArray: step.type === 'walking' ? '10, 10' : undefined
    };

    const polyline = L.polyline(coordinates, options);

    // Add popup with step details
    polyline.bindPopup(this.createStepPopupContent(step));
    polyline.addTo(this.map!);
    this.polylineLayers.push(polyline);
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
  private addRouteMarker(stop: any, type: 'start' | 'end' | 'transfer'): void {
    if (!this.routeMarkersLayer) return;

    const icon = this.createRouteMarkerIcon(type);
    const marker = L.marker([stop.latitude, stop.longitude], { icon });

    const popupContent = this.createMarkerPopupContent(stop, type);
    marker.bindPopup(popupContent);

    marker.addTo(this.routeMarkersLayer);
  }

  /**
   * Create custom icon for route markers
   */
  private createRouteMarkerIcon(type: 'start' | 'end' | 'transfer'): L.DivIcon {
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

    const html = `
      <div style="
        background-color: ${colors[type]};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${labels[type]}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: 'custom-route-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  /**
   * Create HTML content for marker popup
   */
  private createMarkerPopupContent(stop: any, type: 'start' | 'end' | 'transfer'): string {
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
    if (this.routeMarkersLayer && this.map) {
      this.map.removeLayer(this.routeMarkersLayer);
      this.routeMarkersLayer = undefined;
    }
  }

  /**
   * Fit map view to show entire route
   */
  private fitRouteToView(): void {
    if (!this.map || this.polylineLayers.length === 0) {
      return;
    }

    const allBounds = this.polylineLayers
      .map(polyline => polyline.getBounds())
      .filter(bounds => bounds.isValid());

    if (allBounds.length > 0) {
      const combinedBounds = allBounds.reduce((acc, bounds) => {
        return acc.extend(bounds);
      }, allBounds[0]);

      this.map.fitBounds(combinedBounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
        duration: 0.5
      });
    }
  }

  // ============================================================================
  // Map Rendering Fixes (BUG-003 - Layout Fixes)
  // ============================================================================

  /**
   * Setup ResizeObserver to handle container size changes
   * This ensures map tiles re-render correctly when container dimensions change
   *
   * Fix for: Térkép csempék széttördelése
   */
  private setupResizeObserver(map: L.Map): void {
    const container = map.getContainer();

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only invalidate if the container has actual dimensions
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          // Use requestAnimationFrame for smooth rendering
          requestAnimationFrame(() => {
            // Check if map still exists before calling invalidateSize
            if (this.map && map.getContainer()) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Silently catch errors if map is being destroyed
              }
            }
          });
        }
      }
    });

    this.resizeObserver.observe(container);
  }

  /**
   * Setup IntersectionObserver to detect when map becomes visible
   * This handles cases where map is initially hidden (display: none, visibility: hidden)
   *
   * Fix for: Térkép renderelés amikor DOM láthatóvá válik
   */
  private setupIntersectionObserver(map: L.Map): void {
    const container = map.getContainer();

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          // Container became visible, invalidate size with a small delay
          // to ensure DOM is fully rendered
          setTimeout(() => {
            // Check if map still exists before calling invalidateSize
            if (this.map && map.getContainer()) {
              try {
                map.invalidateSize();
              } catch (e) {
                // Silently catch errors if map is being destroyed
              }
            }
          }, 100);
        }
      });
    }, {
      threshold: [0, 0.1, 0.5, 1.0] // Multiple thresholds for better detection
    });

    this.intersectionObserver.observe(container);
  }

  /**
   * Cleanup observers on component destroy
   * Prevents memory leaks
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }
}
