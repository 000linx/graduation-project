import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = process.cwd()
const DIST_DIR = path.join(ROOT, 'dist')

function shouldCompress(file) {
    const ext = path.extname(file).toLowerCase()
    return ['.js', '.css', '.html', '.json', '.svg', '.txt', '.xml', '.map'].includes(ext)
}

async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const ent of entries) {
        const abs = path.join(dir, ent.name)
        if (ent.isDirectory()) {
            yield* walk(abs)
        } else if (ent.isFile()) {
            yield abs
        }
    }
}

async function writeIfMissing(outPath, buf) {
    try {
        await fs.access(outPath)
        return false
    } catch {
    }
    await fs.writeFile(outPath, buf)
    return true
}

async function main() {
    const created = { gz: 0, br: 0 }
    for await (const abs of walk(DIST_DIR)) {
        if (!shouldCompress(abs)) continue
        if (abs.endsWith('.gz') || abs.endsWith('.br')) continue

        const raw = await fs.readFile(abs)
        if (!raw || raw.length < 1024) continue

        const gz = zlib.gzipSync(raw, { level: 9 })
        const br = zlib.brotliCompressSync(raw, {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
        })

        if (await writeIfMissing(`${abs}.gz`, gz)) created.gz += 1
        if (await writeIfMissing(`${abs}.br`, br)) created.br += 1
    }

    process.stdout.write(`compressed: gz=${created.gz} br=${created.br}\n`)
}

main().catch((e) => {
    process.stderr.write(`${e?.stack ?? e}\n`)
    process.exit(1)
})

