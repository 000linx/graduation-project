export type EllipseBounds = {
  h: number
  k: number
  a: number
  b: number
}

export const PARTICLE_SPEED_SCALE = 0.3

export const PARTICLE_DIAMETER_PX_MIN = 2
export const PARTICLE_DIAMETER_PX_MAX = 8
const BASE_DIAMETER_PX = 3.2

export function particleDiameterPx(scale: number) {
  const s = Number.isFinite(scale) ? scale : 1
  const v = BASE_DIAMETER_PX * s
  return Math.min(PARTICLE_DIAMETER_PX_MAX, Math.max(PARTICLE_DIAMETER_PX_MIN, v))
}

export function computeEllipseBounds(width: number, height: number, marginPx = 0): EllipseBounds {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const cx = w / 2
  const cy = h / 2
  const a0 = Math.max(140, w * 0.42)
  const b0 = Math.max(120, h * 0.32)
  const m = Math.max(0, marginPx)
  const a = Math.max(1, a0 - m)
  const b = Math.max(1, b0 - m)
  return { h: cx, k: cy, a, b }
}

export function ellipseValue(x: number, y: number, e: EllipseBounds) {
  const dx = x - e.h
  const dy = y - e.k
  return (dx * dx) / (e.a * e.a) + (dy * dy) / (e.b * e.b)
}

export function isInsideEllipse(x: number, y: number, e: EllipseBounds) {
  return ellipseValue(x, y, e) <= 1
}

export function projectToEllipseBoundary(x: number, y: number, e: EllipseBounds) {
  const dx = x - e.h
  const dy = y - e.k
  const v = ellipseValue(x, y, e)
  if (v <= 1 || v === 0) return { x, y }
  const s = 1 / Math.sqrt(v)
  return { x: e.h + dx * s, y: e.k + dy * s }
}

export function ellipseNormalAt(x: number, y: number, e: EllipseBounds) {
  const dx = x - e.h
  const dy = y - e.k
  const nx = dx / (e.a * e.a)
  const ny = dy / (e.b * e.b)
  const len = Math.hypot(nx, ny) || 1
  return { nx: nx / len, ny: ny / len }
}

export function reflectVelocity(vx: number, vy: number, nx: number, ny: number, bounce = 1) {
  const dot = vx * nx + vy * ny
  const rvx = (vx - 2 * dot * nx) * bounce
  const rvy = (vy - 2 * dot * ny) * bounce
  return { vx: rvx, vy: rvy }
}
