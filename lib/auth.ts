import { createHash } from 'crypto'

export type Role = 'admin' | 'viewer'

function makeToken(username: string, password: string, role: Role): string {
  const secret = process.env.AUTH_SECRET ?? 'cambia-este-secreto-en-produccion'
  return createHash('sha256').update(`${username}:${password}:${role}:${secret}`).digest('hex')
}

export function checkCredentials(username: string, password: string): Role | null {
  const adminUser = process.env.ADMIN_USERNAME ?? 'capataz'
  const adminPass = process.env.ADMIN_PASSWORD ?? 'Cuadrilla#2026!'
  const viewerUser = process.env.VIEWER_USERNAME ?? 'trabajador'
  const viewerPass = process.env.VIEWER_PASSWORD ?? 'Equipo#2026!'

  if (username === adminUser && password === adminPass) return 'admin'
  if (username === viewerUser && password === viewerPass) return 'viewer'
  return null
}

export function getTokenForRole(role: Role): string {
  if (role === 'admin') {
    const u = process.env.ADMIN_USERNAME ?? 'capataz'
    const p = process.env.ADMIN_PASSWORD ?? 'Cuadrilla#2026!'
    return makeToken(u, p, 'admin')
  }
  const u = process.env.VIEWER_USERNAME ?? 'trabajador'
  const p = process.env.VIEWER_PASSWORD ?? 'Equipo#2026!'
  return makeToken(u, p, 'viewer')
}

export function verifyToken(token: string | undefined): Role | null {
  if (!token) return null
  if (token === getTokenForRole('admin')) return 'admin'
  if (token === getTokenForRole('viewer')) return 'viewer'
  return null
}
