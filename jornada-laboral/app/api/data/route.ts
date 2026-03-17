import { kv } from '@vercel/kv'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { INITIAL_DATA } from '@/lib/seed'
import type { AppData } from '@/lib/types'

const KEY = 'jornada:data'

async function getData(): Promise<AppData> {
  try {
    const data = await kv.get<AppData>(KEY)
    return data ?? INITIAL_DATA
  } catch {
    return INITIAL_DATA
  }
}

export async function GET() {
  const data = await getData()
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (verifyToken(token) !== 'admin') {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body: AppData = await req.json()
    await kv.set(KEY, body)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
