# Access model

## Free (public)

| | |
|--|--|
| Repo | [`database-engineering-fundumentals`](https://github.com/ardavanshamroshan/database-engineering-fundumentals) |
| URL | https://ardavanshamroshan.github.io/database-engineering-fundumentals/ |
| Who | Anyone |
| Content | Syllabus + ACID samples |

## Full (private + GitHub login)

| | |
|--|--|
| Repo | [`database-engineering-full`](https://github.com/ardavanshamroshan/database-engineering-full) |
| URL | https://ardavanshamroshan.github.io/database-engineering-full/ |
| Who | Owner + collaborators (logged into GitHub) |
| Content | All chapters + cheatsheets |

### Setup

Needs **GitHub Pro**. Then: Settings → Pages → Source **GitHub Actions** → Visibility **Only people with access to this repository**.

### Local

```bash
cd docs-site
npm ci
DOCS_BASE=/database-engineering-full/ npm run docs:dev
```
