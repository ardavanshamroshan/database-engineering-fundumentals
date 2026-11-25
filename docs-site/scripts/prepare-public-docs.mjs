#!/usr/bin/env node
/**
 * Public free tree for Database Engineering — paid markdown never copied.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(siteRoot, '..')
const srcDocs = siteRoot
const outDocs = path.join(repoRoot, 'docs-site-public')
const freeConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'access/free-paths.json'), 'utf8'),
)

const freeSet = new Set(freeConfig.paths.map((p) => normalizePath(p)))

const vipBadgeHtml =
  '<span class="vip-badge" title="VIP members only" aria-label="VIP"><span class="vip-star" aria-hidden="true">★</span></span>'

function normalizePath(p) {
  let s = p.trim()
  if (!s.startsWith('/')) s = `/${s}`
  if (s.length > 1 && s.endsWith('/')) return s
  return s.replace(/\/$/, '') || '/'
}

function fileToUrlPath(relPosix) {
  let rel = relPosix.replace(/\\/g, '/')
  if (rel === 'index.md') return '/'
  if (rel.endsWith('/index.md')) return `/${rel.slice(0, -'/index.md'.length)}/`
  if (rel.endsWith('.md')) return `/${rel.slice(0, -3)}`
  return null
}

function isFreeUrl(urlPath) {
  const n = normalizePath(urlPath)
  if (freeSet.has(n)) return true
  if (!n.endsWith('/')) return freeSet.has(`${n}/`)
  return freeSet.has(n.slice(0, -1))
}

function pageDir(urlPath) {
  const n = normalizePath(urlPath)
  if (n === '/') return '/'
  if (n.endsWith('/')) return n
  const i = n.lastIndexOf('/')
  return i <= 0 ? '/' : n.slice(0, i + 1)
}

function classifyHref(href, currentUrlPath) {
  const raw = href.trim()
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:')
  ) {
    return { kind: 'keep' }
  }

  const hashIdx = raw.indexOf('#')
  let pathPart = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw

  if (pathPart === '' || pathPart === '#') {
    return { kind: 'keep' }
  }

  if (!pathPart.startsWith('/')) {
    const base = pageDir(currentUrlPath)
    pathPart = new URL(pathPart, `https://docs.local${base}`).pathname
  }

  const absolute = normalizePath(pathPart)
  if (isFreeUrl(absolute)) {
    return { kind: 'free' }
  }

  return { kind: 'vip' }
}

function rewriteVipMarkdownLinks(content, currentUrlPath) {
  let locked = 0
  const next = content.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (full, text, href) => {
      const result = classifyHref(href, currentUrlPath)
      if (result.kind !== 'vip') {
        return full
      }
      locked++
      return `<span class="vip-locked" title="VIP members only">${text} ${vipBadgeHtml}</span>`
    },
  )
  return { content: next, locked }
}

function walkMd(dir, base = dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue
    const full = path.join(dir, name.name)
    if (name.isDirectory()) {
      if (['.vitepress', 'public', 'node_modules', 'scripts', 'dist'].includes(name.name)) continue
      walkMd(full, base, acc)
    } else if (name.name.endsWith('.md')) {
      acc.push(path.relative(base, full))
    }
  }
  return acc
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === 'dist') continue
    const s = path.join(src, name.name)
    const d = path.join(dest, name.name)
    if (name.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

rmrf(outDocs)
fs.mkdirSync(outDocs, { recursive: true })

copyDir(path.join(srcDocs, '.vitepress'), path.join(outDocs, '.vitepress'))
if (fs.existsSync(path.join(srcDocs, 'public'))) {
  copyDir(path.join(srcDocs, 'public'), path.join(outDocs, 'public'))
}
if (fs.existsSync(path.join(srcDocs, 'scripts'))) {
  copyDir(path.join(srcDocs, 'scripts'), path.join(outDocs, 'scripts'))
}

let freeCount = 0
let skippedVip = 0
let vipLinksLocked = 0
for (const rel of walkMd(srcDocs)) {
  const relPosix = rel.split(path.sep).join('/')
  if (relPosix === 'members.md') continue
  const urlPath = fileToUrlPath(relPosix)
  if (urlPath == null) continue
  if (!isFreeUrl(urlPath)) {
    skippedVip++
    continue
  }
  const outFile = path.join(outDocs, rel)
  ensureDir(outFile)
  const raw = fs.readFileSync(path.join(srcDocs, rel), 'utf8')
  const { content, locked } = rewriteVipMarkdownLinks(raw, urlPath)
  vipLinksLocked += locked
  fs.writeFileSync(outFile, content)
  freeCount++
}

fs.mkdirSync(path.join(outDocs, 'access'), { recursive: true })
fs.copyFileSync(
  path.join(repoRoot, 'access/free-paths.json'),
  path.join(outDocs, 'access/free-paths.json'),
)

// Public artifact must not reuse the full-site outDir (../docs)
const cfgPath = path.join(outDocs, '.vitepress/config.ts')
if (fs.existsSync(cfgPath)) {
  let cfg = fs.readFileSync(cfgPath, 'utf8')
  cfg = cfg.replace(/outDir:\s*'[^']+'/, "outDir: '../docs-free'")
  // Source already reads PUBLIC_FREE_BUILD — force-lock for free artifact.
  cfg = cfg.replace(
    /const publicFreeBuild = process\.env\.PUBLIC_FREE_BUILD === ['"]1['"]/,
    'const publicFreeBuild = true /* free public artifact */',
  )
  if (!cfg.includes('const publicFreeBuild = true')) {
    throw new Error('prepare-public-docs: failed to force publicFreeBuild=true')
  }
  fs.writeFileSync(cfgPath, cfg)
}

// Resolve vitepress from docs-site/node_modules
const pkg = path.join(srcDocs, 'package.json')
if (fs.existsSync(pkg)) fs.copyFileSync(pkg, path.join(outDocs, 'package.json'))
const nm = path.join(outDocs, 'node_modules')
try {
  fs.rmSync(nm, { recursive: true, force: true })
} catch {}
fs.symlinkSync(path.join(srcDocs, 'node_modules'), nm, 'dir')

console.log(
  JSON.stringify(
    {
      out: outDocs,
      freePages: freeCount,
      skippedVipPages: skippedVip,
      vipLinksLocked,
      note: 'VIP in menu only; body VIP links locked',
    },
    null,
    2,
  ),
)
