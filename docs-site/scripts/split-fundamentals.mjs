/**
 * Split root README.md into VitePress chapter pages.
 * Left sidebar = chapter pages. Right outline = ## / ### topics on the page.
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const outDir = join(__dirname, '../fundamentals')

const chapterMeta = [
  { num: '01', file: '01-course-updates', title: 'Course Updates', short: 'Course updates' },
  { num: '02', file: '02-acid', title: 'ACID', short: 'ACID' },
  { num: '03', file: '03-internals', title: 'Understanding Database Internals', short: 'Database internals' },
  { num: '04', file: '04-indexing', title: 'Database Indexing', short: 'Indexing' },
  { num: '05', file: '05-btree', title: 'B-Tree vs B+Tree in Production Database Systems', short: 'B-Tree vs B+Tree' },
  { num: '06', file: '06-partitioning', title: 'Database Partitioning', short: 'Partitioning' },
  { num: '07', file: '07-sharding', title: 'Database Sharding', short: 'Sharding' },
  { num: '08', file: '08-concurrency', title: 'Concurrency Control', short: 'Concurrency control' },
  { num: '09', file: '09-replication', title: 'Database Replication', short: 'Replication' },
  { num: '10', file: '10-system-design', title: 'Database System Design', short: 'System design' },
  { num: '11', file: '11-engines', title: 'Database Engines', short: 'Database engines' },
  { num: '12', file: '12-cursors', title: 'Database Cursors', short: 'Cursors' },
  { num: '13', file: '13-security', title: 'Database Security', short: 'Security' },
  { num: '14', file: '14-homomorphic', title: 'Homomorphic Encryption', short: 'Homomorphic encryption' },
  { num: '15', file: '15-qa', title: 'Q&A', short: 'Q&A' },
  { num: '16', file: '16-discussions', title: 'Database Discussions', short: 'Discussions' },
  { num: '17', file: '17-archived', title: 'Archived Lectures', short: 'Archived lectures' },
]

function rewriteLinks(md) {
  return md
    .replace(
      /\]\(README\.fa\.md\)/g,
      '](https://github.com/ardavanshamroshan/database-engineering-fundumentals/blob/main/README.fa.md)',
    )
    .replace(/\]\(README\.md\)/g, '](/fundamentals/)')
    .replace(/\]\(images\//g, '](/images/')
    .replace(/\]\(cheatsheets\/postgresql\.md\)/g, '](/sql/postgresql)')
    .replace(/\]\(cheatsheets\/mysql\.md\)/g, '](/sql/mysql)')
    .replace(/\]\(cheatsheets\/sqlite\.md\)/g, '](/sql/sqlite)')
    .replace(/\]\(cheatsheets\/redis\.md\)/g, '](/nosql/redis)')
    .replace(/\]\(cheatsheets\/mongodb\.md\)/g, '](/nosql/mongodb)')
    .replace(/\]\(cheatsheets\/cassandra\.md\)/g, '](/nosql/cassandra)')
    .replace(/\]\(cheatsheets\/scylladb\.md\)/g, '](/nosql/scylladb)')
    .replace(/\*\*Local course materials:\*\*\n\n`[^`]+`\n*/g, '')
}

/** Demote monolith headings: ### chapter → #, #### lesson → ##, ##### → ### */
function promoteHeadings(body) {
  return body
    .replace(/^##### /gm, '### ')
    .replace(/^#### /gm, '## ')
    .replace(/^### /gm, '# ')
}

/** Strip explicit VitePress/GitHub heading ids; VitePress regenerates from text. */
function stripExplicitIds(md) {
  return md.replace(/ \{#[^}]+\}/g, '')
}

function extractChapters(readme) {
  const parts = readme.split(/\n(?=### \d+ — )/)
  const preamble = parts[0]
  const chapters = new Map()
  for (const part of parts.slice(1)) {
    const m = part.match(/^### (\d+) — ([^\n]+)/)
    if (!m) continue
    chapters.set(m[1], part.trimEnd() + '\n')
  }
  return { preamble, chapters }
}

function statusOf(body) {
  const m = body.match(/\*\*Status:\*\*\s*`([^`]+)`/)
  return m ? m[1] : '[ ]'
}

function statusChip(status) {
  if (status === '[x]') return '<span class="ch-status ch-status--done">Done</span>'
  if (status === '[~]') return '<span class="ch-status ch-status--wip">WIP</span>'
  return '<span class="ch-status ch-status--todo">Todo</span>'
}

function tocBadge(status) {
  return statusChip(status)
}

/** Turn notebook callouts into colored VitePress containers (system-design style). */
function decorateCallouts(md) {
  const rules = [
    [
      /^> \*\*Best practice(?: \(system-design\))?:\*\*\s*(.+)$/gm,
      '::: danger Best practice\n$1\n:::',
    ],
    [/^> \*\*Remember:\*\*\s*(.+)$/gm, '::: tip Remember\n$1\n:::'],
    [/^> \*\*Note:\*\*\s*(.+)$/gm, '::: info Note\n$1\n:::'],
    [/^> \*\*Warning:\*\*\s*(.+)$/gm, '::: warning Warning\n$1\n:::'],
    [/^> \*\*Dig deeper:\*\*\s*(.+)$/gm, '::: tip Dig deeper\n$1\n:::'],
    [/^> \*\*Common question:\*\*\s*(.+)$/gm, '::: info Common question\n$1\n:::'],
    [/^> \*\*یادآوری:\*\*\s*(.+)$/gm, '::: tip یادآوری\n$1\n:::'],
    [/^> \*\*هشدار:\*\*\s*(.+)$/gm, '::: warning هشدار\n$1\n:::'],
    [/^> \*\*بیشتر بدانید:\*\*\s*(.+)$/gm, '::: tip بیشتر بدانید\n$1\n:::'],
  ]
  for (const [re, rep] of rules) md = md.replace(re, rep)
  return md
}

/** Inline emphasis badges for recurring labels. */
function decorateInlineBadges(md) {
  return md
    .replace(
      /(?<![:|>] )\*\*Best practice(?: \(system-design\))?:\*\*/g,
      '<Badge type="danger" text="Must-know" /> **Best practice:**',
    )
    .replace(
      /^## ((?:.*)?Self-check.*)$/gm,
      '## $1 <Badge type="warning" text="Check" />',
    )
    .replace(
      /^## ((?:.*)?Extra notes from system-design.*)$/gm,
      '## $1 <Badge type="info" text="Extra" />',
    )
    .replace(
      /^## ((?:.*)?Section Summary.*)$/gm,
      '## $1 <Badge type="tip" text="Summary" />',
    )
    .replace(
      /\*\*Related \(system-design\):\*\*\s*(.+)$/gm,
      (_m, links) =>
        `<div class="ch-related">\n\n<span class="ch-related__label">Related</span>\n\n${String(links).replace(/\s*·\s*/g, ' ')}\n\n</div>`,
    )
}

function normalizeFences(md) {
  // Unknown highlighter langs → silent fallback noise in VitePress logs
  return md.replace(/```ascii\b/g, '```text').replace(/```conf\b/g, '```text')
}

function decorateChapterBody(rawBody) {
  const status = statusOf(rawBody)
  let body = normalizeFences(stripExplicitIds(promoteHeadings(rewriteLinks(rawBody))))
  body = decorateCallouts(body)
  body = decorateInlineBadges(body)

  // Title + status badge; pull Summary / Focus into a meta strip
  body = body.replace(
    /^# (.+)\n\n- \*\*Status:\*\* `[^`]+`\n- \*\*Summary:\*\* (.+)\n- \*\*Focus:\*\* (.+)\n- \*\*Notes:\*\*\n*/m,
    `# $1 ${statusChip(status)}

<div class="ch-meta">
  <div class="ch-meta__row"><span class="ch-meta__label">Summary</span><span class="ch-meta__value">$2</span></div>
  <div class="ch-meta__row"><span class="ch-meta__label">Focus</span><span class="ch-meta__value">$3</span></div>
</div>

`,
  )

  // Fallback if meta shape differs (stubs)
  body = body.replace(
    /^# (.+)\n\n- \*\*Status:\*\* `[^`]+`\n/m,
    `# $1 ${statusChip(status)}\n\n`,
  )

  return body
}

function buildIndex(preamble, chapters) {
  const done = [...chapters.values()].filter((b) => statusOf(b) === '[x]').length
  const toc = chapterMeta
    .map(({ num, file, short }) => {
      const st = statusOf(chapters.get(num) || '')
      return `- [${num} · ${short}](/fundamentals/${file}) ${tocBadge(st)}`
    })
    .join('\n')

  // Keep the human intro from README, drop the old in-page TOC / Chapters dump.
  let intro = preamble
  intro = intro.replace(/^# Database Engineering Fundamentals\n+/, '')
  intro = intro.replace(/\n## Table of contents[\s\S]*$/m, '\n')
  intro = intro.replace(/\n## Chapters[\s\S]*$/m, '\n')
  // Replace plain progress table with badge strip (system-design style)
  intro = intro.replace(
    /\n## Progress\n[\s\S]*?(?=\n---|\n## )/m,
    `
## Progress

<div class="ch-progress">
  <div class="ch-progress__item"><span class="ch-status ch-status--done">Done</span> <strong>${done}</strong> chapters</div>
  <div class="ch-progress__item"><span class="ch-status ch-status--todo">Todo</span> <strong>${chapterMeta.length - done}</strong> remaining</div>
  <div class="ch-progress__item"><span class="sidebar-lvl sidebar-lvl--1"></span> ${done} / ${chapterMeta.length} filled</div>
</div>

`,
  )
  intro = rewriteLinks(intro.trim()) + '\n'

  return `---
title: Fundamentals
description: Database Engineering Fundamentals study path
outline: deep
---

# Database Engineering Fundamentals

${intro}

## Chapters

${toc}

## Legend

<div class="ch-legend">
  <div><span class="ch-status ch-status--done">Done</span> filled notebook chapter</div>
  <div><span class="ch-status ch-status--wip">WIP</span> in progress</div>
  <div><span class="ch-status ch-status--todo">Todo</span> stub — not written yet</div>
  <div><Badge type="danger" text="Must-know" /> best-practice callout in lessons</div>
  <div><Badge type="warning" text="Check" /> self-check section</div>
  <div><Badge type="info" text="Extra" /> system-design extras</div>
</div>

<div class="ch-legend ch-legend--dots">
  <div><span class="sidebar-lvl sidebar-lvl--1"></span> core chapter (done)</div>
  <div><span class="sidebar-lvl sidebar-lvl--2"></span> core chapter (todo)</div>
  <div><span class="sidebar-lvl sidebar-lvl--3"></span> meta / optional</div>
</div>
`
}

function writeChapter(meta, rawBody) {
  const body = decorateChapterBody(rawBody)
  const content = `---
title: ${meta.num} · ${meta.short}
description: ${meta.title}
outline: deep
---

${body}`
  writeFileSync(join(outDir, `${meta.file}.md`), content)
}

mkdirSync(outDir, { recursive: true })

// Remove old generated chapter pages (keep index rewritten below)
for (const name of readdirSync(outDir)) {
  if (/^\d{2}-.+\.md$/.test(name)) unlinkSync(join(outDir, name))
}

const readme = readFileSync(join(root, 'README.md'), 'utf8')
const { preamble, chapters } = extractChapters(readme)

for (const meta of chapterMeta) {
  const raw = chapters.get(meta.num)
  if (!raw) {
    console.warn(`missing chapter ${meta.num}`)
    continue
  }
  writeChapter(meta, raw)
  console.log(`wrote fundamentals/${meta.file}.md`)
}

writeFileSync(join(outDir, 'index.md'), buildIndex(preamble, chapters))
console.log('wrote fundamentals/index.md')

export { chapterMeta }
