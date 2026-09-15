import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE || 'atlas_admin_session';

// Admin JWT tarayıcıda localStorage'a değil, yalnızca httpOnly cookie'de tutulur.
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // backend ADMIN_JWT_EXPIRES_IN (8h) ile uyumlu
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}
