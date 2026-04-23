import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'

const REPO_ROOT = process.cwd()
const UTF8 = 'utf8'

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function fromPosix(p) {
  return p.split('/').join(path.sep)
}

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function readJson(p) {
  const raw = await fs.readFile(p, UTF8)
  return JSON.parse(raw)
}

async function writeFileEnsured(p, content) {
  await ensureDir(path.dirname(p))
  await fs.writeFile(p, content)
}

function bytes(n) {
  if (n < 1024) return `${n} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

function looksLikeTextExt(ext) {
  return [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.vue',
    '.py',
    '.json',
    '.yml',
    '.yaml',
    '.toml',
    '.ini',
    '.md',
    '.txt',
    '.css',
    '.scss',
    '.less',
    '.html',
    '.env'
  ].includes(ext)
}

async function sha256(fileAbs) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256')
    const s = fsSync.createReadStream(fileAbs)
    s.on('data', (d) => h.update(d))
    s.on('end', () => resolve(h.digest('hex')))
    s.on('error', reject)
  })
}

function loadConfigDefaults() {
  return {
    repoName: 'repo',
    trashDir: '.trash',
    trashRetentionDays: 7,
    scan: {
      maxTextFileBytes: 2_000_000,
      hashAlgorithm: 'sha256',
      ignoreDirNames: [],
      ignoreFileNames: [],
      tempExtensions: [],
      referenceExtensions: [],
      resolveExtensions: [],
      alias: {}
    },
    qualityGates: {}
  }
}

async function loadConfig() {
  const defaults = loadConfigDefaults()
  const configPath = path.join(REPO_ROOT, 'tools', 'repo-audit.config.json')
  if (!(await pathExists(configPath))) return { configPath: null, config: defaults }
  const config = await readJson(configPath)
  return { configPath, config: { ...defaults, ...config } }
}

function isHiddenDirName(name) {
  return name.startsWith('.') && name.length > 1
}

function makeIgnoreMatcher(config) {
  const ignoreDir = new Set((config.scan?.ignoreDirNames ?? []).map((s) => s.toLowerCase()))
  const ignoreFile = new Set((config.scan?.ignoreFileNames ?? []).map((s) => s.toLowerCase()))

  function shouldIgnoreDir(name) {
    return ignoreDir.has(String(name).toLowerCase())
  }

  function shouldIgnoreFile(name) {
    return ignoreFile.has(String(name).toLowerCase())
  }

  return { shouldIgnoreDir, shouldIgnoreFile, ignoreDir }
}

async function summarizeDir(dirAbs, relPosix) {
  const stack = [dirAbs]
  let fileCount = 0
  let totalBytes = 0

  while (stack.length) {
    const cur = stack.pop()
    const entries = await fs.readdir(cur, { withFileTypes: true }).catch(() => [])
    for (const ent of entries) {
      const entAbs = path.join(cur, ent.name)
      if (ent.isDirectory()) {
        stack.push(entAbs)
        continue
      }
      if (!ent.isFile()) continue
      const st = await fs.stat(entAbs).catch(() => null)
      if (!st) continue
      fileCount += 1
      totalBytes += st.size
    }
  }

  return { bucket: relPosix, fileCount, totalBytes }
}

async function* walkFiles(rootAbs, config, ignoredDirSummaries) {
  const { shouldIgnoreDir, shouldIgnoreFile } = makeIgnoreMatcher(config)
  const stack = [{ abs: rootAbs, rel: '' }]

  while (stack.length) {
    const cur = stack.pop()
    const entries = await fs.readdir(cur.abs, { withFileTypes: true })
    for (const ent of entries) {
      const entAbs = path.join(cur.abs, ent.name)
      const entRel = cur.rel ? `${cur.rel}/${ent.name}` : ent.name
      const entRelPosix = toPosix(entRel)

      if (ent.isDirectory()) {
        if (shouldIgnoreDir(ent.name)) {
          if (!ignoredDirSummaries.has(entRelPosix)) {
            ignoredDirSummaries.set(entRelPosix, await summarizeDir(entAbs, entRelPosix))
          }
          continue
        }
        stack.push({ abs: entAbs, rel: entRelPosix })
        continue
      }

      if (!ent.isFile()) continue
      if (shouldIgnoreFile(ent.name)) continue

      const st = await fs.stat(entAbs)
      yield {
        abs: entAbs,
        rel: entRelPosix,
        size: st.size,
        mtimeMs: st.mtimeMs
      }
    }
  }
}

function normalizeRef(raw) {
  if (!raw) return null
  let s = raw.trim()
  const q = s.indexOf('?')
  if (q !== -1) s = s.slice(0, q)
  const h = s.indexOf('#')
  if (h !== -1) s = s.slice(0, h)
  return s
}

function extractRefsFromText(text) {
  const refs = new Set()
  const add = (v) => {
    const n = normalizeRef(v)
    if (!n) return
    if (n.startsWith('./') || n.startsWith('../') || n.startsWith('@/')) refs.add(n)
  }

  const quoted = /(["'`])((?:\.{1,2}\/|@\/)[^"'`]+?)\1/g
  for (const m of text.matchAll(quoted)) add(m[2])

  const urlFn = /url\(\s*(?:(["'])((?:\.{1,2}\/|@\/)[^"')]+)\1|((?:\.{1,2}\/|@\/)[^"')]+))\s*\)/g
  for (const m of text.matchAll(urlFn)) add(m[2] ?? m[3])

  const attr = /\b(?:src|href)\s*=\s*(["'])((?:\.{1,2}\/|@\/)[^"']+)\1/g
  for (const m of text.matchAll(attr)) add(m[2])

  return [...refs]
}

async function resolveRefToFileAbs(ref, fromFileAbs, config) {
  const alias = config.scan?.alias ?? {}
  const tryPaths = []
  const fromDir = path.dirname(fromFileAbs)

  if (ref.startsWith('@/')) {
    const base = alias['@']
    if (!base) return null
    const rel = ref.slice(2)
    tryPaths.push(path.join(REPO_ROOT, fromPosix(base), fromPosix(rel)))
  } else if (ref.startsWith('./') || ref.startsWith('../')) {
    tryPaths.push(path.resolve(fromDir, fromPosix(ref)))
  } else {
    return null
  }

  const out = []
  for (const p of tryPaths) {
    out.push(p)
    for (const ext of config.scan?.resolveExtensions ?? []) out.push(`${p}${ext}`)
    for (const ext of config.scan?.resolveExtensions ?? []) out.push(path.join(p, `index${ext}`))
  }

  for (const cand of out) {
    if (await pathExists(cand)) {
      const st = await fs.stat(cand)
      if (st.isFile()) return cand
    }
  }
  return null
}

function classify(rel) {
  const ext = path.extname(rel).toLowerCase()
  const lower = rel.toLowerCase()

  if (lower.includes('/node_modules/')) return '第三方依赖'
  if (ext === '.map') return '生成产物'
  if (lower.startsWith('frontend/dist/')) return '构建产物'
  if (lower.includes('/playwright-report/') || lower.includes('/test-results/')) return '测试产物'
  if (lower.includes('/__pycache__/') || ext === '.pyc') return '缓存'
  if (lower.includes('/logs/') || ext === '.log') return '日志'

  if (lower.includes('/tests/') || /\.spec\./i.test(rel)) return '测试'

  if (['.md', '.txt'].includes(ext)) return '文档'
  if (['.yml', '.yaml', '.toml', '.ini', '.env', '.json'].includes(ext)) return '配置'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.mp3', '.wav', '.ogg', '.pdf', '.xlsx', '.xls', '.csv'].includes(ext))
    return '资源'

  if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.css', '.scss', '.less', '.html'].includes(ext)) return '源码'

  if (rel.toLowerCase().includes('license')) return '许可证'
  return '其他'
}

function moduleOf(rel) {
  if (rel.startsWith('frontend/src/views/admin/')) return 'frontend:admin'
  if (rel.startsWith('frontend/src/views/')) return 'frontend:views'
  if (rel.startsWith('frontend/src/components/admin/')) return 'frontend:admin'
  if (rel.startsWith('frontend/src/components/')) return 'frontend:components'
  if (rel.startsWith('frontend/src/stores/')) return 'frontend:stores'
  if (rel.startsWith('frontend/src/router/')) return 'frontend:router'
  if (rel.startsWith('frontend/src/api/')) return 'frontend:api'
  if (rel.startsWith('frontend/src/')) return 'frontend:src'

  if (rel.startsWith('backend/app/admin_v2/')) return 'backend:admin_v2'
  if (rel.startsWith('backend/app/routes/')) return 'backend:routes'
  if (rel.startsWith('backend/app/models/')) return 'backend:models'
  if (rel.startsWith('backend/app/services/')) return 'backend:services'
  if (rel.startsWith('backend/app/utils/')) return 'backend:utils'
  if (rel.startsWith('backend/app/')) return 'backend:app'
  if (rel.startsWith('backend/tests/')) return 'backend:tests'
  if (rel.startsWith('backend/docs/')) return 'backend:docs'
  if (rel.startsWith('backend/scripts/')) return 'backend:scripts'
  if (rel.startsWith('backend/')) return 'backend'

  return rel.split('/')[0] ?? 'root'
}

function importanceOf(rel, category) {
  const lower = rel.toLowerCase()
  if (['缓存', '日志', '构建产物', '测试产物'].includes(category)) return '低'
  if (lower === 'frontend/package.json' || lower === 'frontend/package-lock.json') return '高'
  if (lower === 'backend/requirements.txt') return '高'
  if (lower === 'frontend/vite.config.ts' || lower === 'frontend/tsconfig.json' || lower === 'frontend/tsconfig.node.json') return '高'
  if (lower === 'backend/app/main.py' || lower === 'backend/app/__init__.py') return '高'
  if (category === '源码') return '高'
  if (category === '配置') return '中'
  if (category === '测试' || category === '文档' || category === '资源') return '中'
  return '低'
}

async function scanRepo(config) {
  const rawFiles = []
  const refCounts = new Map()
  const refFrom = new Map()
  const ignoredDirSummaries = new Map()

  const resolveExtsLower = new Set((config.scan?.resolveExtensions ?? []).map((s) => s.toLowerCase()))
  const referenceExtsLower = new Set((config.scan?.referenceExtensions ?? []).map((s) => s.toLowerCase()))
  const tempExtsLower = new Set((config.scan?.tempExtensions ?? []).map((s) => s.toLowerCase()))

  for await (const f of walkFiles(REPO_ROOT, config, ignoredDirSummaries)) rawFiles.push(f)

  const byRel = new Map(rawFiles.map((f) => [f.rel, f]))
  const hasRel = (r) => byRel.has(r)

  const jsTwinOfTs = new Set()
  for (const f of rawFiles) {
    if (!f.rel.startsWith('frontend/src/')) continue
    const relLower = f.rel.toLowerCase()
    if (relLower.endsWith('.vue.js')) {
      const vue = f.rel.slice(0, -'.js'.length)
      if (hasRel(vue)) jsTwinOfTs.add(f.rel)
      continue
    }
    if (relLower.endsWith('.vue.js.map')) {
      const vue = f.rel.slice(0, -'.js.map'.length)
      if (hasRel(vue)) jsTwinOfTs.add(f.rel)
      continue
    }
    if (relLower.endsWith('.spec.js')) {
      const ts = `${f.rel.slice(0, -'.js'.length)}.ts`
      if (hasRel(ts)) jsTwinOfTs.add(f.rel)
      continue
    }
    if (relLower.endsWith('.spec.js.map')) {
      const ts = `${f.rel.slice(0, -'.js.map'.length)}.ts`
      if (hasRel(ts)) jsTwinOfTs.add(f.rel)
      continue
    }

    const ext = path.extname(f.rel).toLowerCase()
    if (ext !== '.js' && ext !== '.js.map') continue
    const base = ext === '.js.map' ? f.rel.slice(0, -'.js.map'.length) : f.rel.slice(0, -'.js'.length)
    const ts = `${base}.ts`
    const tsx = `${base}.tsx`
    if (hasRel(ts) || hasRel(tsx)) jsTwinOfTs.add(f.rel)
  }

  for (const f of rawFiles) {
    const ext = path.extname(f.rel).toLowerCase()
    if (!referenceExtsLower.has(ext)) continue
    if (!looksLikeTextExt(ext)) continue
    if (f.size > (config.scan?.maxTextFileBytes ?? 2_000_000)) continue

    let text
    try {
      text = await fs.readFile(f.abs, UTF8)
    } catch {
      continue
    }
    const refs = extractRefsFromText(text)
    for (const r of refs) {
      const targetAbs = await resolveRefToFileAbs(r, f.abs, config)
      if (!targetAbs) continue
      if (!targetAbs.startsWith(REPO_ROOT)) continue
      const targetRel = toPosix(path.relative(REPO_ROOT, targetAbs))
      refCounts.set(targetRel, (refCounts.get(targetRel) ?? 0) + 1)
      const cur = refFrom.get(targetRel) ?? new Set()
      cur.add(f.rel)
      refFrom.set(targetRel, cur)
    }
  }

  const hashToFiles = new Map()
  const rows = []
  for (const f of rawFiles) {
    const ext = path.extname(f.rel).toLowerCase()
    const isTempExt = tempExtsLower.has(ext)
    const shouldHash = f.size > 0 && !isTempExt
    const hash = shouldHash ? await sha256(f.abs) : null
    if (hash) {
      const cur = hashToFiles.get(hash) ?? []
      cur.push(f.rel)
      hashToFiles.set(hash, cur)
    }

    const category = classify(f.rel)
    const module = moduleOf(f.rel)
    const importance = importanceOf(f.rel, category)
    const isEmpty = f.size === 0
    const isTemp = isTempExt || /(?:^|\/)\.cph\//i.test(f.rel)
    const isGeneratedTwin =
      jsTwinOfTs.has(f.rel) || (f.rel.endsWith('.map') && hasRel(f.rel.slice(0, -'.map'.length)))

    const refCount = refCounts.get(f.rel) ?? 0
    const referencedBy = [...(refFrom.get(f.rel) ?? new Set())]

    let duplicateGroup = null
    if (hash && (hashToFiles.get(hash)?.length ?? 0) > 1) duplicateGroup = hash.slice(0, 12)

    let orphan = false
    if (category === '资源' && refCount === 0 && f.rel.startsWith('frontend/')) orphan = true
    if (category === '其他' && refCount === 0 && f.rel.startsWith('frontend/')) orphan = true

    let deleteRecommendation = '保留'
    let risk = '高'

    if (['缓存', '日志', '构建产物', '测试产物'].includes(category)) {
      deleteRecommendation = '立即删除'
      risk = '低'
    } else if (isTemp || isEmpty) {
      deleteRecommendation = '立即删除'
      risk = '低'
    } else if (duplicateGroup) {
      deleteRecommendation = '确认后删除'
      risk = category === '源码' || category === '配置' ? '高' : '中'
    } else if (isGeneratedTwin) {
      deleteRecommendation = '确认后删除'
      risk = '中'
    } else if (orphan) {
      deleteRecommendation = '确认后删除'
      risk = '中'
    } else {
      deleteRecommendation = '保留'
      risk = importance === '高' ? '高' : '中'
    }

    const notes = []
    if (duplicateGroup) notes.push(`重复组:${duplicateGroup}`)
    if (orphan) notes.push('疑似孤立(未解析到引用)')
    if (isGeneratedTwin) notes.push('疑似生成文件(与 ts/vue 成对)')
    if (isTemp) notes.push('临时/缓存文件')
    if (isEmpty) notes.push('空文件')

    const row = {
      path: f.rel,
      category,
      module,
      importance,
      sizeBytes: f.size,
      mtime: new Date(f.mtimeMs).toISOString(),
      hash: hash ?? '',
      duplicateGroup: duplicateGroup ?? '',
      isEmpty,
      isTemp,
      refCount,
      referencedBy: referencedBy.slice(0, 10),
      deleteRecommendation,
      risk,
      notes: notes.join(';')
    }
    rows.push(row)
  }

  const duplicates = []
  for (const [hash, rels] of hashToFiles.entries()) {
    if (rels.length <= 1) continue
    duplicates.push({ hash, group: hash.slice(0, 12), files: rels.slice().sort() })
  }
  duplicates.sort((a, b) => b.files.length - a.files.length)

  return {
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    config,
    ignoredDirSummaries: [...ignoredDirSummaries.values()].sort((a, b) => b.totalBytes - a.totalBytes),
    files: rows,
    duplicates
  }
}

function buildCsv(rows) {
  const header = [
    'path',
    'category',
    'module',
    'importance',
    'size_bytes',
    'mtime',
    'hash',
    'duplicate_group',
    'is_empty',
    'is_temp',
    'ref_count',
    'referenced_by_top10',
    'delete_recommendation',
    'risk',
    'notes'
  ]
  const lines = [header.join(',')]
  for (const r of rows) {
    const line = [
      r.path,
      r.category,
      r.module,
      r.importance,
      r.sizeBytes,
      r.mtime,
      r.hash,
      r.duplicateGroup,
      r.isEmpty ? 1 : 0,
      r.isTemp ? 1 : 0,
      r.refCount,
      (r.referencedBy ?? []).join(';'),
      r.deleteRecommendation,
      r.risk,
      r.notes
    ].map(csvEscape)
    lines.push(line.join(','))
  }
  return `${lines.join('\n')}\n`
}

function buildMarkdown(scan) {
  const rows = scan.files
  const sum = {
    total: rows.length,
    immediate: rows.filter((r) => r.deleteRecommendation === '立即删除').length,
    confirm: rows.filter((r) => r.deleteRecommendation === '确认后删除').length,
    keep: rows.filter((r) => r.deleteRecommendation === '保留').length
  }

  const topBySize = rows
    .slice()
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 30)

  const immediate = rows
    .filter((r) => r.deleteRecommendation === '立即删除')
    .slice()
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 200)

  const confirm = rows
    .filter((r) => r.deleteRecommendation === '确认后删除')
    .slice()
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 200)

  const orphanAssets = rows
    .filter((r) => r.category === '资源' && r.refCount === 0)
    .slice()
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 200)

  const md = []
  md.push(`# 项目文件审计报告`)
  md.push('')
  md.push(`- 生成时间：${scan.generatedAt}`)
  md.push(`- 扫描根目录：${toPosix(path.relative(REPO_ROOT, scan.repoRoot) || '.')}`)
  md.push(`- 文件行数（不含 node_modules/dist/build/__pycache__ 等忽略目录）：${sum.total}`)
  md.push(`- 删除建议：立即删除 ${sum.immediate}，确认后删除 ${sum.confirm}，保留 ${sum.keep}`)
  md.push('')

  md.push(`## 忽略目录汇总（未逐文件列出）`)
  md.push('')
  const ignored = (scan.ignoredDirSummaries ?? []).slice().sort((a, b) => b.totalBytes - a.totalBytes)
  if (!ignored.length) {
    md.push('- 无')
  } else {
    md.push('| 目录桶 | 文件数 | 总大小 |')
    md.push('|---|---:|---:|')
    for (const d of ignored) md.push(`| ${d.bucket} | ${d.fileCount} | ${bytes(d.totalBytes)} |`)
  }
  md.push('')

  md.push(`## 体积 Top 30`)
  md.push('')
  md.push('| 路径 | 分类 | 大小 | 删除建议 | 风险 |')
  md.push('|---|---|---:|---|---|')
  for (const r of topBySize) md.push(`| ${r.path} | ${r.category} | ${bytes(r.sizeBytes)} | ${r.deleteRecommendation} | ${r.risk} |`)
  md.push('')

  md.push(`## 立即删除候选（Top 200）`)
  md.push('')
  if (!immediate.length) {
    md.push('- 无')
  } else {
    md.push('| 路径 | 分类 | 大小 | 备注 |')
    md.push('|---|---|---:|---|')
    for (const r of immediate) md.push(`| ${r.path} | ${r.category} | ${bytes(r.sizeBytes)} | ${r.notes || ''} |`)
  }
  md.push('')

  md.push(`## 确认后删除候选（Top 200）`)
  md.push('')
  if (!confirm.length) {
    md.push('- 无')
  } else {
    md.push('| 路径 | 分类 | 大小 | 引用数 | 被引用(Top 5) | 备注 |')
    md.push('|---|---|---:|---:|---|---|')
    for (const r of confirm) {
      md.push(
        `| ${r.path} | ${r.category} | ${bytes(r.sizeBytes)} | ${r.refCount} | ${(r.referencedBy ?? []).slice(0, 5).join('<br>')} | ${r.notes || ''} |`
      )
    }
  }
  md.push('')

  md.push(`## 疑似孤立资源（未解析到引用，Top 200）`)
  md.push('')
  if (!orphanAssets.length) {
    md.push('- 无')
  } else {
    md.push('| 路径 | 大小 | 删除建议 | 风险 |')
    md.push('|---|---:|---|---|')
    for (const r of orphanAssets) md.push(`| ${r.path} | ${bytes(r.sizeBytes)} | ${r.deleteRecommendation} | ${r.risk} |`)
  }
  md.push('')

  md.push(`## 重复文件（按内容哈希）`)
  md.push('')
  if (!scan.duplicates.length) {
    md.push('- 无')
  } else {
    md.push('| 重复组 | 文件数 | 示例文件(Top 5) |')
    md.push('|---|---:|---|')
    for (const g of scan.duplicates.slice(0, 50)) {
      md.push(`| ${g.group} | ${g.files.length} | ${g.files.slice(0, 5).join('<br>')} |`)
    }
  }
  md.push('')

  md.push(`## 自动化脚本`)
  md.push('')
  md.push('```bash')
  md.push('node tools/repo-audit.mjs scan')
  md.push('node tools/repo-audit.mjs dry-run --recommendation immediate')
  md.push('node tools/repo-audit.mjs apply --recommendation immediate')
  md.push('node tools/repo-audit.mjs verify')
  md.push('node tools/repo-audit.mjs rollback --manifest audit/last-manifest.json')
  md.push('```')
  md.push('')

  return `${md.join('\n')}\n`
}

async function writeScanOutputs(scan) {
  const auditDir = path.join(REPO_ROOT, 'audit')
  await ensureDir(auditDir)

  const csv = buildCsv(scan.files)
  const md = buildMarkdown(scan)
  await writeFileEnsured(path.join(auditDir, 'report.csv'), csv)
  await writeFileEnsured(path.join(auditDir, 'report.md'), md)
  await writeFileEnsured(path.join(auditDir, 'scan.json'), JSON.stringify(scan, null, 2))
  await writeFileEnsured(path.join(auditDir, 'last-scan.json'), JSON.stringify({ generatedAt: scan.generatedAt }, null, 2))
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      args[k] = v
    } else args._.push(a)
  }
  return args
}

async function loadScanJson() {
  const p = path.join(REPO_ROOT, 'audit', 'scan.json')
  if (!(await pathExists(p))) throw new Error('未找到 audit/scan.json，请先运行: node tools/repo-audit.mjs scan')
  return readJson(p)
}

function filterByRecommendation(rows, recommendation) {
  if (!recommendation || recommendation === 'all') return rows.filter((r) => r.deleteRecommendation !== '保留')
  if (recommendation === 'immediate') return rows.filter((r) => r.deleteRecommendation === '立即删除')
  if (recommendation === 'confirm') return rows.filter((r) => r.deleteRecommendation === '确认后删除')
  return rows.filter((r) => r.deleteRecommendation !== '保留')
}

async function moveFilePreserve(srcAbs, dstAbs) {
  await ensureDir(path.dirname(dstAbs))
  try {
    await fs.rename(srcAbs, dstAbs)
    return { ok: true, method: 'rename' }
  } catch (e) {
    const code = e?.code
    if (!['EXDEV', 'EPERM', 'EBUSY', 'EACCES'].includes(code)) return { ok: false, error: `${code ?? 'ERR'}:${e?.message ?? e}` }
  }
  try {
    await fs.copyFile(srcAbs, dstAbs)
    await fs.unlink(srcAbs)
    return { ok: true, method: 'copy' }
  } catch (e) {
    const code = e?.code
    return { ok: false, error: `${code ?? 'ERR'}:${e?.message ?? e}` }
  }
}

async function removeEmptyParents(startDirAbs, stopAtAbs) {
  let cur = startDirAbs
  while (cur.startsWith(stopAtAbs) && cur !== stopAtAbs) {
    const entries = await fs.readdir(cur).catch(() => null)
    if (!entries || entries.length) break
    await fs.rmdir(cur).catch(() => {})
    cur = path.dirname(cur)
  }
}

async function listFilesUnder(dirAbs) {
  const out = []
  const stack = [dirAbs]
  while (stack.length) {
    const cur = stack.pop()
    const entries = await fs.readdir(cur, { withFileTypes: true }).catch(() => [])
    for (const ent of entries) {
      const entAbs = path.join(cur, ent.name)
      if (ent.isDirectory()) {
        stack.push(entAbs)
        continue
      }
      if (!ent.isFile()) continue
      out.push(entAbs)
    }
  }
  return out
}

async function pruneTrash(config, logLines) {
  const trashRoot = path.join(REPO_ROOT, config.trashDir ?? '.trash')
  if (!(await pathExists(trashRoot))) return
  const days = Number(config.trashRetentionDays ?? 7)
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const entries = await fs.readdir(trashRoot, { withFileTypes: true })
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const abs = path.join(trashRoot, ent.name)
    const st = await fs.stat(abs).catch(() => null)
    if (!st) continue
    if (st.mtimeMs >= cutoff) continue
    await fs.rm(abs, { recursive: true, force: true })
    logLines.push(`prune-trash: removed ${toPosix(path.relative(REPO_ROOT, abs))}`)
  }
}

async function cmdSpawn(label, command, args, cwdAbs, logLines) {
  return new Promise((resolve) => {
    const p = spawn(command, args, { cwd: cwdAbs, shell: true, env: process.env })
    logLines.push(`$ (${label}) ${command} ${args.join(' ')}`.trim())
    p.stdout.on('data', (d) => logLines.push(String(d).trimEnd()))
    p.stderr.on('data', (d) => logLines.push(String(d).trimEnd()))
    p.on('close', (code) => resolve({ code }))
  })
}

async function verify(config) {
  const auditDir = path.join(REPO_ROOT, 'audit')
  await ensureDir(auditDir)
  const logLines = []
  logLines.push(`verify started: ${new Date().toISOString()}`)

  const gates = []

  const fe = config.qualityGates?.frontend
  if (fe?.cwd) {
    const cwdAbs = path.join(REPO_ROOT, fromPosix(fe.cwd))
    if (await pathExists(cwdAbs)) {
      gates.push({ name: 'frontend:npm ci', cwdAbs, cmd: fe.install?.[0], args: fe.install?.slice(1) ?? [] })
      gates.push({ name: 'frontend:build', cwdAbs, cmd: fe.build?.[0], args: fe.build?.slice(1) ?? [] })
      gates.push({ name: 'frontend:test(vitest)', cwdAbs, cmd: fe.test?.[0], args: fe.test?.slice(1) ?? [] })
    }
  }

  const be = config.qualityGates?.backend
  if (be?.cwd) {
    const cwdAbs = path.join(REPO_ROOT, fromPosix(be.cwd))
    const venvDir = path.join(cwdAbs, fromPosix(be.venvDir ?? '.venv'))
    const pyCandidates = be.pythonCandidates ?? ['python']

    if (await pathExists(cwdAbs)) {
      let python = null
      for (const c of pyCandidates) {
        const res = await cmdSpawn('detect-python', c, ['--version'], cwdAbs, [])
        if (res.code === 0) {
          python = c
          break
        }
      }

      if (!python) {
        logLines.push('backend: 未检测到可用 python，跳过 backend 门禁')
      } else {
        const venvPython = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'python.exe') : path.join(venvDir, 'bin', 'python')
        if (!(await pathExists(venvPython))) {
          const mk = await cmdSpawn('backend:venv', python, ['-m', 'venv', toPosix(path.relative(cwdAbs, venvDir))], cwdAbs, logLines)
          if (mk.code !== 0) return { ok: false, logLines }
        }
        gates.push({ name: 'backend:pip install', cwdAbs, cmd: venvPython, args: be.install ?? [] })
        gates.push({ name: 'backend:test(pytest)', cwdAbs, cmd: venvPython, args: be.test ?? [] })
      }
    }
  }

  const docker = config.qualityGates?.docker
  if (docker) {
    const candidates = docker.dockerfileCandidates ?? ['Dockerfile']
    const hasDockerfile = (await Promise.all(candidates.map((c) => pathExists(path.join(REPO_ROOT, fromPosix(c)))))).some(Boolean)
    if (!hasDockerfile) {
      logLines.push('docker: 未发现 Dockerfile，跳过 docker build 门禁')
    } else {
      gates.push({ name: 'docker:build', cwdAbs: REPO_ROOT, cmd: docker.buildCommand?.[0], args: docker.buildCommand?.slice(1) ?? [] })
    }
  }

  for (const g of gates) {
    logLines.push(`\n== ${g.name} ==`)
    const res = await cmdSpawn(g.name, g.cmd, g.args, g.cwdAbs, logLines)
    if (res.code !== 0) {
      logLines.push(`FAILED: ${g.name} (exit=${res.code})`)
      await writeFileEnsured(path.join(auditDir, 'verify-log.txt'), `${logLines.join('\n')}\n`)
      return { ok: false, logLines }
    }
    logLines.push(`OK: ${g.name}`)
  }

  await writeFileEnsured(path.join(auditDir, 'verify-log.txt'), `${logLines.join('\n')}\n`)
  return { ok: true, logLines }
}

async function main() {
  const { config } = await loadConfig()
  const args = parseArgs(process.argv)
  const cmd = args._[0] ?? 'scan'

  if (cmd === 'scan') {
    const scan = await scanRepo(config)
    await writeScanOutputs(scan)
    process.stdout.write(`OK: wrote audit/report.md and audit/report.csv\n`)
    return
  }

  if (cmd === 'dry-run' || cmd === 'apply') {
    const scan = await loadScanJson()
    const recommendation = String(args.recommendation ?? 'immediate')
    const rows = filterByRecommendation(scan.files, recommendation)
    const plan = rows.map((r) => r.path).sort()
    const auditDir = path.join(REPO_ROOT, 'audit')
    await ensureDir(auditDir)
    await writeFileEnsured(path.join(auditDir, 'delete-plan.json'), JSON.stringify({ recommendation, files: plan }, null, 2))

    if (cmd === 'dry-run') {
      process.stdout.write(`DRY-RUN: ${plan.length} files\n`)
      for (const p of plan.slice(0, 2000)) process.stdout.write(`${p}\n`)
      if (plan.length > 2000) process.stdout.write(`... (${plan.length - 2000} more)\n`)
      return
    }

    const stamp = nowStamp()
    const trashRoot = path.join(REPO_ROOT, config.trashDir ?? '.trash', stamp)
    const manifest = {
      createdAt: new Date().toISOString(),
      recommendation,
      trashRoot: toPosix(path.relative(REPO_ROOT, trashRoot)),
      moved: [],
      skipped: []
    }
    const logLines = []
    await ensureDir(trashRoot)
    await pruneTrash(config, logLines)

    for (const rel of plan) {
      const srcAbs = path.join(REPO_ROOT, fromPosix(rel))
      if (!(await pathExists(srcAbs))) continue
      const dstAbs = path.join(trashRoot, fromPosix(rel))
      const res = await moveFilePreserve(srcAbs, dstAbs)
      if (!res.ok) {
        manifest.skipped.push({ from: rel, error: res.error })
        logLines.push(`skip: ${rel} (${res.error})`)
        continue
      }
      manifest.moved.push({ from: rel, to: toPosix(path.relative(REPO_ROOT, dstAbs)), method: res.method })
      await removeEmptyParents(path.dirname(srcAbs), REPO_ROOT)
    }

    await writeFileEnsured(path.join(REPO_ROOT, 'audit', 'last-manifest.json'), JSON.stringify(manifest, null, 2))
    await writeFileEnsured(path.join(REPO_ROOT, 'audit', 'apply-log.txt'), `${logLines.join('\n')}\n`)
    process.stdout.write(
      `APPLIED: moved ${manifest.moved.length} files to ${manifest.trashRoot}${manifest.skipped.length ? ` (skipped ${manifest.skipped.length})` : ''}\n`
    )
    if (manifest.skipped.length) process.exitCode = 1
    return
  }

  if (cmd === 'rollback') {
    const manifestPathRel = args.manifest ? String(args.manifest) : 'audit/last-manifest.json'
    const manifestPathAbs = path.join(REPO_ROOT, fromPosix(manifestPathRel))
    if (!(await pathExists(manifestPathAbs))) throw new Error(`未找到 manifest: ${manifestPathRel}`)
    const manifest = await readJson(manifestPathAbs)
    const trashRootAbs = path.join(REPO_ROOT, fromPosix(manifest.trashRoot))
    const moved = manifest.moved ?? []

    for (const m of moved.slice().reverse()) {
      const srcAbs = path.join(REPO_ROOT, fromPosix(m.to))
      const dstAbs = path.join(REPO_ROOT, fromPosix(m.from))
      if (!(await pathExists(srcAbs))) continue
      await ensureDir(path.dirname(dstAbs))
      await moveFilePreserve(srcAbs, dstAbs)
      await removeEmptyParents(path.dirname(srcAbs), trashRootAbs)
    }
    process.stdout.write(`ROLLED BACK: restored ${moved.length} files\n`)
    return
  }

  if (cmd === 'prune-trash') {
    const logLines = []
    await pruneTrash(config, logLines)
    await writeFileEnsured(path.join(REPO_ROOT, 'audit', 'prune-log.txt'), `${logLines.join('\n')}\n`)
    process.stdout.write(`OK: pruned trash if needed\n`)
    return
  }

  if (cmd === 'rebuild-manifest') {
    const trashRel = String(args.trash ?? '').trim()
    if (!trashRel) throw new Error('rebuild-manifest 需要参数: --trash <.trash/时间戳>')
    const trashAbs = path.join(REPO_ROOT, fromPosix(trashRel))
    if (!(await pathExists(trashAbs))) throw new Error(`未找到 trash: ${trashRel}`)

    const filesAbs = await listFilesUnder(trashAbs)
    const moved = filesAbs
      .map((abs) => {
        const relInTrash = toPosix(path.relative(trashAbs, abs))
        return { from: relInTrash, to: `${trashRel.replaceAll('\\', '/')}/${relInTrash}`, method: 'unknown' }
      })
      .sort((a, b) => a.from.localeCompare(b.from))

    const manifest = {
      createdAt: new Date().toISOString(),
      recommendation: 'immediate',
      trashRoot: trashRel.replaceAll('\\', '/'),
      moved,
      skipped: []
    }
    await writeFileEnsured(path.join(REPO_ROOT, 'audit', 'rebuilt-manifest.json'), JSON.stringify(manifest, null, 2))
    process.stdout.write(`OK: wrote audit/rebuilt-manifest.json (${moved.length} files)\n`)
    return
  }

  if (cmd === 'verify') {
    const res = await verify(config)
    process.stdout.write(res.ok ? 'VERIFY OK\n' : 'VERIFY FAILED\n')
    process.exit(res.ok ? 0 : 1)
  }

  throw new Error(`未知命令: ${cmd}`)
}

main().catch((e) => {
  process.stderr.write(`${e?.stack ?? e}\n`)
  process.exit(1)
})
