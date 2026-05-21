const SEEN_KEY = 'cover_seen_v1'
const SESSION_KEY = 'cover_session_v1'
const ALWAYS_KEY = 'cover_show_always_v1'

function genSessionId() {
  try {
    const arr = new Uint32Array(4)
    crypto.getRandomValues(arr)
    return Array.from(arr)
      .map((x) => x.toString(16).padStart(8, '0'))
      .join('')
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

export function getCoverSessionId() {
  try {
    const cur = sessionStorage.getItem(SESSION_KEY)
    if (cur) return cur
    const id = genSessionId()
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return 'no-session'
  }
}

export function getCoverAlwaysShow() {
  try {
    const v = localStorage.getItem(ALWAYS_KEY)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

export function setCoverAlwaysShow(v: boolean) {
  try {
    localStorage.setItem(ALWAYS_KEY, v ? '1' : '0')
  } catch {}
}

export function markCoverSeen() {
  try {
    localStorage.setItem(SEEN_KEY, getCoverSessionId())
  } catch {}
}

export function hasSeenCoverInThisSession() {
  try {
    return localStorage.getItem(SEEN_KEY) === getCoverSessionId()
  } catch {
    return false
  }
}

export function shouldRedirectHomeToCover(toPath: string) {
  if (toPath !== '/') return false
  if (!getCoverAlwaysShow()) return false
  return !hasSeenCoverInThisSession()
}
