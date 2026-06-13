import { NextResponse } from 'next/server'

/**
 * Contact form endpoint for the 廣興禮儀 site.
 *
 * The form POSTs here; we validate, then relay the submission to a single
 * webhook (a Google Apps Script Web App) that fans out to Email + Google
 * Sheet + LINE. Keeping the webhook URL server-side (env var) avoids CORS
 * and keeps it out of the client bundle.
 *
 * Set CONTACT_WEBHOOK_URL in the project's environment variables (Vercel →
 * Settings → Environment Variables). See README.md for the Apps Script
 * template and setup steps.
 */
export async function POST(req: Request) {
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: '格式錯誤' }, { status: 400 })
  }

  const name = String(data?.name ?? '').trim()
  const phone = String(data?.phone ?? '').trim()
  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: '請填寫稱呼與聯絡電話' }, { status: 400 })
  }

  const payload = {
    name,
    phone,
    topic: String(data?.topic ?? ''),
    message: String(data?.message ?? ''),
    submittedAt: new Date().toISOString(),
    source: 'kuanghing-web',
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL
  if (!webhook) {
    // Not configured yet: don't fail the visitor, but make it loud in logs so
    // leads aren't silently lost once the site is live.
    console.warn('[contact] CONTACT_WEBHOOK_URL is not set — submission NOT delivered:', payload)
    return NextResponse.json({ ok: true, delivered: false })
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`webhook responded ${res.status}`)
    return NextResponse.json({ ok: true, delivered: true })
  } catch (err) {
    console.error('[contact] delivery failed:', err)
    return NextResponse.json({ ok: false, error: '送出失敗，請稍後再試或直接來電' }, { status: 502 })
  }
}
