/**
 * Admin Dashboard Statistics
 */
export interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  pendingRatings: number;
  pendingReports: number;
  activeTickets: number;
  monthlyRegistrations: MonthlyRegistration[];
  ratingsStatusDistribution: RatingsDistribution;
}

export interface MonthlyRegistration {
  month: string;
  count: number;
}

export interface RatingsDistribution {
  approved: number;
  pending: number;
  rejected: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User Filters for Admin
 */
export interface UserFilters {
  search?: string;
  role?: 'user' | 'admin' | 'provider';
  page?: number;
  limit?: number;
}

