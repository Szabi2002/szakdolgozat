import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;
  private supabaseUrl: string;
  private anonKey: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Supabase credentials hiányoznak az environment változókból');
    }

    this.supabaseUrl = supabaseUrl;
    this.anonKey = anonKey;

    // Admin client with service role (bypasses RLS - use for admin operations only)
    this.adminClient = createClient(this.supabaseUrl, serviceRoleKey);

    // Anon client for regular operations (respects RLS)
    this.anonClient = createClient(this.supabaseUrl, this.anonKey);
  }

  /**
   * Get admin client - bypasses RLS
   * Use only for admin operations or when RLS is not needed
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Get client - defaults to admin client for backward compatibility
   * @deprecated Use getAdminClient() or getUserClient(token) instead
   */
  getClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Get user-scoped client with JWT token - respects RLS
   * This creates a client with the user's JWT token set
   * @param token - User's JWT token
   */
  getUserClient(token: string): SupabaseClient {
    const client = createClient(this.supabaseUrl, this.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    return client;
  }

  /**
   * Verify and decode JWT token
   * @param token - JWT token to verify
   * @returns User object from token
   */
  async verifyToken(token: string) {
    const { data, error } = await this.adminClient.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }
}
