import Link from 'next/link';
import { adminFetch } from '@/lib/backend';
import type { PaginatedUsers } from '@/lib/types';
import { UsersFilterBar } from './UsersFilterBar';

interface PageProps {
  searchParams: Promise<{ search?: string; tier?: string; page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? '';
  const tier = params.tier ?? '';
  const page = params.page ?? '1';

  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (tier) query.set('tier', tier);
  query.set('page', page);
  query.set('limit', '20');

  let result: PaginatedUsers | null = null;
  let errorMessage: string | null = null;
  try {
    result = await adminFetch<PaginatedUsers>(`/admin/users?${query.toString()}`);
  } catch {
    errorMessage = 'Kullanıcılar yüklenemedi.';
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Kullanıcılar</h1>

      <UsersFilterBar initialSearch={search} initialTier={tier} />

      {errorMessage && <p className="text-red-600">{errorMessage}</p>}

      {result && result.items.length === 0 && (
        <p className="text-gray-500">Bu filtreye uyan kullanıcı bulunamadı.</p>
      )}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ad</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">E-posta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.items.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/users/${user.id}`} className="text-indigo-600 hover:underline">
                      {user.fullName || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.tier === 'PREMIUM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.accountStatus === 'deleted' ? 'text-red-600' : 'text-green-600'}>
                      {user.accountStatus === 'deleted' ? 'Silindi' : 'Aktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            <span>
              Toplam {result.total} kullanıcı — sayfa {result.page}/{result.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <PageLink page={result.page - 1} disabled={result.page <= 1} search={search} tier={tier} label="Önceki" />
              <PageLink
                page={result.page + 1}
                disabled={result.page >= result.totalPages}
                search={search}
                tier={tier}
                label="Sonraki"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  search,
  tier,
  label,
}: {
  page: number;
  disabled: boolean;
  search: string;
  tier: string;
  label: string;
}) {
  if (disabled) {
    return <span className="cursor-not-allowed text-gray-300">{label}</span>;
  }
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (tier) query.set('tier', tier);
  query.set('page', String(page));
  return (
    <Link href={`/users?${query.toString()}`} className="text-indigo-600 hover:underline">
      {label}
    </Link>
  );
}
