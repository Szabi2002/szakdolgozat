# Geo Utils Documentation

## Áttekintés
A `geo.utils.ts` modul geospatial utility függvényeket biztosít a multimodális útvonaltervezéshez, különös tekintettel a gyaloglási távolságok és idők számítására.

## Telepítés és Import

```typescript
// Teljes import
import {
  haversineDistance,
  walkingTimeMinutes,
  isWalkable,
  MAX_WALKING_DISTANCE_METERS,
  MIN_WALKING_DISTANCE_METERS,
} from '@common/utils/geo.utils';

// Vagy barrel export használata
import { haversineDistance, walkingTimeMinutes } from '@common/utils';
```

## API Referencia

### `haversineDistance(lat1, lon1, lat2, lon2): number`

Két GPS koordináta közötti távolságot számítja ki a Haversine formula alapján.

**Paraméterek:**
- `lat1: number` - Első pont földrajzi szélessége (fokban)
- `lon1: number` - Első pont földrajzi hosszúsága (fokban)
- `lat2: number` - Második pont földrajzi szélessége (fokban)
- `lon2: number` - Második pont földrajzi hosszúsága (fokban)

**Visszatérési érték:**
- `number` - Távolság méterben

**Példák:**

```typescript
// Budapest, Deák Ferenc tér → Oktogon
const distance = haversineDistance(
  47.497913, 19.054057,  // Deák Ferenc tér
  47.505870, 19.063574   // Oktogon
);
console.log(distance); // ~1050 méter
```

**Hibakezelés:**
```typescript
try {
  const distance = haversineDistance(NaN, 19.054057, 47.505870, 19.063574);
} catch (error) {
  console.error(error.message); // "Invalid coordinates: all values must be finite numbers"
}
```

---

### `walkingTimeMinutes(distanceMeters): number`

Becsüli a gyaloglási időt egy adott távolságra.

**Paraméterek:**
- `distanceMeters: number` - Távolság méterben

**Visszatérési érték:**
- `number` - Becsült gyaloglási idő percben (felkerekítve)

**Előfeltételek:**
- Átlagos gyaloglási sebesség: 5 km/h
- Az idő konzervatív becslés (felkerekítés a legközelebbi percre)

**Példák:**

```typescript
// 500 méter gyaloglás
const time1 = walkingTimeMinutes(500);
console.log(time1); // 6 perc

// 1000 méter gyaloglás
const time2 = walkingTimeMinutes(1000);
console.log(time2); // 12 perc

// 0 méter
const time3 = walkingTimeMinutes(0);
console.log(time3); // 0 perc
```

**Hibakezelés:**
```typescript
try {
  const time = walkingTimeMinutes(-100);
} catch (error) {
  console.error(error.message); // "Invalid distance: cannot be negative"
}
```

---

### `isWalkable(lat1, lon1, lat2, lon2): boolean`

Ellenőrzi, hogy két megálló ésszerű gyaloglási távolságon belül van-e.

**Paraméterek:**
- `lat1: number` - Első megálló földrajzi szélessége (fokban)
- `lon1: number` - Első megálló földrajzi hosszúsága (fokban)
- `lat2: number` - Második megálló földrajzi szélessége (fokban)
- `lon2: number` - Második megálló földrajzi hosszúsága (fokban)

**Visszatérési érték:**
- `boolean` - `true`, ha a távolság MIN_WALKING_DISTANCE_METERS és MAX_WALKING_DISTANCE_METERS között van

**Példák:**

```typescript
// Közeli megállók (500m)
const walkable1 = isWalkable(
  47.497913, 19.054057,
  47.502413, 19.054057
);
console.log(walkable1); // true

// Távoli megállók (1000m)
const walkable2 = isWalkable(
  47.497913, 19.054057,  // Deák Ferenc tér
  47.505870, 19.063574   // Oktogon
);
console.log(walkable2); // false (túl messze)

// Azonos helyszín
const walkable3 = isWalkable(
  47.497913, 19.054057,
  47.497913, 19.054057
);
console.log(walkable3); // false (túl közel)

// Hibás koordináták
const walkable4 = isWalkable(NaN, 19.054057, 47.505870, 19.063574);
console.log(walkable4); // false (nem dob hibát, csak false-t ad vissza)
```

---

## Konstansok

### `MAX_WALKING_DISTANCE_METERS`

```typescript
export const MAX_WALKING_DISTANCE_METERS = 800;
```

Maximum ésszerű gyaloglási távolság megállók között.
- Érték: 800 méter
- Indoklás: ~10 perc gyaloglás 5 km/h sebességgel
- Használat: Multimodális routing során a gyaloglási szakaszok korlátozása

### `MIN_WALKING_DISTANCE_METERS`

```typescript
export const MIN_WALKING_DISTANCE_METERS = 50;
```

Minimum figyelembe vehető gyaloglási távolság.
- Érték: 50 méter
- Indoklás: Ennél rövidebb szakaszokat nem érdemes gyaloglási szakaszként kezelni
- Használat: Szűrés túl közeli megállók között

---

## Használati Példák

### 1. Multimodális Routing - Graph Building

```typescript
import { haversineDistance, MAX_WALKING_DISTANCE_METERS } from '@common/utils';

async function buildMultimodalGraph() {
  const stops = await getAllStops(); // Minden megálló lekérése
  const adjacencyList = new Map();

  // Gyaloglási élek hozzáadása
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const stop1 = stops[i];
      const stop2 = stops[j];

      const distance = haversineDistance(
        stop1.latitude, stop1.longitude,
        stop2.latitude, stop2.longitude
      );

      if (distance <= MAX_WALKING_DISTANCE_METERS) {
        // Hozzáadás mindkét irányban (gyaloglás kétirányú)
        addWalkingEdge(adjacencyList, stop1, stop2, distance);
        addWalkingEdge(adjacencyList, stop2, stop1, distance);
      }
    }
  }

  return adjacencyList;
}
```

### 2. Útvonaltervező - Walking Segment Display

```typescript
import { walkingTimeMinutes, haversineDistance } from '@common/utils';

function displayWalkingSegment(fromStop, toStop) {
  const distance = haversineDistance(
    fromStop.latitude, fromStop.longitude,
    toStop.latitude, toStop.longitude
  );

  const timeMinutes = walkingTimeMinutes(distance);

  return {
    type: 'WALKING',
    from: fromStop.name,
    to: toStop.name,
    distance_meters: Math.round(distance),
    estimated_time_minutes: timeMinutes,
    instructions: `Gyalogolj ${Math.round(distance)}m-t (kb. ${timeMinutes} perc)`
  };
}
```

### 3. Nearest Stop Finder

```typescript
import { haversineDistance } from '@common/utils';

function findNearestStop(userLat: number, userLon: number, stops: Stop[]) {
  let nearestStop = null;
  let minDistance = Infinity;

  for (const stop of stops) {
    const distance = haversineDistance(
      userLat, userLon,
      stop.latitude, stop.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestStop = stop;
    }
  }

  return {
    stop: nearestStop,
    distance_meters: minDistance,
  };
}
```

### 4. Walking Distance Filter

```typescript
import { isWalkable } from '@common/utils';

function getWalkableStops(fromStop: Stop, allStops: Stop[]) {
  return allStops.filter(stop =>
    stop.id !== fromStop.id && // Kizárjuk ugyanazt a megállót
    isWalkable(
      fromStop.latitude, fromStop.longitude,
      stop.latitude, stop.longitude
    )
  );
}
```

---

## Tesztelés

### Unit Tesztek Futtatása

```bash
cd backend
npm test -- geo.utils.spec.ts
```

### Tesztlefedettség

```bash
npm test -- --coverage geo.utils.spec.ts
```

**Jelenlegi tesztlefedettség:**
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

**Teszteltek:**
- ✅ Haversine pontosság (valós budapest koordináták)
- ✅ Edge cases (azonos koordináták, extrém távolságok)
- ✅ Hibakezelés (NaN, Infinity, negatív értékek)
- ✅ Walking time becslések
- ✅ isWalkable határértékek
- ✅ Konstansok exportálása

---

## Matematikai Háttér

### Haversine Formula

A Haversine formula kiszámítja a legrövidebb távolságot két pont között egy gömb felületén (great-circle distance).

**Formula:**

```
a = sin²(Δφ/2) + cos(φ1) ⋅ cos(φ2) ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2(√a, √(1−a))
d = R ⋅ c
```

Ahol:
- φ = földrajzi szélesség (radiánban)
- λ = földrajzi hosszúság (radiánban)
- R = Föld sugara (6371 km)
- d = távolság

**Pontosság:**
- ±0.5% hibatűrés rövid távolságoknál (<1000 km)
- Tökéletesen pontos gömbön; a Föld lapultsága miatt minimális eltérés lehet

---

## Performance Considerations

### Optimalizáció Nagy Adathalmazoknál

Ha sok megálló között kell távolságokat számolni (N×N probléma):

```typescript
// ❌ ROSSZ: Minden párost számol (O(n²))
for (const stop1 of stops) {
  for (const stop2 of stops) {
    const distance = haversineDistance(...);
  }
}

// ✅ JÓ: Csak közelben lévőket vizsgál (térbeli index)
function buildSpatialIndex(stops: Stop[], gridSize = 0.01) {
  // Grid-alapú indexelés
  // Csak a szomszédos grid cellákban lévő megállókat vizsgálja
}
```

### Caching

```typescript
// Cache távolságokat, ha gyakran kell ugyanazokat lekérni
const distanceCache = new Map<string, number>();

function getCachedDistance(stop1Id: string, stop2Id: string, ...coords) {
  const key = [stop1Id, stop2Id].sort().join('-');

  if (!distanceCache.has(key)) {
    distanceCache.set(key, haversineDistance(...coords));
  }

  return distanceCache.get(key);
}
```

---

## Troubleshooting

### Probléma: "Invalid coordinates" hiba

**Ok:** NaN vagy Infinity értékek a koordinátákban

**Megoldás:**
```typescript
// Ellenőrzés előtt
if (!isFinite(lat) || !isFinite(lon)) {
  throw new Error('Invalid coordinates');
}
```

### Probléma: Túl nagy/kicsi távolságok

**Ok:** Fokban vs. radiánban keveredés, vagy rossz koordináták

**Megoldás:**
```typescript
// Koordináták validálása
function validateCoordinates(lat: number, lon: number) {
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (lon < -180 || lon > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
}
```

### Probléma: Walking time nem reális

**Ok:** A 5 km/h alapértelmezett sebesség nem megfelelő minden esetben

**Megoldás:**
```typescript
// Custom sebesség használata
function walkingTimeWithSpeed(distanceMeters: number, speedKmh: number) {
  const timeHours = (distanceMeters / 1000) / speedKmh;
  return Math.ceil(timeHours * 60);
}

// Példa: idősebb emberek, akadálymentesítés
const slowWalkTime = walkingTimeWithSpeed(500, 3); // 10 perc
```

---

## Következő Lépések

Ezt a modult a következő task-okban használni fogjuk:

1. **Task 2.2**: BFS algoritmus bővítése gyaloglási élekkel
2. **Task 2.3**: Multimodális routing implementáció
3. **Task 2.4**: Frontend integráció walking segments megjelenítéséhez

---

## Changelog

### v1.0.0 (2025-11-09)
- ✅ Haversine távolság számítás implementálva
- ✅ Walking time becslés implementálva
- ✅ isWalkable helper függvény
- ✅ MAX/MIN walking distance konstansok
- ✅ 24 unit teszt (100% coverage)
- ✅ Validáció és hibakezelés
- ✅ Dokumentáció és példák
