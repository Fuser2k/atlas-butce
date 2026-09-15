export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  freeUsers: number;
  premiumUsers: number;
  newUsersLast7Days: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  tier: 'FREE' | 'PREMIUM';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  accountStatus: 'active' | 'deleted';
}

export interface PaginatedUsers {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
