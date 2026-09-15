import { adminFetch } from '@/lib/backend';
import type { DashboardMetrics } from '@/lib/types';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value.toLocaleString('tr-TR')}</p>
    </div>
  );
}

export default async function DashboardPage() {
  let metrics: DashboardMetrics;
  try {
    metrics = await adminFetch<DashboardMetrics>('/admin/dashboard');
  } catch {
    return <p className="text-red-600">Dashboard verileri yüklenemedi.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Toplam Kullanıcı" value={metrics.totalUsers} />
        <MetricCard label="Aktif Kullanıcı" value={metrics.activeUsers} />
        <MetricCard label="Silinen Kullanıcı" value={metrics.deletedUsers} />
        <MetricCard label="Free Kullanıcı" value={metrics.freeUsers} />
        <MetricCard label="Premium Kullanıcı" value={metrics.premiumUsers} />
        <MetricCard label="Son 7 Günde Yeni" value={metrics.newUsersLast7Days} />
      </div>
    </div>
  );
}
