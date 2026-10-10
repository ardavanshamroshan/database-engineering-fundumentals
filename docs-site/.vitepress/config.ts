import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { fundamentalsSidebar } from '../scripts/fundamentals-sidebar.mjs'

const repo = 'https://github.com/ardavanshamroshan/database-engineering-fundumentals'
const base = '/database-engineering-fundumentals/'
const chapters = fundamentalsSidebar(
  readFileSync(new URL('../fundamentals/index.md', import.meta.url), 'utf8'),
)

const sidebar = [
  {
    text: 'Home',
    link: '/',
  },
  {
    text: 'Fundamentals',
    link: '/fundamentals/',
    collapsed: false,
    items: chapters,
  },
  {
    text: 'SQL',
    collapsed: true,
    items: [
      { text: 'PostgreSQL', link: '/sql/postgresql' },
      { text: 'MySQL', link: '/sql/mysql' },
      { text: 'SQLite', link: '/sql/sqlite' },
    ],
  },
  {
    text: 'NoSQL',
    collapsed: true,
    items: [
      { text: 'Redis', link: '/nosql/redis' },
      { text: 'MongoDB', link: '/nosql/mongodb' },
      { text: 'Cassandra', link: '/nosql/cassandra' },
      { text: 'ScyllaDB', link: '/nosql/scylladb' },
    ],
  },
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
      light: 'material-theme-palenight',
      dark: 'material-theme-palenight',
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
    nav: [
      { text: 'Docs', link: '/fundamentals/' },
      {
        text: 'Cheatsheets',
        items: [
          {
            text: 'SQL',
            items: sidebar[2].items,
          },
          {
            text: 'NoSQL',
            items: sidebar[3].items,
          },
        ],
      },
      { text: 'GitHub', link: repo },
    ],

    sidebar,

    socialLinks: [{ icon: 'github', link: repo }],

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    footer: {
      message:
        'Built by <a href="https://ardavanshamroshan.ir" target="_blank" rel="noopener">Ardavan ShamRoshan</a> · <a href="https://github.com/ardavanshamroshan" target="_blank" rel="noopener">GitHub</a>',
      copyright: 'Database Engineering Fundamentals — free to learn and share',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },
  },
})
