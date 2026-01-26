import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { InputSanitizer } from '@common/validators/input-sanitizer';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { UpdateReportPriorityDto } from './dto/update-report-priority.dto';
import {
  ReportResponseDto,
  ReportStatisticsDto,
  UnresolvedReportsSummaryDto,
  CriticalReportsQueueDto,
} from './dto/report-response.dto';
import { Report, ReportStatus, ReportPriority } from './entities/report.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  /**
   * Creates a new report
   * User ID is auto-populated from auth context
   * New reports default to 'pending' status and 'medium' priority
   * @param userId - User ID creating the report
   * @param createReportDto - Report data
   * @returns Created report
   */
  async create(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    try {
      const supabase = this.supabaseService.getClient();

      // Validate route_id if provided
      if (createReportDto.route_id) {
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id')
          .eq('id', createReportDto.route_id)
          .single();

        if (routeError || !route) {
          throw new NotFoundException(
            `Route with ID ${createReportDto.route_id} not found`,
          );
        }
      }

      // Validate stop_id if provided
      if (createReportDto.stop_id) {
        const { data: stop, error: stopError } = await supabase
          .from('stops')
          .select('id')
          .eq('id', createReportDto.stop_id)
          .single();

        if (stopError || !stop) {
          throw new NotFoundException(
            `Stop with ID ${createReportDto.stop_id} not found`,
          );
        }
      }

      // Prepare report data with user_id, pending status, and medium priority
      const reportData = {
        user_id: userId,
        report_type: createReportDto.report_type,
        title: createReportDto.title,
        description: createReportDto.description,
        route_id: createReportDto.route_id || null,
        stop_id: createReportDto.stop_id || null,
        location: createReportDto.location || null,
        status: 'pending' as const,
        priority: 'medium' as const,
      };

      const { data, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to create report: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to create report');
      }

      this.logger.log(
        `Report created: ${data.id} by user ${userId} - type: ${createReportDto.report_type}`,
      );
      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error creating report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  /**
   * Gets all reports with optional filters
   * Includes route/stop/user info and photos
   * Supports pagination
   * @param filters - Filter options (status, type, priority, route, stop)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   * @returns Array of reports with details
   */
  async findAll(
    filters?: {
      status?: ReportStatus;
      type?: string;
      priority?: ReportPriority;
      routeId?: string;
      stopId?: string;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReportResponseDto[]; total: number; page: number; limit: number }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Build query with filters
      let query = supabase
        .from('reports')
        .select(
          `
          *,
          photos:report_photos(*),
          route:routes(id, route_number, name),
          stop:stops(id, name)
        `,
          { count: 'exact' },
        );

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('report_type', filters.type);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.routeId) {
        query = query.eq('route_id', filters.routeId);
      }
      if (filters?.stopId) {
        query = query.eq('stop_id', filters.stopId);
      }

      // Add pagination
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validPage = Math.max(1, page);
      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        this.logger.error(`Failed to fetch reports: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch reports');
      }

      return {
        data: (data || []) as ReportResponseDto[],
        total: count || 0,
        page: validPage,
        limit: validLimit,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching reports: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }

  /**
   * Gets all reports created by the current user
   * Includes all statuses
   * @param userId - User ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Array of user's reports
   */
  async findMyReports(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReportResponseDto[]; total: number; page: number; limit: number }> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Add pagination
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validPage = Math.max(1, page);
      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Fetch reports without relationships - just raw data
      const { data: reportsData, error, count } = await supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch user reports: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch your reports');
      }

      const reports = reportsData || [];

      if (reports.length === 0) {
        return {
          data: [],
          total: count || 0,
          page: validPage,
          limit: validLimit,
        };
      }

      // Get unique route and stop IDs
      const routeIds = [...new Set(reports.map(r => r.route_id).filter(Boolean))];
      const stopIds = [...new Set(reports.map(r => r.stop_id).filter(Boolean))];

      // Fetch routes
      let routesData: any[] = [];
      if (routeIds.length > 0) {
        const { data, error: routesError } = await supabase
          .from('routes')
          .select('id, route_number, name')
          .in('id', routeIds);

        if (routesError) {
          this.logger.warn(`Failed to fetch routes: ${routesError.message}`, routesError);
        } else {
          routesData = data || [];
        }
      }

      // Fetch stops
      let stopsData: any[] = [];
      if (stopIds.length > 0) {
        const { data, error: stopsError } = await supabase
          .from('stops')
          .select('id, name')
          .in('id', stopIds);

        if (stopsError) {
          this.logger.warn(`Failed to fetch stops: ${stopsError.message}`, stopsError);
        } else {
          stopsData = data || [];
        }
      }

      // Create maps for quick lookup
      const routesById: any = routesData.reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
      }, {});

      const stopsById: any = stopsData.reduce((acc, stop) => {
        acc[stop.id] = stop;
        return acc;
      }, {});

      // Get unique user IDs
      const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];

      // Fetch users
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (usersError) {
          this.logger.warn(`Failed to fetch users: ${usersError.message}`, usersError);
        } else {
          usersData = data || [];
        }
      }

      // Create a map of users by ID for quick lookup
      const usersById: any = usersData.reduce((acc: any, user: any) => {
        acc[user.id] = { name: user.name, email: user.email };
        return acc;
      }, {});

      // Fetch photos
      const reportIds = reports.map(r => r.id);
      const { data: photosData, error: photosError } = await supabase
        .from('report_photos')
        .select('*')
        .in('report_id', reportIds);

      if (photosError) {
        this.logger.warn(`Failed to fetch report photos: ${photosError.message}`, photosError);
      }

      // Group photos by report_id
      const photosByReport = (photosData || []).reduce((acc, photo) => {
        if (!acc[photo.report_id]) {
          acc[photo.report_id] = [];
        }
        acc[photo.report_id].push(photo);
        return acc;
      }, {});

      // Combine data
      const result = reports.map(report => ({
        ...report,
        user: report.user_id ? usersById[report.user_id] || null : null,
        route: report.route_id ? routesById[report.route_id] || null : null,
        stop: report.stop_id ? stopsById[report.stop_id] || null : null,
        photos: photosByReport[report.id] || [],
      }));

      return {
        data: result as ReportResponseDto[],
        total: count || 0,
        page: validPage,
        limit: validLimit,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching user reports: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch your reports');
    }
  }

  /**
   * Gets a specific report by ID
   * Includes user info, route/stop info, and photos
   * Hides admin_notes from non-admin users
   * @param id - Report ID
   * @param isAdmin - Whether the requesting user is an admin
   * @returns Report with full details
   * @throws NotFoundException if report doesn't exist
   */
  async findOne(id: string, isAdmin: boolean = false): Promise<ReportResponseDto> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Fetch report without relationships - just raw data
      const { data: reportData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !reportData) {
        this.logger.warn(`Report not found: ${id}`);
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      // Hide admin_notes from non-admin users
      if (!isAdmin && reportData.admin_notes) {
        delete reportData.admin_notes;
      }

      // Fetch route if route_id exists
      let routeData: any = null;
      if (reportData.route_id) {
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id, route_number, name')
          .eq('id', reportData.route_id)
          .single();

        if (routeError) {
          this.logger.warn(`Failed to fetch route details: ${routeError.message}`, routeError);
        } else {
          routeData = route;
        }
      }

      // Fetch stop if stop_id exists
      let stopData: any = null;
      if (reportData.stop_id) {
        const { data: stop, error: stopError } = await supabase
          .from('stops')
          .select('id, name')
          .eq('id', reportData.stop_id)
          .single();

        if (stopError) {
          this.logger.warn(`Failed to fetch stop details: ${stopError.message}`, stopError);
        } else {
          stopData = stop;
        }
      }

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('report_photos')
        .select('*')
        .eq('report_id', id);

      if (photosError) {
        this.logger.warn(`Failed to fetch report photos: ${photosError.message}`, photosError);
      }

      // Combine data
      const result = {
        ...reportData,
        route: routeData,
        stop: stopData,
        photos: photosData || [],
      };

      return result as ReportResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch report');
    }
  }

  /**
   * Updates a pending report
   * Only the owner can update their own pending reports
   * @param id - Report ID
   * @param userId - User ID (for authorization)
   * @param updateReportDto - Updated report data
   * @returns Updated report
   * @throws NotFoundException if report doesn't exist
   * @throws ForbiddenException if user doesn't own the report
   * @throws BadRequestException if report is not pending
   */
  async update(
    id: string,
    userId: string,
    updateReportDto: UpdateReportDto,
  ): Promise<Report> {
    try {
      // First check if report exists and belongs to user
      const existing = await this.findOne(id);

      if (existing.user_id !== userId) {
        throw new ForbiddenException('You can only update your own reports');
      }

      if (existing.status !== 'pending') {
        throw new BadRequestException('Only pending reports can be updated');
      }

      const supabase = this.supabaseService.getClient();

      // Build update object with only provided fields
      const updateData: any = {};
      if (updateReportDto.report_type !== undefined)
        updateData.report_type = updateReportDto.report_type;
      if (updateReportDto.title !== undefined) updateData.title = updateReportDto.title;
      if (updateReportDto.description !== undefined)
        updateData.description = updateReportDto.description;
      if (updateReportDto.route_id !== undefined)
        updateData.route_id = updateReportDto.route_id;
      if (updateReportDto.stop_id !== undefined) updateData.stop_id = updateReportDto.stop_id;
      if (updateReportDto.location !== undefined)
        updateData.location = updateReportDto.location;

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update report: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update report');
      }

      this.logger.log(`Report updated: ${id} by user ${userId}`);
      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update report');
    }
  }

  /**
   * Deletes a pending report
   * Only the owner can delete their own pending reports
   * RLS policies enforce this at database level as well
   * @param id - Report ID
   * @param userId - User ID (for authorization)
   * @throws NotFoundException if report doesn't exist
   * @throws ForbiddenException if user doesn't own the report
   * @throws BadRequestException if report is not pending
   */
  async delete(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    try {
      // First check if report exists and belongs to user
      const existing = await this.findOne(id, isAdmin);

      if (!isAdmin && existing.user_id !== userId) {
        throw new ForbiddenException('You can only delete your own reports');
      }

      if (!isAdmin && existing.status !== 'pending') {
        throw new BadRequestException('Only pending reports can be deleted');
      }

      const supabase = this.supabaseService.getClient();

      const query = supabase
        .from('reports')
        .delete()
        .eq('id', id);

      // Only restrict by user and status if not an admin
      if (!isAdmin) {
        query.eq('user_id', userId).eq('status', 'pending');
      }

      const { error } = await query;

      if (error) {
        this.logger.error(`Failed to delete report: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to delete report');
      }

      this.logger.log(`Report deleted: ${id} by user ${userId}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete report');
    }
  }

  /**
   * Updates report status (admin only)
   * Changes status and optionally adds admin notes
   * Sets resolved_at timestamp automatically when status is 'resolved'
   * @param id - Report ID
   * @param userId - Admin user ID
   * @param updateStatusDto - Status update data
   * @returns Updated report
   * @throws NotFoundException if report doesn't exist
   */
  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateReportStatusDto,
  ): Promise<Report> {
    try {
      // Check if report exists
      const existing = await this.findOne(id, true);

      const supabase = this.supabaseService.getClient();

      // Build update object
      const updateData: any = {
        status: updateStatusDto.status,
      };

      // Add admin notes if provided
      if (updateStatusDto.admin_notes !== undefined) {
        updateData.admin_notes = updateStatusDto.admin_notes;
      }

      // Set resolved_by if status is 'resolved'
      if (updateStatusDto.status === 'resolved') {
        updateData.resolved_by = userId;
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update report status: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update report status');
      }

      // Log admin activity
      await supabase.from('admin_activity_log').insert({
        admin_id: userId,
        action: 'update_report_status',
        details: {
          target_type: 'report',
          target_id: id,
          oldStatus: existing.status,
          newStatus: updateStatusDto.status,
          admin_notes: updateStatusDto.admin_notes,
        },
      });

      this.logger.log(
        `Report ${id} status updated to ${updateStatusDto.status} by admin ${userId}`,
      );

      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating report status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update report status');
    }
  }

  /**
   * Updates report priority (admin only)
   * Changes priority level for proper escalation
   * @param id - Report ID
   * @param updatePriorityDto - Priority update data
   * @returns Updated report
   * @throws NotFoundException if report doesn't exist
   */
  async updatePriority(
    id: string,
    updatePriorityDto: UpdateReportPriorityDto,
    adminId?: string,
  ): Promise<Report> {
    try {
      // Check if report exists
      const existing = await this.findOne(id, true);

      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('reports')
        .update({ priority: updatePriorityDto.priority })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update report priority: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update report priority');
      }

      // Log admin activity
      if (adminId) {
        await supabase.from('admin_activity_log').insert({
          admin_id: adminId,
          action: 'update_report_priority',
          details: {
            target_type: 'report',
            target_id: id,
            oldPriority: existing.priority,
            newPriority: updatePriorityDto.priority,
            reason: updatePriorityDto.reason,
          },
        });
      }

      this.logger.log(
        `Report ${id} priority updated to ${updatePriorityDto.priority}${updatePriorityDto.reason ? `: ${updatePriorityDto.reason}` : ''}`,
      );

      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating report priority: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update report priority');
    }
  }

  /**
   * Updates admin notes (admin only)
   * Adds or updates internal notes for admins
   * @param id - Report ID
   * @param adminNotes - Admin notes text
   * @returns Updated report
   * @throws NotFoundException if report doesn't exist
   */
  async updateAdminNotes(id: string, adminNotes: string): Promise<Report> {
    try {
      // Check if report exists
      await this.findOne(id, true);

      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('reports')
        .update({ admin_notes: adminNotes })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to update admin notes: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to update admin notes');
      }

      this.logger.log(`Admin notes updated for report ${id}`);
      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Error updating admin notes: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update admin notes');
    }
  }

  /**
   * Gets reports queue for admin moderation
   * Supports filtering by status and priority
   * @param status - Filter by status (optional)
   * @param priority - Filter by priority (optional)
   * @param page - Page number
   * @param limit - Items per page
   * @returns Array of reports for admin review
   */
  async getAdminQueue(
    status?: ReportStatus,
    priority?: ReportPriority,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: CriticalReportsQueueDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Add pagination
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validPage = Math.max(1, page);
      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Build query for reports without relationships - just raw data
      let query = supabase
        .from('reports')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }

      // Order by priority and created_at
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: reportsData, error, count } = await query;

      if (error) {
        this.logger.error(`Failed to fetch admin queue: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch admin queue');
      }

      const reports = reportsData || [];

      if (reports.length === 0) {
        return {
          data: [],
          total: count || 0,
          page: validPage,
          limit: validLimit,
        };
      }

      // Get unique route and stop IDs
      const routeIds = [...new Set(reports.map(r => r.route_id).filter(Boolean))];
      const stopIds = [...new Set(reports.map(r => r.stop_id).filter(Boolean))];

      // Fetch routes
      let routesData: any[] = [];
      if (routeIds.length > 0) {
        const { data, error: routesError } = await supabase
          .from('routes')
          .select('id, route_number, name')
          .in('id', routeIds);

        if (routesError) {
          this.logger.warn(`Failed to fetch routes: ${routesError.message}`, routesError);
        } else {
          routesData = data || [];
        }
      }

      // Fetch stops
      let stopsData: any[] = [];
      if (stopIds.length > 0) {
        const { data, error: stopsError } = await supabase
          .from('stops')
          .select('id, name')
          .in('id', stopIds);

        if (stopsError) {
          this.logger.warn(`Failed to fetch stops: ${stopsError.message}`, stopsError);
        } else {
          stopsData = data || [];
        }
      }

      // Create maps for quick lookup
      const routesById: any = routesData.reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
      }, {});

      const stopsById: any = stopsData.reduce((acc, stop) => {
        acc[stop.id] = stop;
        return acc;
      }, {});

      // Get unique user IDs
      const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];

      // Fetch users
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (usersError) {
          this.logger.warn(`Failed to fetch users: ${usersError.message}`, usersError);
        } else {
          usersData = data || [];
        }
      }

      // Create a map of users by ID for quick lookup
      const usersById: any = usersData.reduce((acc: any, user: any) => {
        acc[user.id] = { name: user.name, email: user.email };
        return acc;
      }, {});

      // Fetch photos
      const reportIds = reports.map(r => r.id);
      const { data: photosData, error: photosError } = await supabase
        .from('report_photos')
        .select('*')
        .in('report_id', reportIds);

      if (photosError) {
        this.logger.warn(`Failed to fetch report photos: ${photosError.message}`, photosError);
      }

      // Group photos by report_id
      const photosByReport = (photosData || []).reduce((acc, photo) => {
        if (!acc[photo.report_id]) {
          acc[photo.report_id] = [];
        }
        acc[photo.report_id].push(photo);
        return acc;
      }, {});

      // Combine data
      const result = reports.map(report => ({
        ...report,
        user: report.user_id ? usersById[report.user_id] || null : null,
        route: report.route_id ? routesById[report.route_id] || null : null,
        stop: report.stop_id ? stopsById[report.stop_id] || null : null,
        photos: photosByReport[report.id] || [],
      }));

      return {
        data: result as CriticalReportsQueueDto[],
        total: count || 0,
        page: validPage,
        limit: validLimit,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching admin queue: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch admin queue');
    }
  }

  /**
   * Gets report statistics by type
   * Uses report_type_statistics view
   * @returns Array of statistics grouped by report type
   */
  async getStatistics(): Promise<ReportStatisticsDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('report_type_statistics')
        .select('*')
        .order('total_reports', { ascending: false });

      if (error) {
        this.logger.error(`Failed to fetch report statistics: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch report statistics');
      }

      return (data || []) as ReportStatisticsDto[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching report statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch report statistics');
    }
  }

  /**
   * Gets unresolved reports summary
   * Uses unresolved_reports_summary view
   * @returns Array of unresolved reports grouped by type and priority
   */
  async getUnresolvedSummary(): Promise<UnresolvedReportsSummaryDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('unresolved_reports_summary')
        .select('*');

      if (error) {
        this.logger.error(`Failed to fetch unresolved summary: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch unresolved reports summary');
      }

      return (data || []) as UnresolvedReportsSummaryDto[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error fetching unresolved summary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch unresolved reports summary');
    }
  }

  /**
   * Manually triggers auto-escalation function
   * Calls escalate_stale_reports() database function
   * Admin only
   * @returns Success message with number of reports escalated
   */
  async escalateStaleReports(): Promise<{ message: string; escalated: number }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get count before escalation
      const { count: beforeCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_review'])
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Call the database function
      const { error } = await supabase.rpc('escalate_stale_reports');

      if (error) {
        this.logger.error(`Failed to escalate stale reports: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to escalate stale reports');
      }

      // Get count after escalation (this is approximate, actual logic is in the function)
      const escalated = beforeCount || 0;

      this.logger.log(`Escalated ${escalated} stale reports`);
      return {
        message: `Successfully escalated stale reports`,
        escalated,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error escalating stale reports: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to escalate stale reports');
    }
  }
}
