import { Module } from '@nestjs/common';
import { StopsService } from './stops.service';
import { StopsController } from './stops.controller';
import { SupabaseModule } from '@common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [StopsService],
  controllers: [StopsController],
  exports: [StopsService],
})
export class StopsModule {}
