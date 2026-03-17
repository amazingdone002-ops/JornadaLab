import { NextRequest } from 'next/server'
import { checkCredentials, getTokenForRole, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const role = checkCredentials(username, password)
    if (!role) {
      return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }
    const token = getTokenForRole(role)
    const res = Response.json({ ok: true, role })
    res.headers.set(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
    )
    return res
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = Response.json({ ok: true })
  res.headers.set(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  )
  return res
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  const role = verifyToken(token)
  return Response.json({ role })
}
