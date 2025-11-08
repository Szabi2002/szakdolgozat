# Design Documentation - BUSZ App (Sprint 3-4)

Gyors es konkretan design dokumentacio az admin es publikus oldalakhoz.

## Dokumentumok

### 1. Wireframe-ek

#### admin-routes-wireframe.md
- Jaratkezelesy admin oldal
- Desktop + mobile layout ASCII art
- Keresés, rendezés, pagination
- CRUD dialog specifikacio

#### admin-stops-wireframe.md
- Megallokezelesy admin oldal
- Split view: tabla + Leaflet terkep
- Marker interakciok
- Form modal

#### route-stops-assignment-wireframe.md
- Jaratok + megallok hozzarendelese
- Drag-and-drop layout
- Ket lista: Elerheto / Hozzarendelt
- Sorrendezés + save API

#### stop-details-wireframe.md
- Publikus stop details oldal
- Desktop: 60% terkep + 40% info
- Mobile: Stack layout
- Jaratok lista az adott megallonal

### 2. Design System

design-system.md
- Color palette: Primary, Status, Transport, Neutral
- Typography: Roboto, scaling (H1-Caption)
- Spacing: 8px base unit
- Component styles: Button, Input, Card
- Icons: Material + custom SVG
- Accessibility: WCAG, focus states
- Responsive breakpoints: Mobile/Tablet/Desktop

### 3. Implementation Guide

IMPLEMENTATION_GUIDE.md
- Modul struktura (admin + public features)
- Komponensek listaja es feladatai
- SCSS valtozok es sablonok
- Material komponensek hasznalata
- Leaflet map integracio
- Custom ikonok (bus-marker.svg stb)
- API endpointok
- Responsive design SCSS
- State management javasolt struktura
- Performance tippek
- Accessibility checklist
- Testing strategia

### 4. Component Templates

COMPONENT_TEMPLATES.md
- Routes list component vaskala
- Stops map component vaskala
- Route-stops drag-drop vaskala
- Stop details public component vaskala
- Material komponensek integracioja

## SVG Marker Ikonok

Az ikonok a frontend/src/assets/icons/ mappaban:

- bus-marker.svg (piros #FF5722)
- tram-marker.svg (sarga #FFC107)
- metro-marker.svg (kek #3F51B5)

Mindegyik egy teardrop-shaped marker, amely a terkepen hasznalhato.

## Quick Start Tanucsok

1. Design system szineinek es espacement-nek hasznalata
2. Material Components (matTable, matDialog, matButton)
3. Leaflet terkep az admin stop listaban
4. CDK drag-drop a jaratok-megallok hozzarendeleshez
5. Responsive design: Mobile first, majd tablet/desktop improvements
6. Accessibility: Focus states, ARIA labels, keyboard navigation

## Szukseges Backend API-k

### Routes
- GET /api/routes (list, sort, filter, paginate)
- GET /api/routes/:id
- POST /api/routes
- PUT /api/routes/:id
- DELETE /api/routes/:id
- PUT /api/routes/:id/stops (assign stops)

### Stops
- GET /api/stops (list, sort, filter, paginate)
- GET /api/stops/:id
- POST /api/stops
- PUT /api/stops/:id
- DELETE /api/stops/:id
- GET /api/stops/:id/routes (jaratok az adott megallonal)

## Fejlesztesi sorrendet javasoltam:

1. Admin Routes Management (tábla + CRUD)
2. Admin Stops Management (táblázat + Leaflet terkep)
3. Route-Stops Assignment (drag-drop)
4. Public Stop Details (terkep + jaratok)
5. Styling + Responsive design
6. Testing + Accessibility

## Fajlok listan

Osszes design dokument:
- docs/design/admin-routes-wireframe.md
- docs/design/admin-stops-wireframe.md
- docs/design/route-stops-assignment-wireframe.md
- docs/design/stop-details-wireframe.md
- docs/design/design-system.md
- docs/design/IMPLEMENTATION_GUIDE.md
- docs/design/COMPONENT_TEMPLATES.md
- docs/design/README.md (ez a file)

SVG markerek:
- frontend/src/assets/icons/bus-marker.svg
- frontend/src/assets/icons/tram-marker.svg
- frontend/src/assets/icons/metro-marker.svg

---

**Letrehozva**: 2025-11-08
**Verzioszam**: 1.0 - Sprint 3-4 gyors design dokumentacio
