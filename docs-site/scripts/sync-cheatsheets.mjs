import { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const site = join(__dirname, '..')
const sheets = join(root, 'cheatsheets')

const sheetMap = [
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

/** GitHub TOC (#1-foo--bar / #01--acid) → VitePress (#_1-foo-bar / #_01-acid) */
function rewriteNumberedAnchors(md) {
  return md.replace(/\]\(#([0-9][^)]*)\)/g, (_, id) => {
    const fixed = id.replace(/--+/g, '-')
    return `](#_${fixed})`
  })
}

/** Stable chapter heading IDs so TOC matches (em dash breaks VitePress slugs). */
function addChapterHeadingIds(md) {
  return md.replace(/^### (\d+)\s+[—–-]\s+(.+)$/gm, (_, num, title) => {
    const slug = title
      .toLowerCase()
      .normalize('NFC')
      .replace(/\+/g, '')
      .replace(/\u200c/g, '')
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    return `### ${num} — ${title} {#_${num}-${slug}}`
  })
}

function rewriteReadmeLinks(md) {
  return md
    .replace(
      /\]\(README\.fa\.md\)/g,
      '](https://github.com/ardavanshamroshan/database-engineering-fundumentals/blob/main/README.fa.md)',
    )
    .replace(/\]\(README\.md\)/g, '](/fundamentals/)')
    .replace(/\]\(images\//g, '](/images/')
    .replace(
      /\]\(cheatsheets\/postgresql\.md\)/g,
      '](/sql/postgresql)',
    )
    .replace(/\]\(cheatsheets\/mysql\.md\)/g, '](/sql/mysql)')
    .replace(/\]\(cheatsheets\/sqlite\.md\)/g, '](/sql/sqlite)')
    .replace(/\]\(cheatsheets\/redis\.md\)/g, '](/nosql/redis)')
    .replace(/\]\(cheatsheets\/mongodb\.md\)/g, '](/nosql/mongodb)')
    .replace(
      /\]\(cheatsheets\/cassandra\.md\)/g,
      '](/nosql/cassandra)',
    )
    .replace(
      /\]\(cheatsheets\/scylladb\.md\)/g,
      '](/nosql/scylladb)',
    )
    .replace(
      /\*\*Local course materials:\*\*\n\n`[^`]+`\n*/g,
      '',
    )
    .replace(/\*\*مسیر محلی مواد کورس:\*\*\n\n`[^`]+`\n*/g, '')
}

function prepareReadme(md) {
  return rewriteNumberedAnchors(
    addChapterHeadingIds(rewriteReadmeLinks(md)),
  )
}

function writePage(dest, content) {
  const to = join(site, dest)
  mkdirSync(dirname(to), { recursive: true })
  writeFileSync(to, content)
}

for (const item of sheetMap) {
  const from = join(sheets, item.src)
  const body = rewriteNumberedAnchors(
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
  writePage(item.dest, out)
  console.log(`synced ${item.src} → ${item.dest}`)
}

// --- Fundamentals from root README (English only) ---
{
  const en = prepareReadme(readFileSync(join(root, 'README.md'), 'utf8'))
  writePage(
    'fundamentals/index.md',
    `---
title: Fundamentals
description: Database Engineering Fundamentals study path
outline: deep
---

${en}`,
  )
  console.log('synced README.md → fundamentals/index.md')
}

// --- Root images → public/images (single source of truth) ---
{
  const srcDir = join(root, 'images')
  const destDir = join(site, 'public/images')
  if (existsSync(srcDir)) {
    mkdirSync(destDir, { recursive: true })
    for (const name of readdirSync(srcDir)) {
      if (name.startsWith('.')) continue
      copyFileSync(join(srcDir, name), join(destDir, name))
      console.log(`synced images/${name} → public/images/${name}`)
    }
  }
}
