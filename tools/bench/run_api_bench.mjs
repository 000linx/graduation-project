import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = path.resolve(process.cwd())
const DEFAULT_BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000'
const DEFAULT_RUNS = Number(process.env.RUNS || '10')
const DEFAULT_OUT_DIR = process.env.OUT_DIR || 'audit/bench/api-integration'
const DEFAULT_CASES_FILTER = process.env.CASES || ''

function nowIso() {
  return new Date().toISOString()
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else cur += ch
    } else {
      if (ch === ',') {
        out.push(cur)
        cur = ''
      } else if (ch === '"') inQuotes = true
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

function percentile(sorted, q) {
  if (!sorted.length) return 0
  const idx = Math.floor((sorted.length - 1) * q)
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

async function runOnce({ baseUrl, outDir, runId }) {
  const runner = path.join(ROOT, 'tools', 'api-integration-runner.mjs')
  const args = ['node', runner, '--baseUrl', baseUrl, '--outDir', outDir]
  const proc = spawn(args[0], args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] })
  const stdout = []
  const stderr = []
  proc.stdout.on('data', (d) => stdout.push(d))
  proc.stderr.on('data', (d) => stderr.push(d))
  const code = await new Promise((resolve) => proc.on('close', resolve))
  const errText = Buffer.concat(stderr).toString('utf8')
  if (code !== 0) {
    throw new Error(`runner failed(run=${runId}) exit=${code} ${errText.slice(0, 2000)}`)
  }
  return Buffer.concat(stdout).toString('utf8')
}

async function readResultsCsv(outDir) {
  const csvPath = path.join(outDir, 'results.csv')
  const raw = await fs.readFile(csvPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) return []
  const header = parseCsvLine(lines[0])
  const idxCase = header.indexOf('case_id')
  const idxDur = header.indexOf('duration_ms')
  const idxPassed = header.indexOf('passed')
  const idxStatus = header.indexOf('status')
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    out.push({
      caseId: cols[idxCase],
      durationMs: Number(cols[idxDur] || 0),
      passed: cols[idxPassed] === '1',
      status: Number(cols[idxStatus] || 0)
    })
  }
  return out
}

function summarizeRun(items, filterSet) {
  const filtered = filterSet.size ? items.filter((x) => filterSet.has(String(x.caseId))) : items
  const durations = filtered.map((x) => x.durationMs).filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  const passed = filtered.filter((x) => x.passed).length
  const failed = filtered.length - passed
  return {
    total: filtered.length,
    passed,
    failed,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    p99: percentile(durations, 0.99)
  }
}

async function main() {
  const baseUrl = DEFAULT_BASE_URL
  const runs = Number.isFinite(DEFAULT_RUNS) && DEFAULT_RUNS > 0 ? DEFAULT_RUNS : 10
  const outRoot = path.resolve(DEFAULT_OUT_DIR)
  await ensureDir(outRoot)

  const filterSet = new Set(DEFAULT_CASES_FILTER.split(',').map((x) => x.trim()).filter(Boolean))
  const runOutDir = path.join(outRoot, `run-${Date.now()}`)
  await ensureDir(runOutDir)

  const perRun = []
  for (let i = 0; i < runs; i++) {
    await runOnce({ baseUrl, outDir: 'test-reports/api-integration', runId: i + 1 })
    const items = await readResultsCsv(path.resolve('test-reports/api-integration'))
    perRun.push({ run: i + 1, summary: summarizeRun(items, filterSet) })
  }

  const p50s = perRun.map((x) => x.summary.p50).sort((a, b) => a - b)
  const p95s = perRun.map((x) => x.summary.p95).sort((a, b) => a - b)
  const p99s = perRun.map((x) => x.summary.p99).sort((a, b) => a - b)

  const aggregate = {
    runs,
    p50: percentile(p50s, 0.5),
    p95: percentile(p95s, 0.5),
    p99: percentile(p99s, 0.5),
    worst_p95: percentile(p95s, 1.0),
    worst_p99: percentile(p99s, 1.0)
  }

  const out = {
    generatedAt: nowIso(),
    baseUrl,
    cases: filterSet.size ? [...filterSet] : null,
    aggregate,
    perRun
  }

  const jsonPath = path.join(runOutDir, 'bench.json')
  await fs.writeFile(jsonPath, JSON.stringify(out, null, 2), 'utf8')

  const md = [
    '# API 基准测试结果',
    '',
    `- generatedAt: ${out.generatedAt}`,
    `- baseUrl: ${out.baseUrl}`,
    `- runs: ${runs}`,
    out.cases ? `- cases: ${out.cases.join(', ')}` : '- cases: all',
    '',
    '## 汇总(中位数聚合)',
    '',
    `- p50: ${aggregate.p50}ms`,
    `- p95: ${aggregate.p95}ms`,
    `- p99: ${aggregate.p99}ms`,
    `- worst_p95: ${aggregate.worst_p95}ms`,
    `- worst_p99: ${aggregate.worst_p99}ms`,
    ''
  ].join('\n')
  await fs.writeFile(path.join(runOutDir, 'bench.md'), md, 'utf8')

  process.stdout.write(`${jsonPath}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

