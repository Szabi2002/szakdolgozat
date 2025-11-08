# Development Checklist - Component Implementation

## Phase 1: Admin Routes Management

### Routes List Component
- [ ] Create component: `admin/routes/routes-list.component.ts`
- [ ] Create template: `routes-list.component.html`
- [ ] Create styles: `routes-list.component.scss`
- [ ] Implement MatTable with columns: id, name, type, active, actions
- [ ] Add MatSort for sorting
- [ ] Add MatPaginator for pagination (10 items/page)
- [ ] Add search input with debounce (300ms)
- [ ] Connect to RouteService API (GET /api/routes)
- [ ] Implement Edit button (open dialog)
- [ ] Implement Delete button (confirmation dialog)
- [ ] Test responsive layout (mobile/desktop)

### Route Form Dialog Component
- [ ] Create component: `admin/routes/routes-form-dialog.component.ts`
- [ ] Form fields: number, name, type (select), startStop, endStop
- [ ] Form validation (required fields, unique number)
- [ ] Create mode: POST /api/routes
- [ ] Edit mode: PUT /api/routes/:id
- [ ] Success/error toast notifications
- [ ] Test form inputs and validation

## Phase 2: Admin Stops Management

### Stops List Component
- [ ] Create component: `admin/stops/stops-list.component.ts`
- [ ] Create split view layout (60% table, 40% map)
- [ ] Implement MatTable with columns: id, name, address, coordinates
- [ ] Add MatSort for sorting
- [ ] Add MatPaginator for pagination
- [ ] Add search input (name/address)
- [ ] Connect to StopService API (GET /api/stops)
- [ ] Implement row click to map marker highlight
- [ ] Implement Edit button (open dialog)
- [ ] Implement Delete button (confirmation)
- [ ] Test responsive: tablet stack, mobile single column

### Stops Map Component
- [ ] Create component: `admin/stops/stops-map.component.ts`
- [ ] Initialize Leaflet map
- [ ] Add OpenStreetMap tiles
- [ ] Create custom marker icons (SVG, colored by type)
- [ ] Add markers from stops array
- [ ] Implement popup on marker click
- [ ] Implement marker drag to update coordinates
- [ ] Highlight marker when row selected in table
- [ ] Test map interactions (zoom, pan, drag)

### Stop Form Dialog Component
- [ ] Create component: `admin/stops/stops-form-dialog.component.ts`
- [ ] Form fields: name, latitude, longitude, address, city, type
- [ ] Map click to populate coordinates
- [ ] Coordinate validation (valid lat/lng)
- [ ] Create mode: POST /api/stops
- [ ] Edit mode: PUT /api/stops/:id
- [ ] Test coordinate input and map integration

## Phase 3: Route-Stops Assignment

### Route-Stops Drag-Drop Component
- [ ] Create component: `admin/routes/route-stops-assign.component.ts`
- [ ] Implement CDK DropList for drag-drop
- [ ] Left list: Available stops (all stops not in route)
- [ ] Right list: Assigned stops (ordered)
- [ ] Drag from left to right: add to route
- [ ] Drag within right list: reorder
- [ ] Remove button on right list items
- [ ] Save button: PUT /api/routes/:id/stops
- [ ] Show progress counter (X / total stops)
- [ ] Test drag-drop on mobile (touch events)

## Phase 4: Public Stop Details Page

### Stop Details Component
- [ ] Create component: `public/stop-details/stop-details.component.ts`
- [ ] Get stop ID from route params
- [ ] Load stop data: GET /api/stops/:id
- [ ] Load routes at stop: GET /api/stops/:id/routes
- [ ] Desktop layout: 60% map + 40% info
- [ ] Mobile layout: Stack (map top, info bottom)
- [ ] Implement responsive grid/flex layout
- [ ] Implement back navigation button
- [ ] Test responsive at breakpoints

### Stop Details Info Card
- [ ] Create component: `public/stop-details/stop-info-card.component.ts`
- [ ] Display stop name, address, coordinates
- [ ] Copy address button (clipboard)
- [ ] Open in maps link
- [ ] Show stop type indicator

### Routes at Stop List
- [ ] Create component: `public/stop-details/routes-list.component.ts`
- [ ] Display all routes serving this stop
- [ ] Route card: type badge (colored), number, name, next arrival
- [ ] Show schedule link (if available)
- [ ] Responsive: single column on mobile

### Stop Details Map Component
- [ ] Reuse stops-map.component
- [ ] Show only single marker (current stop)
- [ ] Zoom to stop location
- [ ] Disable drag (read-only)

## Phase 5: Styling & Responsive Design

### SCSS Variables & Mixins
- [ ] Create file: `frontend/src/styles/variables.scss`
- [ ] Define color variables (primary, status, transport, neutral)
- [ ] Define spacing tokens (xs, sm, md, lg, xl, 2xl)
- [ ] Define typography scale (font sizes, weights)
- [ ] Create responsive mixins (mobile, tablet, desktop)
- [ ] Create utility classes (flex, grid, margins, padding)

### Responsive Design Testing
- [ ] Test all components at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1024px (desktop)
- [ ] Test at 1920px (large desktop)
- [ ] Verify touch targets (44x44px min)
- [ ] Test orientation changes
- [ ] Check scroll behavior on all pages

### Material Theme Integration
- [ ] Import Angular Material theme
- [ ] Apply custom color palette
- [ ] Override Material component styles
- [ ] Test light theme
- [ ] Prepare dark theme (future)

## Phase 6: Accessibility & Testing

### Accessibility Checklist
- [ ] All inputs have associated labels (for/id)
- [ ] All buttons have aria-labels (icon buttons)
- [ ] Modal focus trap (focus stays inside modal)
- [ ] Dialog: Escape key closes
- [ ] Keyboard navigation: Tab through all elements
- [ ] Focus visible: 2px outline on all interactive elements
- [ ] Color contrast: Test with WCAG contrast checker
- [ ] Screen reader: Test with NVDA/JAWS
- [ ] Map: Keyboard alternative to marker click
- [ ] Drag-drop: Provide keyboard alternative

### Unit Tests (Jasmine/Karma)
- [ ] RoutesListComponent: filter, sort, pagination
- [ ] RoutesFormComponent: validation, API calls
- [ ] StopsListComponent: row selection, map interaction
- [ ] RouteStopsAssignComponent: drag-drop logic, save API
- [ ] StopDetailsComponent: data loading, responsive layout

### E2E Tests (Playwright)
- [ ] Create admin routes: Add, edit, delete
- [ ] Search and filter routes
- [ ] Create admin stop: Add, edit, delete
- [ ] Assign stops to route (drag-drop)
- [ ] View public stop details
- [ ] Check responsive layout on mobile

## Implementation Structure

Admin module:
- admin.module.ts (feature module)
- admin.routes.ts (routing)
- routes/ (list, form, assignment)
- stops/ (list, map, form)
- services/ (route.service, stop.service)

Public module:
- public.module.ts
- public.routes.ts
- stop-details/ (main, info, routes, map)
- services/ (public-stop.service)

## Key Services

RouteService methods:
- getRoutes(params)
- getRoute(id)
- createRoute(data)
- updateRoute(id, data)
- deleteRoute(id)
- assignStops(routeId, stopIds)

StopService methods:
- getStops(params)
- getStop(id)
- createStop(data)
- updateStop(id, data)
- deleteStop(id)
- getRoutesAtStop(stopId)

## Performance Checklist

- [ ] Use OnPush change detection for table rows
- [ ] Implement virtual scroll for large lists
- [ ] Lazy load admin module
- [ ] Optimize SVG marker icons
- [ ] Implement image lazy loading
- [ ] Cache API responses
- [ ] Debounce search input (300ms)

## Deployment Checklist

- [ ] Build production: ng build --configuration production
- [ ] Test in production build
- [ ] Check bundle size
- [ ] Run accessibility audit (Lighthouse)
- [ ] Check performance metrics
- [ ] Verify API endpoints work in production
- [ ] Test on real mobile devices
- [ ] Check touch interactions on mobile

---

Updated: 2025-11-08
Version: 1.0 - Implementation Ready
