/**
 * Resolves proto.yml delta chains into a merged, full protocol file set.
 *
 * A delta proto.yml is a normal proto.yml with an additional `!base: <version>`
 * directive. Merge semantics, per section (`^types`, `^play.toClient.types`, ...):
 *   - a type present only in the base is inherited unchanged
 *   - a type present in both is replaced wholesale by the delta's definition
 *     (no deep merge: mapper values and packet IDs are positional, so partial
 *     merges would be unsafe)
 *   - a type present only in the delta is added (appended at the end of the
 *     section; key order in the rendered protocol.json is not semantic)
 *   - `TypeName: !delete` removes the inherited type (error if not inherited)
 *   - a whole section can be removed with `^section: !delete` or added by
 *     simply defining it
 * `!base` refers to a version, resolved through dataPaths.json to the data
 * directory holding that version's proto.yml. Deltas chain recursively; cycles,
 * missing bases and bad deletes are hard errors.
 *
 * The result is a files object (`{ main }`) that can be passed directly to
 * protodef-yaml's parse()/compile() in place of a path. Chain `!import`s are
 * passed through to the merged output; import *files* are not collected, so
 * editions whose protos import from disk (bedrock) must keep full protos for
 * now.
 */
const fs = require('fs')
const { join } = require('path')

const DELETE = '!delete'

// protodef-yaml normalizes tabs to 4 spaces; mirror that so splits see the
// same indentation the compiler sees
function normalize (text) {
  return text.replace(/\r\n/g, '\n').replace(/\t/g, '    ').replace(/[ \t]+$/gm, '')
}

// First key of a yaml-ish line: everything before the first ': ' or a trailing ':'
function entryKey (line) {
  const t = line.trim()
  if (t.endsWith(':')) return t.slice(0, -1)
  return t.split(': ', 1)[0]
}

function entryValue (line) {
  const t = line.trim()
  if (t.endsWith(':')) return ''
  return t.split(': ', 2)[1] || ''
}

// Net bracket depth of a line, ignoring brackets inside string literals. Old
// proto.yml versions embed multiline ProtoDef JSON inside entries; a line
// belongs to the current entry while its depth is open.
function bracketDepth (line) {
  let depth = 0
  let inStr = false
  let esc = false
  for (const c of line) {
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
    } else if (c === '"') inStr = true
    else if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') depth--
  }
  return depth
}

// Split a block of lines into sub-entries at the section's child indentation.
// Returns an ordered map key -> lines[]. Comments at or above the child
// indentation attach to the following entry (the docs convention of proto.yml);
// deeper comments stay inside the entry they follow.
function splitSectionEntries (lines, where) {
  const entries = new Map()
  let childIndent = null
  let pending = []
  let current = null
  let depth = 0
  for (const line of lines) {
    if (line.trim() === '' && depth <= 0) continue
    if (current && depth > 0) { // continuation of a multiline JSON value
      depth += bracketDepth(line)
      current.push(line)
      continue
    }
    const indent = line.length - line.trimStart().length
    const isComment = line.trimStart().startsWith('#')
    if (childIndent === null && !isComment) childIndent = indent
    if (!isComment && indent === childIndent) {
      const key = entryKey(line)
      if (entries.has(key)) throw Error(`Duplicate type '${key}' in ${where}`)
      current = [...pending, line]
      depth = bracketDepth(line)
      pending = []
      entries.set(key, current)
    } else if (current && (indent > childIndent)) {
      current.push(line)
    } else if (current && !isComment) { // indented line above childIndent: malformed
      throw Error(`Unexpected indentation in ${where}: ${line}`)
    } else {
      pending.push(line)
    }
  }
  return entries
}

// Parse a full proto.yml into top-level directives and sections.
// Directives are keyed by directive name (`!version`, `!import:types.yml`, ...);
// sections keep their header line and body lines verbatim.
function parseProto (text, where) {
  const lines = normalize(text).split('\n')
  const directives = new Map() // key -> [lines]
  const sections = new Map() // '^section' -> { header, body }
  let pending = []
  let current = null // { kind, key, lines }
  const finish = () => {
    if (!current) return
    while (current.lines.length && current.lines[current.lines.length - 1].trim() === '') current.lines.pop()
    if (current.kind === 'directive') directives.set(current.key, current.lines)
    else if (current.key === '') sections.set(current.key, { header: null, entries: splitSectionEntries(current.lines, where) })
    else sections.set(current.key, { header: current.lines[0], body: current.lines.slice(1) })
    current = null
  }
  for (const line of lines) {
    if (line.trim() === '') {
      if (current) current.lines.push(line)
      continue
    }
    if (line[0] === '#' || line[0] === ' ') { // comment between entries, or body of a section
      if (line[0] === ' ' || current === null || current.kind === 'section') {
        if (current) current.lines.push(line)
        else pending.push(line)
      } else {
        pending.push(line) // column-0 comment: prefix of the next entry
      }
      continue
    }
    finish()
    const key = entryKey(line)
    const val = entryValue(line)
    if (key.startsWith('!')) {
      const mapKey = key === '!import' ? `!import:${val}` : key
      current = { kind: 'directive', key: mapKey, lines: [...pending, line] }
    } else if (key.startsWith('^')) {
      if (val === DELETE) current = { kind: 'directive', key: `!delete:${key}`, lines: [...pending, line] }
      else current = { kind: 'section', key, lines: [...pending, line] }
    } else {
      // bare top-level type (bedrock-style, no ^types: section); the empty
      // key is the implicit root namespace
      current = { kind: 'section', key: '', lines: [...pending, line] }
    }
    pending = []
  }
  finish()
  return { directives, sections }
}

// Merge a delta parse into a base parse. Returns { directives, sections }
// where merged sections carry an `entries` map for rendering; base-only
// sections keep their verbatim body.
function mergeParsed (base, delta, where) {
  const directives = new Map(base.directives)
  for (const [key, lines] of delta.directives) {
    if (key === '!base') continue
    if (key.startsWith('!delete:')) {
      const section = key.slice('!delete:'.length)
      if (!base.sections.has(section)) {
        throw Error(`Cannot delete missing section '${section}' in ${where}`)
      }
      base.sections.delete(section)
      continue
    }
    directives.set(key, lines) // delta directives win (!version, !StartDocs, ...)
  }

  const sections = new Map(base.sections)
  for (const [key, section] of delta.sections) {
    const existing = sections.get(key)
    const baseEntries = existing && existing.entries
      ? existing.entries
      : (existing ? splitSectionEntries(existing.body, `${key} (base)`) : null)
    if (!baseEntries) { // section only exists in the delta: keep it verbatim
      sections.set(key, section)
      continue
    }
    const merged = new Map(baseEntries)
    for (const [typeKey, typeLines] of splitSectionEntries(section.body, `${key} (delta)`)) {
      const real = typeLines.filter(l => !l.trimStart().startsWith('#'))
      if (real.length === 1 && entryValue(real[0]) === DELETE) {
        if (!merged.has(typeKey)) {
          throw Error(`Cannot delete missing type '${typeKey}' from ${key} in ${where}`)
        }
        merged.delete(typeKey)
      } else {
        merged.set(typeKey, typeLines) // replace in place, or append at the end
      }
    }
    sections.set(key, { header: section.header, entries: merged })
  }
  return { directives, sections }
}

function renderFiles (merged) {
  const lines = []
  for (const directiveLines of merged.directives.values()) {
    lines.push(...directiveLines)
  }
  for (const section of merged.sections.values()) {
    lines.push('')
    if (section.entries) {
      if (section.header) lines.push(section.header)
      let first = true
      for (const typeLines of section.entries.values()) {
        if (!first) lines.push('')
        lines.push(...typeLines)
        first = false
      }
    } else {
      lines.push(section.header, ...section.body)
    }
  }
  return { main: lines.join('\n') + '\n' }
}

// Resolve the !base chain starting at the proto.yml in `protoDir`.
// `edition` is used to resolve `!base` version strings through dataPaths.json.
// Returns null when protoDir/proto.yml is not a delta (no `!base`).
function resolveProtoDelta (edition, protoDir, dataRoot) {
  const protoPath = join(protoDir, 'proto.yml')
  if (!parseProto(fs.readFileSync(protoPath, 'utf8'), protoPath).directives.has('!base')) return null
  return { files: resolve(edition, protoPath, dataRoot) }
}

function resolveChain (edition, protoPath, dataRoot, seen) {
  const parsed = parseProto(fs.readFileSync(protoPath, 'utf8'), protoPath)
  if (!parsed.directives.has('!version')) throw Error(`Missing !version in ${protoPath}`)
  const baseVersion = entryValue(parsed.directives.get('!base')[0])
  const dataPaths = JSON.parse(fs.readFileSync(join(dataRoot, 'dataPaths.json'), 'utf8'))
  const baseEntry = dataPaths[edition] && dataPaths[edition][baseVersion]
  if (!baseEntry || !baseEntry.proto) {
    throw Error(`Unknown !base version '${baseVersion}' in ${protoPath}`)
  }
  const baseProto = join(dataRoot, baseEntry.proto, 'proto.yml')
  if (!fs.existsSync(baseProto)) throw Error(`!base '${baseVersion}' (${baseProto}) has no proto.yml`)
  if (seen.has(baseProto)) throw Error(`!base cycle detected at ${baseProto}`)
  seen.add(baseProto)

  const baseRaw = fs.readFileSync(baseProto, 'utf8')
  const baseParsed = parseProto(baseRaw, baseProto).directives.has('!base')
    ? resolveChain(edition, baseProto, dataRoot, seen).parsed
    : parseProto(baseRaw, baseProto)

  return { parsed: mergeParsed(baseParsed, parsed, protoPath), files: null }
}

function resolve (edition, protoPath, dataRoot) {
  const { parsed } = resolveChain(edition, protoPath, dataRoot, new Set([protoPath]))
  return renderFiles(parsed)
}

module.exports = { resolve, resolveProtoDelta, parseProto, splitSectionEntries, normalize, entryKey, entryValue }
