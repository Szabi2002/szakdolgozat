import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { TripResultDto, RouteSegment, Stop, Route, RouteStep } from './dto/trip-result.dto';
import { PlanTripDto } from './dto/plan-trip.dto';
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
  routeId?: string;
  routeNumber?: string;
  routeName?: string;
  type: 'transit' | 'walking';
  distance?: number;
  duration: number;
  vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
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
    vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
  }>;
  totalDuration: number;
}

interface RouteSearchOptions {
  transferPenalty: number;
  walkingPenalty: number;
  forbiddenEdges?: Array<{ fromStopId: string; toStopId: string; routeId?: string }>;
}

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  private readonly MAX_TRANSFERS = 5;
  private readonly TIMEOUT_MS = 5000;
  private readonly TRANSFER_PENALTY_MINUTES = 3;
  private readonly AVERAGE_TRANSIT_SPEED_KMH = 30;
  private readonly SEARCH_RADIUS_METERS = 1000;

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find multiple optimal routes between two stops
   * @param dto Plan trip request with preferences
   * @returns Array of alternative routes
   */
  async findRoutes(dto: PlanTripDto): Promise<Route[]> {
    const startTime = Date.now();

    if (dto.from_stop_id === dto.to_stop_id) {
      await this.getStopById(dto.from_stop_id); // Validate stop exists
      return [
        {
          route_id: 'route-1',
          total_time: 0,
          transfers: 0,
          walking_distance: 0,
          total_stops: 1,
          steps: [],
          recommended: true,
          recommendation_reason: 'Same stop - no travel needed',
        },
      ];
    }

    await this.validateStops(dto.from_stop_id, dto.to_stop_id);
    const includeWalking = dto.include_walking !== undefined ? dto.include_walking : true;
    const { adjacencyList, stopData } = await this.buildGraph(includeWalking);

    const alternatives = await this.findMultipleRoutes(
      dto.from_stop_id,
      dto.to_stop_id,
      adjacencyList,
      stopData,
      startTime,
      dto.max_alternatives || 3,
      dto.preference || 'fastest',
    );

    if (alternatives.length === 0) {
      throw new NotFoundException('No route found between the specified stops');
    }

    return alternatives;
  }

  /**
   * Find the optimal route between two stops using BFS algorithm (Legacy)
   */
  async findRoute(fromStopId: string, toStopId: string): Promise<TripResultDto> {
    const startTime = Date.now();

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

    await this.validateStops(fromStopId, toStopId);
    const { adjacencyList, stopData } = await this.buildGraph(true); // Enable walking for multimodal routing
    const result = this.bfs(fromStopId, toStopId, adjacencyList, startTime);

    if (!result) {
      throw new NotFoundException('No route found between the specified stops');
    }

    return this.buildTripResult(result.path, result.routes, stopData);
  }

  private async findMultipleRoutes(
    fromStopId: string,
    toStopId: string,
    adjacencyList: Map<string, GraphNode[]>,
    stopData: Map<string, Stop>,
    startTime: number,
    maxAlternatives: number,
    preference: 'fastest' | 'least_transfers' | 'least_walking',
  ): Promise<Route[]> {
    const routes: Route[] = [];
    const usedPaths = new Set<string>();

    // Strategy 1: Fastest route (base BFS with normal penalties)
    this.logger.log('Strategy 1: Finding fastest route...');
    const fastestRoute = await this.findSingleRoute(
      fromStopId,
      toStopId,
      adjacencyList,
      stopData,
      startTime,
      { transferPenalty: this.TRANSFER_PENALTY_MINUTES, walkingPenalty: 1.0 },
    );

    if (fastestRoute) {
      routes.push(fastestRoute);
      usedPaths.add(this.getPathSignature(fastestRoute.steps));
      this.logger.log(
        `Strategy 1: Found route with ${fastestRoute.total_time} min, ${fastestRoute.transfers} transfers`,
      );
    }

    // Strategy 2: Least transfers (increase transfer penalty)
    if (routes.length < maxAlternatives) {
      this.logger.log('Strategy 2: Finding route with least transfers...');
      const leastTransfersRoute = await this.findSingleRoute(
        fromStopId,
        toStopId,
        adjacencyList,
        stopData,
        startTime,
        { transferPenalty: 10, walkingPenalty: 1.0 },
      );

      if (leastTransfersRoute && !usedPaths.has(this.getPathSignature(leastTransfersRoute.steps))) {
        routes.push(leastTransfersRoute);
        usedPaths.add(this.getPathSignature(leastTransfersRoute.steps));
        this.logger.log(
          `Strategy 2: Found route with ${leastTransfersRoute.total_time} min, ${leastTransfersRoute.transfers} transfers`,
        );
      }
    }

    // Strategy 3: Least walking (increase walking penalty)
    if (routes.length < maxAlternatives) {
      this.logger.log('Strategy 3: Finding route with least walking...');
      const leastWalkingRoute = await this.findSingleRoute(
        fromStopId,
        toStopId,
        adjacencyList,
        stopData,
        startTime,
        { transferPenalty: this.TRANSFER_PENALTY_MINUTES, walkingPenalty: 2.5 },
      );

      if (leastWalkingRoute && !usedPaths.has(this.getPathSignature(leastWalkingRoute.steps))) {
        routes.push(leastWalkingRoute);
        usedPaths.add(this.getPathSignature(leastWalkingRoute.steps));
        this.logger.log(
          `Strategy 3: Found route with ${leastWalkingRoute.total_time} min, ${leastWalkingRoute.walking_distance}m walking`,
        );
      }
    }

    // Strategy 4: Alternative by forbidding critical edge
    if (routes.length < maxAlternatives && fastestRoute) {
      this.logger.log('Strategy 4: Finding alternative by forbidding critical edge...');
      const criticalEdge = this.findCriticalTransitEdge(fastestRoute.steps);

      if (criticalEdge) {
        const alternativeRoute = await this.findSingleRoute(
          fromStopId,
          toStopId,
          adjacencyList,
          stopData,
          startTime,
          {
            transferPenalty: this.TRANSFER_PENALTY_MINUTES,
            walkingPenalty: 1.0,
            forbiddenEdges: [criticalEdge],
          },
        );

        if (alternativeRoute && !usedPaths.has(this.getPathSignature(alternativeRoute.steps))) {
          routes.push(alternativeRoute);
          usedPaths.add(this.getPathSignature(alternativeRoute.steps));
          this.logger.log(
            `Strategy 4: Found alternative route with ${alternativeRoute.total_time} min`,
          );
        }
      }
    }

    // Strategy 5: Balanced approach
    if (routes.length < maxAlternatives) {
      this.logger.log('Strategy 5: Finding balanced route...');
      const balancedRoute = await this.findSingleRoute(
        fromStopId,
        toStopId,
        adjacencyList,
        stopData,
        startTime,
        { transferPenalty: 6, walkingPenalty: 1.5 },
      );

      if (balancedRoute && !usedPaths.has(this.getPathSignature(balancedRoute.steps))) {
        routes.push(balancedRoute);
        this.logger.log(`Strategy 5: Found balanced route with ${balancedRoute.total_time} min`);
      }
    }

    // Sort routes by preference
    const sortedRoutes = this.sortRoutesByPreference(routes, preference);

    // Mark the first route as recommended
    if (sortedRoutes.length > 0) {
      sortedRoutes[0].recommended = true;
      sortedRoutes[0].recommendation_reason = this.getRecommendationReason(
        preference,
        sortedRoutes[0],
      );
    }

    this.logger.log(`Found ${sortedRoutes.length} distinct alternative routes`);
    return sortedRoutes;
  }

  private buildRoute(
    result: {
      path: string[];
      routes: Array<{
        routeId?: string;
        routeNumber?: string;
        routeName?: string;
        fromStopId: string;
        type: 'transit' | 'walking';
        distance?: number;
        duration: number;
        vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
      }>;
    },
    stopData: Map<string, Stop>,
    routeId: string,
  ): Route {
    const steps: RouteStep[] = [];
    let totalWalkingDistance = 0;
    let totalTime = 0;

    let i = 0;
    while (i < result.routes.length) {
      const segment = result.routes[i];
      const startStop = stopData.get(segment.fromStopId)!;
      const endStopId = result.path[i + 1];
      const currentSegmentStops = [startStop, stopData.get(endStopId)!];
      let segmentDuration = segment.duration;
      let segmentDistance = segment.distance || 0;

      let j = i + 1;
      while (
        j < result.routes.length &&
        result.routes[j].routeId === segment.routeId &&
        result.routes[j].type === segment.type
      ) {
        const nextSegment = result.routes[j];
        const nextStopId = result.path[j + 1];
        currentSegmentStops.push(stopData.get(nextStopId)!);
        segmentDuration += nextSegment.duration;
        segmentDistance += nextSegment.distance || 0;
        j++;
      }

      const step: RouteStep = {
        type: segment.type,
        start_stop: currentSegmentStops[0],
        end_stop: currentSegmentStops[currentSegmentStops.length - 1],
        duration: Math.ceil(segmentDuration),
        stop_count: currentSegmentStops.length,
        stops: currentSegmentStops,
      };

      if (segment.type === 'transit') {
        step.route_id = segment.routeId;
        step.route_number = segment.routeNumber;
        step.route_name = segment.routeName;
        step.vehicle_type = segment.vehicleType || this.inferVehicleType(segment.routeNumber || '');
      } else {
        step.distance = Math.ceil(segmentDistance);
        totalWalkingDistance += segmentDistance;
      }

      totalTime += segmentDuration;
      steps.push(step);
      i = j;
    }

    const transfers = Math.max(0, steps.length - 1);

    return {
      route_id: routeId,
      total_time: Math.ceil(totalTime),
      transfers,
      walking_distance: Math.ceil(totalWalkingDistance),
      total_stops: result.path.length,
      steps,
    };
  }

  private inferVehicleType(routeNumber: string): 'bus' | 'tram' | 'metro' | 'train' {
    if (routeNumber.startsWith('M')) return 'metro';
    if (/^\d+$/.test(routeNumber)) {
      const num = parseInt(routeNumber);
      if (num < 100) return 'tram';
      return 'bus';
    }
    return 'bus';
  }

  /**
   * Find a single route with custom penalty options
   */
  private async findSingleRoute(
    fromStopId: string,
    toStopId: string,
    adjacencyList: Map<string, GraphNode[]>,
    stopData: Map<string, Stop>,
    startTime: number,
    options: RouteSearchOptions,
  ): Promise<Route | null> {
    const result = this.bfsWithOptions(fromStopId, toStopId, adjacencyList, startTime, options);

    if (!result) {
      return null;
    }

    // Generate unique route ID based on path
    const routeId = `route-${this.hashPath(result.path)}`;
    return this.buildRoute(result, stopData, routeId);
  }

  /**
   * Generate a unique signature for a route path to detect duplicates
   */
  private getPathSignature(steps: RouteStep[]): string {
    return steps
      .map((step) => {
        if (step.type === 'transit') {
          return `T:${step.route_id}:${step.start_stop.id}:${step.end_stop.id}`;
        } else {
          return `W:${step.start_stop.id}:${step.end_stop.id}`;
        }
      })
      .join('|');
  }

  /**
   * Find the critical (longest) transit edge in a route for forbidding
   */
  private findCriticalTransitEdge(
    steps: RouteStep[],
  ): { fromStopId: string; toStopId: string; routeId?: string } | null {
    let longestSegment: RouteStep | null = null;
    let maxDuration = 0;

    for (const step of steps) {
      if (step.type === 'transit' && step.duration > maxDuration) {
        maxDuration = step.duration;
        longestSegment = step;
      }
    }

    if (!longestSegment) {
      return null;
    }

    return {
      fromStopId: longestSegment.start_stop.id,
      toStopId: longestSegment.end_stop.id,
      routeId: longestSegment.route_id,
    };
  }

  /**
   * Sort routes according to user preference
   */
  private sortRoutesByPreference(
    routes: Route[],
    preference: 'fastest' | 'least_transfers' | 'least_walking',
  ): Route[] {
    const sorted = [...routes];

    switch (preference) {
      case 'fastest':
        sorted.sort((a, b) => a.total_time - b.total_time);
        break;
      case 'least_transfers':
        sorted.sort((a, b) => {
          if (a.transfers !== b.transfers) {
            return a.transfers - b.transfers;
          }
          return a.total_time - b.total_time;
        });
        break;
      case 'least_walking':
        sorted.sort((a, b) => {
          if (a.walking_distance !== b.walking_distance) {
            return a.walking_distance - b.walking_distance;
          }
          return a.total_time - b.total_time;
        });
        break;
    }

    return sorted;
  }

  /**
   * Generate recommendation reason based on preference
   */
  private getRecommendationReason(
    preference: 'fastest' | 'least_transfers' | 'least_walking',
    route: Route,
  ): string {
    switch (preference) {
      case 'fastest':
        return 'Fastest route';
      case 'least_transfers':
        return route.transfers === 0
          ? 'Direct route - no transfers'
          : `Fewest transfers (${route.transfers})`;
      case 'least_walking':
        return route.walking_distance === 0
          ? 'No walking required'
          : `Least walking (${route.walking_distance}m)`;
    }
  }

  /**
   * Generate a simple hash from path array
   */
  private hashPath(path: string[]): string {
    const str = path.join('-');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

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

  private async buildGraph(includeWalking: boolean = true): Promise<{
    adjacencyList: Map<string, GraphNode[]>;
    stopData: Map<string, Stop>;
  }> {
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
    const routeStopsMap = new Map<string, (RouteStopData & { vehicleType: string })[]>();

    (data || []).forEach((rs: any) => {
      const stopId = rs.stop_id;
      const routeId = rs.route_id;

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
        vehicleType: this.inferVehicleType(rs.routes.route_number),
      });
    });

    let transitEdges = 0;
    let walkingEdges = 0;

    routeStopsMap.forEach((stops, routeId) => {
      stops.sort((a, b) => a.stop_order - b.stop_order);

      for (let i = 0; i < stops.length - 1; i++) {
        const currentStop = stops[i];
        const nextStop = stops[i + 1];

        if (!adjacencyList.has(currentStop.stop_id)) {
          adjacencyList.set(currentStop.stop_id, []);
        }

        const currentStopData = stopData.get(currentStop.stop_id)!;
        const nextStopData = stopData.get(nextStop.stop_id)!;
        const distance = haversineDistance(
          currentStopData.latitude,
          currentStopData.longitude,
          nextStopData.latitude,
          nextStopData.longitude,
        );
        const duration = Math.ceil((distance / 1000 / this.AVERAGE_TRANSIT_SPEED_KMH) * 60) + 1;

        adjacencyList.get(currentStop.stop_id)!.push({
          stopId: nextStop.stop_id,
          routeId: routeId,
          routeNumber: currentStop.route_number,
          routeName: currentStop.route_name,
          type: 'transit',
          duration: duration,
          vehicleType: currentStop.vehicleType as 'bus' | 'tram' | 'metro' | 'train',
        });
        transitEdges++;
      }
    });

    if (includeWalking) {
      const allStops = Array.from(stopData.values());
      this.logger.log(`Building walking edges for ${allStops.length} stops...`);

      for (const stop1 of allStops) {
        const nearbyStops = allStops.filter((stop2) => {
          if (stop1.id === stop2.id) return false;
          const latDiff = Math.abs(stop1.latitude - stop2.latitude);
          const lngDiff = Math.abs(stop1.longitude - stop2.longitude);
          return latDiff <= 0.015 && lngDiff <= 0.015;
        });

        for (const stop2 of nearbyStops) {
          const distance = haversineDistance(
            stop1.latitude,
            stop1.longitude,
            stop2.latitude,
            stop2.longitude,
          );

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
    }

    this.logger.log(
      `Graph built: ${adjacencyList.size} stops, ${transitEdges + walkingEdges} total edges ` +
        `(${transitEdges} transit${includeWalking ? ` + ${walkingEdges} walking` : ''})`,
    );

    return { adjacencyList, stopData };
  }

  /**
   * BFS with custom options (penalties and forbidden edges)
   */
  private bfsWithOptions(
    fromStopId: string,
    toStopId: string,
    adjacencyList: Map<string, GraphNode[]>,
    startTime: number,
    options: RouteSearchOptions,
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
      vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
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

    const bestDuration = new Map<string, number>();
    bestDuration.set(fromStopId, 0);

    while (queue.length > 0) {
      if (Date.now() - startTime > this.TIMEOUT_MS) {
        this.logger.warn('BFS timeout exceeded');
        return null;
      }

      queue.sort((a, b) => a.totalDuration - b.totalDuration);
      const current = queue.shift()!;

      if (current.stopId === toStopId) {
        return {
          path: current.path,
          routes: current.routes,
        };
      }

      if (current.routes.length > this.MAX_TRANSFERS) {
        continue;
      }

      const neighbors = adjacencyList.get(current.stopId) || [];
      for (const neighbor of neighbors) {
        // Check if this edge is forbidden
        if (
          this.isEdgeForbidden(
            current.stopId,
            neighbor.stopId,
            neighbor.routeId,
            options.forbiddenEdges,
          )
        ) {
          continue;
        }

        // Calculate edge cost with penalties
        let edgeCost = neighbor.duration;

        // Apply walking penalty
        if (neighbor.type === 'walking') {
          edgeCost *= options.walkingPenalty;
        }

        // Calculate transfer penalty
        const transferPenalty = this.calculateTransferPenaltyWithOptions(
          current.routes,
          neighbor,
          options.transferPenalty,
        );
        const newDuration = current.totalDuration + edgeCost + transferPenalty;

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
                duration: neighbor.duration, // Store original duration
                vehicleType: neighbor.vehicleType,
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
   * Legacy BFS (kept for backward compatibility)
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
      vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
    }>;
  } | null {
    return this.bfsWithOptions(fromStopId, toStopId, adjacencyList, startTime, {
      transferPenalty: this.TRANSFER_PENALTY_MINUTES,
      walkingPenalty: 1.0,
    });
  }

  /**
   * Check if an edge is forbidden
   */
  private isEdgeForbidden(
    fromStopId: string,
    toStopId: string,
    routeId: string | undefined,
    forbiddenEdges?: Array<{ fromStopId: string; toStopId: string; routeId?: string }>,
  ): boolean {
    if (!forbiddenEdges || forbiddenEdges.length === 0) {
      return false;
    }

    return forbiddenEdges.some(
      (edge) =>
        edge.fromStopId === fromStopId &&
        edge.toStopId === toStopId &&
        (!edge.routeId || edge.routeId === routeId),
    );
  }

  /**
   * Calculate transfer penalty with custom penalty value
   */
  private calculateTransferPenaltyWithOptions(
    currentRoutes: Array<{ routeId?: string; type: 'transit' | 'walking'; duration: number }>,
    nextEdge: GraphNode,
    transferPenalty: number,
  ): number {
    if (currentRoutes.length === 0) {
      return 0;
    }

    const lastRoute = currentRoutes[currentRoutes.length - 1];

    if (lastRoute.routeId && lastRoute.routeId === nextEdge.routeId) {
      return 0;
    }

    if (lastRoute.type === 'walking' && nextEdge.type === 'walking') {
      return 0;
    }

    return transferPenalty;
  }

  private calculateTransferPenalty(
    currentRoutes: Array<{ routeId?: string; type: 'transit' | 'walking'; duration: number }>,
    nextEdge: GraphNode,
  ): number {
    if (currentRoutes.length === 0) {
      return 0;
    }

    const lastRoute = currentRoutes[currentRoutes.length - 1];

    if (lastRoute.routeId && lastRoute.routeId === nextEdge.routeId) {
      return 0;
    }

    if (lastRoute.type === 'walking' && nextEdge.type === 'walking') {
      return 0;
    }

    return this.TRANSFER_PENALTY_MINUTES;
  }

  private buildTripResult(
    path: string[],
    routes: Array<{
      routeId?: string;
      routeNumber?: string;
      routeName?: string;
      fromStopId: string;
      type?: 'transit' | 'walking';
      distance?: number;
      duration?: number;
    }>,
    stopData: Map<string, Stop>,
  ): TripResultDto {
    const segments: RouteSegment[] = [];
    let currentRouteId: string | null | undefined = null;
    let currentSegmentType: 'transit' | 'walking' | null = null;
    let currentSegmentStops: Stop[] = [];
    let currentSegmentDistance = 0;
    let currentSegmentDuration = 0;
    let totalDuration = 0;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const type = route.type || 'transit';
      const fromStop = stopData.get(route.fromStopId)!;
      const toStop = stopData.get(path[i + 1])!;
      const segmentDuration = route.duration || 2;
      const segmentDistance = route.distance || 0;

      totalDuration += segmentDuration;

      // Determine if we need to start a new segment
      const needNewSegment =
        currentSegmentType !== type || (type === 'transit' && route.routeId !== currentRouteId);

      if (needNewSegment) {
        // Save previous segment if exists
        if (currentSegmentStops.length > 0) {
          const prevRoute = routes[i - 1];
          const prevType = prevRoute.type || 'transit';
          const segment: RouteSegment = {
            type: prevType,
            from_stop: currentSegmentStops[0],
            to_stop: currentSegmentStops[currentSegmentStops.length - 1],
            stops_in_segment: [...currentSegmentStops],
            duration: Math.ceil(currentSegmentDuration),
          };

          if (prevType === 'transit') {
            segment.route_id = prevRoute.routeId;
            segment.route_number = prevRoute.routeNumber;
            segment.route_name = prevRoute.routeName;
          } else {
            segment.distance = Math.ceil(currentSegmentDistance);
          }

          segments.push(segment);
        }

        // Start new segment
        currentRouteId = route.routeId;
        currentSegmentType = type;
        currentSegmentStops = [fromStop, toStop];
        currentSegmentDistance = segmentDistance;
        currentSegmentDuration = segmentDuration;
      } else {
        // Continue current segment
        currentSegmentStops.push(toStop);
        currentSegmentDistance += segmentDistance;
        currentSegmentDuration += segmentDuration;
      }
    }

    // Add final segment
    if (currentSegmentStops.length > 0 && routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      const lastType = lastRoute.type || 'transit';
      const segment: RouteSegment = {
        type: lastType,
        from_stop: currentSegmentStops[0],
        to_stop: currentSegmentStops[currentSegmentStops.length - 1],
        stops_in_segment: [...currentSegmentStops],
        duration: Math.ceil(currentSegmentDuration),
      };

      if (lastType === 'transit') {
        segment.route_id = lastRoute.routeId;
        segment.route_number = lastRoute.routeNumber;
        segment.route_name = lastRoute.routeName;
      } else {
        segment.distance = Math.ceil(currentSegmentDistance);
      }

      segments.push(segment);
    }

    // Build complete path of stops
    const completePath = path.map((stopId) => stopData.get(stopId)!);

    // Calculate transfers
    let transfers = 0;
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];

      // Count as transfer if switching routes or modes
      if (
        prev.type !== curr.type ||
        (prev.type === 'transit' && curr.type === 'transit' && prev.route_id !== curr.route_id)
      ) {
        transfers++;
      }
    }

    // Add transfer penalties
    totalDuration += transfers * this.TRANSFER_PENALTY_MINUTES;

    return {
      routes: segments,
      total_stops: path.length,
      transfers: Math.max(0, transfers),
      estimated_duration_minutes: Math.ceil(totalDuration),
      path: completePath,
    };
  }
}
