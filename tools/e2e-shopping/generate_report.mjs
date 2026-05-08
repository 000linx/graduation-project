import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const OUT_DIR = path.resolve(ROOT, 'test-reports', 'e2e-shopping')
const INPUT = path.join(OUT_DIR, 'playwright-results.json')

function percentile(sorted, q) {
  if (!sorted.length) return 0
  const idx = Math.floor((sorted.length - 1) * q)
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

function walkSuites(suite, out) {
  if (!suite) return
  if (Array.isArray(suite.tests)) out.push(...suite.tests)
  if (Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      const file = String(spec?.file || suite?.file || '')
      const line = Number(spec?.line || suite?.line || 0)
      if (Array.isArray(spec?.tests)) {
        for (const t of spec.tests) {
          out.push({ ...t, __specTitle: spec?.title, __file: file, __line: line })
        }
      }
    }
  }
  if (Array.isArray(suite.suites)) suite.suites.forEach((s) => walkSuites(s, out))
}

async function readJson(p) {
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw)
}

function summarizeTests(tests) {
  const total = tests.length
  const byStatus = { passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0, other: 0 }
  for (const t of tests) {
    const results = Array.isArray(t?.results) ? t.results : []
    const outcome = results.length ? results[results.length - 1]?.status : t?.outcome || t?.status
    if (outcome === 'passed') byStatus.passed++
    else if (outcome === 'failed') byStatus.failed++
    else if (outcome === 'skipped') byStatus.skipped++
    else if (outcome === 'flaky') byStatus.flaky++
    else if (outcome === 'timedOut') byStatus.timedOut++
    else byStatus.other++
  }
  const passRate = total ? Math.round((byStatus.passed / total) * 10000) / 100 : 0
  return { total, byStatus, passRate }
}

function stripAnsi(s) {
  return String(s || '').replace(/\u001b\[[0-9;]*m/g, '')
}

function extractFailures(tests) {
  const defects = []
  for (const t of tests) {
    const results = Array.isArray(t?.results) ? t.results : []
    const outcome = results.length ? results[results.length - 1]?.status : t?.outcome || t?.status
    if (outcome === 'failed' || outcome === 'timedOut') {
      const title = String(t?.__specTitle || t?.title || '').trim()
      const project = String(t?.projectName || '')
      const location = t?.__file ? `${t.__file}:${t.__line || 0}` : ''
      const err = results.find((r) => r?.error)?.error
      const msg = stripAnsi(err?.message || err?.value || '')
      defects.push({ project, title, location, message: String(msg).slice(0, 800) })
    }
  }
  return defects
}

async function extractPerf(tests) {
  const nav = []
  const api = []
  for (const t of tests) {
    const results = Array.isArray(t?.results) ? t.results : []
    for (const r of results) {
      const atts = Array.isArray(r?.attachments) ? r.attachments : []
      for (const a of atts) {
        const name = String(a?.name || '')
        if (!name.startsWith('perf.')) continue
        try {
          let perf = null
          const p = a?.path ? String(a.path) : ''
          if (p) {
            perf = await readJson(p)
          } else if (typeof a?.body === 'string' && a.body) {
            const raw = Buffer.from(a.body, 'base64').toString('utf8')
            perf = JSON.parse(raw)
          }
          if (!perf) continue
          if (perf?.nav_ms != null) nav.push({ name, nav_ms: Number(perf.nav_ms) })
          if (Array.isArray(perf?.api)) {
            for (const x of perf.api) {
              api.push({ name, duration_ms: Number(x?.duration_ms || 0) })
            }
          }
        } catch {}
      }
    }
  }
  return { nav, api }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const data = await readJson(INPUT)
  const tests = []
  if (Array.isArray(data?.suites)) data.suites.forEach((s) => walkSuites(s, tests))
  const summary = summarizeTests(tests)
  const defects = extractFailures(tests)
  const perf = await extractPerf(tests)

  const navTimes = perf.nav.map((x) => x.nav_ms).filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b)
  const apiTimes = perf.api.map((x) => x.duration_ms).filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b)

  const md = [
    '# 端到端测试报告（购物流程）',
    '',
    `- 生成时间: ${new Date().toISOString()}`,
    `- 用例总数: ${summary.total}`,
    `- 通过率: ${summary.passRate}%`,
    `- 通过/失败/超时/跳过: ${summary.byStatus.passed}/${summary.byStatus.failed}/${summary.byStatus.timedOut}/${summary.byStatus.skipped}`,
    '',
    '## 性能指标（采样自浏览器 Performance API）',
    '',
    `- 页面加载(nav) p50/p95(ms): ${percentile(navTimes, 0.5)}/${percentile(navTimes, 0.95)}`,
    `- 接口请求(/api/*) p50/p95(ms): ${percentile(apiTimes, 0.5)}/${percentile(apiTimes, 0.95)}`,
    '',
    '## 缺陷列表（自动汇总）',
    '',
    defects.length ? '| 端 | 用例 | 位置 | 失败信息 |' : '- 无',
    defects.length ? '|---|---|---|---|' : ''
  ]
  for (const d of defects) {
    md.push(`| ${d.project} | ${String(d.title).replaceAll('|', ' ')} | ${d.location} | ${String(d.message).replaceAll('|', ' ')} |`)
  }

  md.push(
    '',
    '## 改进建议',
    '',
    '- 页面关键按钮/表单补齐 data-testid（登录/注册/结算/优惠券/支付/售后），降低 E2E 波动',
    '- 后端为订单补齐更完整的物流字段与轨迹展示（carrier/tracking_no/events），并增加用户侧查询接口（如需独立展示）',
    '- 将 E2E 纳入门禁：固定 Node/浏览器版本，设置并行 worker 上限，失败自动收集 trace/video',
    ''
  )

  await fs.writeFile(path.join(OUT_DIR, 'report.md'), md.join('\n'), 'utf8')
  await fs.writeFile(path.join(OUT_DIR, 'defects.json'), JSON.stringify(defects, null, 2), 'utf8')

  process.stdout.write(path.join(OUT_DIR, 'report.md') + '\n')
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

