import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { SupabaseService } from '@common/supabase/supabase.service';

describe('PlannerService', () => {
  let service: PlannerService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<PlannerService>(PlannerService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findRoute', () => {
    const stopA = {
      id: 'stop-a-uuid',
      name: 'Stop A',
      latitude: 47.5,
      longitude: 19.0,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopB = {
      id: 'stop-b-uuid',
      name: 'Stop B',
      latitude: 47.51,
      longitude: 19.01,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopC = {
      id: 'stop-c-uuid',
      name: 'Stop C',
      latitude: 47.52,
      longitude: 19.02,
      type: 'tram',
      is_accessible: false,
      description: null,
    };

    it('should find direct route with single route (no transfers)', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - direct connection on Route 1
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            arrival_time: '08:10:00',
            departure_time: '08:11:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopB.id);

      expect(result).toBeDefined();
      expect(result.transfers).toBe(0);
      expect(result.routes.length).toBe(1);
      expect(result.routes[0].route_number).toBe('1');
      expect(result.total_stops).toBe(2);
      expect(result.path.length).toBe(2);
      expect(result.path[0].id).toBe(stopA.id);
      expect(result.path[1].id).toBe(stopB.id);
    });

    it('should find route with one transfer (2 routes)', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopC.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - A->B on Route 1, B->C on Route 2
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            arrival_time: '08:10:00',
            departure_time: '08:11:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopB,
          },
          {
            id: 'rs3',
            route_id: 'route-2-uuid',
            stop_id: stopB.id,
            stop_order: 1,
            arrival_time: '08:15:00',
            departure_time: '08:16:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: stopB,
          },
          {
            id: 'rs4',
            route_id: 'route-2-uuid',
            stop_id: stopC.id,
            stop_order: 2,
            arrival_time: '08:25:00',
            departure_time: '08:26:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: stopC,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopC.id);

      expect(result).toBeDefined();
      expect(result.transfers).toBe(1);
      expect(result.routes.length).toBe(2);
      expect(result.routes[0].route_number).toBe('1');
      expect(result.routes[1].route_number).toBe('2');
      expect(result.total_stops).toBe(3);
      expect(result.path.length).toBe(3);
    });

    it('should throw NotFoundException when no route exists (isolated stops)', async () => {
      const isolatedStopId = 'isolated-stop-uuid';

      // Mock stops validation - both exist
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: isolatedStopId }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - only Stop A and B have connections
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            arrival_time: '08:10:00',
            departure_time: '08:11:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      await expect(service.findRoute(stopA.id, isolatedStopId)).rejects.toThrow(
        'No route found between the specified stops',
      );
    });

    it('should handle same stop (from === to)', async () => {
      // Mock single stop fetch
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: stopA,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const result = await service.findRoute(stopA.id, stopA.id);

      expect(result).toBeDefined();
      expect(result.transfers).toBe(0);
      expect(result.routes.length).toBe(0);
      expect(result.total_stops).toBe(1);
      expect(result.estimated_duration_minutes).toBe(0);
      expect(result.path.length).toBe(1);
      expect(result.path[0].id).toBe(stopA.id);
    });

    it('should throw NotFoundException for invalid stop ID', async () => {
      const invalidStopId = 'invalid-uuid';

      // Mock stops validation - only one stop found
      const selectMock = jest.fn().mockReturnThis();
      const inMock = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock,
        in: inMock,
      });

      await expect(service.findRoute(stopA.id, invalidStopId)).rejects.toThrow(
        'One or both stops not found',
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error during validation
      const selectMock = jest.fn().mockReturnThis();
      const inMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock,
        in: inMock,
      });

      await expect(service.findRoute(stopA.id, stopB.id)).rejects.toThrow(
        'Failed to validate stops',
      );
    });
  });

  describe('PlannerService - Walking Integration', () => {
    const stopA = {
      id: 'stop-a-uuid',
      name: 'Stop A',
      latitude: 47.5,
      longitude: 19.0,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopB = {
      id: 'stop-b-uuid',
      name: 'Stop B',
      latitude: 47.503, // ~400m from Stop A (walkable)
      longitude: 19.005,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopC = {
      id: 'stop-c-uuid',
      name: 'Stop C',
      latitude: 47.52, // ~2km from Stop A (not walkable directly)
      longitude: 19.02,
      type: 'tram',
      is_accessible: false,
      description: null,
    };

    it('should find walking route when stops are within walking distance', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - two isolated stops with no transit connection
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-2-uuid',
            stop_id: stopB.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopB.id);

      expect(result).toBeDefined();
      expect(result.routes.length).toBeGreaterThan(0);

      // Should find at least one walking segment
      const hasWalkingSegment = result.routes.some((segment) => segment.type === 'walking');
      expect(hasWalkingSegment).toBe(true);

      // Walking segment should have distance information
      const walkingSegment = result.routes.find((segment) => segment.type === 'walking');
      if (walkingSegment) {
        expect(walkingSegment.distance).toBeDefined();
        expect(walkingSegment.distance).toBeGreaterThan(0);
        expect(walkingSegment.duration).toBeGreaterThan(0);
      }
    });

    it('should prefer transit over walking when both are available', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - direct transit connection exists AND walking is possible
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            arrival_time: '08:05:00',
            departure_time: '08:06:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopB.id);

      expect(result).toBeDefined();

      // Should prefer transit over walking (faster)
      expect(result.routes[0].type).toBe('transit');
      expect(result.routes[0].route_id).toBe('route-1-uuid');
    });

    it('should combine transit + walking for optimal multimodal route', async () => {
      // Setup: A -> C (transit on Route 1), C -> D (walkable ~400m)
      const stopD = {
        id: 'stop-d-uuid',
        name: 'Stop D',
        latitude: 47.523, // Close to C (~400m, walkable)
        longitude: 19.025,
        type: 'bus',
        is_accessible: true,
        description: null,
      };

      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopD.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - Route 1: A -> C, then walk C -> D
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopC.id,
            stop_order: 2,
            arrival_time: '08:10:00',
            departure_time: '08:11:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopC,
          },
          {
            id: 'rs3',
            route_id: 'route-2-uuid',
            stop_id: stopD.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: stopD,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopD.id);

      expect(result).toBeDefined();

      // Should have at least one segment (could be transit + walking, or just one mode)
      expect(result.routes.length).toBeGreaterThanOrEqual(1);

      // Should complete the journey from A to D
      expect(result.path[0].id).toBe(stopA.id);
      expect(result.path[result.path.length - 1].id).toBe(stopD.id);
    });

    it('should not create walking edges beyond MAX_WALKING_DISTANCE', async () => {
      const farStopA = {
        id: 'far-stop-a-uuid',
        name: 'Far Stop A',
        latitude: 47.5,
        longitude: 19.0,
        type: 'bus',
        is_accessible: true,
        description: null,
      };

      const farStopB = {
        id: 'far-stop-b-uuid',
        name: 'Far Stop B',
        latitude: 47.52, // ~2.5km away (> 800m MAX_WALKING_DISTANCE)
        longitude: 19.02,
        type: 'bus',
        is_accessible: true,
        description: null,
      };

      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: farStopA.id }, { id: farStopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - no transit connection
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: farStopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: farStopA,
          },
          {
            id: 'rs2',
            route_id: 'route-2-uuid',
            stop_id: farStopB.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: farStopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      // Should throw NotFoundException because stops are too far apart for walking
      // and there's no transit connection
      await expect(service.findRoute(farStopA.id, farStopB.id)).rejects.toThrow(
        'No route found between the specified stops',
      );
    });

    it('should include duration and distance in walking segments', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - no direct transit
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '1', name: 'Route 1', is_active: true },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-2-uuid',
            stop_id: stopB.id,
            stop_order: 1,
            arrival_time: '08:00:00',
            departure_time: '08:01:00',
            routes: { route_number: '2', name: 'Route 2', is_active: true },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const result = await service.findRoute(stopA.id, stopB.id);

      expect(result).toBeDefined();

      const walkingSegment = result.routes.find((segment) => segment.type === 'walking');
      expect(walkingSegment).toBeDefined();

      if (walkingSegment) {
        // Verify distance is provided
        expect(walkingSegment.distance).toBeDefined();
        expect(walkingSegment.distance).toBeGreaterThan(0);
        expect(walkingSegment.distance).toBeLessThanOrEqual(800); // MAX_WALKING_DISTANCE_METERS

        // Verify duration is calculated
        expect(walkingSegment.duration).toBeDefined();
        expect(walkingSegment.duration).toBeGreaterThan(0);

        // Duration should be reasonable (5 km/h walking speed)
        // ~400m should take ~5 minutes
        expect(walkingSegment.duration).toBeLessThan(20);
      }
    });
  });

  describe('findRoutes - Multiple Alternatives', () => {
    const stopA = {
      id: 'stop-a-uuid',
      name: 'Stop A',
      latitude: 47.5,
      longitude: 19.0,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopB = {
      id: 'stop-b-uuid',
      name: 'Stop B',
      latitude: 47.51,
      longitude: 19.01,
      type: 'bus',
      is_accessible: true,
      description: null,
    };

    const stopC = {
      id: 'stop-c-uuid',
      name: 'Stop C',
      latitude: 47.52,
      longitude: 19.02,
      type: 'tram',
      is_accessible: false,
      description: null,
    };

    it('should return multiple distinct routes', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopC.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - multiple possible paths
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopB,
          },
          {
            id: 'rs3',
            route_id: 'route-1-uuid',
            stop_id: stopC.id,
            stop_order: 3,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopC,
          },
          {
            id: 'rs4',
            route_id: 'route-2-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            routes: { route_number: '2', name: 'Route 2', is_active: true, type: 'tram' },
            stops: stopA,
          },
          {
            id: 'rs5',
            route_id: 'route-2-uuid',
            stop_id: stopC.id,
            stop_order: 2,
            routes: { route_number: '2', name: 'Route 2', is_active: true, type: 'tram' },
            stops: stopC,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const routes = await service.findRoutes({
        from_stop_id: stopA.id,
        to_stop_id: stopC.id,
        max_alternatives: 3,
      });

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.length).toBeLessThanOrEqual(3);
    });

    it('should respect max_alternatives limit', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const routes = await service.findRoutes({
        from_stop_id: stopA.id,
        to_stop_id: stopB.id,
        max_alternatives: 2,
      });

      expect(routes.length).toBeLessThanOrEqual(2);
    });

    it('should mark first route as recommended', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopB.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopB.id,
            stop_order: 2,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopB,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const routes = await service.findRoutes({
        from_stop_id: stopA.id,
        to_stop_id: stopB.id,
      });

      expect(routes[0].recommended).toBe(true);
      expect(routes[0].recommendation_reason).toBeDefined();
    });

    it('should sort by preference: fastest', async () => {
      // Mock stops validation
      const selectMock1 = jest.fn().mockReturnThis();
      const inMock1 = jest.fn().mockResolvedValue({
        data: [{ id: stopA.id }, { id: stopC.id }],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock1,
        in: inMock1,
      });

      // Mock route_stops data - multiple routes with different durations
      const selectMock2 = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock1 = jest.fn().mockReturnThis();
      const orderMock2 = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rs1',
            route_id: 'route-1-uuid',
            stop_id: stopA.id,
            stop_order: 1,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopA,
          },
          {
            id: 'rs2',
            route_id: 'route-1-uuid',
            stop_id: stopC.id,
            stop_order: 2,
            routes: { route_number: '1', name: 'Route 1', is_active: true, type: 'bus' },
            stops: stopC,
          },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock2,
        eq: eqMock,
        order: orderMock1.mockReturnValue({ order: orderMock2 }),
      });

      const routes = await service.findRoutes({
        from_stop_id: stopA.id,
        to_stop_id: stopC.id,
        preference: 'fastest',
      });

      // Check sorted by total_time ascending
      for (let i = 1; i < routes.length; i++) {
        expect(routes[i].total_time).toBeGreaterThanOrEqual(routes[i - 1].total_time);
      }
    });

    it('should handle same stop gracefully', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: stopA,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      });

      const routes = await service.findRoutes({
        from_stop_id: stopA.id,
        to_stop_id: stopA.id,
      });

      expect(routes).toBeDefined();
      expect(routes.length).toBe(1);
      expect(routes[0].total_time).toBe(0);
      expect(routes[0].transfers).toBe(0);
      expect(routes[0].recommended).toBe(true);
    });
  });
});
