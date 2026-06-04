import { NextResponse } from 'next/server'

const GRAPH = 'https://graph.facebook.com/v21.0'

export async function GET() {
  const token = process.env.FB_USER_TOKEN
  const businessId = process.env.FB_BUSINESS_ID

  if (!token || !businessId) {
    return NextResponse.json({ error: 'FB_USER_TOKEN 或 FB_BUSINESS_ID 未設定' }, { status: 503 })
  }

  const acctRes = await fetch(
    `${GRAPH}/${businessId}/owned_ad_accounts?fields=id,name,account_status,currency&limit=10&access_token=${token}`
  )
  if (!acctRes.ok) {
    const err = await acctRes.json()
    return NextResponse.json({ error: err.error?.message || '無法取得廣告帳號' }, { status: acctRes.status })
  }

  const acctData = await acctRes.json()
  const accounts: Record<string, unknown>[] = acctData.data || []

  const result = await Promise.all(
    accounts.map(async (acct) => {
      try {
        const campRes = await fetch(
          `${GRAPH}/${acct.id}/campaigns?fields=id,name,status,objective,insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,reach}&limit=20&access_token=${token}`
        )
        if (!campRes.ok) return { id: acct.id, name: acct.name, currency: acct.currency, campaigns: [] }
        const campData = await campRes.json()
        return {
          id: acct.id,
          name: acct.name,
          currency: acct.currency as string,
          campaigns: ((campData.data || []) as Record<string, unknown>[]).map((c) => {
            const ins = ((c.insights as Record<string, unknown[]>)?.data?.[0] || {}) as Record<string, string>
            return {
              id: c.id as string,
              name: c.name as string,
              status: c.status as string,
              objective: c.objective as string,
              spend: ins.spend || '0',
              impressions: ins.impressions || '0',
              clicks: ins.clicks || '0',
              ctr: ins.ctr || '0',
              cpc: ins.cpc || '0',
              reach: ins.reach || '0',
            }
          }),
        }
      } catch {
        return { id: acct.id as string, name: acct.name as string, currency: acct.currency as string, campaigns: [] }
      }
    })
  )

  return NextResponse.json(result)
}
