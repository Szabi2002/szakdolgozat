export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  preferred_language?: 'en' | 'hu';
  notification_preferences: NotificationPreferences;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_ticket_purchase: boolean;
  email_route_disruptions: boolean;
  email_promotional: boolean;
  push_enabled: boolean;
}

export interface UserStatistics {
  tickets_purchased: number;
  active_tickets: number;
  total_spent: number; // in HUF
  favorites_count: number;
  last_purchase_date?: string;
  last_favorite_added?: string;
}

export interface UpdateProfileDto {
  name?: string;
  display_name?: string;
  preferred_language?: 'en' | 'hu';
}

export interface UpdateNotificationPreferencesDto {
  email_ticket_purchase?: boolean;
  email_route_disruptions?: boolean;
  email_promotional?: boolean;
  push_enabled?: boolean;
}
