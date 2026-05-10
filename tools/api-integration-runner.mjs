import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000'
const DEFAULT_OUT_DIR = process.env.OUT_DIR || 'test-reports/api-integration'

function nowMs() {
  return Date.now()
}

function toIso(ts) {
  return new Date(ts).toISOString()
}

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function redactHeaders(headers) {
  const out = {}
  for (const [k, v] of Object.entries(headers || {})) {
    if (String(k).toLowerCase() === 'authorization') out[k] = 'Bearer ***'
    else out[k] = v
  }
  return out
}

function redactBody(body) {
  if (body == null) return body
  if (Array.isArray(body)) return body.map((x) => redactBody(x))
  if (typeof body !== 'object') return body
  const out = {}
  for (const [k, v] of Object.entries(body)) {
    const lk = String(k).toLowerCase()
    if (lk.includes('password') || lk.includes('token')) out[k] = '***'
    else out[k] = redactBody(v)
  }
  return out
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

function parseArgs(argv) {
  const out = { baseUrl: DEFAULT_BASE_URL, outDir: DEFAULT_OUT_DIR }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--baseUrl') out.baseUrl = argv[++i]
    else if (a === '--outDir') out.outDir = argv[++i]
  }
  return out
}

async function httpRequest({ baseUrl, method, url, headers, body, timeoutMs }) {
  const fullUrl = url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}${url}`
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs || 15000)
  const t0 = nowMs()
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal
    })
    const dt = nowMs() - t0
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { ok: res.ok, status: res.status, dt, text, json, url: fullUrl }
  } finally {
    clearTimeout(t)
  }
}

function envHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function assertEnvelope(resp) {
  const issues = []
  if (resp.json == null || typeof resp.json !== 'object') {
    issues.push('非 JSON 响应')
    return issues
  }
  if (!('code' in resp.json)) issues.push('缺少 code 字段')
  if (!('msg' in resp.json) && !('message' in resp.json)) issues.push('缺少 msg/message 字段')
  if ('code' in resp.json && Number(resp.json.code) !== Number(resp.status)) {
    issues.push(`HTTP status(${resp.status}) 与 envelope.code(${resp.json.code}) 不一致`)
  }
  return issues
}

function classifyFailure(resp, issues) {
  if (issues.includes('超时')) return '超时异常'
  if (resp.status === 401) return '认证失败'
  if (resp.status === 403) return '权限不足'
  if (issues.some((x) => x.includes('不一致'))) return '接口规范不一致'
  if (issues.some((x) => x.includes('非 JSON'))) return '数据格式错误'
  if (resp.status >= 500) return '服务端异常'
  return '其他'
}

async function runSeed({ outDir }) {
  const t0 = nowMs()
  const backendSeed = path.resolve('backend', 'tools', 'seed_api_test_data.py')
  const proc = spawn('python', [backendSeed], { stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks = []
  const errs = []
  proc.stdout.on('data', (d) => chunks.push(d))
  proc.stderr.on('data', (d) => errs.push(d))
  const code = await new Promise((resolve) => proc.on('close', resolve))
  const dt = nowMs() - t0
  if (code !== 0) {
    throw new Error(`seed failed (exit=${code}) ${Buffer.concat(errs).toString('utf8').slice(0, 4000)}`)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  const json = JSON.parse(raw)
  await fs.writeFile(path.join(outDir, 'seed.json'), JSON.stringify({ ...json, generatedAt: toIso(nowMs()), durationMs: dt }, null, 2), 'utf8')
  return json
}

async function main() {
  const { baseUrl, outDir } = parseArgs(process.argv.slice(2))
  const outAbs = path.resolve(outDir)
  await ensureDir(outAbs)

  const startedAt = toIso(nowMs())
  const seed = await runSeed({ outDir: outAbs })

  const results = []
  const issues = []
  const caseRecords = []

  const pushResult = (r) => results.push(r)
  const pushIssue = (r, issuesList) => {
    const cat = classifyFailure(r, issuesList)
    issues.push({
      category: cat,
      caseId: r.caseId,
      name: r.name,
      method: r.method,
      url: r.url,
      status: r.status,
      durationMs: r.durationMs,
      issues: issuesList,
      responseSnippet: String(r.responseSnippet || '').slice(0, 500)
    })
  }

  async function runCase(tc) {
    const resp = await httpRequest({
      baseUrl,
      method: tc.method,
      url: tc.url,
      headers: tc.headers,
      body: tc.body,
      timeoutMs: tc.timeoutMs || 15000
    }).catch((e) => {
      return { ok: false, status: 0, dt: tc.timeoutMs || 15000, text: '', json: null, url: tc.url, error: String(e) }
    })

    const r = {
      caseId: tc.id,
      name: tc.name,
      method: tc.method,
      url: resp.url,
      status: resp.status,
      durationMs: resp.dt,
      passed: false,
      envelopeIssues: [],
      responseSnippet: resp.text ? resp.text.slice(0, 500) : '',
      startedAt: toIso(nowMs() - resp.dt),
      endedAt: toIso(nowMs())
    }

    const expected = tc.expectStatus
    const statusOk = Array.isArray(expected) ? expected.includes(resp.status) : resp.status === expected
    const envelopeIssues = assertEnvelope(resp)
    r.envelopeIssues = envelopeIssues
    const ok = statusOk && envelopeIssues.length === 0
    r.passed = ok

    pushResult(r)
    if (!ok) {
      const issueList = []
      if (!statusOk) issueList.push(`HTTP status 不符合预期（期望=${JSON.stringify(expected)} 实际=${resp.status}）`)
      if (resp.error && String(resp.error).includes('AbortError')) issueList.push('超时')
      issueList.push(...envelopeIssues)
      pushIssue(r, issueList)
    }
    caseRecords.push({
      caseId: tc.id,
      name: tc.name,
      method: tc.method,
      url: resp.url,
      expectStatus: tc.expectStatus,
      request: {
        headers: redactHeaders(tc.headers || {}),
        query: null,
        body: redactBody(tc.body ?? null)
      },
      response: {
        status: resp.status,
        durationMs: resp.dt,
        envelopeIssues,
        snippet: resp.text ? resp.text.slice(0, 500) : ''
      }
    })
    return resp
  }

  const today = toLocalDateStr(new Date())

  const cases = [
    { id: 'U01', name: '用户登录', method: 'POST', url: '/api/user/login', headers: { 'content-type': 'application/json' }, body: { phone: seed.user.phone, password: seed.user.password }, expectStatus: 200 },
    { id: 'U02', name: '用户Profile(未登录)', method: 'GET', url: '/api/user/profile', headers: {}, expectStatus: 401 },
    { id: 'U03', name: '用户Profile(已登录)', method: 'GET', url: '/api/user/profile', headers: {}, expectStatus: 200 },
    { id: 'P01', name: '商品列表', method: 'GET', url: '/api/product/list?page=1&page_size=10', headers: {}, expectStatus: 200 },
    { id: 'A01', name: '公共活动列表', method: 'GET', url: '/api/activity/list?page=1&page_size=10', headers: {}, expectStatus: 200 },
    { id: 'AD01', name: '后台登录', method: 'POST', url: '/api/admin/login', headers: { 'content-type': 'application/json' }, body: { phone: seed.admin.phone, password: seed.admin.password }, expectStatus: 200 },
    { id: 'AD02', name: '后台权限(无token)', method: 'GET', url: '/api/admin/me/permissions', headers: {}, expectStatus: 401 },
    { id: 'AD03', name: '后台权限(用户token应失败)', method: 'GET', url: '/api/admin/me/permissions', headers: {}, expectStatus: 403 },
    { id: 'AD04', name: '后台权限(管理员token)', method: 'GET', url: '/api/admin/me/permissions', headers: {}, expectStatus: 200 }
  ]

  const userLogin = await runCase(cases[0])
  const userToken = userLogin.json?.data?.tokens?.access_token || ''
  cases[2].headers = envHeader(userToken)

  const adminLogin = await runCase(cases[5])
  const adminToken = adminLogin.json?.data?.tokens?.access_token || ''
  cases[7].headers = envHeader(userToken)
  cases[8].headers = envHeader(adminToken)

  for (const tc of [cases[1], cases[2], cases[3], cases[4], cases[6], cases[7], cases[8]]) {
    await runCase(tc)
  }

  const productCreateResp = await httpRequest({
    baseUrl,
    method: 'POST',
    url: '/api/admin/products',
    headers: { 'content-type': 'application/json', ...envHeader(adminToken) },
    body: { name: `ITest商品-${Date.now()}`, category: 'test', price: 1999, stock: 50, description: 'integration test', image_url: '', status: 'on_sale' },
    timeoutMs: 15000
  })
  const productId = productCreateResp.json?.data?.product_id
  caseRecords.push({
    caseId: 'AD-P00',
    name: '后台创建商品(测试数据)',
    method: 'POST',
    url: `${baseUrl}/api/admin/products`,
    expectStatus: 200,
    request: {
      headers: redactHeaders({ 'content-type': 'application/json', ...envHeader(adminToken) }),
      query: null,
      body: redactBody({ name: 'ITest商品-<ts>', category: 'test', price: 1999, stock: 50, description: 'integration test', image_url: '', status: 'on_sale' })
    },
    response: {
      status: productCreateResp.status,
      durationMs: productCreateResp.dt,
      envelopeIssues: assertEnvelope(productCreateResp),
      snippet: productCreateResp.text ? productCreateResp.text.slice(0, 500) : ''
    }
  })

  await runCase({ id: 'C01', name: '加入购物车', method: 'POST', url: '/api/cart/add', headers: { 'content-type': 'application/json', ...envHeader(userToken) }, body: { product_id: productId, quantity: 2 }, expectStatus: 200 })
  await runCase({ id: 'C02', name: '查看购物车', method: 'GET', url: '/api/cart/items', headers: envHeader(userToken), expectStatus: 200 })
  await runCase({ id: 'C03', name: '更新购物车数量', method: 'PUT', url: '/api/cart/update', headers: { 'content-type': 'application/json', ...envHeader(userToken) }, body: { product_id: productId, quantity: 1 }, expectStatus: 200 })

  const orderCreate = await httpRequest({
    baseUrl,
    method: 'POST',
    url: '/api/order/create',
    headers: { 'content-type': 'application/json', ...envHeader(userToken) },
    body: { items: [{ product_id: productId, quantity: 1 }], shipping_address: seed.shipping_address },
    timeoutMs: 20000
  })
  const orderId = orderCreate.json?.data?.order_id
  caseRecords.push({
    caseId: 'O01',
    name: '创建订单',
    method: 'POST',
    url: `${baseUrl}/api/order/create`,
    expectStatus: 201,
    request: {
      headers: redactHeaders({ 'content-type': 'application/json', ...envHeader(userToken) }),
      query: null,
      body: redactBody({ items: [{ product_id: productId, quantity: 1 }], shipping_address: seed.shipping_address })
    },
    response: {
      status: orderCreate.status,
      durationMs: orderCreate.dt,
      envelopeIssues: assertEnvelope(orderCreate),
      snippet: orderCreate.text ? orderCreate.text.slice(0, 500) : ''
    }
  })

  results.push({
    caseId: 'O01',
    name: '创建订单',
    method: 'POST',
    url: `${baseUrl}/api/order/create`,
    status: orderCreate.status,
    durationMs: orderCreate.dt,
    passed: orderCreate.status === 201 && assertEnvelope(orderCreate).length === 0,
    envelopeIssues: assertEnvelope(orderCreate),
    responseSnippet: orderCreate.text ? orderCreate.text.slice(0, 500) : '',
    startedAt: startedAt,
    endedAt: toIso(nowMs())
  })

  await runCase({ id: 'O02', name: '订单历史', method: 'GET', url: '/api/order/history', headers: envHeader(userToken), expectStatus: 200 })
  if (orderId) {
    await runCase({ id: 'AD-O1', name: '管理员设置订单状态=paid', method: 'PUT', url: `/api/admin/orders/${orderId}/status`, headers: { 'content-type': 'application/json', ...envHeader(adminToken) }, body: { status: 'paid' }, expectStatus: 200 })
  }

  await runCase({ id: 'M01', name: '维护slots(无需登录)', method: 'GET', url: `/api/maintenance/slots?date=${today}&limit=8`, headers: {}, expectStatus: 200 })
  await runCase({ id: 'M02', name: '维护eligible(需登录)', method: 'GET', url: `/api/maintenance/eligible`, headers: envHeader(userToken), expectStatus: 200 })

  if (orderId) {
    const pickSlot = async (dateStr) => {
      const slotsResp = await httpRequest({ baseUrl, method: 'GET', url: `/api/maintenance/slots?date=${encodeURIComponent(dateStr)}&limit=24`, headers: {}, timeoutMs: 15000 })
      const slots = slotsResp.json?.data?.slots || []
      const minStartMs = nowMs() + 11 * 60 * 1000
      const chosen = slots.find((s) => {
        const startMs = new Date(String(s?.start || '')).getTime()
        return Number.isFinite(startMs) && startMs >= minStartMs
      })
      return { slot: chosen || slots[0] || null, slotsResp }
    }

    let { slot } = await pickSlot(today)
    if (!slot) {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      ;({ slot } = await pickSlot(toLocalDateStr(d)))
    }
    const preferredStart = slot?.start
    if (preferredStart) {
      await runCase({
        id: 'M03',
        name: '提交维护预约',
        method: 'POST',
        url: '/api/maintenance/appointments',
        headers: { 'content-type': 'application/json', ...envHeader(userToken) },
        body: { order_id: orderId, product_id: productId, contact_name: '张三', contact_phone: '13800138000', preferred_start: preferredStart, notes: 'itest' },
        expectStatus: 201
      })
      await runCase({ id: 'M04', name: '查询我的维护预约', method: 'GET', url: '/api/maintenance/appointments?page=1&page_size=10', headers: envHeader(userToken), expectStatus: 200 })
    }
  }

  const endedAt = toIso(nowMs())
  await fs.writeFile(path.join(outAbs, 'results.json'), JSON.stringify({ baseUrl, startedAt, endedAt, seed }, null, 2), 'utf8')
  await fs.writeFile(path.join(outAbs, 'case-records.json'), JSON.stringify(caseRecords, null, 2), 'utf8')

  const csvHeader = [
    'case_id',
    'name',
    'method',
    'url',
    'status',
    'passed',
    'duration_ms',
    'envelope_issues',
    'started_at',
    'ended_at'
  ]
  const csvLines = [csvHeader.join(',')]
  for (const r of results) {
    csvLines.push(
      [
        r.caseId,
        JSON.stringify(r.name),
        r.method,
        JSON.stringify(r.url),
        r.status,
        r.passed ? 1 : 0,
        r.durationMs,
        JSON.stringify((r.envelopeIssues || []).join('; ')),
        r.startedAt,
        r.endedAt
      ].join(',')
    )
  }
  await fs.writeFile(path.join(outAbs, 'results.csv'), csvLines.join('\n'), 'utf8')

  const total = results.length
  const passed = results.filter((x) => x.passed).length
  const failed = total - passed
  const durations = results.map((x) => Number(x.durationMs || 0)).filter((x) => Number.isFinite(x))
  durations.sort((a, b) => a - b)
  const p = (q) => (durations.length ? durations[Math.floor((durations.length - 1) * q)] : 0)
  const p50 = p(0.5)
  const p95 = p(0.95)
  const p99 = p(0.99)

  const byCat = new Map()
  for (const it of issues) byCat.set(it.category, (byCat.get(it.category) || 0) + 1)
  const byCatStr = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const reportMd = [
    '# 前后端接口对接测试报告',
    '',
    `- Base URL: ${baseUrl}`,
    `- 开始时间: ${startedAt}`,
    `- 结束时间: ${endedAt}`,
    `- 用例总数: ${total}`,
    `- 通过: ${passed}`,
    `- 失败: ${failed}`,
    `- 性能指标(所有用例): p50=${p50}ms p95=${p95}ms p99=${p99}ms`,
    '',
    '## 问题分类统计',
    byCatStr || '- 无',
    '',
    '## 产出文件',
    `- results.csv`,
    `- results.json`,
    `- case-records.md`,
    `- case-records.json`,
    `- seed.json`,
    `- issues.json`,
    ''
  ].join('\n')
  await fs.writeFile(path.join(outAbs, 'report.md'), reportMd, 'utf8')
  await fs.writeFile(path.join(outAbs, 'issues.json'), JSON.stringify(issues, null, 2), 'utf8')
  await fs.writeFile(path.join(outAbs, 'issues.md'), issues.length ? issues.map((x) => `- [${x.category}] ${x.caseId} ${x.method} ${x.url} status=${x.status} ${x.issues.join(' | ')}`).join('\n') : '- 无', 'utf8')

  const mdParts = ['# 单接口测试记录', '']
  for (const it of caseRecords) {
    mdParts.push(`## ${it.caseId} ${it.name}`)
    mdParts.push('')
    mdParts.push(`- Method: ${it.method}`)
    mdParts.push(`- URL: ${it.url}`)
    mdParts.push(`- 期望状态码: ${JSON.stringify(it.expectStatus)}`)
    mdParts.push(`- 实际状态码: ${it.response?.status}`)
    mdParts.push(`- 耗时: ${it.response?.durationMs}ms`)
    mdParts.push('')
    mdParts.push('### 请求')
    mdParts.push('')
    mdParts.push('```json')
    mdParts.push(JSON.stringify(it.request || {}, null, 2))
    mdParts.push('```')
    mdParts.push('')
    mdParts.push('### 响应(片段)')
    mdParts.push('')
    mdParts.push('```json')
    mdParts.push(String(it.response?.snippet || ''))
    mdParts.push('```')
    mdParts.push('')
    if (it.response?.envelopeIssues?.length) {
      mdParts.push('### Envelope 异常')
      mdParts.push('')
      mdParts.push('```json')
      mdParts.push(JSON.stringify(it.response.envelopeIssues, null, 2))
      mdParts.push('```')
      mdParts.push('')
    }
  }
  await fs.writeFile(path.join(outAbs, 'case-records.md'), mdParts.join('\n'), 'utf8')
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

