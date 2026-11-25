import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'

const repo = 'https://github.com/ardavanshamroshan/database-engineering-fundumentals'
/** Public free: /database-engineering-fundumentals/ · Full private Pages: /database-engineering-full/ */
const base = process.env.DOCS_BASE || '/database-engineering-fundumentals/'
const publicFreeBuild = true /* free public artifact */

const vipBadge =
  '<span class="vip-badge" title="VIP members only" aria-label="VIP"><span class="vip-star" aria-hidden="true">★</span></span>'

const freePathSet: Set<string> = (() => {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    for (const p of [
      join(here, '../../../access/free-paths.json'),
      join(here, '../../access/free-paths.json'),
      join(here, '../access/free-paths.json'),
    ]) {
      try {
        const raw = JSON.parse(readFileSync(p, 'utf8')) as { paths: string[] }
        return new Set(
          raw.paths.map((x) => {
            let s = x.trim()
            if (!s.startsWith('/')) s = `/${s}`
            return s.length > 1 && s.endsWith('/') ? s : s.replace(/\/$/, '') || '/'
          }),
        )
      } catch {
        /* next */
      }
    }
  } catch {
    /* ignore */
  }
  return new Set<string>()
})()

function isFreeLink(link?: string): boolean {
  if (!link) return true
  let s = link.trim()
  if (!s.startsWith('/')) s = `/${s}`
  if (s.length > 1 && s.endsWith('/')) {
    return freePathSet.has(s) || freePathSet.has(s.slice(0, -1))
  }
  return freePathSet.has(s) || freePathSet.has(`${s}/`)
}

/**
 * Sidebar dots (system-design style):
 * 1 = done core · 2 = todo core · 3 = meta/optional
 */
const lvl = (n: 1 | 2 | 3, label: string) =>
  `<span class="sidebar-lvl sidebar-lvl--${n}" title="${
    n === 1 ? 'Done' : n === 2 ? 'Todo' : 'Meta'
  }"></span>${label}`

type SideItem = DefaultTheme.SidebarItem

function lockItem(item: SideItem): SideItem {
  if (!publicFreeBuild) return item
  const next: SideItem = { ...item }
  if (next.items) next.items = next.items.map(lockItem)
  if (next.link && !isFreeLink(next.link)) {
    next.text = `<span class="vip-locked">${next.text} ${vipBadge}</span>`
    delete next.link
  }
  return next
}

/** Top nav: keep free links only; VIP stays in sidebar as locked labels. */
function lockNav(items: DefaultTheme.NavItem[]): DefaultTheme.NavItem[] {
  if (!publicFreeBuild) return items
  return items
    .map((item) => {
      if (!('items' in item) || !item.items) {
        if ('link' in item && item.link && !isFreeLink(item.link)) return null
        return item
      }
      const groups = item.items
        .map((sub) => {
          if ('items' in sub && sub.items) {
            const leaves = sub.items.filter(
              (leaf) => !('link' in leaf) || !leaf.link || isFreeLink(String(leaf.link)),
            )
            if (!leaves.length) return null
            return { ...sub, items: leaves }
          }
          if ('link' in sub && sub.link && !isFreeLink(sub.link)) return null
          return sub
        })
        .filter(Boolean) as DefaultTheme.NavItem[]
      if (!groups.length) return null
      return { ...item, items: groups }
    })
    .filter(Boolean) as DefaultTheme.NavItem[]
}

/** Left sidebar: chapter pages. Right outline: page ##/### topics. */
const fundamentalsChapters: SideItem[] = [
  { text: 'Overview', link: '/fundamentals/' },
  { text: lvl(3, '01 · Course updates'), link: '/fundamentals/01-course-updates' },
  { text: lvl(1, '02 · ACID'), link: '/fundamentals/02-acid' },
  { text: lvl(1, '03 · Database internals'), link: '/fundamentals/03-internals' },
  { text: lvl(1, '04 · Indexing'), link: '/fundamentals/04-indexing' },
  { text: lvl(1, '05 · B-Tree vs B+Tree'), link: '/fundamentals/05-btree' },
  { text: lvl(1, '06 · Partitioning'), link: '/fundamentals/06-partitioning' },
  { text: lvl(1, '07 · Sharding'), link: '/fundamentals/07-sharding' },
  { text: lvl(1, '08 · Concurrency control'), link: '/fundamentals/08-concurrency' },
  { text: lvl(1, '09 · Replication'), link: '/fundamentals/09-replication' },
  { text: lvl(1, '10 · System design'), link: '/fundamentals/10-system-design' },
  { text: lvl(1, '11 · Database engines'), link: '/fundamentals/11-engines' },
  { text: lvl(1, '12 · Cursors'), link: '/fundamentals/12-cursors' },
  { text: lvl(1, '13 · Security'), link: '/fundamentals/13-security' },
  { text: lvl(1, '14 · Homomorphic encryption'), link: '/fundamentals/14-homomorphic' },
  { text: lvl(3, '15 · Q&A'), link: '/fundamentals/15-qa' },
  { text: lvl(3, '16 · Discussions'), link: '/fundamentals/16-discussions' },
  { text: lvl(3, '17 · Archived lectures'), link: '/fundamentals/17-archived' },
]

const sqlItems: SideItem[] = [
  { text: lvl(1, 'PostgreSQL'), link: '/sql/postgresql' },
  { text: lvl(2, 'MySQL'), link: '/sql/mysql' },
  { text: lvl(2, 'SQLite'), link: '/sql/sqlite' },
]

const nosqlItems: SideItem[] = [
  { text: lvl(1, 'Redis'), link: '/nosql/redis' },
  { text: lvl(2, 'MongoDB'), link: '/nosql/mongodb' },
  { text: lvl(3, 'Cassandra'), link: '/nosql/cassandra' },
  { text: lvl(3, 'ScyllaDB'), link: '/nosql/scylladb' },
]

const sidebarRaw: SideItem[] = [
  { text: 'Home', link: '/' },
  { text: 'Fundamentals', collapsed: false, items: fundamentalsChapters },
  { text: 'SQL', collapsed: true, items: sqlItems },
  { text: 'NoSQL', collapsed: true, items: nosqlItems },
]

const sidebar = sidebarRaw.map(lockItem)

const navRaw: DefaultTheme.NavItem[] = [
  { text: 'Docs', link: '/fundamentals/' },
  {
    text: 'Cheatsheets',
    items: [
      { text: 'SQL', items: sqlItems as DefaultTheme.NavItem[] },
      { text: 'NoSQL', items: nosqlItems as DefaultTheme.NavItem[] },
    ],
  },
  { text: 'GitHub', link: repo },
]

export default defineConfig({
  lang: 'en-US',
  title: 'Database Engineering',
  description: 'Fundamentals and cheatsheets for SQL and NoSQL databases.',
  base,
  outDir: '../docs',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  markdown: {
    theme: {
      light: 'github-light-high-contrast',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },

  head: [
    ['link', { rel: 'stylesheet', href: `${base}fonts/fonts.css` }],
    ['link', { rel: 'icon', href: `${base}images/logo-mark.svg` }],
    ['meta', { name: 'theme-color', content: '#0d9488' }],
  ],

  themeConfig: {
    logo: '/images/logo-mark.svg',
    siteTitle: 'Database Engineering',
    nav: lockNav(navRaw),
    sidebar,
    socialLinks: [{ icon: 'github', link: repo }],
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    footer: {
      message:
        'Built by <a href="https://ardavanshamroshan.ir" target="_blank" rel="noopener">Ardavan ShamRoshan</a> · <a href="https://github.com/ardavanshamroshan" target="_blank" rel="noopener">GitHub</a>',
      copyright: 'Database Engineering Fundamentals — free to learn and share',
    },
  },
})
