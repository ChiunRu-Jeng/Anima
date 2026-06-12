import { NextRequest, NextResponse } from 'next/server'
import type { JournalSource } from '@/types'

function detectJournalSource(source: string, fullName: string): JournalSource {
  const s = (source + ' ' + fullName).toLowerCase()
  if (s.includes('jama') && !s.includes('jamaican')) return 'JAMA'
  if (s.includes('new england') || s.includes('nejm') || s === 'n engl j med') return 'NEJM'
  if (s.includes('lancet')) return 'Lancet'
  if (s === 'bmj' || s.includes('british medical journal')) return 'BMJ'
  if (s.includes('nature medicine') || s === 'nat med') return 'Nature Medicine'
  return 'Other'
}

function extractAbstract(xml: string): string {
  const matches = [...xml.matchAll(/<AbstractText(?:[^>]*Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/g)]
  if (!matches.length) return ''
  return matches.map(m => {
    const label = m[1]
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    return label ? `${label}: ${text}` : text
  }).join('\n\n')
}

export async function GET(req: NextRequest) {
  const pmid = req.nextUrl.searchParams.get('pmid')
  if (!pmid || !/^\d+$/.test(pmid)) {
    return NextResponse.json({ error: 'Invalid PMID' }, { status: 400 })
  }

  const [summaryRes, fetchRes] = await Promise.allSettled([
    fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`),
    fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=xml`),
  ])

  if (summaryRes.status !== 'fulfilled' || !summaryRes.value.ok) {
    return NextResponse.json({ error: 'PubMed unavailable' }, { status: 502 })
  }

  const summary = await summaryRes.value.json()
  const d = summary.result?.[pmid]
  if (!d || d.error) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  }

  let abstract = ''
  if (fetchRes.status === 'fulfilled' && fetchRes.value.ok) {
    const xml = await fetchRes.value.text()
    abstract = extractAbstract(xml)
  }

  const authors: string[] = (d.authors || []).map((a: { name: string }) => a.name)
  const source: string = d.source || ''
  const fullName: string = d.fulljournalname || source
  const journalSource = detectJournalSource(source, fullName)

  const yearMatch = (d.pubdate || '').match(/\d{4}/)
  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()

  const doiMatch = (d.elocationid || '').match(/10\.\d{4,9}\/[^\s\[]+/)
  const doi = doiMatch ? doiMatch[0] : ''

  return NextResponse.json({
    title: d.title?.replace(/<[^>]+>/g, '').trim() || '',
    authors,
    journal: fullName,
    journalSource,
    year,
    volume: d.volume || '',
    issue: d.issue || '',
    pages: d.pages || '',
    doi,
    pmid,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    abstract,
  })
}
