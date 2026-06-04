import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username') || ''
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const [userRes, eventsRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers, next: { revalidate: 3600 } }),
    fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, {
      headers,
      next: { revalidate: 300 },
    }),
    fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=5`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ])

  if (!userRes.ok) {
    const status = userRes.status === 404 ? 404 : 500
    const error = userRes.status === 404 ? 'User not found' : 'GitHub API error'
    return NextResponse.json({ error }, { status })
  }

  const user = await userRes.json()
  const events = eventsRes.ok ? await eventsRes.json() : []
  const repos = reposRes.ok ? await reposRes.json() : []

  const pushes = (events as { type: string; created_at: string; repo: { name: string }; payload: { commits?: { message: string }[] } }[])
    .filter((e) => e.type === 'PushEvent')
    .slice(0, 5)
    .map((e) => ({
      repo: e.repo.name,
      message: e.payload?.commits?.[0]?.message?.split('\n')[0] || '',
      date: e.created_at,
    }))

  return NextResponse.json({
    login: user.login,
    name: user.name,
    avatar: user.avatar_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    recentPushes: pushes,
    topRepos: (repos as { name: string; stargazers_count: number; language: string }[]).map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      language: r.language,
    })),
  })
}
