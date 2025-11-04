import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    this.loadUser();
  }

  private async loadUser() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    this.currentUser$.next(user);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  get user(): User | null {
    return this.currentUser$.value;
  }

  // Sprint 1-2: Google OAuth methods
  async signInWithGoogle() {
    // TODO: Implement in Sprint 1-2
  }

  async signOut() {
    // TODO: Implement in Sprint 1-2
  }
}
