// Autenticación mínima del /admin: una contraseña compartida (ADMIN_PASSWORD) y una
// cookie httpOnly firmada con HMAC. Usa Web Crypto (crypto.subtle) a propósito —
// funciona igual en middleware (Edge runtime) que en las rutas /api (Node runtime).

export const SESSION_COOKIE = 'na_admin_session'

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function sessionSecret(): string {
  // Si no se configuró un secreto aparte, se deriva de la contraseña del admin.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret-inseguro'
}

export async function createSessionToken(): Promise<string> {
  return hmac(sessionSecret(), 'admin-session')
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const expected = await createSessionToken()
  return token === expected
}
