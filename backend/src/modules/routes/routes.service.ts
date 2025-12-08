import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteFilterDto,
  RouteResponseDto,
  RouteListResponseDto,
  AssignStopsDto,
} from './dto';

@Injectable()
export class RoutesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create a new route
   * @param userId - Provider user ID from JWT
   * @param dto - Route creation data
   * @returns Created route
   */
  async create(userId: string, dto: CreateRouteDto): Promise<RouteResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('routes')
      .insert({
        route_number: dto.route_number,
        name: dto.name,
        provider_id: userId,
        is_accessible: dto.is_accessible ?? false,
        route_type: dto.route_type,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new BadRequestException(
          `Route with number '${dto.route_number}' already exists for this provider`,
        );
      }
      throw new InternalServerErrorException('Failed to create route: ' + error.message);
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: userId,
      action: 'create_route',
      details: {
        target_type: 'route',
        target_id: data.id,
        route_number: data.route_number,
        name: data.name,
        is_accessible: data.is_accessible,
      },
    });

    return {
      ...data,
      stops_count: 0,
    };
  }

  /**
   * Find all routes with filtering and pagination
   * @param filters - Filter and pagination options
   * @returns Paginated list of routes
   */
  async findAll(filters: RouteFilterDto): Promise<RouteListResponseDto> {
    const supabase = this.supabaseService.getClient();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = supabase
      .from('routes')
      .select('*, route_stops(count)', { count: 'exact' })
      .eq('is_active', true);

    // Search filter
    if (filters.search) {
      query = query.or(`route_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }

    // Provider filter
    if (filters.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('route_number', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new InternalServerErrorException('Failed to fetch routes: ' + error.message);
    }

    // Transform data to include stops_count
    const routes: RouteResponseDto[] = (data || []).map((route: any) => ({
      id: route.id,
      route_number: route.route_number,
      name: route.name,
      provider_id: route.provider_id,
      is_accessible: route.is_accessible,
      is_active: route.is_active,
      route_type: route.route_type,
      created_at: route.created_at,
      updated_at: route.updated_at,
      stops_count: route.route_stops?.[0]?.count || 0,
    }));

    return {
      data: routes,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find one route by ID with associated stops
   * @param id - Route ID
   * @returns Route with stops details
   */
  async findOne(id: string): Promise<RouteResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Fetch route with stops
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_stops (
          stop_order,
          arrival_offset,
          stops (
            id,
            name,
            type,
            latitude,
            longitude
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Route with ID '${id}' not found`);
    }

    // Transform stops data
    const stops = (data.route_stops || [])
      .map((rs: any) => ({
        id: rs.stops.id,
        name: rs.stops.name,
        type: rs.stops.type,
        latitude: rs.stops.latitude,
        longitude: rs.stops.longitude,
        stop_order: rs.stop_order,
        arrival_offset: rs.arrival_offset,
      }))
      .sort((a: any, b: any) => a.stop_order - b.stop_order);

    return {
      id: data.id,
      route_number: data.route_number,
      name: data.name,
      provider_id: data.provider_id,
      is_accessible: data.is_accessible,
      is_active: data.is_active,
      route_type: data.route_type,
      created_at: data.created_at,
      updated_at: data.updated_at,
      stops_count: stops.length,
      stops,
    };
  }

  /**
   * Update a route
   * @param id - Route ID
   * @param userId - Current user ID
   * @param dto - Update data
   * @returns Updated route
   */
  async update(id: string, userId: string, dto: UpdateRouteDto): Promise<RouteResponseDto> {
    // Check ownership first
    await this.checkOwnership(id, userId);

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('routes')
      .update({
        ...(dto.route_number && { route_number: dto.route_number }),
        ...(dto.name && { name: dto.name }),
        ...(dto.is_accessible !== undefined && { is_accessible: dto.is_accessible }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.route_type && { route_type: dto.route_type }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Route number already exists for this provider');
      }
      throw new InternalServerErrorException('Failed to update route: ' + error.message);
    }

    if (!data) {
      throw new NotFoundException(`Route with ID '${id}' not found`);
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: userId,
      action: 'update_route',
      details: {
        target_type: 'route',
        target_id: id,
        route_number: data.route_number,
        name: data.name,
        is_accessible: data.is_accessible,
        is_active: data.is_active,
      },
    });

    // Fetch stops count
    const { count } = await supabase
      .from('route_stops')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', id);

    return {
      ...data,
      stops_count: count || 0,
    };
  }

  /**
   * Soft delete a route (set is_active to false)
   * @param id - Route ID
   * @param userId - Current user ID
   * @returns Deleted route
   */
  async remove(id: string, userId: string): Promise<RouteResponseDto> {
    // Check ownership first
    await this.checkOwnership(id, userId);

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('routes')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Route with ID '${id}' not found`);
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: userId,
      action: 'delete_route',
      details: {
        target_type: 'route',
        target_id: id,
        route_number: data.route_number,
        name: data.name,
      },
    });

    return {
      ...data,
      stops_count: 0,
    };
  }

  /**
   * Check if user owns the route (for providers) or is admin
   * @param routeId - Route ID
   * @param userId - User ID
   * @param userRole - Optional user role (if already fetched)
   * @throws ForbiddenException if user doesn't own the route
   */
  async checkOwnership(routeId: string, userId: string, userRole?: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // If role is admin, allow access
    if (userRole === 'admin') {
      return;
    }

    // Fetch route to check provider_id
    const { data, error } = await supabase
      .from('routes')
      .select('provider_id')
      .eq('id', routeId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Route with ID '${routeId}' not found`);
    }

    if (data.provider_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this route');
    }
  }

  /**
   * Assign stops to a route in specific order
   * Replaces all existing stops with new configuration
   * This is a transactional operation: all existing assignments are deleted
   * and new ones are inserted
   *
   * @param routeId - Route ID
   * @param userId - User ID for ownership check
   * @param dto - Array of stops with order and optional arrival times
   * @throws BadRequestException if order values are not unique or stop IDs are invalid
   * @throws ForbiddenException if user doesn't own the route
   * @throws NotFoundException if route not found
   */
  async assignStops(routeId: string, userId: string, dto: AssignStopsDto): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 1. Check ownership
    await this.checkOwnership(routeId, userId);

    // 2. Validate unique orders
    const orders = dto.stops.map((s) => s.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException('Order values must be unique');
    }

    // 3. Validate all stops exist
    if (dto.stops.length > 0) {
      const stopIds = dto.stops.map((s) => s.stop_id);
      const { data: existingStops, error: stopsError } = await supabase
        .from('stops')
        .select('id')
        .in('id', stopIds);

      if (stopsError) {
        throw new InternalServerErrorException('Failed to validate stops: ' + stopsError.message);
      }

      if (existingStops.length !== stopIds.length) {
        throw new BadRequestException('Some stop IDs are invalid');
      }
    }

    // 4. Transaction: delete old assignments
    const { error: deleteError } = await supabase
      .from('route_stops')
      .delete()
      .eq('route_id', routeId);

    if (deleteError) {
      throw new InternalServerErrorException(
        'Failed to delete existing stops: ' + deleteError.message,
      );
    }

    // 5. Insert new assignments (if any)
    if (dto.stops.length > 0) {
      const { error: insertError } = await supabase.from('route_stops').insert(
        dto.stops.map((s) => ({
          route_id: routeId,
          stop_id: s.stop_id,
          stop_order: s.order,
          arrival_time: s.arrival_time || null,
          arrival_offset: s.arrival_offset || null,
        })),
      );

      if (insertError) {
        throw new InternalServerErrorException('Failed to assign stops: ' + insertError.message);
      }
    }
  }

  /**
   * Get stops assigned to a route with order
   * Returns stops ordered by their sequence number
   *
   * @param routeId - Route ID
   * @returns Array of stops with their assignment details
   */
  async getRouteStops(routeId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('route_stops')
      .select(
        `
        id,
        stop_order,
        arrival_time,
        arrival_offset,
        stops!inner (
          id,
          name,
          type,
          latitude,
          longitude,
          is_accessible
        )
      `,
      )
      .eq('route_id', routeId)
      .order('stop_order', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('Failed to fetch route stops: ' + error.message);
    }

    // Transform data to flatten stops info
    return (data || []).map((rs: any) => ({
      id: rs.id,
      order: rs.stop_order,
      arrival_time: rs.arrival_time,
      arrival_offset: rs.arrival_offset,
      stop: {
        id: rs.stops.id,
        name: rs.stops.name,
        type: rs.stops.type,
        latitude: rs.stops.latitude,
        longitude: rs.stops.longitude,
        is_accessible: rs.stops.is_accessible,
      },
    }));
  }

  /**
   * Add a single stop to route
   * Validates that the order number is not already used
   *
   * @param routeId - Route ID
   * @param userId - User ID for ownership check
   * @param stopId - Stop ID to add
   * @param order - Order/sequence number
   * @param arrivalTime - Optional arrival time
   * @returns Created route_stop record
   * @throws BadRequestException if order already exists or stop doesn't exist
   */
  async addStopToRoute(
    routeId: string,
    userId: string,
    stopId: string,
    order: number,
    arrivalTime?: string,
    arrivalOffset?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Check ownership
    await this.checkOwnership(routeId, userId);

    // Validate stop exists
    const { data: stopExists, error: stopError } = await supabase
      .from('stops')
      .select('id')
      .eq('id', stopId)
      .single();

    if (stopError || !stopExists) {
      throw new BadRequestException(`Stop with ID '${stopId}' not found`);
    }

    // Check if order already exists
    const { data: existing } = await supabase
      .from('route_stops')
      .select('id')
      .eq('route_id', routeId)
      .eq('stop_order', order)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException(`Order ${order} already exists for this route`);
    }

    // Insert new route_stop
    const { data, error } = await supabase
      .from('route_stops')
      .insert({
        route_id: routeId,
        stop_id: stopId,
        stop_order: order,
        arrival_time: arrivalTime || null,
        arrival_offset: arrivalOffset || null,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Failed to add stop to route: ' + error.message);
    }

    return data;
  }

  /**
   * Remove a stop from route
   * Deletes the route_stop assignment
   *
   * @param routeId - Route ID
   * @param userId - User ID for ownership check
   * @param stopId - Stop ID to remove
   * @throws ForbiddenException if user doesn't own the route
   */
  async removeStopFromRoute(routeId: string, userId: string, stopId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Check ownership
    await this.checkOwnership(routeId, userId);

    const { error } = await supabase
      .from('route_stops')
      .delete()
      .eq('route_id', routeId)
      .eq('stop_id', stopId);

    if (error) {
      throw new InternalServerErrorException('Failed to remove stop from route: ' + error.message);
    }
  }
}
