import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = path.resolve(process.cwd())
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000'
const OUT_DIR = process.env.OUT_DIR || 'audit/bench/cart-flow'
const ITEMS = Number(process.env.ITEMS || '5')

function nowMs() {
  return Date.now()
}

function pct(before, after) {
  if (!Number.isFinite(before) || before <= 0 || !Number.isFinite(after)) return null
  return ((before - after) / before) * 100
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function httpJson({ method, url, headers, body }) {
  const res = await fetch(url, {
    method,
    headers: { ...(headers || {}), ...(body != null ? { 'content-type': 'application/json' } : {}) },
    body: body == null ? undefined : JSON.stringify(body)
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {}
  return { status: res.status, json, text }
}

async function runSeed() {
  const backendSeed = path.resolve(ROOT, 'backend', 'tools', 'seed_api_test_data.py')
  const proc = spawn('python', [backendSeed], { stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks = []
  const errs = []
  proc.stdout.on('data', (d) => chunks.push(d))
  proc.stderr.on('data', (d) => errs.push(d))
  const code = await new Promise((resolve) => proc.on('close', resolve))
  if (code !== 0) {
    throw new Error(Buffer.concat(errs).toString('utf8').slice(0, 2000))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function main() {
  const runDir = path.resolve(OUT_DIR, `run-${Date.now()}`)
  await ensureDir(runDir)

  const seed = await runSeed()
  const login = await httpJson({
    method: 'POST',
    url: `${BASE_URL}/api/user/login`,
    body: { phone: seed.user.phone, password: seed.user.password }
  })
  const token = login.json?.data?.tokens?.access_token || ''
  if (!token) throw new Error('login failed')

  const adminLogin = await httpJson({
    method: 'POST',
    url: `${BASE_URL}/api/admin/login`,
    body: { phone: seed.admin.phone, password: seed.admin.password }
  })
  const adminToken = adminLogin.json?.data?.tokens?.access_token || ''
  if (!adminToken) throw new Error('admin login failed')

  const created = []
  for (let i = 0; i < ITEMS; i++) {
    const p = await httpJson({
      method: 'POST',
      url: `${BASE_URL}/api/admin/products`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: `Bench商品-${Date.now()}-${i}`, category: 'bench', price: 1999 + i, stock: 50, description: 'bench', image_url: '', status: 'on_sale' }
    })
    const pid = p.json?.data?.product_id
    if (pid) created.push(String(pid))
  }

  for (const pid of created) {
    await httpJson({
      method: 'POST',
      url: `${BASE_URL}/api/cart/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product_id: pid, quantity: 1 }
    })
  }

  const oldStart = nowMs()
  const cart1 = await httpJson({
    method: 'GET',
    url: `${BASE_URL}/api/cart/items`,
    headers: { Authorization: `Bearer ${token}` }
  })
  const items = Array.isArray(cart1.json?.data?.items) ? cart1.json.data.items : []
  const ids = items.map((x) => String(x.product_id)).filter(Boolean)
  await Promise.all(
    ids.map((id) =>
      httpJson({
        method: 'GET',
        url: `${BASE_URL}/api/product/${encodeURIComponent(id)}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    )
  )
  const oldMs = nowMs() - oldStart

  const newStart = nowMs()
  const cart2 = await httpJson({
    method: 'GET',
    url: `${BASE_URL}/api/cart/items`,
    headers: { Authorization: `Bearer ${token}` }
  })
  const _products = cart2.json?.data?.products
  const newMs = nowMs() - newStart

  const out = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    items: created.length,
    oldFlowMs: oldMs,
    newFlowMs: newMs,
    improvementPct: pct(oldMs, newMs),
    note: 'oldFlow 模拟历史前端：cart/items + 并发拉取每个 product/:id；newFlow 使用增强后的 cart/items 返回 products map'
  }

  await fs.writeFile(path.join(runDir, 'bench.json'), JSON.stringify(out, null, 2), 'utf8')
  const md = [
    '# 购物车加载链路基准测试',
    '',
    `- generatedAt: ${out.generatedAt}`,
    `- baseUrl: ${out.baseUrl}`,
    `- items: ${out.items}`,
    '',
    '| 指标 | 值 |',
    '|---|---:|',
    `| oldFlow(ms) | ${out.oldFlowMs} |`,
    `| newFlow(ms) | ${out.newFlowMs} |`,
    `| improvement | ${out.improvementPct == null ? 'n/a' : out.improvementPct.toFixed(1) + '%'} |`,
    '',
    out.note,
    ''
  ].join('\n')
  await fs.writeFile(path.join(runDir, 'bench.md'), md, 'utf8')

  process.stdout.write(`${path.join(runDir, 'bench.json')}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

