# Route-Stop Assignment API Documentation

This document provides examples for using the Route-Stop Assignment API endpoints.

## Overview

The Route-Stop Assignment API allows providers and admins to:
- Bulk assign stops to routes with order and arrival times
- Get all stops for a specific route
- Add a single stop to a route
- Remove a stop from a route

All modification endpoints require authentication and proper authorization (admin or provider role).

---

## Endpoints

### 1. Assign Stops to Route (Bulk)

**PUT** `/api/routes/:id/stops`

Replaces all existing stop assignments with new ones. This is a transactional operation.

**Authentication:** Required (Bearer Token)
**Authorization:** Admin or Provider (route owner)

**Request Body:**
```json
{
  "stops": [
    {
      "stop_id": "b1234567-89ab-cdef-0123-456789abcdef",
      "order": 1,
      "arrival_time": "08:00"
    },
    {
      "stop_id": "c2345678-9abc-def0-1234-56789abcdef0",
      "order": 2,
      "arrival_time": "08:15"
    },
    {
      "stop_id": "d3456789-abcd-ef01-2345-6789abcdef01",
      "order": 3,
      "arrival_time": "08:30"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/routes/{route-id}/stops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      {
        "stop_id": "b1234567-89ab-cdef-0123-456789abcdef",
        "order": 1,
        "arrival_time": "08:00"
      },
      {
        "stop_id": "c2345678-9abc-def0-1234-56789abcdef0",
        "order": 2,
        "arrival_time": "08:15"
      }
    ]
  }'
```

**Success Response (200):**
```json
{
  "message": "Stops successfully assigned to route"
}
```

**Error Responses:**

- **400 Bad Request** - Duplicate orders:
```json
{
  "statusCode": 400,
  "message": "Order values must be unique",
  "error": "Bad Request"
}
```

- **400 Bad Request** - Invalid stop IDs:
```json
{
  "statusCode": 400,
  "message": "Some stop IDs are invalid",
  "error": "Bad Request"
}
```

- **403 Forbidden** - User doesn't own route:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this route",
  "error": "Forbidden"
}
```

---

### 2. Get Route Stops

**GET** `/api/routes/:id/stops`

Retrieves all stops assigned to a route, ordered by sequence number.

**Authentication:** Not required (Public endpoint)

**cURL Example:**
```bash
curl http://localhost:3000/api/routes/{route-id}/stops
```

**Success Response (200):**
```json
[
  {
    "id": "rs-1234-5678-90ab",
    "order": 1,
    "arrival_time": "08:00",
    "stop": {
      "id": "b1234567-89ab-cdef-0123-456789abcdef",
      "name": "Main Station",
      "type": "bus_stop",
      "latitude": 47.4979,
      "longitude": 19.0402,
      "address": "1051 Budapest, Main Street 1",
      "is_active": true
    }
  },
  {
    "id": "rs-2345-6789-0abc",
    "order": 2,
    "arrival_time": "08:15",
    "stop": {
      "id": "c2345678-9abc-def0-1234-56789abcdef0",
      "name": "City Center",
      "type": "bus_stop",
      "latitude": 47.5002,
      "longitude": 19.0458,
      "address": "1052 Budapest, City Square 5",
      "is_active": true
    }
  },
  {
    "id": "rs-3456-789a-bcde",
    "order": 3,
    "arrival_time": null,
    "stop": {
      "id": "d3456789-abcd-ef01-2345-6789abcdef01",
      "name": "University Campus",
      "type": "bus_stop",
      "latitude": 47.5105,
      "longitude": 19.0523,
      "address": "1053 Budapest, Campus Road 10",
      "is_active": true
    }
  }
]
```

**Empty Response (200):**
```json
[]
```

---

### 3. Add Single Stop to Route

**POST** `/api/routes/:id/stops/:stopId`

Adds a single stop to a route with specified order and optional arrival time.

**Authentication:** Required (Bearer Token)
**Authorization:** Admin or Provider (route owner)

**Request Body:**
```json
{
  "order": 4,
  "arrival_time": "08:45"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/routes/{route-id}/stops/{stop-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": 4,
    "arrival_time": "08:45"
  }'
```

**Success Response (201):**
```json
{
  "id": "rs-4567-89ab-cdef",
  "route_id": "route-1234-5678-90ab",
  "stop_id": "e4567890-bcde-f012-3456-789abcdef012",
  "stop_order": 4,
  "arrival_time": "08:45",
  "created_at": "2025-01-08T10:30:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - Order already exists:
```json
{
  "statusCode": 400,
  "message": "Order 4 already exists for this route",
  "error": "Bad Request"
}
```

- **400 Bad Request** - Stop not found:
```json
{
  "statusCode": 400,
  "message": "Stop with ID 'invalid-id' not found",
  "error": "Bad Request"
}
```

---

### 4. Remove Stop from Route

**DELETE** `/api/routes/:id/stops/:stopId`

Removes a stop assignment from a route.

**Authentication:** Required (Bearer Token)
**Authorization:** Admin or Provider (route owner)

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/routes/{route-id}/stops/{stop-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "Stop removed from route"
}
```

**Error Response:**

- **403 Forbidden** - User doesn't own route:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this route",
  "error": "Forbidden"
}
```

---

## Validation Rules

### AssignStopsDto Validation

- **stops**: Array of stop assignments (required)
  - **stop_id**: Must be a valid UUID v4
  - **order**: Must be an integer >= 1
  - **arrival_time**: Optional, must match format `HH:mm` (24-hour format)
    - Valid examples: `08:00`, `14:30`, `23:59`
    - Invalid examples: `8:00`, `25:00`, `14:60`

### Business Rules

1. **Order Uniqueness**: All order values within a route must be unique
2. **Stop Validation**: All stop IDs must exist in the database
3. **Ownership**: Only the route owner (provider) or admin can modify stop assignments
4. **Transaction Safety**: Bulk assignment replaces all stops atomically

---

## Common Use Cases

### 1. Initial Route Setup

Assign all stops to a newly created route:

```bash
# Create route first
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route_number": "7E",
    "name": "Express Line 7",
    "is_accessible": true
  }'

# Assign stops
curl -X PUT http://localhost:3000/api/routes/{route-id}/stops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      { "stop_id": "stop-uuid-1", "order": 1, "arrival_time": "06:00" },
      { "stop_id": "stop-uuid-2", "order": 2, "arrival_time": "06:15" },
      { "stop_id": "stop-uuid-3", "order": 3, "arrival_time": "06:30" }
    ]
  }'
```

### 2. Add Intermediate Stop

Add a new stop between existing stops:

```bash
# First, get current stops
curl http://localhost:3000/api/routes/{route-id}/stops

# Add new stop with order that fits between existing ones
curl -X POST http://localhost:3000/api/routes/{route-id}/stops/{new-stop-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": 5,
    "arrival_time": "06:45"
  }'
```

### 3. Reorder Entire Route

Replace all stops with a new order:

```bash
curl -X PUT http://localhost:3000/api/routes/{route-id}/stops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      { "stop_id": "stop-uuid-3", "order": 1, "arrival_time": "06:00" },
      { "stop_id": "stop-uuid-1", "order": 2, "arrival_time": "06:20" },
      { "stop_id": "stop-uuid-2", "order": 3, "arrival_time": "06:40" }
    ]
  }'
```

### 4. Remove Specific Stop

```bash
curl -X DELETE http://localhost:3000/api/routes/{route-id}/stops/{stop-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing Coverage

All endpoints have comprehensive unit tests covering:

- ✅ Successful operations
- ✅ Duplicate order validation
- ✅ Invalid stop ID validation
- ✅ Empty stops array handling
- ✅ Ownership verification
- ✅ Order conflict detection
- ✅ Non-existent stop handling

**Test Command:**
```bash
npm test -- routes.service.spec.ts
```

**Test Results:** 23/23 passed (100% success rate)

---

## Integration with Swagger

All endpoints are fully documented in Swagger UI:

1. Start the backend: `npm run start:dev`
2. Navigate to: `http://localhost:3000/api`
3. Expand the **Routes** section
4. Find the following endpoints:
   - `PUT /routes/{id}/stops` - Assign stops to route
   - `GET /routes/{id}/stops` - Get route stops
   - `POST /routes/{id}/stops/{stopId}` - Add single stop
   - `DELETE /routes/{id}/stops/{stopId}` - Remove stop

---

## Database Schema

The route-stop assignment uses the `route_stops` table:

```sql
CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  arrival_time VARCHAR(5),  -- HH:mm format
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (route_id, stop_order),  -- Ensures unique order per route
  UNIQUE (route_id, stop_id)      -- Prevents duplicate stop assignments
);
```

---

## Notes

- Arrival times are optional and stored in `HH:mm` format
- Stops are returned in ascending order by the `stop_order` field
- Bulk assignment is atomic - either all stops are assigned or none
- Removing a stop does not affect other stop orders (no automatic reordering)
- Public users can view route stops but cannot modify them
