# Design Documentation Index - Sprint 3-4 US-4.1

Gyors referencia az összes design dokumentumhoz.

## Wireframe-ek (ASCII Art Layout-ok)

Ezek az oldal layout-okat mutatják be, desktop és mobile nézet-ben.

### 1. Admin Routes Management
Fájl: `docs/design/admin-routes-wireframe.md`

Mit tartalmaz:
- Desktop tabla layout (ID, Név, Típus, Aktív, Műveletek)
- Mobile kártya nézet
- CRUD dialog forma (új/szerkesztés)
- Keresés, rendezés, pagination funkcionalitás
- API interakciók

Komponensek: RoutesListComponent, RouteFormDialogComponent

### 2. Admin Stops Management
Fájl: `docs/design/admin-stops-wireframe.md`

Mit tartalmaz:
- Split view layout: 60% tabla + 40% Leaflet térkép
- Marker szín kódok (piros BUS, sárga TRAM, kék METRO)
- Mobile: Tab switch (Térkép / Lista)
- Popup info megállóra
- Szerkesztés: Form + map koordináta katt

Komponensek: StopsListComponent, StopsMapComponent, StopFormDialogComponent

### 3. Route-Stops Assignment
Fájl: `docs/design/route-stops-assignment-wireframe.md`

Mit tartalmaz:
- Drag-and-drop interface (CDK DropList)
- Két lista: Elérhető / Hozzárendelt megállók
- Sorrendezés: ↑↓ nyilak
- Mobile: Szeparált tab-ok
- Save button: PUT API meghívás

Komponensek: RouteStopsAssignComponent

### 4. Public Stop Details Page
Fájl: `docs/design/stop-details-wireframe.md`

Mit tartalmaz:
- Desktop: 60% térkép (bal) + 40% info (jobb)
- Mobile: Stack layout (térkép felül)
- Stop adatok kártya
- Járatok lista a megállón
- Responsive breakpoints

Komponensek: StopDetailsComponent, StopInfoCardComponent, RoutesListComponent

## Design System

Fájl: `docs/design/design-system.md`

Teljes design rendszer egy helyen:

### Szín Paletta

**Primary Colors:**
- Primary: #1976D2 (Material Blue)
- Primary Dark: #1565C0 (Hover)
- Primary Light: #E3F2FD (Background)

**Status Colors:**
- Success: #4CAF50 (Green)
- Error: #F44336 (Red)
- Warning: #FF9800 (Orange)
- Info: #2196F3 (Blue)

**Transport Colors:**
- BUS: #FF5722 (Red/Orange)
- TRAM: #FFC107 (Yellow)
- METRO: #3F51B5 (Blue)

### Typography

- Font: Roboto, sans-serif
- Skála: H1 32px, H2 28px, H3 24px, Body 16px, Caption 12px

### Spacing

Base unit: 8px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### Accessibility

- Color contrast: WCAG AAA (21:1)
- Focus states: 2px outline
- Touch targets: 44-48px minimum
- Keyboard navigation: Full support

## Implementation Guide

Fájl: `docs/design/IMPLEMENTATION_GUIDE.md`

Technikai útmutató a fejlesztéshez:

### Modul Struktura

```
frontend/src/app/features/
├── admin/
│   ├── routes/ (List, Form, Assignment)
│   ├── stops/ (List, Map, Form)
│   └── services/
└── public/
    ├── stop-details/
    └── services/
```

### Material Components

- MatTable (lista/táblázat)
- MatSort (rendezés)
- MatPaginator (lapozás)
- MatDialog (modal forma)
- MatButton, MatIcon (UI elemek)
- CdkDropList (drag-drop)

### Leaflet Integráció

- OpenStreetMap tiles
- Custom SVG marker-ek
- Popup info szöveg
- Marker drag (edit módban)

### API Endpoints

**Routes:**
- GET /api/routes (lista + filter/sort/paginate)
- POST /api/routes (új)
- PUT /api/routes/:id (szerkesztés)
- DELETE /api/routes/:id (törlés)
- PUT /api/routes/:id/stops (megállók hozzárendelése)

**Stops:**
- GET /api/stops (lista + filter/sort/paginate)
- POST /api/stops (új)
- PUT /api/stops/:id (szerkesztés)
- DELETE /api/stops/:id (törlés)
- GET /api/stops/:id/routes (járatok)

## Component Templates

Fájl: `docs/design/COMPONENT_TEMPLATES.md`

Component vaskonnstruktúrák és pszeudokód:

- Routes List component
- Stops Map component
- Route-Stops Drag-Drop component
- Stop Details Public component

## Development Checklist

Fájl: `docs/design/DEVELOPMENT_CHECKLIST.md`

Fázis-alapú fejlesztési tervek 100+ checklist item-mel:

### Phase 1-6
1. Admin Routes Management
2. Admin Stops Management
3. Route-Stops Assignment
4. Public Stop Details
5. Styling & Responsive
6. Accessibility & Testing

Minden fázisban: komponens, template, stílus, tesztelés

## SVG Marker Ikonok

### Bus Marker
Fájl: `frontend/src/assets/icons/bus-marker.svg`
- Szín: #FF5722 (piros)
- Forma: Teardrop (40x56px)

### Tram Marker
Fájl: `frontend/src/assets/icons/tram-marker.svg`
- Szín: #FFC107 (sárga)
- Forma: Teardrop (40x56px)

### Metro Marker
Fájl: `frontend/src/assets/icons/metro-marker.svg`
- Szín: #3F51B5 (kék)
- Forma: Teardrop (40x56px)

## Navigációs Dokumentumok

### README
Fájl: `docs/design/README.md`

- Összes dokumentum rövid leírása
- Módszer és sorrend
- Backend API szükségletek

### Summary
Fájl: `DESIGN_DOCUMENTATION_SUMMARY.md`

Teljes projekt összefoglalása, design elemek, commitok

## Fejlesztési Sorrend

Javasolt megvalósítási sorrend:

1. **Admin Routes Management** (2-3 nap)
   - Tábla, keresés, CRUD

2. **Admin Stops Management** (2-3 nap)
   - Tábla + térkép

3. **Route-Stops Assignment** (1-2 nap)
   - Drag-drop

4. **Public Stop Details** (1-2 nap)
   - Responsive layout

5. **Styling & Responsive** (2-3 nap)
   - SCSS, breakpoints, Material theme

6. **Testing & Accessibility** (2-3 nap)
   - Unit, E2E, WCAG audit

## Gyors Start

1. Olvasd el: `docs/design/design-system.md` (szin, typography, spacing)
2. Nézd meg: `docs/design/admin-routes-wireframe.md` (layout koncepció)
3. Tanulmányozd: `docs/design/IMPLEMENTATION_GUIDE.md` (tech stack)
4. Kövesd: `docs/design/DEVELOPMENT_CHECKLIST.md` (fázisok)

## Fájl Hivatkozások

Abszolút elérési utak:

```
C:/Users/Szabolcs/BUSZ/szakdolgozat/docs/design/
├── admin-routes-wireframe.md
├── admin-stops-wireframe.md
├── route-stops-assignment-wireframe.md
├── stop-details-wireframe.md
├── design-system.md
├── IMPLEMENTATION_GUIDE.md
├── COMPONENT_TEMPLATES.md
├── DEVELOPMENT_CHECKLIST.md
├── README.md
└── (ez az index)

C:/Users/Szabolcs/BUSZ/szakdolgozat/frontend/src/assets/icons/
├── bus-marker.svg
├── tram-marker.svg
└── metro-marker.svg

C:/Users/Szabolcs/BUSZ/szakdolgozat/
├── DESIGN_DOCUMENTATION_SUMMARY.md
└── DESIGN_INDEX.md (ez a fájl)
```

---

Letrehozva: 2025-11-08
Verzió: 1.0 - Design Complete
