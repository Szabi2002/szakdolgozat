import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkAccountsDto } from './dto/link-accounts.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google OAuth bejelentkezés',
    description: 'Supabase-től kapott Google OAuth token validálása és user létrehozása/lekérése',
  })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Sikeres bejelentkezés',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Hibás kérés vagy érvénytelen token',
  })
  @ApiResponse({
    status: 401,
    description: 'Érvénytelen Google token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Please try again later.',
  })
  async googleLogin(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.authService.signInWithGoogle(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aktuális user lekérése',
    description: 'Bejelentkezett user adatainak lekérése a JWT tokenből',
  })
  @ApiResponse({
    status: 200,
    description: 'User adatok sikeresen lekérve',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Érvénytelen vagy hiányzó token',
  })
  async getCurrentUser(
    @Headers('authorization') authHeader: string,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    const token = authHeader.replace('Bearer ', '');
    return this.authService.getCurrentUser(token);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kijelentkezés',
    description: 'Token invalidálása Supabase-en keresztül (opcionális token)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sikeres kijelentkezés',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sikeres kijelentkezés' },
      },
    },
  })
  async logout(@Headers('authorization') authHeader?: string): Promise<{ message: string }> {
    // Token is optional for logout - if present, invalidate it
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    return this.authService.signOut(token);
  }

  // ==============================================================================
  // EMAIL/PASSWORD AUTHENTICATION ENDPOINTS
  // ==============================================================================

  @Post('register')
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 3 } }) // 3 requests per hour
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Regisztráció email/jelszóval',
    description: 'Új felhasználó létrehozása email címmel és jelszóval. Email megerősítés szükséges.',
  })
  @ApiBody({ type: EmailRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Sikeres regisztráció',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Regisztráció sikeres. Kérjük, ellenőrizze email fiókját a megerősítéshez.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Hibás kérés vagy érvénytelen adatok',
  })
  @ApiResponse({
    status: 409,
    description: 'Email cím már használatban van',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts. Please try again later.',
  })
  async register(@Body() dto: EmailRegisterDto): Promise<{ message: string }> {
    return this.authService.registerWithEmail(dto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bejelentkezés email/jelszóval',
    description: 'Bejelentkezés email címmel és jelszóval',
  })
  @ApiBody({ type: EmailLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Sikeres bejelentkezés',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Hibás kérés',
  })
  @ApiResponse({
    status: 401,
    description: 'Érvénytelen email vagy jelszó, vagy email még nincs megerősítve',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Please try again later.',
  })
  async login(@Body() dto: EmailLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithEmail(dto);
  }

  @Get('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Email megerősítése',
    description: 'Email cím megerősítése tokennel (emailből kapott link)',
  })
  @ApiQuery({
    name: 'token',
    description: 'Email megerősítési token',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Email sikeresen megerősítve',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email cím sikeresen megerősítve. Most már bejelentkezhet.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Érvénytelen vagy lejárt token',
  })
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Elfelejtett jelszó',
    description: 'Jelszó visszaállítási link küldése emailben',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email elküldve (ha a cím létezik)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Ha az email cím regisztrálva van, elküldtük a jelszó visszaállítási linket.',
        },
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Jelszó visszaállítása',
    description: 'Jelszó visszaállítása tokennel (emailből kapott link)',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Jelszó sikeresen visszaállítva',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Jelszó sikeresen visszaállítva. Most már bejelentkezhet az új jelszavával.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Érvénytelen vagy lejárt token',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Jelszó módosítása',
    description: 'Bejelentkezett felhasználó jelszavának módosítása',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Jelszó sikeresen módosítva',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Jelszó sikeresen megváltoztatva',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Hibás kérés vagy fiók csak Google bejelentkezést támogat',
  })
  @ApiResponse({
    status: 401,
    description: 'Helytelen jelenlegi jelszó vagy nincs bejelentkezve',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('link-google')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google fiók csatolása',
    description: 'Google fiók csatolása meglévő email/jelszó fiókhoz',
  })
  @ApiBody({ type: LinkAccountsDto })
  @ApiResponse({
    status: 200,
    description: 'Google fiók sikeresen csatolva',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Google fiók sikeresen csatolva',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email címek nem egyeznek',
  })
  @ApiResponse({
    status: 401,
    description: 'Érvénytelen Google token vagy nincs bejelentkezve',
  })
  @ApiResponse({
    status: 409,
    description: 'Google fiók már másik felhasználóhoz van csatolva',
  })
  async linkGoogle(
    @CurrentUser() user: any,
    @Body() dto: LinkAccountsDto,
  ): Promise<{ message: string }> {
    return this.authService.linkGoogleAccount(user.id, dto);
  }
}
