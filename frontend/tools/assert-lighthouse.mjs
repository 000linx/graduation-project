import fs from 'node:fs'
import path from 'node:path'

const reportPath = process.argv[2] || 'lighthouse-report.json'

const abs = path.resolve(process.cwd(), reportPath)
const raw = fs.readFileSync(abs, 'utf8')
const r = JSON.parse(raw)

const c = r?.categories || {}

const scores = {
    performance: Number(c?.performance?.score ?? NaN),
    accessibility: Number(c?.accessibility?.score ?? NaN),
    bestPractices: Number(c?.['best-practices']?.score ?? NaN),
    seo: Number(c?.seo?.score ?? NaN)
}

const mins = {
    performance: Number(process.env.LH_MIN_PERFORMANCE ?? 0.9),
    accessibility: Number(process.env.LH_MIN_ACCESSIBILITY ?? 0.9),
    bestPractices: Number(process.env.LH_MIN_BEST_PRACTICES ?? 0.9),
    seo: Number(process.env.LH_MIN_SEO ?? 0.9)
}

for (const k of Object.keys(scores)) {
    if (!Number.isFinite(scores[k])) {
        console.error(`Invalid Lighthouse score: ${k}=${scores[k]}`)
        process.exit(2)
    }
}

fs.writeFileSync('lh-scores.json', JSON.stringify(scores, null, 2))

const failed = Object.keys(mins).filter((k) => scores[k] < mins[k])
if (failed.length) {
    console.error(`Lighthouse thresholds not met: ${failed.map((k) => `${k} ${scores[k]} < ${mins[k]}`).join(', ')}`)
    process.exit(1)
}

process.stdout.write(JSON.stringify(scores) + '\n')
