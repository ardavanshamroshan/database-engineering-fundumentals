# Deploy notes

## Live site (current)

GitHub Pages serves the built VitePress site from `/docs` on `main`:

https://ardavanshamroshan.github.io/database-engineering-fundumentals/

Rebuild and publish:

```bash
cd docs-site
npm ci
npm run docs:build
# commit and push the updated /docs folder
```

## Optional: GitHub Actions

Workflow file is ready at `.github/workflows/deploy-docs.yml` but may need a token with the `workflow` scope to push:

```bash
gh auth refresh -h github.com -s workflow
git add .github/workflows/deploy-docs.yml
git commit -m "ci: add VitePress Pages workflow"
git push
```

Then set Pages source to **GitHub Actions** in repo Settings → Pages (or keep `/docs` legacy deploy).
