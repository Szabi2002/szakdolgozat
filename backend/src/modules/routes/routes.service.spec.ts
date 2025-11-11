import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateRouteDto, UpdateRouteDto, RouteFilterDto, AssignStopsDto } from './dto';

describe('RoutesService', () => {
  let service: RoutesService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a route successfully', async () => {
      const userId = 'user-123';
      const createDto: CreateRouteDto = {
        route_number: '1A',
        name: 'Test Route',
        is_accessible: true,
      };

      const mockRoute = {
        id: 'route-123',
        route_number: '1A',
        name: 'Test Route',
        provider_id: userId,
        is_accessible: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
          }),
        }),
      });

      const result = await service.create(userId, createDto);

      expect(result).toEqual({ ...mockRoute, stops_count: 0 });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
    });

    it('should throw BadRequestException on duplicate route number', async () => {
      const userId = 'user-123';
      const createDto: CreateRouteDto = {
        route_number: '1A',
        name: 'Test Route',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'Unique violation' },
            }),
          }),
        }),
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated routes', async () => {
      const filters: RouteFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockRoutes = [
        {
          id: 'route-1',
          route_number: '1A',
          name: 'Route 1',
          provider_id: 'user-1',
          is_accessible: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          route_stops: [{ count: 5 }],
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockRoutes,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.data[0].stops_count).toBe(5);
    });

    it('should apply search filter', async () => {
      const filters: RouteFilterDto = {
        search: '1A',
        page: 1,
        limit: 10,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await service.findAll(filters);

      expect(mockQuery.or).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return route with stops', async () => {
      const routeId = 'route-123';
      const mockRoute = {
        id: routeId,
        route_number: '1A',
        name: 'Test Route',
        provider_id: 'user-1',
        is_accessible: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        route_stops: [
          {
            stop_order: 1,
            stops: {
              id: 'stop-1',
              name: 'Stop 1',
              type: 'bus_stop',
              latitude: 47.5,
              longitude: 19.0,
            },
          },
        ],
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
          }),
        }),
      });

      const result = await service.findOne(routeId);

      expect(result.id).toBe(routeId);
      expect(result.stops).toHaveLength(1);
      expect(result.stops_count).toBe(1);
    });

    it('should throw NotFoundException when route not found', async () => {
      const routeId = 'non-existent';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      await expect(service.findOne(routeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkOwnership', () => {
    it('should pass for admin role', async () => {
      await expect(service.checkOwnership('route-123', 'user-123', 'admin')).resolves.not.toThrow();
    });

    it('should pass for route owner', async () => {
      const routeId = 'route-123';
      const userId = 'user-123';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { provider_id: userId },
              error: null,
            }),
          }),
        }),
      });

      await expect(service.checkOwnership(routeId, userId)).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const routeId = 'route-123';
      const userId = 'user-456';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { provider_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      });

      await expect(service.checkOwnership(routeId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when route does not exist', async () => {
      const routeId = 'non-existent';
      const userId = 'user-123';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(service.checkOwnership(routeId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update route successfully', async () => {
      const routeId = 'route-123';
      const userId = 'user-123';
      const updateDto: UpdateRouteDto = {
        name: 'Updated Route',
      };

      const mockRoute = {
        id: routeId,
        route_number: '1A',
        name: 'Updated Route',
        provider_id: userId,
        is_accessible: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock checkOwnership
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { provider_id: userId },
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
            }),
          }),
        }),
      });

      // Mock count
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      });

      const result = await service.update(routeId, userId, updateDto);

      expect(result.name).toBe('Updated Route');
      expect(result.stops_count).toBe(3);
    });
  });

  describe('remove', () => {
    it('should soft delete route successfully', async () => {
      const routeId = 'route-123';
      const userId = 'user-123';

      const mockRoute = {
        id: routeId,
        route_number: '1A',
        name: 'Test Route',
        provider_id: userId,
        is_accessible: true,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock checkOwnership
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { provider_id: userId },
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
            }),
          }),
        }),
      });

      const result = await service.remove(routeId, userId);

      expect(result.is_active).toBe(false);
    });
  });

  describe('Route-Stop Assignment', () => {
    describe('assignStops', () => {
      it('should assign stops to route successfully', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const dto: AssignStopsDto = {
          stops: [
            { stop_id: 'stop-1', order: 1, arrival_time: '10:00' },
            { stop_id: 'stop-2', order: 2, arrival_time: '10:15' },
          ],
        };

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock validate stops exist
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'stop-1' }, { id: 'stop-2' }],
              error: null,
            }),
          }),
        });

        // Mock delete existing stops
        mockSupabaseClient.from.mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

        // Mock insert new stops
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null }),
        });

        await service.assignStops(routeId, userId, dto);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('stops');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('route_stops');
      });

      it('should throw error for duplicate orders', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const dto: AssignStopsDto = {
          stops: [
            { stop_id: 'stop-1', order: 1 },
            { stop_id: 'stop-2', order: 1 }, // duplicate order!
          ],
        };

        // Mock checkOwnership (for both test calls)
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        await expect(service.assignStops(routeId, userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.assignStops(routeId, userId, dto)).rejects.toThrow(
          'Order values must be unique',
        );
      });

      it('should throw error for invalid stop IDs', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const dto: AssignStopsDto = {
          stops: [{ stop_id: 'invalid-id', order: 1 }],
        };

        // First call - Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // First call - Mock validate stops - return empty array (stop not found)
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [], // no stops found
              error: null,
            }),
          }),
        });

        await expect(service.assignStops(routeId, userId, dto)).rejects.toThrow(
          BadRequestException,
        );

        // Second call - Mock checkOwnership again
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Second call - Mock validate stops again
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [], // no stops found
              error: null,
            }),
          }),
        });

        await expect(service.assignStops(routeId, userId, dto)).rejects.toThrow(
          'Some stop IDs are invalid',
        );
      });

      it('should handle empty stops array', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const dto: AssignStopsDto = {
          stops: [],
        };

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock delete existing stops
        mockSupabaseClient.from.mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

        await service.assignStops(routeId, userId, dto);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('route_stops');
      });
    });

    describe('getRouteStops', () => {
      it('should return route stops in order', async () => {
        const routeId = 'route-123';
        const mockData = [
          {
            id: 'rs-1',
            stop_order: 1,
            arrival_time: '10:00',
            stops: {
              id: 'stop-1',
              name: 'Stop 1',
              type: 'bus',
              latitude: 47.5,
              longitude: 19.0,
              is_accessible: true,
            },
          },
          {
            id: 'rs-2',
            stop_order: 2,
            arrival_time: '10:15',
            stops: {
              id: 'stop-2',
              name: 'Stop 2',
              type: 'bus',
              latitude: 47.6,
              longitude: 19.1,
              is_accessible: false,
            },
          },
        ];

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        });

        const result = await service.getRouteStops(routeId);

        expect(result).toHaveLength(2);
        expect(result[0].order).toBe(1);
        expect(result[0].stop.name).toBe('Stop 1');
        expect(result[1].order).toBe(2);
      });

      it('should return empty array when no stops assigned', async () => {
        const routeId = 'route-123';

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });

        const result = await service.getRouteStops(routeId);

        expect(result).toEqual([]);
      });
    });

    describe('addStopToRoute', () => {
      it('should add a single stop to route', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const stopId = 'stop-1';
        const order = 1;
        const arrivalTime = '10:00';

        const mockRouteStop = {
          id: 'rs-1',
          route_id: routeId,
          stop_id: stopId,
          stop_order: order,
          arrival_time: arrivalTime,
          created_at: new Date().toISOString(),
        };

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock validate stop exists
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: stopId },
                error: null,
              }),
            }),
          }),
        });

        // Mock check if order exists
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        });

        // Mock insert
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockRouteStop,
                error: null,
              }),
            }),
          }),
        });

        const result = await service.addStopToRoute(routeId, userId, stopId, order, arrivalTime);

        expect(result).toEqual(mockRouteStop);
      });

      it('should throw error when order already exists', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const stopId = 'stop-1';
        const order = 1;

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock validate stop exists
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: stopId },
                error: null,
              }),
            }),
          }),
        });

        // Mock check if order exists - return existing record
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: 'existing-rs' },
                  error: null,
                }),
              }),
            }),
          }),
        });

        await expect(service.addStopToRoute(routeId, userId, stopId, order)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw error when stop does not exist', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const stopId = 'invalid-stop';
        const order = 1;

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock validate stop exists - return null
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        });

        await expect(service.addStopToRoute(routeId, userId, stopId, order)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('removeStopFromRoute', () => {
      it('should remove stop from route successfully', async () => {
        const routeId = 'route-123';
        const userId = 'user-123';
        const stopId = 'stop-1';

        // Mock checkOwnership
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { provider_id: userId },
                error: null,
              }),
            }),
          }),
        });

        // Mock delete
        mockSupabaseClient.from.mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        });

        await service.removeStopFromRoute(routeId, userId, stopId);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('route_stops');
      });
    });
  });
});
