import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Sign in with Google OAuth through Supabase
   * The frontend should first get the OAuth token from Supabase
   * and send it to this endpoint for validation and user creation
   */
  async signInWithGoogle(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    try {
      // Verify the token with Supabase
      const user = await this.supabaseService.verifyToken(dto.accessToken);

      if (!user) {
        throw new UnauthorizedException('Érvénytelen Google token');
      }

      // Get or create user in database
      const dbUser = await this.getOrCreateUser(user);

      return {
        accessToken: dto.accessToken,
        user: this.mapUserToDto(dbUser),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Google bejelentkezés sikertelen: ' + error.message);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(token: string): Promise<UserResponseDto> {
    try {
      const supabaseUser = await this.supabaseService.verifyToken(token);

      if (!supabaseUser) {
        throw new UnauthorizedException('Érvénytelen token');
      }

      // Get user from database
      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !data) {
        throw new UnauthorizedException('User nem található');
      }

      return this.mapUserToDto(data);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('User lekérdezés sikertelen: ' + error.message);
    }
  }

  /**
   * Sign out - invalidate token on Supabase side
   * Token is optional - gracefully handles missing tokens
   *
   * IMPORTANT: We cannot use supabase.auth.signOut() on the backend because:
   * 1. Backend uses admin client with service role key
   * 2. Calling signOut() would log out the admin client itself
   * 3. Token invalidation happens automatically when frontend removes the token
   * 4. Supabase tokens have expiration and are validated on each request
   *
   * This method always returns success to prevent infinite logout loops.
   */
  async signOut(token: string | null): Promise<{ message: string }> {
    try {
      // If token provided, verify it was valid (optional check for logging)
      if (token) {
        try {
          await this.supabaseService.verifyToken(token);
          this.logger.log('Valid token logout');
        } catch (error) {
          // Token already invalid or expired, which is fine for logout
          this.logger.log(`Token already invalid during logout: ${error.message}`);
        }
      } else {
        this.logger.log('Logout without token');
      }

      // Always return success - token cleanup happens on frontend
      // This prevents infinite logout loops when token is already invalid
      return { message: 'Sikeres kijelentkezés' };
    } catch (error) {
      // Gracefully handle any errors - never block user logout
      this.logger.warn(`Logout error (non-critical): ${error.message}`);
      return { message: 'Sikeres kijelentkezés' };
    }
  }

  /**
   * Validate user exists and has proper role
   */
  async validateUser(userId: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Get or create user in database from Supabase Auth user
   */
  private async getOrCreateUser(supabaseUser: any): Promise<any> {
    const { data: existingUser } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const newUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      profile_picture_url: supabaseUser.user_metadata?.avatar_url || null,
      google_id: supabaseUser.user_metadata?.provider_id || supabaseUser.id,
      role: 'user', // Default role
    };

    const { data: createdUser, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('User létrehozása sikertelen: ' + error.message);
    }

    return createdUser;
  }

  /**
   * Map database user to DTO
   */
  private mapUserToDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profile_picture_url: user.profile_picture_url,
      role: user.role,
      created_at: user.created_at,
    };
  }
}
