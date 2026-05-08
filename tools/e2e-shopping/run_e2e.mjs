import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const FRONTEND_DIR = path.resolve(ROOT, 'frontend')
const OUT_DIR = path.resolve(ROOT, 'test-reports', 'e2e-shopping')
const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:5000'
const WEB_BASE_ENV = process.env.E2E_BASE_URL || ''

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function fetchOk(url, timeoutMs = 2_500) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'GET', signal: ac.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}

async function waitHttpOk(url, timeoutMs = 60_000) {
  const start = Date.now()
  for (;;) {
    if (await fetchOk(url)) return true
    if (Date.now() - start > timeoutMs) return false
    await sleep(800)
  }
}

async function canListen(port, host = '127.0.0.1') {
  const server = net.createServer()
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, host, resolve)
    })
    return true
  } catch {
    return false
  } finally {
    try {
      await new Promise((resolve) => server.close(resolve))
    } catch {}
  }
}

async function pickWebBase() {
  if (WEB_BASE_ENV) return WEB_BASE_ENV
  const host = '127.0.0.1'
  for (let p = 5173; p <= 5190; p += 1) {
    if (await canListen(p, host)) return `http://${host}:${p}`
  }
  return `http://${host}:5173`
}

function startProc(cmd, args, cwd) {
  const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: process.env, shell: process.platform === 'win32' })
  p.stdout.on('data', (d) => process.stdout.write(d))
  p.stderr.on('data', (d) => process.stderr.write(d))
  return p
}

const npmCmd = 'npm'
const pythonCmd = 'python'

async function runSeed() {
  const proc = spawn(pythonCmd, ['backend/tools/seed_api_test_data.py'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  })
  const out = []
  const err = []
  proc.stdout.on('data', (d) => out.push(d))
  proc.stderr.on('data', (d) => err.push(d))
  const code = await new Promise((resolve) => proc.on('close', resolve))
  if (code !== 0) throw new Error(Buffer.concat(err).toString('utf8').slice(0, 2000))
  return JSON.parse(Buffer.concat(out).toString('utf8'))
}

async function runPlaywright(seed, webBase) {
  const env = {
    ...process.env,
    E2E_API_BASE: API_BASE,
    E2E_BASE_URL: webBase,
    E2E_ADMIN_PHONE: seed.admin.phone,
    E2E_ADMIN_PASSWORD: seed.admin.password
  }
  const proc = spawn(npmCmd, ['exec', '--', 'playwright', 'test', '--config', 'playwright.config.ts', '--workers=3'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32'
  })
  const code = await new Promise((resolve) => proc.on('close', resolve))
  return Number(code || 0)
}

async function main() {
  await ensureDir(OUT_DIR)
  const seed = await runSeed()
  await fs.writeFile(path.join(OUT_DIR, 'seed.json'), JSON.stringify(seed, null, 2), 'utf8')

  const webBase = await pickWebBase()

  const backend = startProc(pythonCmd, ['backend/app/main.py'], ROOT)
  const webUrl = new URL(webBase)
  const frontend = startProc(
    npmCmd,
    ['exec', '--', 'vite', '--host', webUrl.hostname, '--port', String(Number(webUrl.port) || 5173), '--strictPort'],
    FRONTEND_DIR
  )

  const okApi = await waitHttpOk(`${API_BASE}/api/product/list`, 80_000)
  const okWeb = await waitHttpOk(`${webBase}/`, 80_000)
  if (!okApi || !okWeb) {
    try {
      backend.kill()
      frontend.kill()
    } catch {}
    throw new Error('server not ready')
  }

  const exitCode = await runPlaywright(seed, webBase)

  try {
    backend.kill()
    frontend.kill()
  } catch {}

  const reportProc = spawn('node', ['tools/e2e-shopping/generate_report.mjs'], { cwd: ROOT, stdio: 'inherit' })
  const reportCode = await new Promise((resolve) => reportProc.on('close', resolve))
  if (reportCode !== 0) process.exit(1)
  process.exit(exitCode)
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`)
  process.exit(1)
})

