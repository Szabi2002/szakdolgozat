import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PaginatedUserListDto, UserListItemDto } from './dto/user-list.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get admin dashboard statistics
   * Returns aggregated counts for various entities in the system
   */
  async getStats(): Promise<AdminStatsDto> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get current date for "this month" calculation
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Query all statistics in parallel for better performance
      const [
        usersResult,
        newUsersResult,
        pendingRatingsResult,
        approvedRatingsResult,
        rejectedRatingsResult,
        pendingReportsResult,
        activeTicketsResult,
        monthlyUsersData,
      ] = await Promise.all([
        // Total users
        supabase.from('users').select('id', { count: 'exact', head: true }),

        // New users this month
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString()),

        // Pending ratings
        supabase
          .from('ratings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Approved ratings
        supabase
          .from('ratings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),

        // Rejected ratings
        supabase
          .from('ratings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected'),

        // Pending reports
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Active tickets (valid_until > now)
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .gt('valid_until', new Date().toISOString()),

        // Monthly registrations for the last 12 months
        supabase.from('users').select('created_at'),
      ]);

      // Calculate monthly registrations for last 12 months
      const monthlyRegistrations = this.calculateMonthlyRegistrations(
        monthlyUsersData.data || [],
      );

      return {
        totalUsers: usersResult.count || 0,
        newUsersThisMonth: newUsersResult.count || 0,
        pendingRatings: pendingRatingsResult.count || 0,
        pendingReports: pendingReportsResult.count || 0,
        activeTickets: activeTicketsResult.count || 0,
        monthlyRegistrations,
        ratingsStatusDistribution: {
          approved: approvedRatingsResult.count || 0,
          pending: pendingRatingsResult.count || 0,
          rejected: rejectedRatingsResult.count || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get admin stats: ${error.message}`);
      throw new BadRequestException('Failed to retrieve admin statistics: ' + error.message);
    }
  }

  /**
   * Calculate monthly registrations for the last 12 months
   */
  private calculateMonthlyRegistrations(
    users: Array<{ created_at: string }>,
  ): Array<{ month: string; count: number }> {
    const now = new Date();
    const monthsMap = new Map<string, number>();

    // Initialize last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(monthKey, 0);
    }

    // Count users per month
    users.forEach((user) => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + 1);
      }
    });

    // Convert to array
    return Array.from(monthsMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }

  /**
   * Get paginated list of users with filtering
   * Supports search by name/email and role filtering
   */
  async getUsers(filters: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedUserListDto> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      const supabase = this.supabaseService.getClient();

      // Build query
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply role filter
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      // Apply search filter (name or email)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new BadRequestException('Failed to fetch users: ' + error.message);
      }

      // Map users to DTOs
      const users: UserListItemDto[] = (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        profile_picture_url: user.profile_picture_url,
        role: user.role,
        created_at: user.created_at,
        hasPassword: !!user.password_hash,
        hasGoogleLinked: !!user.google_id,
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to get users: ${error.message}`);
      throw new BadRequestException('Failed to retrieve users: ' + error.message);
    }
  }

  /**
   * Update user role
   * Logs the action in admin activity log
   */
  async updateUserRole(
    adminId: string,
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<{ message: string }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get current user to check if role is actually changing
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new NotFoundException('User not found');
      }

      const oldRole = user.role;

      // Update user role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: dto.role })
        .eq('id', userId);

      if (updateError) {
        throw new BadRequestException('Failed to update user role: ' + updateError.message);
      }

      // Log admin activity
      await this.logActivity(adminId, 'update_user_role', 'user', userId, {
        oldRole,
        newRole: dto.role,
      });

      return {
        message: 'User role updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update user role: ${error.message}`);
      throw new BadRequestException('Failed to update user role: ' + error.message);
    }
  }

  /**
   * Delete user
   * Deletes from auth.users which cascades to public.users
   * Logs the action in admin activity log
   */
  async deleteUser(adminId: string, userId: string): Promise<{ message: string }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get user details before deletion for logging
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, name, role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new NotFoundException('User not found');
      }

      // Prevent self-deletion
      if (userId === adminId) {
        throw new BadRequestException('Cannot delete your own account');
      }

      // Delete from auth.users (this will cascade to public.users via ON DELETE CASCADE)
      const { error: deleteError } = await this.supabaseService
        .getAdminClient()
        .auth.admin.deleteUser(userId);

      if (deleteError) {
        throw new BadRequestException('Failed to delete user: ' + deleteError.message);
      }

      // Log admin activity
      await this.logActivity(adminId, 'delete_user', 'user', userId, {
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete user: ${error.message}`);
      throw new BadRequestException('Failed to delete user: ' + error.message);
    }
  }

  /**
   * Log admin activity
   * Private helper method to record admin actions
   */
  private async logActivity(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // Include target_type and target_id in details since table doesn't have these columns
      const fullDetails = {
        ...details,
        target_type: targetType,
        target_id: targetId,
      };

      const { error } = await supabase.from('admin_activity_log').insert({
        admin_id: adminId,
        action,
        details: fullDetails,
      });

      if (error) {
        this.logger.error(`Failed to log admin activity: ${error.message}`);
        // Don't throw error - logging failure shouldn't break the main operation
      }
    } catch (error) {
      this.logger.error(`Failed to log admin activity: ${error.message}`);
      // Don't throw error - logging failure shouldn't break the main operation
    }
  }
}
