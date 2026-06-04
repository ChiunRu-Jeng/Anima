import { NextResponse } from 'next/server'

const GRAPH = 'https://graph.facebook.com/v21.0'

export async function GET() {
  const token = process.env.FB_USER_TOKEN
  const businessId = process.env.FB_BUSINESS_ID

  if (!token || !businessId) {
    return NextResponse.json({ error: 'FB_USER_TOKEN 或 FB_BUSINESS_ID 未設定' }, { status: 503 })
  }

  const pagesRes = await fetch(
    `${GRAPH}/${businessId}/owned_pages?fields=id,name,fan_count,followers_count,picture.type(small)&limit=25&access_token=${token}`
  )
  if (!pagesRes.ok) {
    const err = await pagesRes.json()
    return NextResponse.json({ error: err.error?.message || '無法取得粉專列表' }, { status: pagesRes.status })
  }

  const pagesData = await pagesRes.json()
  const pages: Record<string, unknown>[] = pagesData.data || []

  const enriched = await Promise.all(
    pages.map(async (page) => {
      try {
        const since = Math.floor((Date.now() - 7 * 86400000) / 1000)
        const until = Math.floor(Date.now() / 1000)
        const insRes = await fetch(
          `${GRAPH}/${page.id}/insights?metric=page_reach,page_impressions,page_post_engagements&period=day&since=${since}&until=${until}&access_token=${token}`
        )
        if (insRes.ok) {
          const insData = await insRes.json()
          const metrics: Record<string, unknown>[] = insData.data || []
          const sum = (name: string) => {
            const m = metrics.find((m) => m.name === name)
            const values = (m?.values as Array<{ value: number }>) || []
            return values.reduce((s, v) => s + (v.value || 0), 0)
          }
          return {
            id: page.id,
            name: page.name,
            fanCount: page.fan_count || 0,
            followersCount: page.followers_count || 0,
            picture: (page.picture as { data?: { url?: string } })?.data?.url || null,
            reach7d: sum('page_reach'),
            impressions7d: sum('page_impressions'),
            engagements7d: sum('page_post_engagements'),
          }
        }
      } catch { /* per-page error, fall through */ }
      return {
        id: page.id,
        name: page.name,
        fanCount: page.fan_count || 0,
        followersCount: page.followers_count || 0,
        picture: (page.picture as { data?: { url?: string } })?.data?.url || null,
        reach7d: null,
        impressions7d: null,
        engagements7d: null,
      }
    })
  )

  return NextResponse.json(enriched)
}
