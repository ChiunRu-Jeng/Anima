import { NextRequest, NextResponse } from 'next/server'

const GRAPH = 'https://graph.facebook.com/v21.0'

export async function POST(req: NextRequest) {
  const token = process.env.FB_USER_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'FB_USER_TOKEN 未設定' }, { status: 503 })
  }

  let pageIds: string[] = []
  let message = ''
  try {
    const body = await req.json() as { pageIds?: string[]; message?: string }
    pageIds = body.pageIds || []
    message = body.message || ''
  } catch {
    return NextResponse.json({ error: '無效的 JSON 請求內容' }, { status: 400 })
  }

  if (!pageIds.length || !message.trim()) {
    return NextResponse.json({ error: 'pageIds 和 message 為必填' }, { status: 400 })
  }

  const results = await Promise.all(
    pageIds.map(async (pageId) => {
      try {
        // Fetch page-specific access token so we can post as the page
        const tokenRes = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${token}`)
        const tokenData = await tokenRes.json() as { access_token?: string }
        const pageToken = tokenData.access_token || token

        const publishRes = await fetch(`${GRAPH}/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.trim(), access_token: pageToken }),
        })
        const publishData = await publishRes.json() as { id?: string; error?: { message: string } }

        return {
          pageId,
          success: publishRes.ok && !publishData.error,
          postId: publishData.id || null,
          error: publishData.error?.message || null,
        }
      } catch (e) {
        return { pageId, success: false, postId: null, error: String(e) }
      }
    })
  )

  return NextResponse.json(results)
}
