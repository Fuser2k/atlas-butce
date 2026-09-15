import { NextRequest, NextResponse } from 'next/server';
import { adminLoginRequest, BackendError } from '@/lib/backend';
import { setSessionCookie } from '@/lib/session';

// BFF pattern: admin JWT tarayıcıya hiç gönderilmez, sadece httpOnly cookie olarak set edilir.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'E-posta ve şifre gerekli.' }, { status: 400 });
  }

  try {
    const result = await adminLoginRequest(body.email, body.password);
    await setSessionCookie(result.accessToken);
    return NextResponse.json({ admin: result.admin });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Giriş sırasında beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
