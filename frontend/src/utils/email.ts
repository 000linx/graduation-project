export type EmailValidationResult = {
    ok: boolean
    reason:
    | 'empty'
    | 'missing_at'
    | 'bad_local'
    | 'bad_domain'
    | 'bad_tld'
    | 'too_long'
    | 'ok'
}

function isAscii(s: string) {
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7f) return false
    }
    return true
}

function isValidDomainLabel(label: string) {
    if (!label) return false
    if (label.length > 63) return false
    if (label.startsWith('-') || label.endsWith('-')) return false
    if (label.includes('..')) return false
    const re = /^[a-z0-9\u00a1-\uffff-]+$/iu
    return re.test(label)
}

export function validateEmail(raw: string): EmailValidationResult {
    const v = String(raw ?? '').trim()
    if (!v) return { ok: false, reason: 'empty' }
    if (v.length > 254) return { ok: false, reason: 'too_long' }
    if (v.includes(' ')) return { ok: false, reason: 'bad_local' }

    const at = v.lastIndexOf('@')
    if (at <= 0 || at !== v.indexOf('@') || at === v.length - 1) return { ok: false, reason: 'missing_at' }

    const local = v.slice(0, at)
    const domain = v.slice(at + 1)

    if (!local || local.length > 64) return { ok: false, reason: 'bad_local' }
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return { ok: false, reason: 'bad_local' }

    const localAllowed = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i
    if (!localAllowed.test(local)) return { ok: false, reason: 'bad_local' }

    if (!domain || domain.length > 253) return { ok: false, reason: 'bad_domain' }
    if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return { ok: false, reason: 'bad_domain' }
    if (isAscii(domain) && domain.includes('_')) return { ok: false, reason: 'bad_domain' }

    const labels = domain.split('.')
    if (labels.length < 2) return { ok: false, reason: 'bad_domain' }
    if (!labels.every(isValidDomainLabel)) return { ok: false, reason: 'bad_domain' }

    const tld = labels[labels.length - 1]
    if (tld.length < 2) return { ok: false, reason: 'bad_tld' }
    if (!/^[a-z0-9\u00a1-\uffff-]+$/iu.test(tld)) return { ok: false, reason: 'bad_tld' }

    return { ok: true, reason: 'ok' }
}

