import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import {
  CreateStopDto,
  UpdateStopDto,
  StopFilterDto,
  NearbyStopsDto,
  StopResponseDto,
  StopListResponseDto,
} from './dto';

@Injectable()
export class StopsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create a new stop (admin only)
   * @param dto - Stop creation data
   * @returns Created stop
   */
  async create(dto: CreateStopDto): Promise<StopResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('stops')
      .insert({
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        type: dto.type,
        is_accessible: dto.is_accessible ?? false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new BadRequestException('A stop with similar coordinates already exists');
      }
      throw new InternalServerErrorException('Failed to create stop: ' + error.message);
    }

    return {
      ...data,
      routes_count: 0,
    };
  }

  /**
   * Find all stops with filtering and pagination
   * @param filters - Filter and pagination options
   * @returns Paginated list of stops
   */
  async findAll(filters: StopFilterDto): Promise<StopListResponseDto> {
    const supabase = this.supabaseService.getClient();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = supabase.from('stops').select('*, route_stops(count)', { count: 'exact' });

    // Search filter
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Type filter
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Bounding box filter (geographic bounds)
    if (filters.sw_lat && filters.sw_lng && filters.ne_lat && filters.ne_lng) {
      query = query
        .gte('latitude', filters.sw_lat)
        .lte('latitude', filters.ne_lat)
        .gte('longitude', filters.sw_lng)
        .lte('longitude', filters.ne_lng);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new InternalServerErrorException('Failed to fetch stops: ' + error.message);
    }

    // Transform data to include routes_count
    const stops: StopResponseDto[] = (data || []).map((stop: any) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      type: stop.type,
      is_accessible: stop.is_accessible,
      created_at: stop.created_at,
      updated_at: stop.updated_at,
      routes_count: stop.route_stops?.[0]?.count || 0,
    }));

    return {
      data: stops,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find stops within a radius using spatial query
   * @param dto - Center coordinates and radius
   * @returns List of nearby stops sorted by distance
   */
  async findNearby(dto: NearbyStopsDto): Promise<StopResponseDto[]> {
    const supabase = this.supabaseService.getClient();

    // Use Haversine formula for distance calculation
    // This is a simplified query - in production, you might want to use PostGIS
    const { data, error } = await supabase.rpc('find_nearby_stops', {
      lat_center: dto.latitude,
      lng_center: dto.longitude,
      radius_meters: dto.radius || 500,
    });

    if (error) {
      // Fallback to client-side calculation if RPC doesn't exist
      return this.findNearbyFallback(dto);
    }

    return (data || []).map((stop: any) => ({
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      type: stop.type,
      is_accessible: stop.is_accessible,
      created_at: stop.created_at,
      updated_at: stop.updated_at,
      distance: stop.distance,
    }));
  }

  /**
   * Fallback method for nearby stops using client-side filtering
   * Used when PostGIS/RPC is not available
   */
  private async findNearbyFallback(dto: NearbyStopsDto): Promise<StopResponseDto[]> {
    const supabase = this.supabaseService.getClient();

    // Approximate bounding box (1 degree ~ 111km)
    const radiusInDegrees = (dto.radius || 500) / 111000;

    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .gte('latitude', dto.latitude - radiusInDegrees)
      .lte('latitude', dto.latitude + radiusInDegrees)
      .gte('longitude', dto.longitude - radiusInDegrees)
      .lte('longitude', dto.longitude + radiusInDegrees);

    if (error) {
      throw new InternalServerErrorException('Failed to fetch nearby stops: ' + error.message);
    }

    // Calculate distance using Haversine formula
    const stopsWithDistance = (data || []).map((stop: any) => {
      const distance = this.calculateDistance(
        dto.latitude,
        dto.longitude,
        stop.latitude,
        stop.longitude,
      );
      return {
        ...stop,
        distance,
      };
    });

    // Filter by actual radius and sort by distance
    return stopsWithDistance
      .filter((stop) => stop.distance <= (dto.radius || 500))
      .sort((a, b) => a.distance - b.distance)
      .map((stop) => ({
        id: stop.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        type: stop.type,
        is_accessible: stop.is_accessible,
        created_at: stop.created_at,
        updated_at: stop.updated_at,
        distance: stop.distance,
      }));
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns Distance in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find one stop by ID with associated routes
   * @param id - Stop ID
   * @returns Stop with routes details
   */
  async findOne(id: string): Promise<StopResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Fetch stop with routes
    const { data, error } = await supabase
      .from('stops')
      .select(
        `
        *,
        route_stops (
          stop_order,
          routes (
            id,
            route_number,
            name
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Stop with ID '${id}' not found`);
    }

    // Transform routes data
    const routes = (data.route_stops || [])
      .map((rs: any) => ({
        id: rs.routes.id,
        route_number: rs.routes.route_number,
        name: rs.routes.name,
        stop_order: rs.stop_order,
      }))
      .sort((a: any, b: any) => a.route_number.localeCompare(b.route_number));

    return {
      id: data.id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type,
      is_accessible: data.is_accessible,
      created_at: data.created_at,
      updated_at: data.updated_at,
      routes_count: routes.length,
      routes,
    };
  }

  /**
   * Update a stop (admin only)
   * @param id - Stop ID
   * @param dto - Update data
   * @returns Updated stop
   */
  async update(id: string, dto: UpdateStopDto): Promise<StopResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('stops')
      .update({
        ...(dto.name && { name: dto.name }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.type && { type: dto.type }),
        ...(dto.is_accessible !== undefined && { is_accessible: dto.is_accessible }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('A stop with similar coordinates already exists');
      }
      throw new InternalServerErrorException('Failed to update stop: ' + error.message);
    }

    if (!data) {
      throw new NotFoundException(`Stop with ID '${id}' not found`);
    }

    // Fetch routes count
    const { count } = await supabase
      .from('route_stops')
      .select('*', { count: 'exact', head: true })
      .eq('stop_id', id);

    return {
      ...data,
      routes_count: count || 0,
    };
  }

  /**
   * Delete a stop (admin only)
   * Note: This is a hard delete. Consider soft delete in production.
   * @param id - Stop ID
   */
  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Check if stop is used in any routes
    const { count } = await supabase
      .from('route_stops')
      .select('*', { count: 'exact', head: true })
      .eq('stop_id', id);

    if (count && count > 0) {
      throw new BadRequestException(
        `Cannot delete stop. It is currently used in ${count} route(s).`,
      );
    }

    const { error } = await supabase.from('stops').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Failed to delete stop: ' + error.message);
    }
  }
}
