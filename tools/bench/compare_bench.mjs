import fs from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const out = { before: '', after: '' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--before') out.before = argv[++i]
    else if (a === '--after') out.after = argv[++i]
  }
  return out
}

function pctChange(before, after) {
  if (!Number.isFinite(before) || before <= 0 || !Number.isFinite(after)) return null
  return ((after - before) / before) * 100
}

function fmtPct(v) {
  if (v == null) return 'n/a'
  const s = v.toFixed(1)
  return `${s}%`
}

async function readJson(p) {
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw)
}

async function main() {
  const { before, after } = parseArgs(process.argv.slice(2))
  if (!before || !after) {
    process.stderr.write('Usage: node tools/bench/compare_bench.mjs --before <bench.json> --after <bench.json>\n')
    process.exit(2)
  }

  const b = await readJson(path.resolve(before))
  const a = await readJson(path.resolve(after))

  const bp50 = Number(b?.aggregate?.p50 || 0)
  const bp95 = Number(b?.aggregate?.p95 || 0)
  const bp99 = Number(b?.aggregate?.p99 || 0)
  const ap50 = Number(a?.aggregate?.p50 || 0)
  const ap95 = Number(a?.aggregate?.p95 || 0)
  const ap99 = Number(a?.aggregate?.p99 || 0)

  const lines = [
    '# 基准测试对比',
    '',
    `- before: ${before}`,
    `- after: ${after}`,
    '',
    '| 指标 | before | after | 变化 |',
    '|---|---:|---:|---:|',
    `| p50(ms) | ${bp50} | ${ap50} | ${fmtPct(pctChange(bp50, ap50))} |`,
    `| p95(ms) | ${bp95} | ${ap95} | ${fmtPct(pctChange(bp95, ap95))} |`,
    `| p99(ms) | ${bp99} | ${ap99} | ${fmtPct(pctChange(bp99, ap99))} |`,
    ''
  ]

  process.stdout.write(lines.join('\n'))
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

