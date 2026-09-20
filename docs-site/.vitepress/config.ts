import { defineConfig } from 'vitepress'

const repo = 'https://github.com/ardavanshamroshan/database-engineering-fundumentals'
const base = '/database-engineering-fundumentals/'

export default defineConfig({
  title: 'Database Engineering',
  description:
    'Fundamentals study path and practical cheatsheets for SQL and NoSQL databases.',
  base,
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#0f1419' }],
  ],

  themeConfig: {
    siteTitle: 'Database Engineering',
    logo: undefined,
    nav: [
      { text: 'Fundamentals', link: '/fundamentals/' },
      { text: 'SQL', link: '/sql/' },
      { text: 'NoSQL', link: '/nosql/' },
      {
        text: 'Repo',
        items: [
          { text: 'GitHub', link: repo },
          { text: 'English notes', link: `${repo}/blob/main/README.md` },
          { text: 'Persian notes', link: `${repo}/blob/main/README.fa.md` },
        ],
      },
    ],

    sidebar: {
      '/fundamentals/': [
        {
          text: 'Fundamentals',
          items: [{ text: 'Study path', link: '/fundamentals/' }],
        },
      ],
      '/sql/': [
        {
          text: 'SQL',
          items: [
            { text: 'Overview', link: '/sql/' },
            { text: 'PostgreSQL', link: '/sql/postgresql' },
            { text: 'MySQL', link: '/sql/mysql' },
            { text: 'SQLite', link: '/sql/sqlite' },
          ],
        },
      ],
      '/nosql/': [
        {
          text: 'NoSQL',
          items: [
            { text: 'Overview', link: '/nosql/' },
            { text: 'Redis', link: '/nosql/redis' },
            { text: 'MongoDB', link: '/nosql/mongodb' },
            { text: 'Cassandra', link: '/nosql/cassandra' },
            { text: 'ScyllaDB', link: '/nosql/scylladb' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: repo }],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Personal learning notes · Ardavan ShamRoshan',
      copyright: 'Source on GitHub',
    },

    outline: {
      level: [2, 3],
    },
  },
})
