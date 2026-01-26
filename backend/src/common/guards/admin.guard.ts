import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';

/**
 * Admin Guard
 * Ensures that only users with 'admin' role can access protected endpoints
 * Should be used in combination with AuthGuard (user must be authenticated first)
 *
 * Usage:
 * @UseGuards(AdminGuard)
 * async adminOnlyEndpoint() { ... }
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // User should already be authenticated by AuthGuard
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role
    // The role is stored in auth.users.raw_user_meta_data->>'role'
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        throw new ForbiddenException('Unable to verify user role');
      }

      if (data.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      // Attach role to request user object so controllers can use it
      request.user.role = data.role;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Unable to verify admin access');
    }
  }
}
