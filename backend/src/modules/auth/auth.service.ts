import { Injectable, UnauthorizedException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { EmailService } from '@common/services/email.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkAccountsDto } from './dto/link-accounts.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private emailService: EmailService,
  ) { }

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
        token: dto.accessToken, // FIXED: Renamed from accessToken to match DTO
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

    // Create new user with default notification preferences
    const newUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      profile_picture_url: supabaseUser.user_metadata?.avatar_url || null,
      google_id: supabaseUser.user_metadata?.provider_id || supabaseUser.id,
      role: 'user', // Default role
      notification_preferences: {
        emailTicketPurchase: true,
        emailRouteDisruptions: true,
        emailPromotional: false,
        pushNotifications: true,
      },
      preferred_language: 'hu',
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
      name: user.display_name || user.name, // Prefer display_name (user-customized) over name (OAuth default)
      profile_picture_url: user.profile_picture_url,
      role: user.role,
      created_at: user.created_at,
    };
  }

  // ==============================================================================
  // EMAIL/PASSWORD AUTHENTICATION METHODS
  // ==============================================================================

  /**
   * Register new user with email and password
   * Sends verification email via Supabase Auth (automatically triggers email)
   */
  async registerWithEmail(dto: EmailRegisterDto): Promise<{ message: string }> {
    try {
      // Check if user already exists in public.users
      const { data: existingUser } = await this.supabaseService
        .getClient()
        .from('users')
        .select('id')
        .eq('email', dto.email)
        .single();

      if (existingUser) {
        throw new ConflictException('Ez az email cím már használatban van');
      }

      // Hash password with bcrypt (10 rounds)
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Generate verification token for fallback (in case Supabase email doesn't work)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hour expiration

      // Check if auth user already exists (orphan from previous failed registration)
      let authUserId: string;
      const { data: authUsers } = await this.supabaseService
        .getAdminClient()
        .auth.admin.listUsers();

      const existingAuthUser = authUsers?.users?.find((u: any) => u.email === dto.email);

      if (existingAuthUser) {
        // Orphan auth user found - use its ID and update it
        this.logger.log(`Found orphan auth user for ${dto.email}, reusing ID`);
        authUserId = existingAuthUser.id;

        // Update the auth user with new password
        const { error: updateError } = await this.supabaseService
          .getAdminClient()
          .auth.admin.updateUserById(authUserId, {
            password: dto.password,
            email_confirm: false, // Require email confirmation
            user_metadata: { name: dto.name },
          });

        if (updateError) {
          this.logger.error(`Failed to update orphan auth user: ${updateError.message}`);
          throw new BadRequestException('Felhasználó frissítése sikertelen: ' + updateError.message);
        }
      } else {
        // Create new user in Supabase Auth using admin client
        // This will automatically trigger Supabase's email confirmation flow
        const { data: authData, error: authError } = await this.supabaseService
          .getAdminClient()
          .auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: false, // User must verify email - triggers confirmation email
            user_metadata: {
              name: dto.name,
            },
          });

        if (authError || !authData.user) {
          this.logger.error(`Failed to create auth user: ${authError?.message}`);
          throw new BadRequestException('Felhasználó létrehozása sikertelen: ' + authError?.message);
        }

        // DEBUG: Check immediately if user is confirmed
        this.logger.log(`[DEBUG] Created Supabase Auth User: ID=${authData.user.id}, ConfirmedAt=${authData.user.email_confirmed_at}, Role=${authData.user.role}`);
        if (authData.user.email_confirmed_at) {
          this.logger.error(`[CRITICAL] User created with email_confirm: false, but Supabase returned email_confirmed_at! Auto-confirm is active.`);
        }

        authUserId = authData.user.id;
      }

      // Create or update user in public.users table with default notification preferences
      // Use UPSERT to handle race conditions where auth user exists but public.users doesn't
      const { error: dbError } = await this.supabaseService
        .getClient()
        .from('users')
        .upsert({
          id: authUserId,
          email: dto.email,
          name: dto.name,
          password_hash: passwordHash,
          email_verified: false,
          verification_token: verificationToken,
          verification_token_expires: verificationTokenExpires.toISOString(),
          role: 'user',
          notification_preferences: {
            emailTicketPurchase: true,
            emailRouteDisruptions: true,
            emailPromotional: false,
            pushNotifications: true,
          },
          preferred_language: 'hu',
        }, {
          onConflict: 'id', // Handle duplicate ID conflicts
          ignoreDuplicates: false, // Update existing record if conflict
        });

      if (dbError) {
        // Rollback: delete auth user if public.users upsert fails (only if we created it)
        if (!existingAuthUser) {
          await this.supabaseService.getAdminClient().auth.admin.deleteUser(authUserId);
        }
        throw new BadRequestException('Felhasználó adatainak mentése sikertelen: ' + dbError.message);
      }

      // Generate email verification link using Supabase Auth Admin API
      // This creates a magic link that will be sent via EmailService
      let verificationLink: string;
      try {
        const { data: linkData, error: linkError } = await this.supabaseService
          .getAdminClient()
          .auth.admin.generateLink({
            type: 'signup',
            email: dto.email,
            password: dto.password, // Required for signup type
            options: {
              ...(process.env.FRONTEND_URL ? { redirectTo: `${process.env.FRONTEND_URL}/auth/verify-email` } : {}),
            },
          });

        if (linkError || !linkData?.properties?.action_link) {
          // Supabase link generation failed - use manual verification token as fallback
          this.logger.warn(`Supabase verification link generation failed: ${linkError?.message || 'No link generated'}`);
          verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/verify-email?token=${verificationToken}`;
          this.logger.log(`Using manual verification token for ${dto.email}`);
        } else {
          // Successfully generated Supabase link
          verificationLink = linkData.properties.action_link;
          this.logger.log(`Generated Supabase verification link for ${dto.email}`);
        }
      } catch (emailError) {
        // Error generating link - use manual verification token as fallback
        this.logger.error(`Error generating verification link: ${emailError.message}`);
        verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/verify-email?token=${verificationToken}`;
      }

      // Send verification email using EmailService
      // This will either send a real email (if SMTP configured) or log to console (dev mode)
      try {
        const emailResult = await this.emailService.sendVerificationEmail(dto.email, dto.name, verificationLink);

        if (emailResult.link) {
          this.logger.log(`[DEV AID] Verification link: ${emailResult.link}`);
        } else {
          this.logger.log(`Verification email sent for ${dto.email}`);
        }
      } catch (emailError) {
        // Non-critical error - log it but don't fail registration
        this.logger.error(`Error sending verification email: ${emailError.message}`);
        this.logger.log(`Verification link: ${verificationLink}`);
      }

      // Check if user was automatically confirmed by Supabase (project setting: Enable Email Confirmations is OFF)
      try {
        const { data: checkUser } = await this.supabaseService.getAdminClient().auth.admin.getUserById(authUserId);
        if (checkUser?.user?.email_confirmed_at) {
          this.logger.warn(`
            [WARNING] User ${dto.email} was automatically confirmed by Supabase immediately after registration.
            This means the "Enable Email Confirmations" project setting is likely OFF in Supabase Dashboard.
            Fix: Go to Supabase > Authentication > Providers > Email > Enable Email Confirmations.
          `);
        }
      } catch (e) {
        // Ignore check errors
      }

      return {
        message: 'Regisztráció sikeres. Kérjük, ellenőrizze email fiókját a megerősítéshez.',
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Registration error: ${error.message}`);
      throw new BadRequestException('Regisztráció sikertelen: ' + error.message);
    }
  }

  /**
   * Login with email and password
   * Returns JWT token from Supabase
   */
  async loginWithEmail(dto: EmailLoginDto): Promise<AuthResponseDto> {
    try {
      // Get user from database
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', dto.email)
        .single();

      if (userError || !user) {
        throw new UnauthorizedException('Érvénytelen email vagy jelszó');
      }

      // Check if user has password (not Google-only)
      if (!user.password_hash) {
        throw new UnauthorizedException('Ez a fiók csak Google bejelentkezést támogat');
      }

      // Verify password
      const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
      if (!passwordValid) {
        throw new UnauthorizedException('Érvénytelen email vagy jelszó');
      }

      // Check email verification - check both our DB and Supabase auth
      let isEmailVerified = user.email_verified;

      // If not verified in our DB, check Supabase auth user status
      if (!isEmailVerified) {
        try {
          const { data: authUser } = await this.supabaseService
            .getAdminClient()
            .auth.admin.getUserById(user.id);

          if (authUser?.user?.email_confirmed_at) {
            // Supabase verified but our DB not updated - sync it now
            isEmailVerified = true;
            await this.supabaseService
              .getClient()
              .from('users')
              .update({ email_verified: true })
              .eq('id', user.id);
            this.logger.log(`Synced email verification status for ${dto.email}`);
          }
        } catch (authCheckError) {
          this.logger.warn(`Could not check Supabase auth status: ${authCheckError.message}`);
        }
      }

      if (!isEmailVerified) {
        throw new UnauthorizedException('Kérjük, először erősítse meg az email címét');
      }

      // Sign in with Supabase to get JWT token
      const { data: authData, error: authError } = await this.supabaseService
        .getAnonClient()
        .auth.signInWithPassword({
          email: dto.email,
          password: dto.password,
        });

      if (authError || !authData.session) {
        this.logger.error(`Login error: ${authError?.message}`);
        throw new UnauthorizedException('Bejelentkezés sikertelen');
      }

      return {
        token: authData.session.access_token,
        user: this.mapUserToDto(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error: ${error.message}`);
      throw new BadRequestException('Bejelentkezés sikertelen: ' + error.message);
    }
  }

  /**
   * Verify email with token
   * Marks user's email as verified
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      // Find user with this verification token
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('verification_token', token)
        .single();

      if (userError || !user) {
        throw new BadRequestException('Érvénytelen vagy lejárt megerősítési token');
      }

      // Check token expiration
      const tokenExpires = new Date(user.verification_token_expires);
      if (tokenExpires < new Date()) {
        throw new BadRequestException('A megerősítési token lejárt');
      }

      // Update user - mark as verified and clear token
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('users')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires: null,
        })
        .eq('id', user.id);

      if (updateError) {
        throw new BadRequestException('Email megerősítése sikertelen: ' + updateError.message);
      }

      // Also update Supabase auth user
      await this.supabaseService.getAdminClient().auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      return {
        message: 'Email cím sikeresen megerősítve. Most már bejelentkezhet.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Email verification error: ${error.message}`);
      throw new BadRequestException('Email megerősítése sikertelen: ' + error.message);
    }
  }

  /**
   * Initiate password reset process
   * Generates reset token and sends email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      // Find user by email
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', dto.email)
        .single();

      // Always return success message (don't reveal if email exists)
      if (userError || !user) {
        this.logger.log(`Password reset requested for non-existent email: ${dto.email}`);
        return {
          message: 'Ha az email cím regisztrálva van, elküldtük a jelszó visszaállítási linket.',
        };
      }

      // Check if user has password (not Google-only)
      if (!user.password_hash) {
        this.logger.log(`Password reset requested for Google-only account: ${dto.email}`);
        return {
          message: 'Ha az email cím regisztrálva van, elküldtük a jelszó visszaállítási linket.',
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiration

      // Save reset token
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpires.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        this.logger.error(`Failed to save reset token: ${updateError.message}`);
      }

      // Log token (in production, send via email)
      this.logger.log(`Password reset token for ${dto.email}: ${resetToken}`);

      // TODO: Send email using Supabase or external email service
      // Example: await this.sendResetEmail(user.email, resetToken);

      return {
        message: 'Ha az email cím regisztrálva van, elküldtük a jelszó visszaállítási linket.',
      };
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`);
      // Always return success to prevent email enumeration
      return {
        message: 'Ha az email cím regisztrálva van, elküldtük a jelszó visszaállítási linket.',
      };
    }
  }

  /**
   * Reset password with token
   * Validates token and updates password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      // Find user with this reset token
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('reset_token', dto.token)
        .single();

      if (userError || !user) {
        throw new BadRequestException('Érvénytelen vagy lejárt visszaállítási token');
      }

      // Check token expiration
      const tokenExpires = new Date(user.reset_token_expires);
      if (tokenExpires < new Date()) {
        throw new BadRequestException('A visszaállítási token lejárt');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);

      // Update password and clear reset token
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('users')
        .update({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
        })
        .eq('id', user.id);

      if (updateError) {
        throw new BadRequestException('Jelszó visszaállítása sikertelen: ' + updateError.message);
      }

      // Also update Supabase auth user password
      await this.supabaseService.getAdminClient().auth.admin.updateUserById(user.id, {
        password: dto.newPassword,
      });

      return {
        message: 'Jelszó sikeresen visszaállítva. Most már bejelentkezhet az új jelszavával.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Reset password error: ${error.message}`);
      throw new BadRequestException('Jelszó visszaállítása sikertelen: ' + error.message);
    }
  }

  /**
   * Change password for authenticated user
   * Verifies old password before updating
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    try {
      // Get user from database
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new UnauthorizedException('User nem található');
      }

      // Check if user has password (not Google-only)
      if (!user.password_hash) {
        throw new BadRequestException('Ez a fiók csak Google bejelentkezést támogat');
      }

      // Verify old password
      const passwordValid = await bcrypt.compare(dto.oldPassword, user.password_hash);
      if (!passwordValid) {
        throw new UnauthorizedException('Helytelen jelenlegi jelszó');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);

      // Update password
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('users')
        .update({
          password_hash: passwordHash,
        })
        .eq('id', userId);

      if (updateError) {
        throw new BadRequestException('Jelszó módosítása sikertelen: ' + updateError.message);
      }

      // Also update Supabase auth user password
      await this.supabaseService.getAdminClient().auth.admin.updateUserById(userId, {
        password: dto.newPassword,
      });

      return {
        message: 'Jelszó sikeresen megváltoztatva',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Change password error: ${error.message}`);
      throw new BadRequestException('Jelszó módosítása sikertelen: ' + error.message);
    }
  }

  /**
   * Link Google account to existing email/password account
   * Verifies that emails match before linking
   */
  async linkGoogleAccount(userId: string, dto: LinkAccountsDto): Promise<{ message: string }> {
    try {
      // Verify Google token
      const googleUser = await this.supabaseService.verifyToken(dto.googleToken);
      if (!googleUser) {
        throw new UnauthorizedException('Érvénytelen Google token');
      }

      // Get current user
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new UnauthorizedException('User nem található');
      }

      // Check if emails match
      if (user.email !== googleUser.email) {
        throw new BadRequestException('A Google fiók email címe nem egyezik a jelenlegi fiókéval');
      }

      // Check if Google account already linked to another user
      const { data: existingGoogleUser } = await this.supabaseService
        .getClient()
        .from('users')
        .select('id')
        .eq('google_id', googleUser.user_metadata?.provider_id || googleUser.id)
        .neq('id', userId)
        .single();

      if (existingGoogleUser) {
        throw new ConflictException('Ez a Google fiók már egy másik felhasználóhoz van csatolva');
      }

      // Link Google account
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('users')
        .update({
          google_id: googleUser.user_metadata?.provider_id || googleUser.id,
          profile_picture_url: googleUser.user_metadata?.avatar_url || user.profile_picture_url,
        })
        .eq('id', userId);

      if (updateError) {
        throw new BadRequestException('Google fiók csatolása sikertelen: ' + updateError.message);
      }

      return {
        message: 'Google fiók sikeresen csatolva',
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Link Google account error: ${error.message}`);
      throw new BadRequestException('Google fiók csatolása sikertelen: ' + error.message);
    }
  }
}
