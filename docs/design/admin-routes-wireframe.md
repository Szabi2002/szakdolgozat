# Admin Routes Management - Wireframe

## Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Járatkezelés                           [+ Új járat]  🔄 ⚙️  │
├─────────────────────────────────────────────────────────────┤
│ Keresés: [        ] | Sorrend: [Név ▼]  |  Oldalak: 1-10   │
├──────┬────────────┬──────────┬──────────┬──────────────────┤
│ ID   │ Név        │ Típus    │ Aktív    │ Műveletek        │
├──────┼────────────┼──────────┼──────────┼──────────────────┤
│ 1    │ 7-es busz  │ BUS      │ ✓        │ [✏️]  [🗑️]       │
│ 2    │ 1-es villamos│ TRAM   │ ✓        │ [✏️]  [🗑️]       │
│ 3    │ M1 metró   │ METRO    │ ✓        │ [✏️]  [🗑️]       │
│ 4    │ 14-es busz │ BUS      │ ✗        │ [✏️]  [🗑️]       │
├──────┴────────────┴──────────┴──────────┴──────────────────┤
│ < 1 2 3 ... >  Összes: 47 rekord                            │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌────────────────────────┐
│ Járatkezelés  [+ Új]   │
├────────────────────────┤
│ Keresés: [     ]  🔍   │
├────────────────────────┤
│ 7-es busz              │
│ BUS • Aktív            │
│ [✏️]  [🗑️]             │
├────────────────────────┤
│ 1-es villamos          │
│ TRAM • Aktív           │
│ [✏️]  [🗑️]             │
├────────────────────────┤
│ [< Prev] [1] [Next >] │
└────────────────────────┘
```

## CRUD Dialog - Új/Szerkesztés

```
┌─────────────────────────────┐
│ ✕ Új járat létrehozása      │
├─────────────────────────────┤
│ Járat száma: [7     ]       │
│ Járat neve:  [Bosnyák]      │
│ Járat típusa:[BUS    ▼]     │
│ Kezdő állomás:[      ▼]     │
│ Végálomás:   [      ▼]      │
│                             │
│ [Mégsem]  [Mentés]          │
└─────────────────────────────┘
```

## Funkciók

| Funkció | Leírás |
|---------|--------|
| **Keresés** | Járat szám/név alapján valós idejű szűrés |
| **Sorrend** | Név, típus, aktivitás szerinti rendezés |
| **Pagination** | 10-es lapozás |
| **Szerkesztés** | Modal dialog megnyitása |
| **Törlés** | Megerősítési dialog |
| **Nuevo** | Modal a + Új gombra kattintva |

## Interakciók

- **Szerkesztés**: Katt [✏️] → Modal kitöltve az adatokkal
- **Törlés**: Katt [🗑️] → Megerősítési dialog → DELETE API
- **Keresés**: Live filter → Debounce 300ms
- **Pagination**: Select page → API fetch, top scroll
