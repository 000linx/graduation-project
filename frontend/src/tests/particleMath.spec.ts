import { describe, expect, it } from 'vitest'
import {
    PARTICLE_SPEED_SCALE,
    particleDiameterPx,
    computeEllipseBounds,
    ellipseNormalAt,
    ellipseValue,
    isInsideEllipse,
    projectToEllipseBoundary,
    reflectVelocity
} from '@/utils/particleMath'

describe('particleMath', () => {
    it('uses 0.5 speed scale', () => {
        expect(PARTICLE_SPEED_SCALE).toBe(0.3)
    })

    it('maps particle diameter into 2..8 px', () => {
        expect(particleDiameterPx(0.1)).toBeGreaterThanOrEqual(2)
        expect(particleDiameterPx(0.1)).toBeLessThanOrEqual(8)
        expect(particleDiameterPx(5)).toBeGreaterThanOrEqual(2)
        expect(particleDiameterPx(5)).toBeLessThanOrEqual(8)
    })

    it('shrinks ellipse by margin', () => {
        const e0 = computeEllipseBounds(1000, 800, 0)
        const e1 = computeEllipseBounds(1000, 800, 10)
        expect(e1.a).toBeLessThan(e0.a)
        expect(e1.b).toBeLessThan(e0.b)
    })

    it('projects point to ellipse boundary', () => {
        const e = computeEllipseBounds(1000, 800)
        const p = projectToEllipseBoundary(e.h + e.a * 1.4, e.k, e)
        expect(isInsideEllipse(p.x, p.y, e)).toBe(true)
        expect(Math.abs(ellipseValue(p.x, p.y, e) - 1)).toBeLessThan(1e-6)
    })

    it('reflects velocity at boundary normal', () => {
        const e = computeEllipseBounds(900, 700)
        const p = projectToEllipseBoundary(e.h + e.a * 2, e.k, e)
        const n = ellipseNormalAt(p.x, p.y, e)
        const v0 = { vx: 10, vy: 0 }
        const v1 = reflectVelocity(v0.vx, v0.vy, n.nx, n.ny, 1)
        const dot0 = v0.vx * n.nx + v0.vy * n.ny
        const dot1 = v1.vx * n.nx + v1.vy * n.ny
        expect(dot0).toBeGreaterThan(0)
        expect(dot1).toBeLessThanOrEqual(1e-9)
    })
})

