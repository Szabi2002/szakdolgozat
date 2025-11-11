import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { SupabaseModule } from '@common/supabase/supabase.module';
import { RoutesModule } from './modules/routes/routes.module';
import { StopsModule } from './modules/stops/stops.module';
import { PlannerModule } from './modules/planner/planner.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AuthGuard } from '@common/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Global rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // 100 requests per minute
      },
    ]),
    SupabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RoutesModule,
    StopsModule,
    PlannerModule,
    TicketTypesModule,
    TicketsModule,
    TransactionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
