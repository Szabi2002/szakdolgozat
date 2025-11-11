# Planner API - Használati Példák

## Endpoint: POST /api/planner/search

### 1. Alapvető keresés (default értékekkel)

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

**Default értékek:**
- `include_walking: true`
- `max_alternatives: 3`
- `preference: "fastest"`

**Response:**
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
          "start_stop": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Astoria M",
            "latitude": 47.497913,
            "longitude": 19.054057,
            "type": "metro",
            "is_accessible": true,
            "description": null
          },
          "end_stop": {
            "id": "123e4567-e89b-12d3-a456-426614174002",
            "name": "Deák Ferenc tér M",
            "latitude": 47.498156,
            "longitude": 19.054013,
            "type": "metro",
            "is_accessible": true,
            "description": "Metro hub with 3 lines"
          },
          "route_id": "123e4567-e89b-12d3-a456-426614174100",
          "route_number": "M2",
          "route_name": "Metro Line 2",
          "vehicle_type": "metro",
          "duration": 8,
          "stop_count": 3,
          "stops": [...]
        },
        {
          "type": "walking",
          "start_stop": {
            "id": "123e4567-e89b-12d3-a456-426614174002",
            "name": "Deák Ferenc tér M",
            "latitude": 47.498156,
            "longitude": 19.054013,
            "type": "metro",
            "is_accessible": true,
            "description": null
          },
          "end_stop": {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "name": "Bajcsy-Zsilinszky út",
            "latitude": 47.500000,
            "longitude": 19.056000,
            "type": "bus",
            "is_accessible": true,
            "description": null
          },
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
  "search_timestamp": "2025-11-10T14:30:00.000Z",
  "computation_time_ms": 342
}
```

### 2. Gyaloglás nélküli keresés (csak tömegközlekedés)

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "include_walking": false
  }'
```

**Eredmény:**
- Csak transit típusú steps
- `walking_distance: 0`
- Esetleg több átszállás

### 3. Legkevesebb átszállás preferencia

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "preference": "least_transfers"
  }'
```

**Eredmény:**
```json
{
  "alternatives": [
    {
      "route_id": "route-1",
      "total_time": 35,
      "transfers": 0,
      "walking_distance": 0,
      "total_stops": 15,
      "steps": [
        {
          "type": "transit",
          "route_number": "7",
          "route_name": "Bosnyák tér - Szabadság híd",
          "vehicle_type": "tram",
          ...
        }
      ],
      "recommended": true,
      "recommendation_reason": "Fewest transfers (0)"
    }
  ],
  ...
}
```

### 4. Legkevesebb gyaloglás preferencia

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "preference": "least_walking"
  }'
```

**Eredmény:**
```json
{
  "alternatives": [
    {
      "route_id": "route-1",
      "total_time": 32,
      "transfers": 2,
      "walking_distance": 50,
      "total_stops": 18,
      "recommendation_reason": "Least walking (50m)"
      ...
    }
  ],
  ...
}
```

### 5. Több alternatíva kérése

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "max_alternatives": 5
  }'
```

**Eredmény:**
```json
{
  "alternatives": [
    {
      "route_id": "route-1",
      "total_time": 28,
      "transfers": 1,
      "walking_distance": 450,
      "recommended": true,
      "recommendation_reason": "Fastest route"
    },
    {
      "route_id": "route-2",
      "total_time": 30,
      "transfers": 0,
      "walking_distance": 200,
      "recommended": false
    },
    {
      "route_id": "route-3",
      "total_time": 32,
      "transfers": 2,
      "walking_distance": 0,
      "recommended": false
    }
  ],
  ...
}
```

### 6. Időzített keresés

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "date": "2025-11-15",
    "time": "08:30"
  }'
```

**Megjegyzés:** A date és time mezők jelenleg informatívak, a tényleges ütemezés a későbbi fejlesztések része lesz.

### 7. Teljes konfiguráció

**Request:**
```bash
curl -X POST http://localhost:3000/api/planner/search \
  -H "Content-Type: application/json" \
  -d '{
    "from_stop_id": "123e4567-e89b-12d3-a456-426614174000",
    "to_stop_id": "123e4567-e89b-12d3-a456-426614174001",
    "include_walking": true,
    "max_alternatives": 3,
    "date": "2025-11-15",
    "time": "08:30",
    "preference": "fastest"
  }'
```

## Frontend Integráció Példa (TypeScript)

### Service Method

```typescript
// src/app/core/services/planner.service.ts

export interface PlanTripRequest {
  from_stop_id: string;
  to_stop_id: string;
  include_walking?: boolean;
  max_alternatives?: number;
  date?: string;
  time?: string;
  preference?: 'fastest' | 'least_transfers' | 'least_walking';
}

export interface TripSearchResponse {
  alternatives: Route[];
  search_timestamp: string;
  computation_time_ms: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchRoutes(request: PlanTripRequest): Observable<TripSearchResponse> {
    return this.http.post<TripSearchResponse>(
      `${this.apiUrl}/planner/search`,
      request
    );
  }
}
```

### Component Usage

```typescript
// src/app/features/planner/planner.component.ts

export class PlannerComponent {
  routes: Route[] = [];
  loading = false;

  constructor(private plannerService: PlannerService) {}

  searchRoute(fromStopId: string, toStopId: string) {
    this.loading = true;

    const request: PlanTripRequest = {
      from_stop_id: fromStopId,
      to_stop_id: toStopId,
      include_walking: true,
      max_alternatives: 3,
      preference: 'fastest'
    };

    this.plannerService.searchRoutes(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.routes = response.alternatives;
          console.log(`Found ${response.alternatives.length} routes`);
          console.log(`Computation time: ${response.computation_time_ms}ms`);
        },
        error: (error) => {
          console.error('Route search failed:', error);
        }
      });
  }
}
```

### Template Display

```html
<!-- src/app/features/planner/planner.component.html -->

<div *ngFor="let route of routes" class="route-card">
  <div class="route-header">
    <h3>Route {{ route.route_id }}</h3>
    <span *ngIf="route.recommended" class="badge">Recommended</span>
  </div>

  <div class="route-summary">
    <div>Total time: {{ route.total_time }} min</div>
    <div>Transfers: {{ route.transfers }}</div>
    <div>Walking distance: {{ route.walking_distance }}m</div>
    <div>Total stops: {{ route.total_stops }}</div>
  </div>

  <div class="route-steps">
    <div *ngFor="let step of route.steps; let i = index" class="step">
      <div class="step-number">{{ i + 1 }}</div>

      <div *ngIf="step.type === 'transit'" class="transit-step">
        <div class="route-info">
          <span class="route-number">{{ step.route_number }}</span>
          <span class="route-name">{{ step.route_name }}</span>
          <span class="vehicle-type">{{ step.vehicle_type }}</span>
        </div>
        <div>{{ step.start_stop.name }} → {{ step.end_stop.name }}</div>
        <div>{{ step.stop_count }} stops, {{ step.duration }} min</div>
      </div>

      <div *ngIf="step.type === 'walking'" class="walking-step">
        <div class="walking-icon">🚶</div>
        <div>Walk {{ step.distance }}m ({{ step.duration }} min)</div>
        <div>{{ step.start_stop.name }} → {{ step.end_stop.name }}</div>
      </div>
    </div>
  </div>
</div>
```

## Error Responses

### 400 Bad Request - Invalid Parameters

```json
{
  "statusCode": 400,
  "message": [
    "max_alternatives must not be greater than 5",
    "preference must be one of the following values: fastest, least_transfers, least_walking"
  ],
  "error": "Bad Request"
}
```

### 404 Not Found - No Route

```json
{
  "statusCode": 404,
  "message": "No route found between the specified stops",
  "error": "Not Found"
}
```

### 404 Not Found - Invalid Stop ID

```json
{
  "statusCode": 404,
  "message": "One or both stops not found",
  "error": "Not Found"
}
```

## Swagger UI

Teljes API dokumentáció böngészhető formában:

```
http://localhost:3000/api
```

- Try it out funkció teszt kérések küldéséhez
- Schema böngészése
- Példa request/response megtekintése
- HTTP status kódok magyarázata
