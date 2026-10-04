'use strict'
// Fix Bedrock blocks.json harvestTools: the bedrock data generation copies harvestTools from the pc (Java) data by
// block name but leaves the Java TOOL item ids in place, which do not exist in the bedrock items.json (e.g. bedrock
// stone lists {941,946,...} - Java pickaxe ids - while the bedrock pickaxes are 341/345/328/356/349/648/775). Result:
// prismarine-block's digTime() finds no matching tool and returns hand-time for every tool-mineable block, so tool
// tier and Efficiency never apply. This remaps each harvestTools id to the correct BEDROCK item id, and retags the
// pickaxe blocks that are (wrongly) tagged incorrect_for_wooden_tool - which carries no speed table - to mineable/pickaxe.
//
// The remap is self-contained (no pc data needed). Java registers a material's tools in the fixed order
// sword, shovel, pickaxe, axe, hoe with consecutive ids, and the materials themselves in the fixed registry order
// [wooden, copper, stone, golden, iron, diamond, netherite] with ascending ids. So the reference block that lists ALL
// seven pickaxes (e.g. stone) gives, by its ascending ids, both the tier order and - by the +/-offset from each
// pickaxe id - the sword/shovel/axe/hoe ids of every tier. shears is the one non-tier tool that appears in harvestTools
// (cobweb etc.); it is mapped to the bedrock shears. Ids that already resolve to a bedrock item are left untouched, so
// the tool is idempotent: re-running it on fixed data is a no-op rather than scrambling the tiers. Edits are done as
// text so the file keeps its original (single-line harvestTools) formatting.
const fs = require('fs')
const path = require('path')

const MATERIAL_ORDER = ['wooden', 'copper', 'stone', 'golden', 'iron', 'diamond', 'netherite']
// Java per-material tool registration order, as an id offset from that material's pickaxe.
const TOOL_OFFSETS = { sword: -2, shovel: -1, pickaxe: 0, axe: 1, hoe: 2 }

function fixVersion (dir) {
  const blocksPath = path.join(dir, 'blocks.json')
  const itemsPath = path.join(dir, 'items.json')
  if (!fs.existsSync(blocksPath) || !fs.existsSync(itemsPath)) return null
  const text = fs.readFileSync(blocksPath, 'utf8')
  const blocks = JSON.parse(text)
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))
  const itemsByName = {}
  const itemIds = new Set()
  for (const it of items) { itemsByName[it.name] = it; itemIds.add(it.id) }
  const bedrockPickIds = MATERIAL_ORDER.map(n => itemsByName[`${n}_pickaxe`] && itemsByName[`${n}_pickaxe`].id)
  const shearsId = itemsByName.shears && itemsByName.shears.id

  // Reference block = the one listing all seven pickaxes with the original Java ids; its ascending ids give the tier
  // order. Skip a block whose ids already resolve to bedrock items (data already fixed), so we build the map from the
  // raw Java ids, not a previously remapped set.
  let ref = null
  for (const blk of blocks) {
    if (!blk.harvestTools) continue
    const ids = Object.keys(blk.harvestTools).map(Number)
    if (ids.length !== bedrockPickIds.length) continue
    if (ids.some(id => itemIds.has(id))) continue // already-bedrock ids: not a raw Java reference
    ref = ids.sort((a, b) => a - b)
    break
  }

  // Build the full Java-id -> bedrock-id map across every tool family from the pickaxe reference.
  const map = new Map()
  if (ref) {
    for (let i = 0; i < ref.length; i++) {
      const pickaxeJavaId = ref[i]
      for (const [family, offset] of Object.entries(TOOL_OFFSETS)) {
        const bedrock = itemsByName[`${MATERIAL_ORDER[i]}_${family}`]
        if (bedrock) map.set(pickaxeJavaId + offset, bedrock.id)
      }
    }
  }

  // Text edit 1: remap each inline harvestTools object's ids, keeping the {"id": true, ...} single-line shape.
  let remapped = 0; let kept = 0; let shears = 0; let unmapped = 0
  let out = text.replace(/"harvestTools": \{([^}]*)\}/g, (whole, inner) => {
    const parts = inner.split(',').map(s => s.trim()).filter(Boolean)
    const nextIds = []
    for (const p of parts) {
      const m = /^"(\d+)":\s*true$/.exec(p)
      if (!m) return whole
      const id = Number(m[1])
      if (map.has(id)) { nextIds.push(map.get(id)); remapped++ } // raw Java tool id -> bedrock id
      else if (itemIds.has(id)) { nextIds.push(id); kept++ } // already a bedrock item id: leave it (idempotent)
      else if (shearsId != null) { nextIds.push(shearsId); shears++ } // the only non-tier harvest tool is shears
      else { nextIds.push(id); unmapped++ }
    }
    const unique = [...new Set(nextIds)].sort((a, b) => a - b)
    return '"harvestTools": {' + unique.map(id => `"${id}": true`).join(', ') + '}'
  })

  // Text edit 2: retag incorrect_for_wooden_tool (no speed table) to mineable/pickaxe. Verified: every such block is a
  // pickaxe block (its harvest tools are all pickaxes), so the tag change gives it the pickaxe speed table; harvestTools
  // still encodes the tier requirement. Idempotent: no incorrect_for_wooden_tool remains after the first run.
  const retagged = (out.match(/"material": "incorrect_for_wooden_tool"/g) || []).length
  out = out.replace(/"material": "incorrect_for_wooden_tool"/g, '"material": "mineable/pickaxe"')

  return { blocksPath, out, remapped, kept, shears, unmapped, retagged, hasRef: Boolean(ref), map: [...map.entries()] }
}

if (require.main === module) {
  const dir = process.argv[2]
  const write = process.argv.includes('--write')
  if (!dir) { console.log('usage: node fixBedrockHarvestTools.cjs <data/bedrock/VERSION dir> [--write]'); process.exit(1) }
  const res = fixVersion(dir)
  if (!res) { console.log('no blocks.json/items.json in', dir); process.exit(1) }
  console.log('reference found:', res.hasRef, '| remapped:', res.remapped, '| kept (already bedrock):', res.kept, '| shears:', res.shears, '| unmapped:', res.unmapped, '| retagged:', res.retagged)
  if (res.unmapped > 0) { console.log('ERROR: unmapped harvestTools ids remain; aborting'); process.exit(1) }
  if (write) { fs.writeFileSync(res.blocksPath, res.out); console.log('WROTE', res.blocksPath) } else console.log('(dry run - pass --write to save)')
}

module.exports = { fixVersion }
