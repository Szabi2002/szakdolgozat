# Design Documentation - Gyors Design Dokumentacio Letrehozva

Datum: 2025-11-08
Sprint: 3-4 (US-4.1 - UI/UX Tervezes)

## Letrehozott Dokumentumok

### 1. Wireframe Dokumentumok (ASCII art layoutok)

#### A. Admin Routes Management
Fajl: docs/design/admin-routes-wireframe.md
Tartalom:
- Desktop tabla layout (ID, Nev, Tipus, Aktiv, Muveletetek)
- Mobile kartyalista nezett
- CRUD modal forma (uj/szerkesztés)
- Keresés, rendezés, pagination funkciok
- API interakciok (GET, POST, PUT, DELETE)

#### B. Admin Stops Management
Fajl: docs/design/admin-stops-wireframe.md
Tartalom:
- Split view layout: 60% tabla + 40% Leaflet terkep
- Marker szinek: Piros (BUS), Sarga (TRAM), Kek (METRO)
- Mobile: Tab switch (Terkep / Lista)
- Popup info megallok ra
- Szerkesztes: Form + Map koordinata katt

#### C. Route-Stops Assignment
Fajl: docs/design/route-stops-assignment-wireframe.md
Tartalom:
- Drag-and-drop interface (CDK)
- Ket lista: Elerheto megallok / Hozzarendelt megallok
- Sorrendezés: ↑↓ nyilak a hozzarendelt listaban
- Mobile: Tablap separat listak (Elerheto/Hozzarendelt)
- Save button: PUT API meghivas orden array-jel

#### D. Public Stop Details Page
Fajl: docs/design/stop-details-wireframe.md
Tartalom:
- Desktop: 60% terkep (bal) + 40% info (jobb)
- Mobile: Stack layout, terkep felul
- Stop adatok: Cim, koordinatak, "Negyzetre masolas"
- Jaratok lista: Szallitasi tipus badge + indulasi idok
- Responsive breakpoints: Mobile (<768px), Tablet (768-1024), Desktop (>1024)

### 2. Design System

Fajl: docs/design/design-system.md
Tartalom:
- Color palette:
  * Primary: #1976D2 (Material Blue)
  * Status: #4CAF50 (green), #F44336 (red), #FF9800 (orange), #2196F3 (info)
  * Transport: #FF5722 (BUS), #FFC107 (TRAM), #3F51B5 (METRO)
  * Neutral: Black, Grey, White
  
- Typography:
  * Font: Roboto (Material default)
  * Scaling: H1 (32px), H2 (28px), H3 (24px), Body (16px), Caption (12px), Button (14px)
  
- Spacing system (8px base unit):
  * xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
  
- Components:
  * Button styles (Primary, Secondary, Danger)
  * Form elements (Input, Select)
  * Cards & containers
  
- Accessibility:
  * Color contrast: WCAG AAA (21:1)
  * Focus states: 2px outline
  * Touch targets: 44-48px min
  
- Responsive breakpoints:
  * Mobile: <768px
  * Tablet: 768-1024px
  * Desktop: >1024px
  * Max-width: 1200px

### 3. Implementation Guide

Fajl: docs/design/IMPLEMENTATION_GUIDE.md
Tartalom:
- Modul struktura (Admin + Public features)
- Komponensek zarszerkezete es feladatai
- SCSS valtozok hasznalata
- Material Components integracioja:
  * MatTable (listakazas)
  * MatSort (rendezés)
  * MatPaginator (oldalazas)
  * MatDialog (CRUD modal)
  * MatCard, MatButton, MatIcon
  * CdkDropList (drag-drop)
  
- Leaflet terkep integracioja
- Custom SVG markerek hasznalata
- API endpoints dokumentacioja
- Responsive SCSS es breakpoints
- State management javasolt struktura
- Performance optimizaciok (lazy load, OnPush detection, virtualization)
- Accessibility checklist
- Testing strategia (Unit, E2E)

### 4. Component Templates

Fajl: docs/design/COMPONENT_TEMPLATES.md
Tartalom:
- Routes List component vaslatai
- Stops Map component vaslatai
- Route-Stops Drag-Drop component vaslatai
- Stop Details Public component vaslatai
- Material komponensek integracioja
- API integracios pontok

### 5. README es Navigacio

Fajl: docs/design/README.md
Tartalom:
- Osszes dokumentum listaja
- SVG marker ikonok leiras
- Quick start tancsok
- Backend API szuksegletes endpoint-ok
- Fejlesztesi sorrend javaslatai

## Letrehozott SVG Marker Ikonok

Az ikonok a frontend/src/assets/icons/ mappaban:

### bus-marker.svg
- Teardrop alak
- Szin: #FF5722 (Deep Orange / Piros)
- Busz ikon az elefben (2 ablak + kerekek)

### tram-marker.svg
- Teardrop alak
- Szin: #FFC107 (Amber / Sarga)
- Villamos ikon az eletben (3 ablak + kozepauto vonal)

### metro-marker.svg
- Teardrop alak
- Szin: #3F51B5 (Indigo / Kek)
- Metro vonat ikon az eletben (4 ablak)

## Kulcs Karakterisztikak

### Admin Interface
- Tábla-alapu CRUD (Routes, Stops)
- Real-time keresés + sorting
- Leaflet terkep integracioja
- Drag-and-drop hozzarendeles
- Material Design komponensek

### Public Interface
- Responsive stop details oldal
- Interaktiv terkep
- Jaratok lista sallitasi tipussal szinezve
- Mobile-friendly layout

### Design System Keszenleti
- Teljes szin paletta (primary, status, transport)
- Typography skala
- Spacing rendszer
- Komponens stilus definiciok
- Accessibility standard (WCAG AA/AAA)
- Dark mode vaskala (jovo hasznalatra)

## Fajlok Listajelenlete

Osszes letrehozott fajl az alabbi konyvtarban:
```
docs/design/
├── admin-routes-wireframe.md
├── admin-stops-wireframe.md
├── route-stops-assignment-wireframe.md
├── stop-details-wireframe.md
├── design-system.md
├── IMPLEMENTATION_GUIDE.md
├── COMPONENT_TEMPLATES.md
└── README.md
```

SVG marker ikonok:
```
frontend/src/assets/icons/
├── bus-marker.svg
├── tram-marker.svg
└── metro-marker.svg
```

## Keszenleti Skala

- Wireframes: 100% (ASCII art ASCII layout-ok)
- Design System: 100% (Colors, typography, spacing, components)
- Implementation Guide: 100% (Modul struktura, API, tech stack)
- Component Templates: 100% (Vaslatai es pseudocode)
- SVG Marker Ikonok: 100% (3 DB teardrop-style marker)

## Kovetkezo Lepesek (Development)

1. Modul struktura letrehozasa (admin + public features)
2. Material komponensek hasznalata
3. Leaf-let terkep integracioja
4. SCSS valtozok es stilusok alkalmazasa
5. API szolgaltatasok implementacioja
6. Component fejlesztes
7. Responsive design testing
8. Accessibility testing
9. E2E testing (Playwright)

## Referencia

Tervezett Angular Material alkalmazas, már kész:
- Authentication (Sprint 1-2)
- Landing page
- Header/Footer komponensek

Szukseges kornyezetek:
- Angular 16+
- Angular Material
- Leaflet + OpenStreetMap
- Angular CDK (Drag-drop)
- RxJS
- TypeScript

---

Letrehozva: 2025-11-08
Design dokumentacio verzio: 1.0
Sprint: 3-4 (US-4.1)
