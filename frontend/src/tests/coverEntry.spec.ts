import { describe, expect, it, beforeEach } from 'vitest'
import { getCoverSessionId, setCoverAlwaysShow, shouldRedirectHomeToCover } from '@/utils/coverEntry'

describe('cover entry redirect', () => {
    beforeEach(() => {
        sessionStorage.clear()
        localStorage.clear()
    })

    it('redirects home to cover when not seen', () => {
        expect(shouldRedirectHomeToCover('/')).toBe(true)
    })

    it('does not redirect when seen', () => {
        localStorage.setItem('cover_seen_v1', getCoverSessionId())
        expect(shouldRedirectHomeToCover('/')).toBe(false)
    })

    it('does not redirect when disabled', () => {
        setCoverAlwaysShow(false)
        expect(shouldRedirectHomeToCover('/')).toBe(false)
    })

    it('does not redirect non-home routes', () => {
        expect(shouldRedirectHomeToCover('/login')).toBe(false)
        expect(shouldRedirectHomeToCover('/cover')).toBe(false)
    })
})

