import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { BRAIN_SUMMARISE_PROMPT } from '@/lib/prompts'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
// Import the inner lib directly — the package root runs a self-test at require()
// time that reads a fixture file, which breaks Next.js build / Vercel deployment.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>
import mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

// Vercel serverless body limit is 4.5 MB — keep a safe margin
const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB

function fileTypeFromName(filename: string): 'pdf' | 'txt' | 'docx' | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return 'pdf'
  if (ext === 'txt')  return 'txt'
  if (ext === 'docx') return 'docx'
  return null
}

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const type = fileTypeFromName(filename)

  if (type === 'txt') {
    return buffer.toString('utf-8').slice(0, 8000)
  }

  if (type === 'pdf') {
    const data = await pdfParse(buffer)
    return data.text.replace(/\s{3,}/g, '\n\n').slice(0, 8000)
  }

  if (type === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.replace(/\s{3,}/g, '\n\n').slice(0, 8000)
  }

  throw new Error('Unsupported file type. Please upload a PDF, TXT, or DOCX file.')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file     = formData.get('file')     as File   | null
    const tag      = formData.get('tag')      as string | null
    const memberId = formData.get('memberId') as string | null

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!file)     return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const detectedType = fileTypeFromName(file.name)
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF, TXT, or DOCX.' },
        { status: 415 },
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large — 4 MB max.' }, { status: 413 })
    }

    const { allowed } = await checkRateLimit(memberId, 'brain')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 429 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── Extract text ────────────────────────────────────────────────────────
    let text: string
    try {
      text = await extractText(buffer, file.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not read file'
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    const supabase = createServerClient()

    // ── Upload to Supabase Storage (brain-files bucket) ─────────────────────
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath  = `${memberId}/${Date.now()}-${safeFilename}`

    const { error: storageError } = await supabase.storage
      .from('brain-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      // Non-fatal: log it but continue — we still have the extracted text
      console.warn('Storage upload failed (non-fatal):', storageError.message)
    }

    // ── Summarise with Claude ────────────────────────────────────────────────
    const title   = file.name.replace(/\.[^.]+$/, '') // strip extension for display
    const summary = await callClaude(BRAIN_SUMMARISE_PROMPT, text, 1024)

    // ── Save knowledge card ──────────────────────────────────────────────────
    const { data, error: dbError } = await supabase
      .from('member_brain')
      .insert({
        member_id: memberId,
        type:      detectedType,          // 'pdf' | 'txt' | 'docx'
        title,
        tag:       tag ?? 'OTHER',
        summary,
        url:       storageError ? null : storagePath,   // storage ref if upload succeeded
      })
      .select()
      .single()

    if (dbError) throw dbError

    await logUsage(memberId, 'brain_add')

    return NextResponse.json(data)
  } catch (err) {
    console.error('Brain upload error:', err)
    return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 500 })
  }
}
