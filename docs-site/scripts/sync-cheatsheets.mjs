import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const site = join(__dirname, '..')
const sheets = join(root, 'cheatsheets')

const map = [
  { src: 'postgresql.md', dest: 'sql/postgresql.md', title: 'PostgreSQL' },
  { src: 'mysql.md', dest: 'sql/mysql.md', title: 'MySQL' },
  { src: 'sqlite.md', dest: 'sql/sqlite.md', title: 'SQLite' },
  { src: 'redis.md', dest: 'nosql/redis.md', title: 'Redis' },
  { src: 'mongodb.md', dest: 'nosql/mongodb.md', title: 'MongoDB' },
  { src: 'cassandra.md', dest: 'nosql/cassandra.md', title: 'Cassandra' },
  { src: 'scylladb.md', dest: 'nosql/scylladb.md', title: 'ScyllaDB' },
]

for (const item of map) {
  const from = join(sheets, item.src)
  const to = join(site, item.dest)
  mkdirSync(dirname(to), { recursive: true })
  const body = readFileSync(from, 'utf8')
  // Strip leading H1 if present — VitePress uses frontmatter title
  const cleaned = body.replace(/^#\s+.+\n+/, '')
  const out = `---
title: ${item.title}
outline: deep
---

# ${item.title}

${cleaned}`
  writeFileSync(to, out)
  console.log(`synced ${item.src} → ${item.dest}`)
}

// Keep a copy listing for reference (optional raw mirror)
mkdirSync(join(site, 'public'), { recursive: true })
copyFileSync(join(root, 'README.md'), join(site, 'public', 'README.en.md'))
