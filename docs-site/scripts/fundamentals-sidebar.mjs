import { createMarkdownRenderer } from 'vitepress'
import { fileURLToPath } from 'node:url'

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

const sectionLabels = {
  'what-is-a-transaction': 'Transactions',
  'lab-prove-atomicity-with-an-unfinished-transaction-postgresql': 'Lab: unfinished transaction',
  'isolation-levels-in-postgresql-overview': 'Isolation levels',
  '_1-read-uncommitted-same-as-read-committed-in-postgresql': '1. Read Uncommitted',
  '_2-read-committed-default': '2. Read Committed',
  '_3-repeatable-read-snapshot': '3. Repeatable Read',
  '_4-serializable-ssi': '4. Serializable',
  'eventual-consistency-in-database-systems': 'Eventual consistency',
  'how-tables-and-indexes-are-stored-and-found-—-explained-simply': 'Tables and index storage',
  '_2-lab-compare-a-query-before-and-after-indexing': '2. Lab: before and after indexing',
}

// Use the same Markdown parser as the page, including explicit and duplicate IDs.
export async function fundamentalsSidebar(markdown) {
  const renderer = await createMarkdownRenderer(
    fileURLToPath(new URL('../', import.meta.url)),
  )
  const tokens = renderer.parse(markdown, {})
  const chapters = []
  const parents = []

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.type !== 'heading_open') continue
    const level = Number(token.tag.slice(1))
    const inline = tokens[index + 1]
    const title = inline.children
      .filter((child) => child.type === 'text' || child.type === 'code_inline')
      .map((child) => child.content)
      .join('')
      .trim()
    const number = title.match(/^(\d{2}(?:\.\d+)?) — /)?.[1]

    if (level <= 3) {
      parents.length = 0
      if (level !== 3 || !number || number.includes('.')) continue
    } else if (!parents.length) {
      continue
    }

    const label = number
      ? `${number} · ${labels[number] ?? title.replace(/^\d{2}(?:\.\d+)? — /, '').replace(/ \(Lesson \d+\)$/, '')}`
      : sectionLabels[token.attrGet('id')] ?? title
    // VitePress renders sidebar labels as HTML, so escape literal heading text.
    const item = {
      text: label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      link: `/fundamentals/#${token.attrGet('id')}`,
    }
    while (parents.length && parents.at(-1).level >= level) parents.pop()
    if (parents.length) {
      const parent = parents.at(-1).item
      parent.collapsed = true
      ;(parent.items ??= []).push(item)
    } else {
      chapters.push(item)
    }
    parents.push({ level, item })
  }

  return chapters
}
