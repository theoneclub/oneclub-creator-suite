import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = password === process.env.ADMIN_SECRET

  if (!correct) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_authed', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_authed')
  return res
}
