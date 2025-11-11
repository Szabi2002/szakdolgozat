# Sprint 5-6: Task 2.4 - DTO-k és Validáció Frissítése - Összefoglaló

## Áttekintés

A planner module API-ja kibővült multimodális routing támogatással (gyaloglás + tömegközlekedés). A DTO-k és validációk frissítve lettek az új funkciókhoz.

## Végrehajtott Változások

### 1. Request DTO Bővítése

**Fájl:** `backend/src/modules/planner/dto/plan-trip.dto.ts`

**Új mezők:**

- `include_walking?: boolean` (default: true) - Gyaloglás bekapcsolása az útvonaltervezésben
- `max_alternatives?: number` (1-5, default: 3) - Alternatív útvonalak száma
- `preference?: 'fastest' | 'least_transfers' | 'least_walking'` (default: 'fastest') - Útvonal preferencia

**Validációk:**
- UUID validáció a `from_stop_id` és `to_stop_id` mezőkre
- `@Min(1)` és `@Max(5)` a `max_alternatives` mezőre
- `@IsEnum()` a `preference` mezőre
- `@Type()` transformer a boolean és number mezőkhöz

**Példa Request:**
```json
{
  "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
  "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
  "include_walking": true,
  "max_alternatives": 3,
  "date": "2025-11-10",
  "time": "14:30",
  "preference": "fastest"
}
```

### 2. Response DTO Újrastrukturálás

**Fájl:** `backend/src/modules/planner/dto/trip-result.dto.ts`

**Új DTO osztályok:**

#### `RouteStep`
Egy utazási szakasz (transit vagy walking):
- `type: 'transit' | 'walking'` - Szakasz típusa
- `start_stop: Stop` - Kezdő megálló
- `end_stop: Stop` - Végső megálló
- `route_id?: string` - Járat UUID (csak transit)
- `route_number?: string` - Járatszám (pl. "7", "M2")
- `route_name?: string` - Járat neve
- `vehicle_type?: 'bus' | 'tram' | 'metro' | 'train'` - Jármű típusa
- `distance?: number` - Gyaloglási távolság méterben (csak walking)
- `duration: number` - Szakasz időtartama percben
- `stop_count: number` - Megállók száma
- `stops: Stop[]` - Megállók listája

#### `Route`
Egy teljes útvonal alternatíva:
- `route_id: string` - Egyedi azonosító (pl. "route-1")
- `total_time: number` - Teljes utazási idő percben
- `transfers: number` - Átszállások száma
- `walking_distance: number` - Teljes gyaloglási távolság méterben
- `total_stops: number` - Megállók száma
- `steps: RouteStep[]` - Utazási szakaszok rendezett listája
- `recommended?: boolean` - Ez az ajánlott útvonal?
- `recommendation_reason?: string` - Miért ajánlott

#### `TripSearchResponse`
Keresési eredmény wrapper:
- `alternatives: Route[]` - Alternatív útvonalak (1-5)
- `search_timestamp: string` - Keresés időbélyege
- `computation_time_ms: number` - Számítási idő milliszekundumban

**Példa Response:**
```json
{
  "alternatives": [
    {
      "route_id": "route-1",
      "total_time": 28,
      "transfers": 1,
      "walking_distance": 450,
      "total_stops": 12,
      "steps": [
        {
          "type": "transit",
          "start_stop": { "id": "...", "name": "Astoria M", ... },
          "end_stop": { "id": "...", "name": "Deák Ferenc tér M", ... },
          "route_id": "...",
          "route_number": "M2",
          "route_name": "Metro Line 2",
          "vehicle_type": "metro",
          "duration": 8,
          "stop_count": 3,
          "stops": [...]
        },
        {
          "type": "walking",
          "start_stop": { "id": "...", "name": "Deák Ferenc tér M", ... },
          "end_stop": { "id": "...", "name": "Bajcsy-Zsilinszky út", ... },
          "distance": 450,
          "duration": 6,
          "stop_count": 2,
          "stops": [...]
        }
      ],
      "recommended": true,
      "recommendation_reason": "Fastest route"
    }
  ],
  "search_timestamp": "2025-11-10T14:30:00Z",
  "computation_time_ms": 342
}
```

**Legacy DTO-k:**
A backward kompatibilitás érdekében megtartva:
- `RouteSegment` (deprecated)
- `TripResultDto` (deprecated)

### 3. Controller Frissítése

**Fájl:** `backend/src/modules/planner/planner.controller.ts`

**Új endpoint:**
```typescript
POST /api/planner/search
```

**Változások:**
- Új `TripSearchResponse` típusú válasz
- Részletes Swagger dokumentáció példákkal
- `computation_time_ms` mérés
- HTTP status kódok dokumentálva (200, 400, 404)

**Legacy endpoint:**
```typescript
POST /api/planner/search-legacy (DEPRECATED)
```
- Régi `TripResultDto` formátum
- Backward kompatibilitás biztosítása

### 4. Service Frissítése

**Fájl:** `backend/src/modules/planner/planner.service.ts`

**Új metódus:**
```typescript
async findRoutes(dto: PlanTripDto): Promise<Route[]>
```

**Funkciók:**
- Multimodális routing (walking + transit)
- `include_walking` paraméter támogatása
- `Route` objektumok építése `RouteStep`-ekből
- Vehicle type következtetés route number alapján
- Recommendation reason generálás

**Legacy metódus:**
```typescript
async findRoute(fromStopId: string, toStopId: string): Promise<TripResultDto>
```
- Megőrizve backward kompatibilitás céljából
- `include_walking: false` használatával

**Új privát metódusok:**
- `findMultipleRoutes()` - Több alternatíva keresése
- `buildRoute()` - Route DTO építése BFS eredményből
- `inferVehicleType()` - Jármű típus következtetés
- `getRecommendationReason()` - Ajánlási indok generálás

**Módosított metódusok:**
- `buildGraph(includeWalking: boolean)` - Walking élek opcionális hozzáadása
- `bfs()` - Vehicle type tracking

### 5. Validációs Tesztek

**Fájl:** `backend/src/modules/planner/dto/plan-trip.dto.spec.ts`

**Teszt lefedettség:**
- Valid DTO-k (minimal, with defaults, all fields)
- Invalid UUID-k
- `max_alternatives` validáció (1-5 tartomány, integer check)
- `preference` enum validáció
- `include_walking` boolean validáció
- `date` és `time` formátum validáció
- Type transformation tesztek

**Teszt eredmény:**
```
Test Suites: 1 passed
Tests:       21 passed
```

## Breaking Changes

### API Response Format

**Régi:**
```json
{
  "routes": [...],
  "total_stops": 12,
  "transfers": 1,
  "estimated_duration_minutes": 28,
  "path": [...]
}
```

**Új:**
```json
{
  "alternatives": [{
    "route_id": "route-1",
    "total_time": 28,
    "transfers": 1,
    "walking_distance": 450,
    "total_stops": 12,
    "steps": [...]
  }],
  "search_timestamp": "2025-11-10T14:30:00Z",
  "computation_time_ms": 342
}
```

### Mezők átnevezése
- `routes` → `alternatives`
- `estimated_duration_minutes` → `total_time`
- `RouteSegment` → `RouteStep` (bővített típusokkal)

### Új mezők
- `walking_distance` - Teljes gyaloglási távolság
- `route_id` - Alternatíva azonosító
- `search_timestamp` - Keresés időbélyege
- `computation_time_ms` - Számítási idő

## Migrációs Útmutató

### Frontend Integráció

**Régi kód:**
```typescript
const result = await plannerService.findRoute(fromId, toId);
console.log(result.routes); // RouteSegment[]
console.log(result.estimated_duration_minutes);
```

**Új kód:**
```typescript
const response = await plannerService.searchRoute({
  from_stop_id: fromId,
  to_stop_id: toId,
  include_walking: true,
  max_alternatives: 3,
  preference: 'fastest'
});

const primaryRoute = response.alternatives[0];
console.log(primaryRoute.steps); // RouteStep[]
console.log(primaryRoute.total_time);
console.log(primaryRoute.walking_distance);
```

### Legacy Support

Ha a frontend még nem frissíthető:
```typescript
POST /api/planner/search-legacy

// Ugyanaz a régi formátum
{
  "from_stop_id": "...",
  "to_stop_id": "..."
}
```

## Swagger Dokumentáció

Az API teljes dokumentációja elérhető:
```
http://localhost:3000/api
```

**Ellenőrizendő:**
- `/api/planner/search` endpoint látható
- Request body tartalmazza az új mezőket
- Response schema helyesen jelenik meg
- Example values értelmesek
- Enum értékek dokumentálva

## Tesztelés

### Unit tesztek futtatása:
```bash
cd backend
npm test -- plan-trip.dto.spec.ts
```

### Build ellenőrzése:
```bash
cd backend
npm run build
```

### Backend indítása:
```bash
cd backend
npm run start:dev
```

### Manual testing:
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "include_walking": true,
    "max_alternatives": 3,
    "preference": "fastest"
  }'
```

## Acceptance Criteria Teljesítés

- [x] PlanTripDto tartalmazza az új mezőket
- [x] Validáció működik (max_alternatives <= 5, preference enum)
- [x] RouteStep DTO támogatja a walking típust
- [x] Route DTO tartalmazza a walking_distance mezőt
- [x] TripSearchResponse wrapper létezik
- [x] Swagger docs frissítve példákkal
- [x] Validációs tesztek írva és átmennek (21/21)
- [x] Breaking changes dokumentálva
- [x] Build sikeres
- [x] Legacy kompatibilitás biztosítva

## Következő Lépések

1. Frontend integráció frissítése az új API-hoz
2. K-shortest paths algoritmus implementálása (több alternatíva)
3. Preference-based routing optimalizáció finomhangolása
4. Real-time validation a date/time mezőkhöz
5. Integration tesztek az új endpoint-hoz

## Fájlok Listája

**Módosított:**
- `backend/src/modules/planner/dto/plan-trip.dto.ts`
- `backend/src/modules/planner/dto/trip-result.dto.ts`
- `backend/src/modules/planner/planner.controller.ts`
- `backend/src/modules/planner/planner.service.ts`

**Új:**
- `backend/src/modules/planner/dto/plan-trip.dto.spec.ts`
- `backend/SPRINT_5_6_TASK_2_4_SUMMARY.md`

**Backup:**
- `backend/src/modules/planner/dto/plan-trip.dto.ts.bak`
- `backend/src/modules/planner/dto/trip-result.dto.ts.bak`
- `backend/src/modules/planner/planner.controller.ts.bak`
- `backend/src/modules/planner/planner.service.ts.bak`
