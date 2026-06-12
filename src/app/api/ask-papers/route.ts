import { NextRequest, NextResponse } from 'next/server'

interface PaperContext {
  title: string
  authors: string[]
  journal: string
  year: number
  abstract?: string
  doi?: string
  pmid?: string
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { apiKey, question, papers } = body as { apiKey: string; question: string; papers: PaperContext[] }

  if (!apiKey?.trim()) {
    return NextResponse.json({ error: 'Anthropic API key required' }, { status: 400 })
  }
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }
  if (!papers?.length) {
    return NextResponse.json({ error: 'No papers in database' }, { status: 400 })
  }

  const paperContext = papers
    .map((p, i) => {
      const lines = [`[${i + 1}] "${p.title}"`, `   Journal: ${p.journal} (${p.year})`]
      if (p.authors?.length) lines.push(`   Authors: ${p.authors.slice(0, 5).join(', ')}`)
      if (p.abstract) {
        const trimmed = p.abstract.length > 800 ? p.abstract.slice(0, 800) + '…' : p.abstract
        lines.push(`   Abstract: ${trimmed}`)
      }
      if (p.doi) lines.push(`   DOI: ${p.doi}`)
      return lines.join('\n')
    })
    .join('\n\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system:
        'You are a medical research assistant. Answer health and medical questions based ONLY on the research papers provided below. ' +
        'Cite specific papers using their reference numbers like [1], [2], etc. ' +
        'If the papers in the database do not contain enough information to answer the question, explicitly say so — do not draw on outside knowledge. ' +
        'Be precise, evidence-based, and clear.',
      messages: [
        {
          role: 'user',
          content: `Research papers in my database:\n\n${paperContext}\n\n---\n\nHealth question: ${question}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { error?: { message?: string } }).error?.message || `Anthropic API error ${response.status}` },
      { status: response.status }
    )
  }

  const data = await response.json()
  const answer = (data.content as Array<{ type: string; text?: string }>)
    .filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('')

  return NextResponse.json({ answer })
}
