import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionToken } from './session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export class BackendError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  error: { statusCode: number; message: string | string[] } | null;
}

/// Sunucu bileşenlerinden (Server Component) NestJS admin API'sine istek atar.
/// Token cookie'den okunur; 401 dönerse login'e yönlendirilir.
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/login');
  }

  const envelope = (await response.json()) as Envelope<T>;

  if (!envelope.success) {
    const message = Array.isArray(envelope.error?.message)
      ? envelope.error!.message.join(', ')
      : (envelope.error?.message ?? 'Bilinmeyen hata');
    throw new BackendError(envelope.error?.statusCode ?? response.status, message);
  }

  return envelope.data;
}

export async function adminLoginRequest(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const envelope = (await response.json()) as Envelope<{ accessToken: string; admin: { email: string; role: string } }>;

  if (!envelope.success) {
    const message = Array.isArray(envelope.error?.message)
      ? envelope.error!.message.join(', ')
      : (envelope.error?.message ?? 'Giriş başarısız');
    throw new BackendError(envelope.error?.statusCode ?? response.status, message);
  }

  return envelope.data;
}
