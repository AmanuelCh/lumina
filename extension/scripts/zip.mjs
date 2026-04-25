/**
 * Creates store-ready zip files with POSIX (forward-slash) paths.
 * Usage: node scripts/zip.mjs
 * Outputs: lumina-chrome.zip and lumina-firefox.zip at the extension root.
 */
import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Minimal ZIP writer — no external deps, forward-slash paths only.
function uint16LE(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b }
function uint32LE(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b }

function dosDateTime(date) {
  const d = date ?? new Date()
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  return { dosDate, dosTime }
}

function crc32(buf) {
  const table = crc32.table ??= (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      t[i] = c
    }
    return t
  })()
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function collectFiles(dir, base = '') {
  const entries = []
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name)
    const rel = base ? `${base}/${name}` : name  // always forward slash
    if (fs.statSync(abs).isDirectory()) {
      entries.push(...collectFiles(abs, rel))
    } else {
      entries.push({ abs, rel })
    }
  }
  return entries
}

function buildZip(srcDir) {
  const files = collectFiles(srcDir)
  const parts = []
  const central = []
  let offset = 0

  for (const { abs, rel } of files) {
    const data = fs.readFileSync(abs)
    const compressed = zlib.deflateRawSync(data, { level: 9 })
    const usesDeflate = compressed.length < data.length
    const body = usesDeflate ? compressed : data
    const method = usesDeflate ? 8 : 0
    const crc = crc32(data)
    const nameBytes = Buffer.from(rel, 'utf8')
    const { dosDate, dosTime } = dosDateTime(fs.statSync(abs).mtime)

    // Local file header
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),  // signature
      uint16LE(20),           // version needed
      uint16LE(0),            // flags
      uint16LE(method),
      uint16LE(dosTime),
      uint16LE(dosDate),
      uint32LE(crc),
      uint32LE(body.length),
      uint32LE(data.length),
      uint16LE(nameBytes.length),
      uint16LE(0),            // extra length
      nameBytes,
    ])

    parts.push(local, body)

    // Central directory entry
    central.push(Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x01, 0x02]),  // signature
      uint16LE(20),           // version made by
      uint16LE(20),           // version needed
      uint16LE(0),            // flags
      uint16LE(method),
      uint16LE(dosTime),
      uint16LE(dosDate),
      uint32LE(crc),
      uint32LE(body.length),
      uint32LE(data.length),
      uint16LE(nameBytes.length),
      uint16LE(0),            // extra
      uint16LE(0),            // comment
      uint16LE(0),            // disk start
      uint16LE(0),            // internal attrs
      uint32LE(0),            // external attrs
      uint32LE(offset),
      nameBytes,
    ]))

    offset += local.length + body.length
  }

  const centralBuf = Buffer.concat(central)
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]),  // signature
    uint16LE(0), uint16LE(0),
    uint16LE(central.length),
    uint16LE(central.length),
    uint32LE(centralBuf.length),
    uint32LE(offset),
    uint16LE(0),
  ])

  return Buffer.concat([...parts, centralBuf, eocd])
}

for (const [srcDir, outFile] of [
  ['dist',         'lumina-chrome.zip'],
  ['dist-firefox', 'lumina-firefox.zip'],
]) {
  const src = path.join(root, srcDir)
  if (!fs.existsSync(src)) { console.warn(`Skipping ${srcDir} (not built)`); continue }
  const zip = buildZip(src)
  const out = path.join(root, outFile)
  fs.writeFileSync(out, zip)
  console.log(`✓ ${outFile}  (${(zip.length / 1024).toFixed(1)} KB,  ${collectFiles(src).length} files)`)
}
