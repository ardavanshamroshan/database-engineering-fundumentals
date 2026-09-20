import { defineConfig } from 'vitepress'

const repo = 'https://github.com/ardavanshamroshan/database-engineering-fundumentals'
const base = '/database-engineering-fundumentals/'

const sidebar = [
  {
    text: 'Start',
    items: [
      { text: 'Home', link: '/' },
      { text: 'Fundamentals', link: '/fundamentals/' },
    ],
  },
  {
    text: 'SQL',
    items: [
      { text: 'PostgreSQL', link: '/sql/postgresql' },
      { text: 'MySQL', link: '/sql/mysql' },
      { text: 'SQLite', link: '/sql/sqlite' },
    ],
  },
  {
    text: 'NoSQL',
    items: [
      { text: 'Redis', link: '/nosql/redis' },
      { text: 'MongoDB', link: '/nosql/mongodb' },
      { text: 'Cassandra', link: '/nosql/cassandra' },
      { text: 'ScyllaDB', link: '/nosql/scylladb' },
    ],
  },
]

export default defineConfig({
  title: 'Database Engineering',
  description: 'Fundamentals and cheatsheets for SQL and NoSQL databases.',
  base,
  outDir: '../docs',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: false,
  },

  head: [
    ['link', { rel: 'icon', href: `${base}images/logo-mark.svg` }],
    ['meta', { name: 'theme-color', content: '#fafafa' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    ],
  ],

  themeConfig: {
    logo: '/images/logo-mark.svg',
    siteTitle: 'Database Engineering',
    nav: [
      { text: 'Fundamentals', link: '/fundamentals/' },
      {
        text: 'Cheatsheets',
        items: [
          { text: 'PostgreSQL', link: '/sql/postgresql' },
          { text: 'MySQL', link: '/sql/mysql' },
          { text: 'SQLite', link: '/sql/sqlite' },
          { text: 'Redis', link: '/nosql/redis' },
          { text: 'MongoDB', link: '/nosql/mongodb' },
          { text: 'Cassandra', link: '/nosql/cassandra' },
          { text: 'ScyllaDB', link: '/nosql/scylladb' },
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
      message: 'Ardavan ShamRoshan · logos via Simple Icons (CC0)',
      copyright: 'Database Engineering Fundamentals',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },
  },
})
