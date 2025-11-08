# Implementation Guide - Admin & Public Pages

## Quick Start

### Admin Module Structure
```
frontend/src/app/features/admin/
├── admin.module.ts          # Feature module
├── admin.routes.ts          # Route definitions
├── layouts/
│   └── admin-layout/        # Admin shell layout
├── routes/
│   ├── routes-list/         # Routes CRUD
│   ├── routes-form/         # Route form dialog
│   └── route-stops-assign/  # Drag-and-drop assignment
├── stops/
│   ├── stops-list/          # Stops CRUD + map
│   ├── stops-form/          # Stop form dialog
│   └── stops-map/           # Leaflet map component
└── shared/
    ├── admin-header/        # Admin header
    └── admin-sidebar/       # Sidebar navigation
```

### Public Module Structure
```
frontend/src/app/features/public/
├── public.module.ts
├── public.routes.ts
├── stop-details/
│   ├── stop-details.component.ts      # Main page
│   ├── stop-details-info/             # Info card
│   ├── stop-details-map/              # Leaflet map
│   └── route-list-panel/              # Routes at stop
└── shared/
    └── public-header/       # Public header
```

## Key Components

### 1. Routes Management Table
**File**: `frontend/src/app/features/admin/routes/routes-list/routes-list.component.ts`

```typescript
// Key features:
// - MatTableDataSource with server-side pagination
// - matSort for column sorting
// - matInput with live filter (debounce 300ms)
// - Action buttons: Edit, Delete
// - Modal dialog for CRUD (MatDialog)
```

### 2. Stops Management with Map
**File**: `frontend/src/app/features/admin/stops/stops-list/stops-list.component.ts`

```typescript
// Layout: Split view (60/40)
// Left: Table similar to routes
// Right: Leaflet map with markers
// Interaction: Click row → marker highlight
//              Click marker → row select
//              Marker drag → update coordinates
```

### 3. Route-Stops Drag-and-Drop
**File**: `frontend/src/app/features/admin/routes/route-stops-assign/`

```typescript
// Uses cdkDropList (Angular CDK Drag-Drop)
// Two lists: Available / Assigned
// Drag from left → right (add)
// Drag in right → reorder
// Click remove button → back to left
// Save → PUT API with order array
```

### 4. Stop Details Public Page
**File**: `frontend/src/app/features/public/stop-details/`

```typescript
// Top: Map with single marker
// Bottom: Info card + routes list
// Responsive: Stack on mobile
// Routes show schedules (if API available)
```

## Design System Implementation

### SCSS Variables
**File**: `frontend/src/styles/variables.scss`

```scss
// Colors
$primary: #1976D2;
$primary-dark: #1565C0;
$primary-light: #E3F2FD;

$success: #4CAF50;
$error: #F44336;
$warning: #FF9800;

// Transport colors
$bus-color: #FF5722;
$tram-color: #FFC107;
$metro-color: #3F51B5;

// Neutral
$text-dark: #212121;
$text-light: #757575;
$border: #BDBDBD;
$disabled: #EEEEEE;

// Spacing (8px base)
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
```

### Component Shared Styles
**File**: `frontend/src/styles/components.scss`

```scss
// Buttons
.btn-primary { }
.btn-secondary { }
.btn-danger { }

// Cards
.card { }
.card-header { }
.card-body { }

// Forms
.form-group { }
.form-control { }
.form-error { }

// Layouts
.split-view { }
.container-responsive { }
```

## Material Components Used

| Component | Usage |
|-----------|-------|
| MatTable | Routes/Stops lists |
| MatSort | Column sorting |
| MatPaginator | Pagination |
| MatInput | Search/form fields |
| MatDialog | CRUD modals |
| MatButton | Action buttons |
| MatSelect | Dropdown filters |
| MatCard | Info cards |
| MatIcon | Icons |
| CdkDropList | Drag-and-drop |

## API Integration

### Routes Endpoints
- `GET /api/routes` - List (pagination, sort, filter)
- `GET /api/routes/:id` - Single
- `POST /api/routes` - Create
- `PUT /api/routes/:id` - Update
- `DELETE /api/routes/:id` - Delete
- `GET /api/routes/:id/stops` - Route stops
- `PUT /api/routes/:id/stops` - Assign stops

### Stops Endpoints
- `GET /api/stops` - List (pagination, sort, filter)
- `GET /api/stops/:id` - Single
- `POST /api/stops` - Create
- `PUT /api/stops/:id` - Update
- `DELETE /api/stops/:id` - Delete

## Leaflet Map Integration

### Setup
```typescript
import * as L from 'leaflet';

// In component:
map = L.map('map-container').setView([47.5, 19.0], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add markers
private addMarker(stop) {
  const marker = L.marker([stop.lat, stop.lng], {
    icon: this.getMarkerIcon(stop.type) // Custom SVG icon
  });
  marker.bindPopup(this.getPopupContent(stop));
  marker.addTo(this.map);
}
```

### Custom Icons
```typescript
private getMarkerIcon(type: string) {
  const colors = {
    'BUS': '#FF5722',
    'TRAM': '#FFC107',
    'METRO': '#3F51B5'
  };
  
  return L.divIcon({
    html: `<img src="assets/icons/${type.toLowerCase()}-marker.svg" />`,
    iconSize: [40, 56],
    iconAnchor: [20, 56],
    popupAnchor: [0, -56]
  });
}
```

## Responsive Design

### Breakpoints in SCSS
```scss
@media (max-width: 768px) {
  // Mobile: Stack layouts
  .split-view { flex-direction: column; }
  .admin-table { font-size: 12px; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  // Tablet: Adjust spacing
}

@media (min-width: 1024px) {
  // Desktop: Full features
}
```

## State Management Considerations

### Route List State
```typescript
interface RouteListState {
  items: Route[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  sort: { column: string; direction: 'asc' | 'desc' };
  filter: { search: string; type?: string };
}
```

### Stop Details State
```typescript
interface StopDetailsState {
  stop: Stop | null;
  routes: Route[];
  loading: boolean;
  mapReady: boolean;
  error: string | null;
}
```

## Performance Tips

1. **Lazy Load**: Admin module should be lazy-loaded
2. **OnPush Change Detection**: Use for tables/lists
3. **Virtual Scroll**: For large stop lists (ngx-virtual-scroll)
4. **Map Markers**: Cluster large marker sets
5. **Image Optimization**: Compress SVG icons

## Accessibility Checklist

- [ ] Form labels associated with inputs (for/id)
- [ ] ARIA labels for icon buttons
- [ ] Keyboard navigation: Tab, Enter, Escape
- [ ] Focus visible (outline) on all interactive elements
- [ ] Color contrast: 4.5:1 for text
- [ ] Modal: Focus trap inside modal
- [ ] Map: Keyboard alternative to marker click
- [ ] Loading states: aria-busy, aria-label

## Testing Strategy

### Unit Tests
- Component logic (filter, sort, validation)
- Service methods (API calls)
- Utility functions

### E2E Tests
- Create/Edit/Delete routes
- Assign stops to route (drag-drop)
- Search and filter
- Public stop details page

---

**Ready to implement!**
