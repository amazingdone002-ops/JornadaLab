import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { INITIAL_DATA } from '@/lib/seed'
import type { AppData } from '@/lib/types'

const KEY = 'jornada:data'

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

async function getData(): Promise<AppData> {
  try {
    const redis = getRedis()
    const data = await redis.get<AppData>(KEY)
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
    const redis = getRedis()
    await redis.set(KEY, body)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
