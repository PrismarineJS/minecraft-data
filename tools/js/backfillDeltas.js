/**
 * One-time migration: converts full per-version proto.yml files into !base
 * deltas (see protoDelta.js).
 *
 * For each consecutive pair of protocol versions (in dataPaths.json order),
 * diffs their proto.yml at the type level and emits a minimal delta for the
 * newer version. Before keeping anything it compiles each delta chain and
 * verifies the result is deep-equal to the previously committed protocol.json
 * (the golden check: key *order* may differ since added types are appended,
 * which is not semantically meaningful, but content must match exactly).
 *
 * Usage:
 *   node backfillDeltas.js [edition]        # dry run (default: pc)
 *   node backfillDeltas.js [edition] --write
 * After --write, run `npm run build` to regenerate the protocol.json files in
 * the new key order.
 */
const fs = require('fs')
const { join } = require('path')
const { compile } = require('protodef-yaml')
const { parseProto, splitSectionEntries, resolve, entryValue } = require('./protoDelta')

const DATA = join(__dirname, '../../data')
const DELETE = '!delete'

// Mirror compileProtocol.js: decimal mapper keys are rendered as hex
function visitor (key, value) {
  if ((key === 'packet') && (value?.[1]?.[0]?.name === 'name')) {
    const mapper = value[1][0].type[1].mappings
    for (const k in mapper) {
      if (k.startsWith('0x')) continue
      mapper['0x' + Number(k).toString(16).padStart(2, '0')] = mapper[k]
      delete mapper[k]
    }
  }
  return value
}

// Distinct proto dirs in dataPaths order, with a canonical version id each
function protoChain (edition) {
  const dataPaths = JSON.parse(fs.readFileSync(join(DATA, 'dataPaths.json'), 'utf8'))
  const chain = []
  for (const [versionId, paths] of Object.entries(dataPaths[edition])) {
    if (!paths.proto) continue
    if (chain.length && chain[chain.length - 1].dir === paths.proto) continue
    chain.push({ versionId, dir: paths.proto })
  }
  return chain
}

// Diff two parsed protos into a delta: added/changed types verbatim, removed
// types as `TypeName: !delete`, removed sections as `^section: !delete`
function buildDelta (prevParsed, curParsed) {
  const sections = new Map()
  for (const [key, curSection] of curParsed.sections) {
    const prevSection = prevParsed.sections.get(key)
    const prevEntries = prevSection ? splitSectionEntries(prevSection.body, `${key} (prev)`) : null
    const curEntries = splitSectionEntries(curSection.body, `${key} (cur)`)
    const ops = []
    if (prevEntries) {
      for (const typeKey of prevEntries.keys()) {
        if (!curEntries.has(typeKey)) ops.push({ lines: [`   ${typeKey}: ${DELETE}`] })
      }
    }
    for (const [typeKey, lines] of curEntries) {
      const prev = prevEntries && prevEntries.get(typeKey)
      if (!prev || prev.join('\n') !== lines.join('\n')) ops.push({ lines })
    }
    if (ops.length) sections.set(key, { header: curSection.header, ops })
  }
  for (const key of prevParsed.sections.keys()) {
    if (!curParsed.sections.has(key)) sections.set(key, { header: `${key}: ${DELETE}`, ops: [] })
  }
  if (sections.size === 0) return null // identical protocol: keep the full file
  return sections
}

function renderDelta (version, baseVersion, sections) {
  const lines = [`!version: ${version}`, `!base: ${baseVersion}`]
  for (const section of sections.values()) {
    lines.push('', section.header)
    if (section.header.endsWith(DELETE)) continue
    let first = true
    for (const op of section.ops) {
      if (!first) lines.push('')
      lines.push(...op.lines)
      first = false
    }
  }
  return lines.join('\n') + '\n'
}

function sortKeys (v) {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v).sort()) o[k] = sortKeys(v[k])
    return o
  }
  return v
}

function main () {
  const edition = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'pc'
  const write = process.argv.includes('--write')
  const chain = protoChain(edition)
  console.log(`${edition}: ${chain.length} distinct protocol dirs`)

  let converted = 0
  let failed = 0
  // Full (chain-resolved) text of the previous version's protocol: diffs are
  // always computed against the full previous protocol, never a delta file
  let prevFullText = null
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1]
    const cur = chain[i]
    const curDir = join(DATA, cur.dir)
    const curPath = join(curDir, 'proto.yml')
    const prevPath = join(DATA, prev.dir, 'proto.yml')
    if (prevFullText === null) {
      prevFullText = parseProto(fs.readFileSync(prevPath, 'utf8'), prevPath).directives.has('!base')
        ? resolve(edition, prevPath, DATA).main
        : fs.readFileSync(prevPath, 'utf8')
    }
    const original = fs.readFileSync(curPath, 'utf8')
    const curIsDelta = parseProto(original, curPath).directives.has('!base')
    const curFullText = curIsDelta ? resolve(edition, curPath, DATA).main : original
    const curParsed = parseProto(curFullText, curPath)

    const sections = buildDelta(parseProto(prevFullText, prevPath), curParsed)
    if (!sections) {
      console.log(`= ${cur.versionId}: identical to ${prev.versionId}, keeping full file`)
      prevFullText = curFullText
      continue
    }

    // golden check: write the delta, resolve the chain, compile, compare with
    // the committed protocol.json, then restore unless we are writing
    const versionLine = (curParsed.directives.get('!version') || [])[0] || ''
    const version = entryValue(versionLine.trim())
    if (!version) throw Error(`No !version in ${curPath}`)
    const deltaText = renderDelta(version, prev.versionId, sections)
    fs.writeFileSync(curPath, deltaText)
    let err = null
    let mergedMain = null
    try {
      const files = resolve(edition, curPath, DATA)
      const json = compile(files)
      const goldenPath = join(curDir, 'protocol.json')
      if (fs.existsSync(goldenPath)) {
        const expected = JSON.parse(fs.readFileSync(goldenPath, 'utf8'))
        const actual = JSON.parse(JSON.stringify(json, visitor, 2))
        if (JSON.stringify(sortKeys(actual)) !== JSON.stringify(sortKeys(expected))) {
          err = 'compiled protocol differs from committed protocol.json'
        }
      } // else: unreleased version (pc/latest), nothing committed to compare with
      mergedMain = files.main
    } catch (e) {
      err = e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e.message
    }
    if (err || !write) fs.writeFileSync(curPath, original)
    prevFullText = err ? curFullText : mergedMain

    if (err) {
      failed++
      console.log(`✗ ${cur.versionId}: ${err}`)
      continue
    }
    converted++
    const ops = [...sections.values()].reduce((n, s) => n + s.ops.length, 0)
    console.log(`✓ ${cur.versionId}: delta on ${prev.versionId} (${ops} type ops, ${deltaText.split('\n').length} lines)`)
  }
  console.log(`\n${converted} converted, ${failed} failed${write ? '' : ' (dry run: deltas NOT kept)'}`)
  if (failed) process.exit(1)
}

try { main() } catch (e) { console.error(e); process.exit(1) }
