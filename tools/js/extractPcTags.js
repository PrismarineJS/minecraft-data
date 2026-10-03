// Extracts vanilla tags from the official server jar into data/pc/<version>/tags.json.
// Tags are datapack JSON inside every jar since 1.13, so no generator or mappings are needed.
//
// Usage: node extractPcTags.js <version> [<version> ...]
//        node extractPcTags.js --all            (every pc release in dataPaths from 1.13 on)
//
// Output follows schemas/tags_schema.json: namespaced registry keys, namespaced tag keys,
// resolved namespaced members, everything sorted, empty registries omitted. Versions whose
// output is identical to the previous version reuse its directory in dataPaths, like other data.
const fs = require('fs')
const os = require('os')
const path = require('path')
const https = require('https')
const zlib = require('zlib')
const crypto = require('crypto')

const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
const jarCache = process.env.MCDATA_JAR_CACHE || path.join(os.tmpdir(), 'minecraft-data-server-jars')
const dataDir = path.join(__dirname, '../../data')
const dataPathsFile = path.join(dataDir, 'dataPaths.json')
const dataPaths = JSON.parse(fs.readFileSync(dataPathsFile, 'utf8'))

// Registry folders were plural before 1.21; the registry keys are the modern singular names.
const PLURAL = { blocks: 'block', items: 'item', fluids: 'fluid', entity_types: 'entity_type', game_events: 'game_event', functions: 'function' }

function get (url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location).then(resolve, reject)
      if (res.statusCode !== 200) return reject(new Error(`${res.statusCode} ${url}`))
      const chunks = []
      res.on('data', c => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks))).on('error', reject)
    }).on('error', reject)
  })
}

const sha1 = buf => crypto.createHash('sha1').update(buf).digest('hex')
let manifest

async function serverJar (version) {
  manifest = manifest || JSON.parse(await get(MANIFEST)).versions
  const entry = manifest.find(v => v.id === version)
  if (!entry) throw new Error(`${version} is not in the Mojang version manifest`)
  const download = JSON.parse(await get(entry.url)).downloads.server
  if (!download) throw new Error(`${version} has no server download`)
  const file = path.join(jarCache, `minecraft_server.${version}.jar`)
  if (fs.existsSync(file)) {
    const cached = fs.readFileSync(file)
    if (sha1(cached) === download.sha1) return cached
  }
  console.log(`downloading ${version} server jar (${(download.size / 1048576).toFixed(0)} MB)`)
  const buf = await get(download.url)
  if (sha1(buf) !== download.sha1) throw new Error(`${version} server jar sha1 mismatch`)
  fs.mkdirSync(jarCache, { recursive: true })
  fs.writeFileSync(file, buf)
  return buf
}

// Minimal zip reader: central directory plus stored/deflated entries, which is all a jar uses.
function readZip (buf) {
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('not a zip file')
  const count = buf.readUInt16LE(eocd + 10)
  let offset = buf.readUInt32LE(eocd + 16)
  const entries = new Map()
  for (let i = 0; i < count; i++) {
    const nameLength = buf.readUInt16LE(offset + 28)
    entries.set(buf.toString('utf8', offset + 46, offset + 46 + nameLength), {
      method: buf.readUInt16LE(offset + 10),
      size: buf.readUInt32LE(offset + 20),
      local: buf.readUInt32LE(offset + 42)
    })
    offset += 46 + nameLength + buf.readUInt16LE(offset + 30) + buf.readUInt16LE(offset + 32)
  }
  const read = name => {
    const e = entries.get(name)
    const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28)
    const data = buf.subarray(start, start + e.size)
    return e.method === 8 ? zlib.inflateRawSync(data) : data
  }
  // newer server jars are bundlers wrapping the real server jar
  const inner = [...entries.keys()].find(n => /^META-INF\/versions\/[^/]+\/server-[^/]+\.jar$/.test(n))
  return inner ? readZip(read(inner)) : { names: [...entries.keys()], read }
}

function extractTags (jar) {
  const raw = {}
  for (const name of jar.names) {
    const m = /^data\/minecraft\/tags\/(.+)\.json$/.exec(name)
    if (!m) continue
    const parts = m[1].split('/')
    // only worldgen registries have path-shaped names; every other registry is one segment
    const depth = parts[0] === 'worldgen' ? 2 : 1
    const registry = PLURAL[parts[0]] || parts.slice(0, depth).join('/')
    raw[registry] = raw[registry] || {}
    raw[registry][parts.slice(depth).join('/')] = JSON.parse(jar.read(name)).values || []
  }
  const out = {}
  for (const registry of Object.keys(raw).sort()) {
    const tags = raw[registry]
    const resolved = {}
    const resolve = (tag, stack) => {
      if (resolved[tag]) return resolved[tag]
      if (stack.includes(tag)) return []
      const members = new Set()
      for (const value of tags[tag] || []) {
        const id = typeof value === 'string' ? value : value.id
        if (id.startsWith('#')) resolve(id.slice(1).replace(/^minecraft:/, ''), [...stack, tag]).forEach(x => members.add(x))
        else members.add(id.includes(':') ? id : `minecraft:${id}`)
      }
      resolved[tag] = [...members].sort()
      return resolved[tag]
    }
    const tagMap = {}
    for (const tag of Object.keys(tags).sort()) tagMap[`minecraft:${tag}`] = resolve(tag, [])
    if (Object.keys(tagMap).length) out[`minecraft:${registry}`] = tagMap
  }
  return out
}

function compareVersions (a, b) {
  const ka = a.split('.').map(n => parseInt(n, 10) || 0)
  const kb = b.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const d = (ka[i] || 0) - (kb[i] || 0)
    if (d) return d
  }
  return 0
}

async function main () {
  const args = process.argv.slice(2)
  if (!args.length) {
    console.log('Usage: node extractPcTags.js <version> [<version> ...] | --all')
    process.exit(1)
  }
  // releases and their pre/rc aliases from 1.13 on; weekly snapshots alias unrelated block data and are skipped
  const all = Object.keys(dataPaths.pc).filter(v => /^\d+\.\d+/.test(v) && compareVersions(v, '1.13') >= 0).sort(compareVersions)
  const wanted = args.includes('--all') ? all : args
  for (const version of wanted) if (!dataPaths.pc[version]) throw new Error(`${version} is not a pc version in dataPaths`)

  let previous = null
  for (const version of all) {
    const paths = dataPaths.pc[version]
    if (!wanted.includes(version)) {
      // an untouched version with tags data stays the reference for the next version's dedupe
      if (paths.tags) previous = { version, dir: paths.tags, json: fs.readFileSync(path.join(dataDir, paths.tags, 'tags.json'), 'utf8') }
      continue
    }
    let jar
    try {
      jar = await serverJar(version)
    } catch (err) {
      if (!args.includes('--all')) throw err
      console.warn(`${version}: skipped (${err.message})`)
      continue
    }
    const tags = extractTags(readZip(jar))
    if (!Object.keys(tags).length) {
      console.warn(`${version}: no tags in jar, skipped`)
      continue
    }
    const json = JSON.stringify(tags, null, 2)
    if (previous && previous.json === json) {
      paths.tags = previous.dir
      console.log(`${version}: identical to ${previous.version}, reusing ${previous.dir}`)
      continue
    }
    const dir = fs.existsSync(path.join(dataDir, 'pc', version)) ? `pc/${version}` : paths.blocks
    fs.writeFileSync(path.join(dataDir, dir, 'tags.json'), json)
    paths.tags = dir
    previous = { version, dir, json }
    console.log(`${version}: ${dir}/tags.json  ${Object.entries(tags).map(([r, t]) => `${r.slice(10)}=${Object.keys(t).length}`).join(' ')}`)
  }
  // mirror the existing file's line endings and trailing-newline state so the diff is only the added keys
  const original = fs.readFileSync(dataPathsFile)
  let text = JSON.stringify(dataPaths, null, 2) + (original[original.length - 1] === 10 ? '\n' : '')
  if (original.includes('\r\n')) text = text.replace(/\n/g, '\r\n')
  fs.writeFileSync(dataPathsFile, text)
}

main().catch(err => { console.error(err.message); process.exit(1) })
