import { Injectable } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private supabaseService: SupabaseService) {}

  async check(): Promise<HealthResponseDto> {
    // Supabase connection check
    let dbStatus = 'unknown';
    let storageStatus = 'unknown';

    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('count')
        .limit(1);

      dbStatus = error ? 'disconnected' : 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    try {
      const { data } = await this.supabaseService.getClient().storage.listBuckets();

      storageStatus = data && data.length >= 0 ? 'connected' : 'disconnected';
    } catch {
      storageStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services: {
        database: dbStatus,
        storage: storageStatus,
      },
    };
  }
}
