# Admin Stops Management - Wireframe

## Desktop Split View Layout

```
┌───────────────────────────────────────────────────────────────────┐
│ Megállókezelés                            [+ Új megálló]  🔄 ⚙️  │
├──────────────────────────────┬──────────────────────────────────┤
│ LISTA (Bal oldal)             │ TÉRKÉP (Jobb oldal)              │
├──────────────────────────────┼──────────────────────────────────┤
│ Keresés: [    ] Km [  ]      │                                  │
│ Szűrés: Típus [BUS ▼]        │   🗺️ Leaflet Térkép             │
├──────────────┬────────────┤   │   Marker-ek + Popup info       │
│ ID │ Név      │ Koordináta  │   │                              │
├────┼──────────┼────────────┤   │   Pl. katt marker → Info      │
│ 1  │ Bosnyák  │ 47.5°, 19.0°│   │   sáv balloon popup-pal      │
│ 2  │ Podmaniczky │...      │   │                              │
│ 3  │ Déak tér │ ...        │   │   🔴 (marker animál join)    │
├────┴──────────┴────────────┤   │                              │
│ < 1 2 3 ... >               │   │                              │
└──────────────────────────────┴──────────────────────────────────┘
```

## Mobile Layout

```
┌────────────────────────┐
│ Megállókezelés [+ Új]  │
├────────────────────────┤
│ Keresés: [      ] 🔍   │
├────────────────────────┤
│ [📍 Térkép]  [📋 Lista]│
├────────────────────────┤
│                        │
│   🗺️ Leaflet Térkép   │
│   (Teljes nézet)      │
│                        │
│                        │
│ [Marker click → Info]  │
│                        │
│                        │
└────────────────────────┘
```

## Megálló Info Popup (Marker Katt)

```
┌────────────────────────┐
│ Bosnyák  [✏️] [🗑️]     │
├────────────────────────┤
│ Cím: Budapest, VII.    │
│ Járatok: 7, 8, 9       │
│ Aktív: ✓               │
│ [Szerkesztés]          │
└────────────────────────┘
```

## Szerkesztés/Új Modal

```
┌─────────────────────────────────┐
│ ✕ Új megálló                    │
├─────────────────────────────────┤
│ Megálló neve: [Bosnyák    ]     │
│ Szélesség:    [47.5055    ]     │
│ Hosszúság:    [19.0447    ]     │
│ Város:        [Budapest   ▼]    │
│ Cím:          [VII. kerület]    │
│ Típus:        [BUS      ▼]      │
│ Aktív:        [☑]               │
│                                 │
│ [Mégsem]  [Térkép katt...] [✓] │
└─────────────────────────────────┘
```

## Térkép Interakció

- **Click on map**: Koordináták automatikusan kitöltődnek
- **Marker drag**: Végignézhet/áthelyezhet marker-eket
- **Zoom**: Közlekedési közök zoomai
- **Cluster**: Nagy zoom ki → marker grouping

## Funkciók

| Elem | Funkció |
|------|---------|
| **Keresés** | Név alapján szűrés |
| **Km filter** | Távolság alapján szűrés |
| **Térkép** | Interaktív Leaflet (egyedi tema) |
| **Marker-ek** | Szín kód: 🔴BUS, 🟡TRAM, 🔵METRO |
| **Dupla klikk** | Modal megnyit szerkesztéshez |
| **Szerkesztés** | Form + térkép klikk koordináta |

## Jelöléskódok

- 🔴 BUS - Piros marker
- 🟡 TRAM - Sárga marker
- 🔵 METRO - Kék marker
