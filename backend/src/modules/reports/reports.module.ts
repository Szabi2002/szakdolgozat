import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SupabaseModule } from '@common/supabase/supabase.module';

/**
 * Reports Module
 * Provides functionality for users to report issues about:
 * - Service issues (delays, no-shows, route problems)
 * - Safety concerns (harassment, dangerous driving)
 * - Cleanliness issues (dirty vehicles, trash)
 * - Accessibility problems (wheelchair access, elevators)
 * - Other feedback
 *
 * Features:
 * - User report submission with optional photos (max 5)
 * - Report status tracking (pending, in_review, resolved, dismissed)
 * - Priority levels (low, medium, high, critical)
 * - Auto-escalation of stale reports (>7 days)
 * - Admin moderation queue
 * - Statistics and analytics
 * - RLS-based security
 */
@Module({
  imports: [SupabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
