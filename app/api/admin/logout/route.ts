import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', req.url))
  response.cookies.delete(SESSION_COOKIE)
  return response
}
