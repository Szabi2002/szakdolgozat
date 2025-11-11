import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
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
}
