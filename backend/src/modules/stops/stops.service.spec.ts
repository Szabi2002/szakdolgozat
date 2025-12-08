import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StopsService } from './stops.service';
import { SupabaseService } from '@common/supabase/supabase.service';
import { CreateStopDto, UpdateStopDto, StopFilterDto, NearbyStopsDto } from './dto';

describe('StopsService', () => {
  let service: StopsService;
  let supabaseService: SupabaseService;

  const mockAdminId = 'admin-123';

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
        StopsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<StopsService>(StopsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a stop successfully', async () => {
      const createDto: CreateStopDto = {
        name: 'Test Stop',
        latitude: 47.497913,
        longitude: 19.040236,
        type: 'bus_stop',
        is_accessible: true,
      };

      const mockStop = {
        id: 'stop-123',
        name: 'Test Stop',
        latitude: 47.497913,
        longitude: 19.040236,
        type: 'bus_stop',
        is_accessible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockStop, error: null }),
          }),
        }),
      });

      const result = await service.create(mockAdminId, createDto);

      expect(result).toEqual({ ...mockStop, routes_count: 0 });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stops');
    });

    it('should throw BadRequestException on duplicate coordinates', async () => {
      const createDto: CreateStopDto = {
        name: 'Test Stop',
        latitude: 47.497913,
        longitude: 19.040236,
        type: 'bus_stop',
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

      await expect(service.create(mockAdminId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated stops', async () => {
      const filters: StopFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockStops = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 47.5,
          longitude: 19.0,
          type: 'bus_stop',
          is_accessible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          route_stops: [{ count: 3 }],
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockStops,
              error: null,
              count: 1,
            }),
          }),
        }),
      });

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].routes_count).toBe(3);
    });

    it('should apply bounding box filter', async () => {
      const filters: StopFilterDto = {
        sw_lat: 47.4,
        sw_lng: 19.0,
        ne_lat: 47.6,
        ne_lng: 19.2,
        page: 1,
        limit: 10,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await service.findAll(filters);

      expect(mockQuery.gte).toHaveBeenCalledTimes(2);
      expect(mockQuery.lte).toHaveBeenCalledTimes(2);
    });
  });

  describe('findNearby', () => {
    it('should find nearby stops using RPC', async () => {
      const nearbyDto: NearbyStopsDto = {
        latitude: 47.497913,
        longitude: 19.040236,
        radius: 500,
      };

      const mockStops = [
        {
          id: 'stop-1',
          name: 'Nearby Stop',
          latitude: 47.498,
          longitude: 19.041,
          type: 'bus_stop',
          is_accessible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          distance: 150,
        },
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockStops,
        error: null,
      });

      const result = await service.findNearby(nearbyDto);

      expect(result).toHaveLength(1);
      expect(result[0].distance).toBe(150);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('find_nearby_stops', {
        lat_center: nearbyDto.latitude,
        lng_center: nearbyDto.longitude,
        radius_meters: nearbyDto.radius,
      });
    });

    it('should fallback to client-side calculation when RPC fails', async () => {
      const nearbyDto: NearbyStopsDto = {
        latitude: 47.497913,
        longitude: 19.040236,
        radius: 500,
      };

      const mockStops = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 47.498,
          longitude: 19.041,
          type: 'bus_stop',
          is_accessible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // RPC returns error
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Function not found' },
      });

      // Fallback query
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockResolvedValue({
                  data: mockStops,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.findNearby(nearbyDto);

      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('distance');
    });
  });

  describe('findOne', () => {
    it('should return stop with routes', async () => {
      const stopId = 'stop-123';
      const mockStop = {
        id: stopId,
        name: 'Test Stop',
        latitude: 47.5,
        longitude: 19.0,
        type: 'bus_stop',
        is_accessible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        route_stops: [
          {
            stop_order: 1,
            routes: {
              id: 'route-1',
              route_number: '1A',
              name: 'Route 1',
            },
          },
        ],
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockStop, error: null }),
          }),
        }),
      });

      const result = await service.findOne(stopId);

      expect(result.id).toBe(stopId);
      expect(result.routes).toHaveLength(1);
      expect(result.routes_count).toBe(1);
    });

    it('should throw NotFoundException when stop not found', async () => {
      const stopId = 'non-existent';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      await expect(service.findOne(stopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update stop successfully', async () => {
      const stopId = 'stop-123';
      const updateDto: UpdateStopDto = {
        name: 'Updated Stop',
      };

      const mockStop = {
        id: stopId,
        name: 'Updated Stop',
        latitude: 47.5,
        longitude: 19.0,
        type: 'bus_stop',
        is_accessible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockStop, error: null }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      });

      const result = await service.update(mockAdminId, stopId, updateDto);

      expect(result.name).toBe('Updated Stop');
      expect(result.routes_count).toBe(2);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when stop is used in routes', async () => {
      const stopId = 'stop-123';

      // Mock fetching stop data
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { name: 'Test', type: 'bus_stop' }, error: null }),
          }),
        }),
      });

      // Mock checking route count
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      });

      await expect(service.remove(mockAdminId, stopId)).rejects.toThrow(BadRequestException);
    });

    it('should delete stop successfully when not used', async () => {
      const stopId = 'stop-123';

      // Mock fetching stop data
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { name: 'Test', type: 'bus_stop' }, error: null }),
          }),
        }),
      });

      // Mock checking route count
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      });

      // Mock delete
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock activity log insert
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await expect(service.remove(mockAdminId, stopId)).resolves.not.toThrow();
    });
  });
});
