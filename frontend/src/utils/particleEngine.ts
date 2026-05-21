import type { CoverMode } from '@/stores/cover'
import {
  PARTICLE_SPEED_SCALE,
  computeEllipseBounds,
  ellipseNormalAt,
  ellipseValue,
  particleDiameterPx,
  projectToEllipseBoundary
} from '@/utils/particleMath'

export type ParticleEngineOptions = {
  mode: CoverMode
  reduceMotion: boolean
  particleScale?: number
  onPerfReduced?: (msg: string) => void
  onPerfRestored?: () => void
}

type P = {
  x: number
  y: number
  vx: number
  vy: number
  bx: number
  by: number
  tx?: number
  ty?: number
  wa: number
  ws: number
  wt: number
}

type PointerState = {
  active: boolean
  x: number
  y: number
  down: boolean
  downX: number
  downY: number
  lastMoveTs: number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function rand(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function desiredCount(w: number, h: number) {
  const area = w * h
  const base = Math.round(area / 5200)
  const max = w < 520 ? 2200 : 7600
  return clamp(base, 900, max)
}

export function createParticleEngine(canvas: HTMLCanvasElement, opts: ParticleEngineOptions) {
  const pointer: PointerState = {
    active: false,
    x: 0,
    y: 0,
    down: false,
    downX: 0,
    downY: 0,
    lastMoveTs: 0
  }

  const particles: P[] = []
  let dprCap = 2
  let width = 1
  let height = 1
  let mode: CoverMode = opts.mode
  let reduceMotion = Boolean(opts.reduceMotion)
  let particleScale = typeof opts.particleScale === 'number' ? opts.particleScale : 1
  let rafId = 0
  let lastTs = 0
  let resizeObs: ResizeObserver | null = null

  let fpsSamples: number[] = []
  let fpsLowSince = 0
  let perfReduced = false
  const debug = typeof location !== 'undefined' && /(^|[?&])particleDebug=1(&|$)/.test(location.search)
  let lastDebugTs = 0
  let sprite: HTMLCanvasElement | null = null
  let spriteD = 0

  function dpr() {
    return Math.min(dprCap, Math.max(1, window.devicePixelRatio || 1))
  }

  function particleDiameter() {
    return particleDiameterPx(particleScale)
  }

  function ensureSprite() {
    const d = particleDiameter()
    if (sprite && Math.abs(spriteD - d) < 0.001) return
    spriteD = d
    const dpi = dpr()
    const px = Math.max(2, Math.ceil(d * dpi))
    const off = document.createElement('canvas')
    off.width = px
    off.height = px
    const ctx = off.getContext('2d')
    if (!ctx) {
      sprite = null
      return
    }
    ctx.clearRect(0, 0, px, px)
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0)
    ctx.fillStyle = 'rgba(238,242,255,0.78)'
    ctx.beginPath()
    ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2)
    ctx.fill()
    sprite = off
  }

  function newWander(i: number) {
    const a = rand(i + 9001) * Math.PI * 2
    const sp = (8 + rand(i + 9002) * 22) * PARTICLE_SPEED_SCALE
    const t = 0.45 + rand(i + 9003) * 1.05
    return { wa: a, ws: sp, wt: t }
  }

  function resetParticles(count: number) {
    ensureSprite()
    const r = particleDiameter() / 2
    const e = computeEllipseBounds(width, height, r)
    particles.length = 0
    for (let i = 0; i < count; i++) {
      const rx = rand(i + 1)
      const ry = rand(i + 101)
      const ang = rx * Math.PI * 2
      const r = Math.sqrt(ry) * 0.98
      const x = e.h + Math.cos(ang) * e.a * r
      const y = e.k + Math.sin(ang) * e.b * r
      const w = newWander(i)
      const vx = (rand(i + 301) - 0.5) * 6 * PARTICLE_SPEED_SCALE
      const vy = (rand(i + 401) - 0.5) * 6 * PARTICLE_SPEED_SCALE
      particles.push({ x, y, vx, vy, bx: x, by: y, wa: w.wa, ws: w.ws, wt: w.wt })
    }
  }

  function setTargetsFromText(text: string) {
    const w = width
    const h = height
    if (!w || !h) return

    const boxW = clamp(Math.floor(Math.min(w * 0.66, 760)), 360, 760)
    const boxH = clamp(Math.floor(boxW * 0.28), 120, 240)
    const off = document.createElement('canvas')
    off.width = boxW
    off.height = boxH
    const ctx = off.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.clearRect(0, 0, boxW, boxH)
    const fontSize = clamp(Math.floor(boxH * 0.76), 56, 160)
    ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, boxW / 2, boxH / 2)

    const img = ctx.getImageData(0, 0, boxW, boxH)
    const pts: { x: number; y: number }[] = []
    const step = w < 520 ? 5 : 4
    for (let y = 0; y < boxH; y += step) {
      for (let x = 0; x < boxW; x += step) {
        const idx = (y * boxW + x) * 4 + 3
        if (img.data[idx] > 18) pts.push({ x, y })
      }
    }
    if (!pts.length) return

    const ox = Math.floor(w / 2 - boxW / 2)
    const oy = Math.floor(h / 2 - boxH / 2)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const t = pts[Math.floor((i / particles.length) * pts.length) % pts.length]
      p.tx = ox + t.x
      p.ty = oy + t.y
    }
  }

  function scheduleTargets() {
    if (mode !== 'gather') return
    setTargetsFromText('MALL')
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    const dpi = dpr()
    canvas.width = Math.floor(width * dpi)
    canvas.height = Math.floor(height * dpi)

    ensureSprite()
    if (!particles.length) resetParticles(desiredCount(width, height))
    const r = particleDiameter() / 2
    const e = computeEllipseBounds(width, height, r)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const v = ellipseValue(p.x, p.y, e)
      if (v > 1) {
        const pr = projectToEllipseBoundary(p.x, p.y, e)
        p.x = pr.x
        p.y = pr.y
      }
    }
    scheduleTargets()
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = e.clientX - rect.left
    pointer.y = e.clientY - rect.top
    pointer.active = true
    pointer.lastMoveTs = Date.now()
  }

  function onPointerDown(e: PointerEvent) {
    onPointerMove(e)
    pointer.down = true
    pointer.downX = pointer.x
    pointer.downY = pointer.y
    if (mode === 'scatter' && !reduceMotion) {
      const r = Math.min(width, height) * 0.18
      const r2 = r * r
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = p.x - pointer.downX
        const dy = p.y - pointer.downY
        const d2 = dx * dx + dy * dy
        if (d2 > r2) continue
        const d = Math.max(8, Math.sqrt(d2))
        const s = (1 - d / r) * 7.2 * PARTICLE_SPEED_SCALE
        p.vx += (dx / d) * s
        p.vy += (dy / d) * s
      }
    }
  }

  function onPointerUp() {
    pointer.down = false
  }

  function onPointerLeave() {
    pointer.active = false
    pointer.down = false
  }

  function tick(ts: number) {
    rafId = requestAnimationFrame(tick)
    if (!lastTs) lastTs = ts
    const dt = clamp((ts - lastTs) / 1000, 0.008, 0.034)
    lastTs = ts

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpi = dpr()
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const now = Date.now()
    const movedRecently = now - pointer.lastMoveTs < 650
    const followActive = mode === 'follow' && pointer.active && movedRecently && !reduceMotion

    const w = width
    const h = height
    const cx = w / 2
    const cy = h / 2
    ensureSprite()
    const r = particleDiameter() / 2
    const e = computeEllipseBounds(w, h, r)
    const gather = mode === 'gather'
    const damp = gather ? (reduceMotion ? 0.86 : 0.82) : reduceMotion ? 0.9 : 0.88
    const springK = gather ? (reduceMotion ? 3.2 : 4.6) : 0
    const steerK = reduceMotion ? 2.2 : 3.4

    const fr = followActive ? Math.min(w, h) * 0.22 : 0
    const fr2 = fr * fr
    const bounce = 0.82

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      let ax = 0
      let ay = 0

      if (gather && typeof p.tx === 'number' && typeof p.ty === 'number') {
        ax += (p.tx - p.x) * springK
        ay += (p.ty - p.y) * springK
      } else {
        p.wt -= dt
        if (p.wt <= 0) {
          const w2 = newWander(i + Math.floor(ts))
          p.wa = w2.wa
          p.ws = w2.ws
          p.wt = w2.wt
        }
        const dvx = Math.cos(p.wa) * p.ws - p.vx
        const dvy = Math.sin(p.wa) * p.ws - p.vy
        ax += dvx * steerK
        ay += dvy * steerK
      }

      if (followActive) {
        const dx = pointer.x - p.x
        const dy = pointer.y - p.y
        const d2 = dx * dx + dy * dy
        if (d2 < fr2) {
          const d = Math.max(10, Math.sqrt(d2))
          const s = (1 - d / fr) * 10.2 * PARTICLE_SPEED_SCALE
          ax += (dx / d) * s
          ay += (dy / d) * s
        }
      }

      p.vx = (p.vx + ax * dt) * damp
      p.vy = (p.vy + ay * dt) * damp
      p.x += p.vx
      p.y += p.vy

      const v = ellipseValue(p.x, p.y, e)
      if (v > 1) {
        const pr = projectToEllipseBoundary(p.x, p.y, e)
        const n = ellipseNormalAt(pr.x, pr.y, e)
        const dot = p.vx * n.nx + p.vy * n.ny
        if (dot > 0) {
          p.vx = (p.vx - 2 * dot * n.nx) * bounce
          p.vy = (p.vy - 2 * dot * n.ny) * bounce
        }
        p.x = pr.x
        p.y = pr.y
      }
    }

    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.62)
    grad.addColorStop(0, 'rgba(91,140,255,0.10)')
    grad.addColorStop(0.55, 'rgba(0,245,255,0.06)')
    grad.addColorStop(1, 'rgba(7,10,18,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    if (sprite) {
      const d = particleDiameter()
      const ox = d / 2
      const oy = d / 2
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        ctx.drawImage(sprite, p.x - ox, p.y - oy, d, d)
      }
    }

    if (!reduceMotion) {
      ctx.strokeStyle = 'rgba(0,245,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      const step = w < 520 ? 3 : 2
      for (let i = 0; i < particles.length; i += step) {
        const a = particles[i]
        const b = particles[(i + 11) % particles.length]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 > 5200) continue
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }
      ctx.stroke()
    }

    if (debug) {
      ctx.save()
      ctx.strokeStyle = 'rgba(0,245,255,0.22)'
      ctx.lineWidth = 2
      ctx.fillStyle = 'rgba(0,245,255,0.04)'
      ctx.beginPath()
      ctx.ellipse(e.h, e.k, e.a, e.b, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    if (debug && now - lastDebugTs > 1500) {
      lastDebugTs = now
      let out = 0
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (ellipseValue(p.x, p.y, e) > 1.0004) out++
      }
      const avg = fpsSamples.length ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length : 0
      if (out) console.warn('[particles] out-of-ellipse:', out, 'ellipse=', e, 'avgFps=', avg.toFixed(1))
      else console.log('[particles] OK', 'count=', particles.length, 'ellipse=', e, 'avgFps=', avg.toFixed(1))
    }

    const fps = 1 / dt
    fpsSamples.push(fps)
    if (fpsSamples.length > 50) fpsSamples.shift()
    const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length

    if (reduceMotion) {
      fpsLowSince = 0
      if (perfReduced) {
        perfReduced = false
        opts.onPerfRestored?.()
      }
      return
    }

    if (avg < 55) {
      if (!fpsLowSince) fpsLowSince = now
      const lowFor = now - fpsLowSince
      if (lowFor > 1400 && !perfReduced) {
        perfReduced = true
        const next = Math.max(700, Math.floor(particles.length * 0.78))
        resetParticles(next)
        if (dprCap > 1.25) dprCap = 1.25
        resize()
        opts.onPerfReduced?.('已自动降低粒子数量以保持流畅')
      }
    } else {
      fpsLowSince = 0
      if (perfReduced && avg > 58) {
        perfReduced = false
        opts.onPerfRestored?.()
      }
    }
  }

  function start() {
    resizeObs = new ResizeObserver(() => resize())
    resizeObs.observe(canvas)
    canvas.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true })
    resize()
    rafId = requestAnimationFrame(tick)
  }

  function destroy() {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('pointerup', onPointerUp)
    if (resizeObs) resizeObs.unobserve(canvas)
    resizeObs = null
    cancelAnimationFrame(rafId)
  }

  function setMode(next: CoverMode) {
    mode = next
    scheduleTargets()
  }

  function setReduceMotion(v: boolean) {
    reduceMotion = Boolean(v)
  }

  function setParticleScale(v: number) {
    const next = Number.isFinite(v) ? v : 1
    particleScale = Math.min(5, Math.max(0.1, next))
    ensureSprite()
    resize()
  }

  start()
  return { destroy, setMode, setReduceMotion, setParticleScale, resize }
}
