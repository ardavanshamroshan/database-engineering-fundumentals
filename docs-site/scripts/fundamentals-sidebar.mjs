const labels = {
  '01': 'Course updates',
  '02': 'ACID',
  '03': 'Database internals',
  '04': 'Indexing',
  '04.1': 'Keys and INCLUDE',
  '04.2': 'Combining indexes',
  '04.3': 'Optimizer choices',
  '04.4': 'Scan strategies',
  '04.5': 'Concurrent builds',
  '04.6': 'Bloom filters',
  '04.7': 'Billion-row tables',
  '05': 'B-Tree vs B+Tree',
  '05.1': 'Overview',
  '05.2': 'Table scans',
  '05.3': 'B-Tree structure',
  '05.4': 'Lookup performance',
  '05.5': 'B-Tree limitations',
  '05.6': 'B+Tree and ranges',
  '05.7': 'Engine details',
  '05.8': 'Engine storage',
  '05.9': 'Summary',
  '06': 'Partitioning',
  '07': 'Sharding',
  '08': 'Concurrency control',
  '09': 'Replication',
  '10': 'System design',
  '11': 'Database engines',
  '12': 'Cursors',
  '13': 'Security',
  '14': 'Homomorphic encryption',
  '15': 'Q&A',
  '16': 'Discussions',
  '17': 'Archived lectures',
}

// Read the generated heading IDs so sidebar links stay aligned with the page.
export function fundamentalsSidebar(markdown) {
  const chapters = []
  const byNumber = new Map()
  const headings = /^#{3,4} (\d{2}(?:\.\d+)?) — (.+?) \{#([^}]+)\}$/gm

  for (const [, number, title, anchor] of markdown.matchAll(headings)) {
    const item = {
      text: `${number} · ${labels[number] ?? title.replace(/ \(Lesson \d+\)$/, '')}`,
      link: `/fundamentals/#${anchor}`,
    }
    if (!number.includes('.')) {
      chapters.push(item)
      byNumber.set(number, item)
      continue
    }

    const parent = byNumber.get(number.split('.')[0])
    if (!parent) throw new Error(`Missing parent chapter for ${number}`)
    parent.collapsed = true
    ;(parent.items ??= []).push(item)
  }

  return chapters
}
