import { NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: Request) {
  const formData = await req.formData()
  const password = String(formData.get('password') || '')
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    return NextResponse.redirect(
      new URL('/admin/login?error=config', req.url)
    )
  }

  if (password !== expected) {
    return NextResponse.redirect(new URL('/admin/login?error=1', req.url))
  }

  const token = await createSessionToken()
  const response = NextResponse.redirect(new URL('/admin', req.url))
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })
  return response
}
