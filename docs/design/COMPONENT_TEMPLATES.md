# Component Templates - Gyors megvalositas

## Routes List Component Template

Typescriptet es HTML-t meg kellene valasztani a templateben.

```
Routes List komponens:
- MatTable dataSource-al
- MatSort, MatPaginator
- Search input
- Edit/Delete buttons
- Dialog a forma

Struktura:
1. Header: cim + "Uj" gomb
2. Search input
3. Table (id, name, type, active, actions)
4. Paginator
```

## Stops Map Component Template

```
Map komponens:
- Leaflet inicialization
- Marker hozzaadasok
- Popup info
- Drag-enabled markerek

Szukseges:
1. #mapElement DIV
2. L.map() inicializacio
3. Marker hozzaadasok tömb alapjan
4. getMarkerIcon() metodus a szin kodolas
```

## Route-Stops Drag-Drop Template

```
Drag-and-drop komponens:
- cdkDropList ket listara
- Available stops (bal)
- Assigned stops (jobb, sorrendezhet)
- Remove gomb hozzarendelt stopsra

API:
PUT /api/routes/:id/stops
{
  "stops": [
    {"stopId": 5, "order": 1},
    {"stopId": 3, "order": 2}
  ]
}
```

## Stop Details Public Component

```
Stop details oldal:
- Responsive split (desktop: 60/40, mobile: 1 column)
- Left: Leaflet map, marker az adott stopra
- Right: Stop info card + routes list

Elrheto jaratok:
- Transport type badge szinez (piros busz, sarga villamos, kek metro)
- Indulasi idok
- Menetrend link (opcionalis)
```

## Material Components Hasznalata

MatTable - Listakazas
MatSort - Rendezés
MatPaginator - Oldalazas
MatDialog - CRUD form modalis
MatCard - Info kartyak
MatButton - Gombok
MatIcon - Material ikonok
CdkDropList - Drag-drop

## Responsive Design

Mobile < 768px:
- Single column
- Terkep teljes szelesseg
- Stack sorban

Desktop > 1024px:
- Split view layouts
- Side-by-side komponentek

## API Integration Pontok

GET /api/routes
GET /api/routes/:id
POST /api/routes
PUT /api/routes/:id
DELETE /api/routes/:id
GET /api/routes/:id/stops
PUT /api/routes/:id/stops

GET /api/stops
GET /api/stops/:id
POST /api/stops
PUT /api/stops/:id
DELETE /api/stops/:id
GET /api/stops/:id/routes
