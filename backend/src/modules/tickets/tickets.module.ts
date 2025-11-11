import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { SupabaseModule } from '@common/supabase/supabase.module';
import { QrCodeService } from '@common/services/qr-code.service';
import { EmailService } from '@common/services/email.service';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { TicketTypesModule } from '@modules/ticket-types/ticket-types.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [SupabaseModule, TransactionsModule, TicketTypesModule, UsersModule],
  controllers: [TicketsController],
  providers: [TicketsService, QrCodeService, EmailService],
  exports: [TicketsService],
})
export class TicketsModule {}
