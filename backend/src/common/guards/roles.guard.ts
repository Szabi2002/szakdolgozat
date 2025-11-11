import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@common/decorators/roles.decorator';
import { SupabaseService } from '@common/supabase/supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch user profile with role from database
    const { data: profile, error } = await this.supabaseService
      .getClient()
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      throw new ForbiddenException('User profile not found');
    }

    const hasRole = requiredRoles.includes(profile.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `User role '${profile.role}' does not have permission to access this resource`,
      );
    }

    // Attach role to request for later use
    request.user.role = profile.role;

    return true;
  }
}
