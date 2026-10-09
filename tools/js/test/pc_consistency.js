/* eslint-env mocha */

// Cross-file consistency of the Java edition data: ids that other files point at must exist,
// id sequences must be sane, and formulas must be complete. Each check is one `it` per version
// so a failure names the version and the entries involved.

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const dataPaths = require('../../../data/dataPaths.json').pc
const versions = require('../../../data/pc/common/versions.json')
const order = new Map(versions.map((v, i) => [v, i]))
const atLeast = (v, min) => order.get(v) >= order.get(min)

function load (version, kind) {
  const dir = dataPaths[version] && dataPaths[version][kind]
  if (!dir) return null
  const file = path.join(__dirname, '../../../data', dir, kind + '.json')
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

// Failures that are known and have a fix in flight live in pc_consistency_known.json, keyed by "<version> | <check>",
// each { reason, problems }: `reason` is the tracking note, `problems` is the EXACT, complete, sorted list of tolerated
// problem strings for that check. A known failure is reported as pending only when the check's full problem set is
// identical to `problems`; any added, removed or changed problem - including one in a later category of the same check -
// makes the sets differ and the check fails, so the exception cannot hide a new regression. The fingerprint is the
// complete problem list (from the assertion's `actual`), not a display message, so truncation can never mask a failure.
// Run with RECORD_KNOWN=1 to regenerate the file from the current data (it keeps each reason and records the current
// problem set). Once a known failure passes, the run says so and the entry can be dropped.
const knownPath = path.join(__dirname, 'pc_consistency_known.json')
const known = require('./pc_consistency_known.json')
const recording = !!process.env.RECORD_KNOWN
const recorded = {}
const nowPassing = []
after(function () {
  if (recording) {
    const sorted = {}
    for (const k of Object.keys(recorded).sort()) sorted[k] = recorded[k]
    fs.writeFileSync(knownPath, JSON.stringify(sorted, null, 2) + '\n')
    console.log(`\n  RECORD_KNOWN: wrote ${Object.keys(sorted).length} known failures to pc_consistency_known.json`)
    return
  }
  if (nowPassing.length) console.log(`\n  pc_consistency_known.json: ${nowPassing.length} entr${nowPassing.length === 1 ? 'y' : 'ies'} now pass and can be removed:\n    ${nowPassing.join('\n    ')}`)
})

const TOOL = /(_pickaxe|_axe|_shovel|_hoe|_sword|^shears$|^spade$)/
const isTool = (name) => TOOL.test(name)
const list = (arr, n = 8) => arr.slice(0, n).join(', ') + (arr.length > n ? `, ... (${arr.length} total)` : '')

for (const version of versions) {
  if (!dataPaths[version]) continue
  describe(`pc ${version} consistency`, function () {
    const check = (title, fn) => it(title, function () {
      const key = `${version} | ${title}`
      const entry = known[key]
      try {
        fn()
      } catch (err) {
        // Only our own consistency assertions can be a tolerated known failure: they compare the complete problem list
        // against [], so err.actual is that full list. Anything else (a bug in the check, missing data, a real throw) is
        // never swallowed - it surfaces as a failure.
        if (!(err && err.code === 'ERR_ASSERTION' && Array.isArray(err.actual))) throw err
        const problems = [...err.actual].sort()
        if (recording) { recorded[key] = { reason: (entry && entry.reason) || (typeof entry === 'string' ? entry : 'unclassified'), problems }; return this.skip() }
        // Tolerate ONLY the exact recorded set. An added/removed/changed problem - including in a later category of the
        // same check - makes the sets differ, so a known exception can never hide a new regression.
        const knownProblems = entry && Array.isArray(entry.problems) ? [...entry.problems].sort() : null
        if (knownProblems && problems.length === knownProblems.length && problems.every((p, i) => p === knownProblems[i])) return this.skip()
        throw err
      }
      if (!recording && entry) nowPassing.push(key)
    })
    const blocks = load(version, 'blocks')
    const items = load(version, 'items')
    if (!blocks || !items) return
    const itemsById = new Map(items.map(i => [i.id, i]))
    const itemsByName = new Map(items.map(i => [i.name, i]))
    const blocksByName = new Map(blocks.map(b => [b.name, b]))
    const flattened = atLeast(version, '1.13')
    // spawn_entity keeps a separate object id space (object type byte) through 1.13.2; the registry ids do not replace it
    // until the 1.13.2 -> 1.14 transition. This is independent of block flattening (1.13).
    const legacyEntityIds = !atLeast(version, '1.14')
    // before the flattening, block ids below 256 double as item ids
    const isItemId = (id) => itemsById.has(id) || (!flattened && blocks.some(b => b.id === id && id < 256))

    check('ids and names are unique', function () {
      // Collect problems across every category before asserting, so a known duplicate in one category cannot hide a new
      // duplicate in a later one.
      const problems = []
      for (const [kind, data] of [['blocks', blocks], ['items', items], ['entities', load(version, 'entities')], ['biomes', load(version, 'biomes')], ['effects', load(version, 'effects')], ['enchantments', load(version, 'enchantments')], ['sounds', load(version, 'sounds')]]) {
        if (!Array.isArray(data)) continue
        const ids = new Set(); const names = new Set()
        for (const e of data) {
          const idKey = kind === 'entities' && legacyEntityIds ? `${e.type}/${e.id}` : e.id // legacy mobs and objects have separate id spaces (through 1.13.2)
          if (ids.has(idKey)) problems.push(`${kind}: duplicate id ${e.name}#${e.id}`); ids.add(idKey)
          if (kind === 'entities' && legacyEntityIds) continue // the legacy object table reuses class names (Arrow, FallingSand)
          if (names.has(e.name)) problems.push(`${kind}: duplicate name ${e.name}`); names.add(e.name)
        }
      }
      assert.deepStrictEqual(problems, [], list(problems))
    })

    check('registry ids start at 0 and are contiguous', function () {
      const problems = []
      for (const kind of ['items', 'entities', 'sounds', 'effects', 'enchantments', 'biomes']) {
        const data = load(version, kind)
        if (!Array.isArray(data) || !data.length) continue
        if (!flattened && kind !== 'sounds') continue // legacy numeric ids have deliberate gaps
        if (kind === 'entities' && legacyEntityIds) continue // entities keep the legacy object id space (with gaps) through 1.13.2
        if (kind === 'effects' || kind === 'enchantments' || kind === 'biomes') {
          if (!atLeast(version, '1.20.3')) continue // registry-backed only after the 1.20.3 data-driven change
        }
        const ids = data.map(e => e.id).sort((a, b) => a - b)
        if (kind === 'items' && ids[0] === 1) ids.unshift(0) // air is not listed as an item in every version
        if (ids[0] !== 0) problems.push(`${kind}: first id is ${ids[0]} (${data.find(e => e.id === ids[0]).name}), registry ids start at 0`)
        for (const g of ids.filter((id, i) => i > 0 && id !== ids[i - 1] + 1).map(id => `${ids[ids.indexOf(id) - 1]}->${id}`)) problems.push(`${kind}: gap in the id sequence ${g}`)
      }
      assert.deepStrictEqual(problems, [], list(problems))
    })

    check('block state ids are contiguous and default states are in range', function () {
      if (blocks[0].minStateId === undefined) return
      const sorted = [...blocks].sort((a, b) => a.minStateId - b.minStateId)
      const problems = []
      sorted.forEach((b, i) => {
        if (b.maxStateId < b.minStateId) problems.push(`${b.name}: maxStateId ${b.maxStateId} < minStateId ${b.minStateId}`)
        if (b.defaultState < b.minStateId || b.defaultState > b.maxStateId) problems.push(`${b.name}: defaultState ${b.defaultState} outside ${b.minStateId}..${b.maxStateId}`)
        if (i > 0 && b.minStateId !== sorted[i - 1].maxStateId + 1) problems.push(`${sorted[i - 1].name} ends at ${sorted[i - 1].maxStateId}, ${b.name} starts at ${b.minStateId}`)
        if (Array.isArray(b.states) && flattened) {
          const product = b.states.reduce((p, s) => p * (s.num_values ?? (s.values ? s.values.length : (s.type === 'bool' ? 2 : 1))), 1)
          if (product !== b.maxStateId - b.minStateId + 1) problems.push(`${b.name}: ${product} state combinations but id span ${b.maxStateId - b.minStateId + 1}`)
        }
      })
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('blocks point at existing items', function () {
      const problems = []
      for (const b of blocks) {
        if (b.harvestTools) for (const id of Object.keys(b.harvestTools)) { const it = itemsById.get(Number(id)); if (!it) problems.push(`${b.name}.harvestTools ${id}: no such item`); else if (!isTool(it.name)) problems.push(`${b.name}.harvestTools ${id} is ${it.name}, not a tool`) }
        if (Array.isArray(b.drops)) for (const d of b.drops) { const id = typeof d === 'object' ? (d.drop && d.drop.id !== undefined ? d.drop.id : d.drop) : d; if (Number.isInteger(id) && id !== 0 && !isItemId(id)) problems.push(`${b.name}.drops ${id}: no such item`) }
      }
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('materials speed tables point at tools that exist', function () {
      const materials = load(version, 'materials')
      if (!materials) return
      const problems = []
      for (const [mat, table] of Object.entries(materials)) for (const id of Object.keys(table)) { const it = itemsById.get(Number(id)); if (!it) problems.push(`${mat}: item ${id} does not exist`); else if (!isTool(it.name)) problems.push(`${mat}: ${it.name} (${id}) is not a tool`) }
      for (const b of blocks) if (typeof b.material === 'string' && b.material !== 'default' && !(b.material in materials) && flattened) problems.push(`${b.name}: material ${b.material} not in materials.json`)
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('foods are items with the same id', function () {
      const foods = load(version, 'foods')
      if (!foods) return
      const problems = []
      for (const f of foods) { const it = itemsByName.get(f.name); if (!it) problems.push(`${f.name}: not an item`); else if (it.id !== f.id) problems.push(`${f.name}: food id ${f.id}, item id ${it.id}`) }
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('items repair with items that exist', function () {
      const problems = []
      for (const i of items) if (Array.isArray(i.repairWith)) for (const r of i.repairWith) if (!itemsByName.has(r) && !blocksByName.has(r)) problems.push(`${i.name}: ${r}`)
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('recipes use item ids that exist', function () {
      const recipes = load(version, 'recipes')
      if (!recipes) return
      const problems = new Set()
      const check = (id, where) => { if (Number.isInteger(id) && !isItemId(id)) problems.add(`${where} ${id}`) }
      for (const [resultId, variants] of Object.entries(recipes)) {
        check(Number(resultId), 'result key')
        for (const r of variants) {
          if (r.result) check(typeof r.result === 'object' ? r.result.id : r.result, 'result')
          if (r.ingredients) for (const ing of r.ingredients) check(typeof ing === 'object' ? ing.id : ing, 'ingredient')
          if (r.inShape) for (const row of r.inShape) for (const cell of row) check(typeof cell === 'object' && cell ? cell.id : cell, 'inShape')
          if (r.outShape) for (const row of r.outShape) for (const cell of row) check(typeof cell === 'object' && cell ? cell.id : cell, 'outShape')
        }
      }
      assert.deepStrictEqual([...problems], [], list([...problems], 6))
    })

    check('loot tables name blocks, entities and items that exist', function () {
      const problems = []
      const blockLoot = load(version, 'blockLoot')
      if (blockLoot) for (const t of blockLoot) { if (!blocksByName.has(t.block)) problems.push(`blockLoot ${t.block}: no such block`); for (const d of t.drops || []) if (!itemsByName.has(d.item) && !blocksByName.has(d.item)) problems.push(`blockLoot ${t.block} drops ${d.item}: no such item`) }
      const entityLoot = load(version, 'entityLoot')
      const entities = load(version, 'entities')
      if (entityLoot && entities) { const names = new Set(entities.map(e => e.name)); for (const t of entityLoot) { if (!names.has(t.entity)) problems.push(`entityLoot ${t.entity}: no such entity`); for (const d of t.drops || []) if (!itemsByName.has(d.item)) problems.push(`entityLoot ${t.entity} drops ${d.item}: no such item`) } }
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('enchantment costs are complete', function () {
      const ench = load(version, 'enchantments')
      if (!ench || !atLeast(version, '1.14')) return
      const problems = []
      for (const e of ench) {
        for (const c of ['minCost', 'maxCost']) if (!e[c] || typeof e[c].a !== 'number' || typeof e[c].b !== 'number') problems.push(`${e.name}: ${c} incomplete`)
        if (!(e.maxLevel >= 1)) problems.push(`${e.name}: maxLevel ${e.maxLevel}`)
        if (Array.isArray(e.exclude)) for (const x of e.exclude) if (!ench.some(o => o.name === x)) problems.push(`${e.name}: excludes unknown ${x}`)
      }
      assert.deepStrictEqual(problems, [], list(problems, 6))
    })

    check('collision shapes cover the blocks', function () {
      const shapes = load(version, 'blockCollisionShapes')
      if (!shapes || !shapes.blocks) return
      const problems = []
      for (const b of blocks) if (!(b.name in shapes.blocks)) problems.push(`block without a shape: ${b.name}`)
      for (const n of Object.keys(shapes.blocks)) if (!blocksByName.has(n)) problems.push(`shape for a block that does not exist: ${n}`)
      assert.deepStrictEqual(problems, [], list(problems))
    })
  })
}
