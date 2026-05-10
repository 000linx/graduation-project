const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000'
const TOKEN = process.env.TOKEN || ''
const ORDER_ID = process.env.ORDER_ID || ''
const PRODUCT_ID = process.env.PRODUCT_ID || ''
const START = process.env.START || ''
const CONCURRENCY = Number(process.env.CONCURRENCY || 50)
const REQUESTS = Number(process.env.REQUESTS || 500)

if (!TOKEN || !ORDER_ID || !PRODUCT_ID || !START) {
  process.stderr.write(
    `Missing env.\n` +
      `Required: TOKEN, ORDER_ID, PRODUCT_ID, START\n` +
      `Optional: BASE_URL, CONCURRENCY, REQUESTS\n`
  )
  process.exit(1)
}

const url = `${BASE_URL.replace(/\\/$/, '')}/api/maintenance/appointments`
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${TOKEN}`
}

function nowMs() {
  return Date.now()
}

async function one(i) {
  const body = {
    order_id: ORDER_ID,
    product_id: PRODUCT_ID,
    contact_name: `loadtest-${i}`,
    contact_phone: '13800138000',
    preferred_start: START,
    notes: 'load test'
  }

  const t0 = nowMs()
  let ok = false
  let status = 0
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    status = res.status
    ok = res.status === 201 || res.status === 200 || res.status === 409
    await res.arrayBuffer().catch(() => {})
  } catch {
    ok = false
  }
  const dt = nowMs() - t0
  return { ok, status, dt }
}

async function run() {
  const lat = []
  let okCount = 0
  let failCount = 0
  const byStatus = new Map()

  let idx = 0
  const workers = new Array(CONCURRENCY).fill(0).map(async () => {
    while (true) {
      const i = idx++
      if (i >= REQUESTS) return
      const r = await one(i)
      lat.push(r.dt)
      if (r.ok) okCount++
      else failCount++
      byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1)
    }
  })

  const t0 = nowMs()
  await Promise.all(workers)
  const t1 = nowMs()

  lat.sort((a, b) => a - b)
  const p = (q) => lat[Math.floor((lat.length - 1) * q)]
  process.stdout.write(`requests=${REQUESTS} concurrency=${CONCURRENCY}\n`)
  process.stdout.write(`ok=${okCount} fail=${failCount} success_rate=${((okCount / REQUESTS) * 100).toFixed(2)}%\n`)
  process.stdout.write(`time_ms=${t1 - t0}\n`)
  process.stdout.write(`p50=${p(0.5)}ms p90=${p(0.9)}ms p99=${p(0.99)}ms\n`)
  process.stdout.write(`status_counts=${JSON.stringify(Object.fromEntries([...byStatus.entries()].sort((a, b) => a[0] - b[0])))}\n`)
}

run().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

