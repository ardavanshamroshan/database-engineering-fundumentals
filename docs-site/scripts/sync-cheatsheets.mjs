import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const site = join(__dirname, '..')
const sheets = join(root, 'cheatsheets')

const map = [
  {
    src: 'postgresql.md',
    dest: 'sql/postgresql.md',
    title: 'PostgreSQL',
    slug: 'postgresql',
    blurb: 'psql · SQL · admin · ops',
  },
  {
    src: 'mysql.md',
    dest: 'sql/mysql.md',
    title: 'MySQL',
    slug: 'mysql',
    blurb: 'mysql client · InnoDB · ops',
  },
  {
    src: 'sqlite.md',
    dest: 'sql/sqlite.md',
    title: 'SQLite',
    slug: 'sqlite',
    blurb: 'embedded · pragmas · file DB',
  },
  {
    src: 'redis.md',
    dest: 'nosql/redis.md',
    title: 'Redis',
    slug: 'redis',
    blurb: 'cache · structures · streams',
  },
  {
    src: 'mongodb.md',
    dest: 'nosql/mongodb.md',
    title: 'MongoDB',
    slug: 'mongodb',
    blurb: 'documents · aggregation · indexes',
  },
  {
    src: 'cassandra.md',
    dest: 'nosql/cassandra.md',
    title: 'Cassandra',
    slug: 'cassandra',
    blurb: 'CQL · wide-column · cluster',
  },
  {
    src: 'scylladb.md',
    dest: 'nosql/scylladb.md',
    title: 'ScyllaDB',
    slug: 'scylladb',
    blurb: 'CQL · shard-per-core · ops',
  },
]

/** GitHub TOC (#1-foo--bar) → VitePress (#_1-foo-bar) */
function rewriteTocAnchors(md) {
  return md.replace(/\]\(#([0-9][^)]*)\)/g, (_, id) => {
    const fixed = id.replace(/--+/g, '-')
    return `](#_${fixed})`
  })
}

for (const item of map) {
  const from = join(sheets, item.src)
  const to = join(site, item.dest)
  mkdirSync(dirname(to), { recursive: true })
  const body = rewriteTocAnchors(
    readFileSync(from, 'utf8').replace(/^#\s+.+\n+/, ''),
  )
  const out = `---
title: ${item.title}
outline: deep
---

<div class="db-hero">
  <span class="db-logo db-logo--${item.slug}" role="img" aria-label="${item.title} logo"></span>
  <div>
    <h1>${item.title}</h1>
    <p class="db-hero__blurb">${item.blurb}</p>
  </div>
</div>

${body}`
  writeFileSync(to, out)
  console.log(`synced ${item.src} → ${item.dest}`)
}
