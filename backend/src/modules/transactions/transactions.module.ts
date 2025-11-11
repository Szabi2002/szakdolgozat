import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { SupabaseModule } from '@common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
