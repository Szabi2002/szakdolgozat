/**
 * Report type enum - categorizes the type of issue being reported
 */
export type ReportType = 'service_issue' | 'safety_concern' | 'cleanliness' | 'accessibility' | 'other';

/**
 * Report status enum - tracks lifecycle of a report
 */
export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

/**
 * Report priority enum - indicates urgency level
 */
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Main report entity interface
 */
export interface Report {
  id: string;
  user_id: string;
  route_id?: string;
  stop_id?: string;
  report_type: ReportType;
  title: string;
  description: string;
  location?: string;
  status: ReportStatus;
  priority: ReportPriority;
  admin_notes?: string; // Only visible to admins
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  photos?: ReportPhoto[];
  user?: {
    name: string;
    email: string;
  };
  route?: {
    id: string;
    route_number: string;
    name: string;
  };
  stop?: {
    name: string;
  };
}

/**
 * Report photo attachment interface
 */
export interface ReportPhoto {
  id: string;
  report_id: string;
  photo_url: string;
  created_at: string;
}

/**
 * DTO for creating a new report
 */
export interface CreateReportDto {
  report_type: ReportType;
  title: string;
  description: string;
  route_id?: string;
  stop_id?: string;
  location?: string;
}

/**
 * DTO for updating an existing report (user can only update pending reports)
 */
export interface UpdateReportDto {
  title?: string;
  description?: string;
  location?: string;
}

/**
 * DTO for updating report status (admin only)
 */
export interface UpdateStatusDto {
  status: ReportStatus;
  admin_notes?: string;
}

/**
 * DTO for updating report priority (admin only)
 */
export interface UpdatePriorityDto {
  priority: ReportPriority;
}

/**
 * Filters for querying reports
 */
export interface ReportFilters {
  status?: ReportStatus;
  report_type?: ReportType;
  priority?: ReportPriority;
  route_id?: string;
  stop_id?: string;
  page?: number;
  limit?: number;
}

/**
 * Admin-specific filters for moderation queue
 */
export interface AdminQueueFilters {
  status?: ReportStatus;
  priority?: ReportPriority;
  page?: number;
  limit?: number;
}

/**
 * Paginated reports response
 */
export interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Report statistics (admin only)
 */
export interface ReportStatistics {
  report_type: ReportType;
  total_reports: number;
  pending_count: number;
  in_review_count: number;
  resolved_count: number;
  dismissed_count: number;
  critical_count: number;
  high_count: number;
  avg_resolution_hours: number;
}

/**
 * User statistics for my-reports page
 */
export interface UserReportStats {
  total: number;
  pending: number;
  in_review: number;
  resolved: number;
  dismissed: number;
}

/**
 * Report type metadata for UI display
 */
export interface ReportTypeMetadata {
  type: ReportType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Predefined report type metadata for UI
 */
export const REPORT_TYPE_METADATA: Record<ReportType, ReportTypeMetadata> = {
  service_issue: {
    type: 'service_issue',
    label: 'Szolgáltatási probléma',
    icon: 'directions_bus',
    color: '#FF9800',
    description: 'Busz/villamos/metró késések, kimaradások, menetrendi problémák'
  },
  safety_concern: {
    type: 'safety_concern',
    label: 'Biztonsági probléma',
    icon: 'warning',
    color: '#F44336',
    description: 'Zaklatás, veszélyes vezetés, vészhelyzetek'
  },
  cleanliness: {
    type: 'cleanliness',
    label: 'Tisztaság',
    icon: 'cleaning_services',
    color: '#2196F3',
    description: 'Piszkos járművek, szemét, karbantartási problémák'
  },
  accessibility: {
    type: 'accessibility',
    label: 'Akadálymentesség',
    icon: 'accessible',
    color: '#9C27B0',
    description: 'Kerekesszék hozzáférés, liftek, rámpák, létesítmények'
  },
  other: {
    type: 'other',
    label: 'Egyéb',
    icon: 'feedback',
    color: '#757575',
    description: 'Általános visszajelzések és javaslatok'
  }
};

/**
 * Status badge color mapping
 */
export const STATUS_COLORS: Record<ReportStatus, { color: string; matColor?: string; icon: string }> = {
  pending: { color: '#FFC107', matColor: 'warn', icon: 'schedule' },
  in_review: { color: '#2196F3', matColor: 'primary', icon: 'rate_review' },
  resolved: { color: '#4CAF50', matColor: 'accent', icon: 'check_circle' },
  dismissed: { color: '#9E9E9E', icon: 'cancel' }
};

/**
 * Priority badge color mapping
 */
export const PRIORITY_COLORS: Record<ReportPriority, { color: string; matColor?: string }> = {
  low: { color: '#9E9E9E' },
  medium: { color: '#2196F3', matColor: 'primary' },
  high: { color: '#FF9800', matColor: 'warn' },
  critical: { color: '#F44336', matColor: 'warn' }
};
