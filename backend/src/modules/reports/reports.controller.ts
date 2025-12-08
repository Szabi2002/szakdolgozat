import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '@common/guards/admin.guard';
import { ReportsService } from './reports.service';
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
import { ReportPhoto } from './entities/report-photo.entity';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Create a new report
   * Rate limited to 10 reports per hour per user
   */
  @Post()
  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 reports per hour
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new report',
    description:
      'Submit a new report about service issues, safety concerns, cleanliness, accessibility, or other topics. New reports default to pending status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: Report,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid report data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded (max 10 per hour)',
  })
  async create(@Req() req: any, @Body() createReportDto: CreateReportDto): Promise<Report> {
    const userId = req.user.id;
    return this.reportsService.create(userId, createReportDto);
  }

  /**
   * Get all reports with optional filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get all reports',
    description:
      'Retrieve all reports with optional filters by status, type, priority, route, or stop. Supports pagination.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_review', 'resolved', 'dismissed'],
    description: 'Filter by report status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['service_issue', 'safety_concern', 'cleanliness', 'accessibility', 'other'],
    description: 'Filter by report type',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['low', 'medium', 'high', 'critical'],
    description: 'Filter by priority level',
  })
  @ApiQuery({
    name: 'routeId',
    required: false,
    description: 'Filter by route ID (UUID)',
  })
  @ApiQuery({
    name: 'stopId',
    required: false,
    description: 'Filter by stop ID (UUID)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reports with pagination',
    type: [ReportResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('status') status?: ReportStatus,
    @Query('type') type?: string,
    @Query('priority') priority?: ReportPriority,
    @Query('routeId') routeId?: string,
    @Query('stopId') stopId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: ReportResponseDto[]; total: number; page: number; limit: number }> {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.reportsService.findAll(
      { status, type, priority, routeId, stopId },
      pageNum,
      limitNum,
    );
  }

  /**
   * Get all reports created by the current user
   */
  @Get('my-reports')
  @ApiOperation({
    summary: 'Get my reports',
    description: 'Get all reports created by the authenticated user (all statuses)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user reports',
    type: [ReportResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyReports(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: ReportResponseDto[]; total: number; page: number; limit: number }> {
    const userId = req.user.id;
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.reportsService.findMyReports(userId, pageNum, limitNum);
  }

  /**
   * ADMIN: Get reports queue for moderation
   */
  @Get('admin/queue')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get reports queue (Admin only)',
    description:
      'Get reports queue filtered by status and priority for admin moderation. Uses critical_reports_queue view for high/critical priorities.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_review', 'resolved', 'dismissed'],
    description: 'Filter by report status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['low', 'medium', 'high', 'critical'],
    description: 'Filter by priority level',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reports queue',
    type: [CriticalReportsQueueDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async getAdminQueue(
    @Query('status') status?: ReportStatus,
    @Query('priority') priority?: ReportPriority,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: CriticalReportsQueueDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.reportsService.getAdminQueue(status, priority, pageNum, limitNum);
  }

  /**
   * Get a specific report by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a report by ID',
    description:
      'Get detailed information about a specific report. Admin notes are only visible to admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report details',
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<ReportResponseDto> {
    // Check if user is admin to determine if admin_notes should be shown
    const isAdmin = req.user?.role === 'admin';
    return this.reportsService.findOne(id, isAdmin);
  }

  /**
   * Update own pending report
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update own pending report',
    description: 'Update a report. Only pending reports can be updated by their owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report updated successfully',
    type: Report,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only pending reports can be updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only update your own reports',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<Report> {
    const userId = req.user.id;
    return this.reportsService.update(id, userId, updateReportDto);
  }

  /**
   * Delete own pending report
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete own pending report',
    description: 'Delete a report. Only pending reports can be deleted by their owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Report deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Only pending reports can be deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete your own reports',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async delete(@Req() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    await this.reportsService.delete(id, userId);
  }

  /**
   * Upload photos to a report
   */
  @Post(':id/photos')
  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 photo uploads per hour
  @ApiOperation({
    summary: 'Upload photos to report',
    description:
      'Upload photos to a pending report. Maximum 5 photos per report. Expects array of photo URLs from Supabase Storage.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Photos uploaded successfully',
    type: [ReportPhoto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Too many photos or report not pending',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only upload photos to your own reports',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async uploadPhotos(
    @Req() req: any,
    @Param('id') id: string,
    @Body('photoUrls') photoUrls: string[],
  ): Promise<ReportPhoto[]> {
    const userId = req.user.id;
    return this.reportsService.uploadPhotos(id, userId, photoUrls);
  }

  /**
   * Delete a photo from a report
   */
  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete photo from report',
    description: 'Delete a specific photo from a pending report.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'photoId',
    description: 'Photo UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Photo deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Photos can only be deleted from pending reports',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete photos from your own reports',
  })
  @ApiResponse({
    status: 404,
    description: 'Report or photo not found',
  })
  async deletePhoto(
    @Req() req: any,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.reportsService.deletePhoto(id, photoId, userId);
  }

  /**
   * ADMIN: Update report status
   */
  @Put(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Update report status (Admin only)',
    description:
      'Change report status to pending, in_review, resolved, or dismissed. Optionally add admin notes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report status updated successfully',
    type: Report,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReportStatusDto,
  ): Promise<Report> {
    const userId = req.user.id;
    return this.reportsService.updateStatus(id, userId, updateStatusDto);
  }

  /**
   * ADMIN: Update report priority
   */
  @Put(':id/priority')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Update report priority (Admin only)',
    description: 'Change report priority level for proper escalation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Report priority updated successfully',
    type: Report,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async updatePriority(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePriorityDto: UpdateReportPriorityDto,
  ): Promise<Report> {
    const adminId = req.user.id;
    return this.reportsService.updatePriority(id, updatePriorityDto, adminId);
  }

  /**
   * ADMIN: Update admin notes
   */
  @Put(':id/admin-notes')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Update admin notes (Admin only)',
    description: 'Add or update internal admin notes for a report.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin notes updated successfully',
    type: Report,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async updateAdminNotes(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
  ): Promise<Report> {
    return this.reportsService.updateAdminNotes(id, adminNotes);
  }

  /**
   * ADMIN: Get report statistics
   */
  @Get('admin/statistics')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get report statistics (Admin only)',
    description:
      'Get aggregated statistics by report type including counts, priorities, and average resolution times.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report statistics',
    type: [ReportStatisticsDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async getStatistics(): Promise<ReportStatisticsDto[]> {
    return this.reportsService.getStatistics();
  }

  /**
   * ADMIN: Get unresolved reports summary
   */
  @Get('admin/unresolved-summary')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get unresolved reports summary (Admin only)',
    description: 'Get summary of unresolved reports grouped by type and priority.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unresolved reports summary',
    type: [UnresolvedReportsSummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async getUnresolvedSummary(): Promise<UnresolvedReportsSummaryDto[]> {
    return this.reportsService.getUnresolvedSummary();
  }

  /**
   * ADMIN: Manually trigger auto-escalation
   */
  @Post('admin/escalate')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Trigger auto-escalation (Admin only)',
    description:
      'Manually trigger the auto-escalation function to increase priority of stale reports (older than 7 days).',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-escalation triggered successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async escalateStaleReports(): Promise<{ message: string; escalated: number }> {
    return this.reportsService.escalateStaleReports();
  }
}
