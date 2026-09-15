import Link from 'next/link';
import { adminFetch } from '@/lib/backend';
import type { AdminUserRow } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  let user: AdminUserRow | null = null;
  let errorMessage: string | null = null;
  try {
    user = await adminFetch<AdminUserRow>(`/admin/users/${id}`);
  } catch {
    errorMessage = 'Kullanıcı bulunamadı veya yüklenemedi.';
  }

  return (
    <div>
      <Link href="/users" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Kullanıcılara Dön
      </Link>

      {errorMessage && <p className="text-red-600">{errorMessage}</p>}

      {user && (
        <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-gray-900">{user.fullName || 'İsimsiz Kullanıcı'}</h1>
          <dl>
            <Field label="ID" value={user.id} />
            <Field label="E-posta" value={user.email} />
            <Field label="Tier" value={user.tier} />
            <Field label="Kayıt Tarihi" value={new Date(user.createdAt).toLocaleString('tr-TR')} />
            <Field label="Güncelleme Tarihi" value={new Date(user.updatedAt).toLocaleString('tr-TR')} />
            <Field
              label="Hesap Durumu"
              value={
                <span className={user.accountStatus === 'deleted' ? 'text-red-600' : 'text-green-600'}>
                  {user.accountStatus === 'deleted' ? 'Silindi' : 'Aktif'}
                </span>
              }
            />
          </dl>
          <p className="mt-4 text-xs text-gray-400">
            Gizlilik ilkesi gereği bu görünümde kullanıcının gelir/gider, banka, kart veya kredi bilgileri
            gösterilmez.
          </p>
        </div>
      )}
    </div>
  );
}
