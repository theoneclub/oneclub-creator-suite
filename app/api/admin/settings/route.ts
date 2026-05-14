import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authed')?.value === 'true'
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminSecretSet: !!process.env.ADMIN_SECRET,
    nodeEnv: process.env.NODE_ENV,
  })
}
