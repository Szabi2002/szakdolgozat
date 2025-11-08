# Route-Stop Assignment - Wireframe

## Desktop Drag-and-Drop Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Járat-Megálló Hozzárendelés                      [Mentés]   │
├──────────────────────┬───────────────────────────────────┤
│ JÁRAT: [7-es busz ▼] │                                   │
├──────────────────────┼───────────────────────────────────┤
│ ELÉRHETŐ MEGÁLLÓK   │ HOZZÁRENDELT MEGÁLLÓK            │
├──────────────────────┼───────────────────────────────────┤
│ [🔍 Keresés...]      │ SORREND:                          │
│                      │                                   │
│ ☐ Bosnyák            │ 1. ↑ Blaha Lujza  [✕]            │
│ ☐ Déak tér           │ 2. ↑ Astoria      [✕]            │
│ ☐ Astoria            │ 3. ↑ Ferenciek tere [✕]          │
│ ☐ Ferenciek tere     │ 4. ↑ Vámház körút [✕]            │
│ ☐ Vámház körút       │                                   │
│ ☐ Fővám tér          │ [Összes hozzáadás] [Mindent távolít]
│ ☐ Kálvin tér         │                                   │
│ ☐ Corvinus Egyetem   │ KÉSZ: 4 / 10 megálló             │
│                      │                                   │
│ [Összes hozzáadás]   │                                   │
└──────────────────────┴───────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────┐
│ Járat: [7-es ▼]      │
├──────────────────────┤
│ [📋 Elérhető]        │
│ [✅ Hozzárendelt]     │
├──────────────────────┤
│ ELÉRHETŐ:            │
│ ☐ Bosnyák [→]       │
│ ☐ Déak tér [→]      │
│ ☐ Astoria [→]       │
├──────────────────────┤
│ [Következő]          │
└──────────────────────┘

┌──────────────────────┐
│ HOZZÁRENDELT:        │
│                      │
│ 1. Blaha Lujza  [⬆]  │
│    [✕]               │
│ 2. Astoria      [⬆]  │
│    [✕]               │
│ 3. Ferenciek    [⬆]  │
│    [✕]               │
│                      │
│ [Mentés] [Mégsem]    │
└──────────────────────┘
```

## Interakció Módok

### Mód 1: Drag-and-Drop (Desktop)

1. Balról megálló húzása → jobbra drop
2. Jobboldali lista sorrendje ↑↓ nyilakkal módosítható
3. Megálló eltávolítása: [✕] gomb

### Mód 2: Checkbox + Buttons

1. Jelöljük be megállókat balról
2. [→] vagy [← Hozzáadás] gomb
3. Jobboldali lista sorrendje ↑↓ nyilakkal

### Mód 3: Select List (Mobile)

1. Tab-ok: Elérhető / Hozzárendelt
2. Jobbra nyíl → hozzáadás (jobb tab)
3. Balra nyíl / ✕ → eltávolítás

## Logika

```
┌─────────────────┐
│ Járat kiválasztás
└────────┬────────┘
         │
         v
┌──────────────────────────────────────┐
│ Betöltés: Elérhető megállók listája  │
│           (már hozzárendelt ✓)       │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Felhasználó végrehajtja a változásokat
│ (Add/Remove/Reorder)                 │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ [Mentés] kattintás → API PUT request │
│ Hozzárendelt megállók sorrenddel     │
└─────────────────────────────────────┘
```

## API Payload (Mentés)

```json
{
  "routeId": 1,
  "stops": [
    {"stopId": 5, "order": 1},
    {"stopId": 3, "order": 2},
    {"stopId": 8, "order": 3},
    {"stopId": 12, "order": 4}
  ]
}
```

## Funkciók

| Funkció | Leírás |
|---------|--------|
| **Keresés** | Megálló név szűrés baloldali lista |
| **Drag-Drop** | Húzás balról jobbra (Desktop) |
| **↑↓ Sorrend** | Rendezés jobboldali listán |
| **Eltávolítás** | [✕] gomb a hozzárendeltből |
| **Tömeges Add** | Összes hozzáadás gomb |
| **Mentés** | PUT API + success toast |
