# Stop Details - Public Page Wireframe

## Desktop Layout

```
┌──────────────────────────────────────────────────────────┐
│ [ <- Vissza ]  Bosnyák megálló                           │
├──────────────────────────────────────────────────────────┤
│  BALOLDAL (60%)              │  JOBBOLDAL (40%)          │
├──────────────────────────────┼──────────────────────────┤
│                              │                          │
│  🗺️ Leaflet Térkép            │ MEGÁLLÓ ADATOK           │
│  (Marker + környéke)         │                          │
│                              │ Bosnyák                 │
│  [Cím másolás]              │ ━━━━━━━━━━━━━━━━━━       │
│  [Útvonal megtekintés]       │ Cím: Budapest            │
│                              │      VII. kerület       │
│                              │                         │
│                              │ Koordináták:            │
│                              │ 47.5055° N              │
│                              │ 19.0447° E              │
│                              │ [Térképen megnyitás]    │
│                              │                         │
├──────────────────────────────┼──────────────────────────┤
│                              │                         │
│ JÁRATOK (Ezen a megállon)    │                         │
├──────────────────────────────┤                         │
│ [🔴 7-es busz] [Indulási...]│                         │
│ [🟡 8-as villamos] [Indulási│                         │
│ [🔴 9-es busz] [Indulási..] │                         │
│ [🔵 M1 metró] [Indulási...] │                         │
│                              │                         │
└──────────────────────────────┴──────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [ <- Vissza ]  Bosnyák   │
├──────────────────────────┤
│  🗺️ Leaflet Térkép       │
│  (Teljes szélesség)      │
│  [Marker]                │
│  [Cím másolás]           │
├──────────────────────────┤
│ MEGÁLLÓ ADATOK           │
│                          │
│ Bosnyák                  │
│ ━━━━━━━━━━━━━━━━━━       │
│ Cím: Budapest            │
│      VII. kerület        │
│                          │
│ Koordináták:             │
│ 47.5055° N, 19.0447° E   │
│ [Térképen megnyitás]     │
├──────────────────────────┤
│ JÁRATOK (4 innen)        │
│                          │
│ [🔴 7-es busz]           │
│ Indulás: ~5 percben      │
│ Úticél: Bosnyák tér      │
│                          │
│ [🟡 8-as villamos]       │
│ Indulás: ~10 percben     │
│ Úticél: Nagysándor József│
│                          │
│ [🔴 9-es busz]           │
│ Indulás: ~3 percben      │
│ Úticél: Etele út         │
│                          │
│ [🔵 M1 metró]            │
│ Indulás: ~15 percben     │
│ Úticél: Vörösmarty tér   │
│                          │
│ [Vissza a kereséshez]    │
└──────────────────────────┘
```

## Megálló Adatok Kártya (Jobboldal)

```
┌────────────────────────┐
│ Bosnyák                │
│ ━━━━━━━━━━━━━━━━━━━━  │
│                        │
│ CÍM:                   │
│ Budapest, VII. kerület │
│ Kazinczy u. - Dob u.   │
│                        │
│ POZÍCIÓ:               │
│ 47.5055° N             │
│ 19.0447° E             │
│                        │
│ [Copy Address]         │
│ [Open in Maps]         │
│                        │
│ JÁRATOK INNEN: 4       │
└────────────────────────┘
```

## Járat Kártya

```
┌────────────────────────────────┐
│ [🔴] 7-es busz (Tömeg)         │
├────────────────────────────────┤
│ Indulás: ~5 percben            │
│ Úticél: Bosnyák tér            │
│ Frekvencia: 3 percenként        │
│                                │
│ [Részletes menetrend]          │
│ [Útvonal]                      │
└────────────────────────────────┘
```

## Interakciók

### Desktop
- **Térkép hover marker**: Cursor megváltozik
- **Klikk járatra**: Navigator.app / Google Maps megnyitás
- **Indulási klikk**: Menetrend modal
- **Koordináták**: Copy to clipboard

### Mobile
- **Tab együttes**: Scroll felül az egyes szekciók között
- **Járat klikk**: Részletes nézet / menetrend
- **Vissza gomb**: Vissza az előző oldalra

## Adatmegjelenítés

| Elem | Forrás |
|------|--------|
| **Megálló név/cím** | Stop API |
| **Térkép** | Leaflet + OpenStreetMap |
| **Járatok** | Route API (filter by stop) |
| **Menetrend** | Schedule API (opcionális) |

## Responsive Breakpoints

- **Mobile**: < 768px → Single column, térkép felül
- **Tablet**: 768px - 1024px → 1:1 split, stacked
- **Desktop**: > 1024px → 60/40 split view
