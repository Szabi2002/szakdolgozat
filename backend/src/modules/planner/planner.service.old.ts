import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { TripResultDto, RouteSegment, Stop } from './dto/trip-result.dto';
import {
  haversineDistance,
  walkingTimeMinutes,
  MAX_WALKING_DISTANCE_METERS,
} from '@common/utils/geo.utils';

interface RouteStopData {
  id: string;
  route_id: string;
  stop_id: string;
  stop_order: number;
  arrival_time: string | null;
  departure_time: string | null;
  route_number: string;
  route_name: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  type: string;
  is_accessible: boolean;
  description: string | null;
}

interface GraphNode {
  stopId: string;
  routeId?: string; // Optional for walking edges
  routeNumber?: string; // Optional for walking edges
  routeName?: string; // Optional for walking edges
  type: 'transit' | 'walking'; // Edge type
  distance?: number; // Distance in meters (for walking)
  duration: number; // Duration in minutes
}

interface QueueItem {
  stopId: string;
  path: string[];
  routes: Array<{
    routeId?: string;
    routeNumber?: string;
    routeName?: string;
    fromStopId: string;
    type: 'transit' | 'walking';
    distance?: number;
    duration: number;
  }>;
  totalDuration: number; // Cumulative travel time for cost optimization
}

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  private readonly MAX_TRANSFERS = 5;
  private readonly TIMEOUT_MS = 5000;
  private readonly TRANSFER_PENALTY_MINUTES = 3; // Penalty for each transfer
  private readonly AVERAGE_TRANSIT_SPEED_KMH = 30; // Average bus/tram speed
  private readonly SEARCH_RADIUS_METERS = 1000; // Spatial optimization for walking edges

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find the optimal route between two stops using BFS algorithm
   * @param fromStopId Starting stop UUID
   * @param toStopId Destination stop UUID
   * @returns Trip result with route segments and metadata
   */
  async findRoute(fromStopId: string, toStopId: string): Promise<TripResultDto> {
    const startTime = Date.now();

    // Special case: same stop
    if (fromStopId === toStopId) {
      const stop = await this.getStopById(fromStopId);
      return {
        routes: [],
        total_stops: 1,
        transfers: 0,
        estimated_duration_minutes: 0,
        path: [stop],
      };
    }

    // Validate that both stops exist
    await this.validateStops(fromStopId, toStopId);

    // Build the graph from route_stops data
    const { adjacencyList, stopData } = await this.buildGraph();

    // Run BFS to find the shortest path
    const result = this.bfs(fromStopId, toStopId, adjacencyList, startTime);

    if (!result) {
      throw new NotFoundException('No route found between the specified stops');
    }

    // Build the detailed trip result
    return this.buildTripResult(result.path, result.routes, stopData, adjacencyList);
  }

  /**
   * Validate that both stops exist in the database
   */
  private async validateStops(fromStopId: string, toStopId: string): Promise<void> {
    const { data, error } = await this.supabase
      .getClient()
      .from('stops')
      .select('id')
      .in('id', [fromStopId, toStopId]);

    if (error) {
      this.logger.error(`Error validating stops: ${error.message}`);
      throw new Error('Failed to validate stops');
    }

    if (!data || data.length !== 2) {
      throw new NotFoundException('One or both stops not found');
    }
  }

  /**
   * Get stop details by ID
   */
  private async getStopById(stopId: string): Promise<Stop> {
    const { data, error } = await this.supabase
      .getClient()
      .from('stops')
      .select('*')
      .eq('id', stopId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Stop with ID ${stopId} not found`);
    }

    return {
      id: data.id,
      name: data.name,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      type: data.type,
      is_accessible: data.is_accessible,
      description: data.description,
    };
  }

  /**
   * Build adjacency list graph from route_stops table
   * Includes both transit edges (from routes) and walking edges (between nearby stops)
   * Returns graph structure and stop metadata
   */
  private async buildGraph(): Promise<{
    adjacencyList: Map<string, GraphNode[]>;
    stopData: Map<string, Stop>;
  }> {
    // Fetch all route_stops with joined route and stop data
    const { data, error } = await this.supabase
      .getClient()
      .from('route_stops')
      .select(
        `
        id,
        route_id,
        stop_id,
        stop_order,
        arrival_time,
        departure_time,
        routes!inner(route_number, name, is_active),
        stops!inner(id, name, latitude, longitude, type, is_accessible, description)
      `,
      )
      .eq('routes.is_active', true)
      .order('route_id')
      .order('stop_order');

    if (error) {
      this.logger.error(`Error fetching route_stops: ${error.message}`);
      throw new Error('Failed to fetch route data');
    }

    const adjacencyList = new Map<string, GraphNode[]>();
    const stopData = new Map<string, Stop>();
    const routeStopsMap = new Map<string, RouteStopData[]>();

    // Process data and build stop metadata
    (data || []).forEach((rs: any) => {
      const stopId = rs.stop_id;
      const routeId = rs.route_id;

      // Store stop data
      if (!stopData.has(stopId)) {
        stopData.set(stopId, {
          id: rs.stops.id,
          name: rs.stops.name,
          latitude: parseFloat(rs.stops.latitude),
          longitude: parseFloat(rs.stops.longitude),
          type: rs.stops.type,
          is_accessible: rs.stops.is_accessible,
          description: rs.stops.description,
        });
      }

      // Group route stops by route_id
      if (!routeStopsMap.has(routeId)) {
        routeStopsMap.set(routeId, []);
      }
      routeStopsMap.get(routeId)!.push({
        id: rs.id,
        route_id: routeId,
        stop_id: stopId,
        stop_order: rs.stop_order,
        arrival_time: rs.arrival_time,
        departure_time: rs.departure_time,
        route_number: rs.routes.route_number,
        route_name: rs.routes.name,
        stop_name: rs.stops.name,
        latitude: rs.stops.latitude,
        longitude: rs.stops.longitude,
        type: rs.stops.type,
        is_accessible: rs.stops.is_accessible,
        description: rs.stops.description,
      });
    });

    let transitEdges = 0;
    let walkingEdges = 0;

    // Build transit edges: for each route, connect consecutive stops
    routeStopsMap.forEach((stops, routeId) => {
      // Sort by stop_order to ensure correct sequence
      stops.sort((a, b) => a.stop_order - b.stop_order);

      for (let i = 0; i < stops.length - 1; i++) {
        const currentStop = stops[i];
        const nextStop = stops[i + 1];

        if (!adjacencyList.has(currentStop.stop_id)) {
          adjacencyList.set(currentStop.stop_id, []);
        }

        // Calculate estimated transit duration based on distance
        const currentStopData = stopData.get(currentStop.stop_id)!;
        const nextStopData = stopData.get(nextStop.stop_id)!;
        const distance = haversineDistance(
          currentStopData.latitude,
          currentStopData.longitude,
          nextStopData.latitude,
          nextStopData.longitude,
        );
        // Transit duration: distance / average speed + 1 min stop time
        const duration = Math.ceil((distance / 1000 / this.AVERAGE_TRANSIT_SPEED_KMH) * 60) + 1;

        // Add transit edge from current stop to next stop on this route
        adjacencyList.get(currentStop.stop_id)!.push({
          stopId: nextStop.stop_id,
          routeId: routeId,
          routeNumber: currentStop.route_number,
          routeName: currentStop.route_name,
          type: 'transit',
          duration: duration,
        });
        transitEdges++;
      }
    });

    // Build walking edges: connect stops within walking distance
    const allStops = Array.from(stopData.values());
    this.logger.log(`Building walking edges for ${allStops.length} stops...`);

    for (const stop1 of allStops) {
      // Spatial optimization: only check stops within bounding box
      const nearbyStops = allStops.filter((stop2) => {
        if (stop1.id === stop2.id) return false;

        // Quick bounding box check (~1km = 0.01 degrees latitude)
        const latDiff = Math.abs(stop1.latitude - stop2.latitude);
        const lngDiff = Math.abs(stop1.longitude - stop2.longitude);

        // 0.015 degrees ~ 1.5km (conservative for search radius)
        return latDiff <= 0.015 && lngDiff <= 0.015;
      });

      // Calculate precise distances for nearby stops
      for (const stop2 of nearbyStops) {
        const distance = haversineDistance(
          stop1.latitude,
          stop1.longitude,
          stop2.latitude,
          stop2.longitude,
        );

        // Only add walking edge if within max walking distance
        if (distance <= MAX_WALKING_DISTANCE_METERS) {
          if (!adjacencyList.has(stop1.id)) {
            adjacencyList.set(stop1.id, []);
          }

          adjacencyList.get(stop1.id)!.push({
            stopId: stop2.id,
            type: 'walking',
            distance: distance,
            duration: walkingTimeMinutes(distance),
          });
          walkingEdges++;
        }
      }
    }

    this.logger.log(
      `Graph built: ${adjacencyList.size} stops, ${transitEdges + walkingEdges} total edges ` +
        `(${transitEdges} transit + ${walkingEdges} walking)`,
    );

    return { adjacencyList, stopData };
  }

  /**
   * Duration-optimized BFS to find shortest path (by travel time, not hop count)
   * Uses priority queue logic to explore routes with minimum total duration first
   */
  private bfs(
    fromStopId: string,
    toStopId: string,
    adjacencyList: Map<string, GraphNode[]>,
    startTime: number,
  ): {
    path: string[];
    routes: Array<{
      routeId?: string;
      routeNumber?: string;
      routeName?: string;
      fromStopId: string;
      type: 'transit' | 'walking';
      distance?: number;
      duration: number;
    }>;
  } | null {
    const queue: QueueItem[] = [
      {
        stopId: fromStopId,
        path: [fromStopId],
        routes: [],
        totalDuration: 0,
      },
    ];

    // Track best duration to reach each stop (for pruning suboptimal paths)
    const bestDuration = new Map<string, number>();
    bestDuration.set(fromStopId, 0);

    while (queue.length > 0) {
      // Timeout protection
      if (Date.now() - startTime > this.TIMEOUT_MS) {
        this.logger.warn('BFS timeout exceeded');
        return null;
      }

      // Sort queue by totalDuration to explore shortest paths first (priority queue behavior)
      queue.sort((a, b) => a.totalDuration - b.totalDuration);
      const current = queue.shift()!;

      // Found destination - this is guaranteed to be optimal due to priority queue
      if (current.stopId === toStopId) {
        this.logger.log(
          `Route found: ${current.path.length} stops, ${current.routes.length} segments, ` +
            `${current.totalDuration.toFixed(1)} min total duration`,
        );
        return {
          path: current.path,
          routes: current.routes,
        };
      }

      // Max transfer protection
      if (current.routes.length > this.MAX_TRANSFERS) {
        continue;
      }

      // Explore neighbors
      const neighbors = adjacencyList.get(current.stopId) || [];
      for (const neighbor of neighbors) {
        const segmentDuration = neighbor.duration;
        const transferPenalty = this.calculateTransferPenalty(current.routes, neighbor);
        const newDuration = current.totalDuration + segmentDuration + transferPenalty;

        // Only add to queue if this is a better path to the neighbor than we've seen before
        if (
          !bestDuration.has(neighbor.stopId) ||
          newDuration < bestDuration.get(neighbor.stopId)!
        ) {
          bestDuration.set(neighbor.stopId, newDuration);

          queue.push({
            stopId: neighbor.stopId,
            path: [...current.path, neighbor.stopId],
            routes: [
              ...current.routes,
              {
                routeId: neighbor.routeId,
                routeNumber: neighbor.routeNumber,
                routeName: neighbor.routeName,
                fromStopId: current.stopId,
                type: neighbor.type,
                distance: neighbor.distance,
                duration: segmentDuration,
              },
            ],
            totalDuration: newDuration,
          });
        }
      }
    }

    return null;
  }

  /**
   * Calculate penalty for transfers between different routes/modes
   * @param currentRoutes Current route history
   * @param nextEdge Next edge to traverse
   * @returns Penalty in minutes
   */
  private calculateTransferPenalty(
    currentRoutes: Array<{ routeId?: string; type: 'transit' | 'walking'; duration: number }>,
    nextEdge: GraphNode,
  ): number {
    if (currentRoutes.length === 0) {
      return 0; // No penalty for first segment
    }

    const lastRoute = currentRoutes[currentRoutes.length - 1];

    // No penalty if continuing on same route
    if (lastRoute.routeId && lastRoute.routeId === nextEdge.routeId) {
      return 0;
    }

    // No penalty for consecutive walking segments (treated as single walk)
    if (lastRoute.type === 'walking' && nextEdge.type === 'walking') {
      return 0;
    }

    // Transfer penalty for switching routes or modes
    return this.TRANSFER_PENALTY_MINUTES;
  }

  /**
   * Build detailed trip result from BFS path
   * Handles both transit and walking segments
   */
  private buildTripResult(
    path: string[],
    routes: Array<{
      routeId?: string;
      routeNumber?: string;
      routeName?: string;
      fromStopId: string;
      type: 'transit' | 'walking';
      distance?: number;
      duration: number;
    }>,
    stopData: Map<string, Stop>,
    adjacencyList: Map<string, GraphNode[]>,
  ): TripResultDto {
    const segments: RouteSegment[] = [];
    let currentRouteId: string | null | undefined = null;
    let currentSegmentStops: Stop[] = [];
    let currentSegmentType: 'transit' | 'walking' | null = null;
    let totalDuration = 0;

    // Build route segments by grouping consecutive stops on the same route/mode
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const fromStop = stopData.get(route.fromStopId)!;
      const toStop = stopData.get(path[i + 1])!;

      totalDuration += route.duration;

      // Determine if we need to start a new segment
      const needNewSegment =
        currentSegmentType !== route.type ||
        (route.type === 'transit' && route.routeId !== currentRouteId);

      if (needNewSegment) {
        // Save previous segment if exists
        if (currentSegmentStops.length > 0) {
          const prevRoute = routes[i - 1];
          segments.push({
            type: prevRoute.type,
            route_id: prevRoute.routeId,
            route_number: prevRoute.routeNumber,
            route_name: prevRoute.routeName,
            from_stop: currentSegmentStops[0],
            to_stop: currentSegmentStops[currentSegmentStops.length - 1],
            stops_in_segment: [...currentSegmentStops],
            distance: prevRoute.distance,
            duration: this.calculateSegmentDuration(
              routes.slice(i - currentSegmentStops.length + 1, i),
            ),
          });
        }

        // Start new segment
        currentRouteId = route.routeId;
        currentSegmentType = route.type;
        currentSegmentStops = [fromStop, toStop];
      } else {
        // Continue current segment
        currentSegmentStops.push(toStop);
      }
    }

    // Add final segment
    if (currentSegmentStops.length > 0 && routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      const segmentStartIdx = routes.length - currentSegmentStops.length + 1;

      segments.push({
        type: lastRoute.type,
        route_id: lastRoute.routeId,
        route_number: lastRoute.routeNumber,
        route_name: lastRoute.routeName,
        from_stop: currentSegmentStops[0],
        to_stop: currentSegmentStops[currentSegmentStops.length - 1],
        stops_in_segment: [...currentSegmentStops],
        distance: lastRoute.distance,
        duration: this.calculateSegmentDuration(routes.slice(segmentStartIdx)),
      });
    }

    // Build complete path of stops
    const completePath = path.map((stopId) => stopData.get(stopId)!);

    // Calculate transfers (segment changes, excluding walking-to-walking)
    let transfers = 0;
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];

      // Count as transfer if switching routes or switching between transit and walking
      if (
        prev.type !== curr.type ||
        (prev.type === 'transit' && curr.type === 'transit' && prev.route_id !== curr.route_id)
      ) {
        transfers++;
      }
    }

    // Add transfer penalties to total duration
    totalDuration += transfers * this.TRANSFER_PENALTY_MINUTES;

    return {
      routes: segments,
      total_stops: path.length,
      transfers: Math.max(0, transfers),
      estimated_duration_minutes: Math.ceil(totalDuration),
      path: completePath,
    };
  }

  /**
   * Calculate total duration for a segment from individual route steps
   */
  private calculateSegmentDuration(routes: Array<{ duration: number }>): number {
    return routes.reduce((sum, route) => sum + route.duration, 0);
  }
}
