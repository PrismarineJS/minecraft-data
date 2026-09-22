'use strict'
// Fix Bedrock blocks.json harvestTools: the bedrock data generation copies harvestTools from the pc (Java) data by
// block name but leaves the Java TOOL item ids in place, which do not exist in the bedrock items.json (e.g. bedrock
// stone lists {941,946,...} - Java pickaxe ids - while the bedrock pickaxes are 341/345/328/356/349/648/775). Result:
// prismarine-block's digTime() finds no matching tool and returns hand-time for every tool-mineable block, so tool
// tier and Efficiency never apply. This remaps each harvestTools id to the correct BEDROCK item id, and retags the
// pickaxe blocks that are (wrongly) tagged incorrect_for_wooden_tool - which carries no speed table - to mineable/pickaxe.
//
// The remap is self-contained (no pc data needed): pc lists a material's pickaxes in the fixed registry order
// [wooden, copper, stone, golden, iron, diamond, netherite] with ascending ids, so the reference block that lists ALL
// seven pickaxes (e.g. stone) gives the ascending id -> tier order; every other block's ids are a subset that maps by
// the same order. Edits are done as text so the file keeps its original (single-line harvestTools) formatting.
const fs = require('fs')
const path = require('path')

const PICKAXE_ORDER = ['wooden_pickaxe', 'copper_pickaxe', 'stone_pickaxe', 'golden_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe']

function fixVersion (dir) {
  const blocksPath = path.join(dir, 'blocks.json')
  const itemsPath = path.join(dir, 'items.json')
  if (!fs.existsSync(blocksPath) || !fs.existsSync(itemsPath)) return null
  const text = fs.readFileSync(blocksPath, 'utf8')
  const blocks = JSON.parse(text)
  const itemsByName = {}
  for (const it of JSON.parse(fs.readFileSync(itemsPath, 'utf8'))) itemsByName[it.name] = it
  const bedrockPickIds = PICKAXE_ORDER.map(n => itemsByName[n] && itemsByName[n].id)

  // Reference block = the one listing all seven pickaxes; its ascending ids give the tier order -> bedrock pickaxe ids.
  let ref = null
  for (const blk of blocks) {
    if (!blk.harvestTools) continue
    const ids = Object.keys(blk.harvestTools).map(Number)
    if (ids.length === bedrockPickIds.length) { ref = ids.sort((a, b) => a - b); break }
  }
  if (!ref) return null
  const map = new Map()
  for (let i = 0; i < ref.length; i++) map.set(ref[i], bedrockPickIds[i])
  const pickIdSet = new Set(bedrockPickIds)

  // Text edit 1: remap each inline harvestTools object's ids, keeping the {"id": true, ...} single-line shape.
  let remapped = 0; let unmapped = 0
  let out = text.replace(/"harvestTools": \{([^}]*)\}/g, (whole, inner) => {
    const parts = inner.split(',').map(s => s.trim()).filter(Boolean)
    const nextIds = []
    for (const p of parts) {
      const m = /^"(\d+)":\s*true$/.exec(p)
      if (!m) return whole
      const mapped = map.get(Number(m[1]))
      if (mapped != null) { nextIds.push(mapped); remapped++ } else { nextIds.push(Number(m[1])); unmapped++ }
    }
    // Every block that has harvestTools here is a pickaxe block (verified: all ids map to the pickaxe set); keep sorted.
    nextIds.sort((a, b) => a - b)
    return '"harvestTools": {' + nextIds.map(id => `"${id}": true`).join(', ') + '}'
  })

  // Text edit 2: retag incorrect_for_wooden_tool (no speed table) to mineable/pickaxe. Verified: every such block is a
  // pickaxe block (its harvest tools are all pickaxes), so the tag change gives it the pickaxe speed table; harvestTools
  // still encodes the tier requirement.
  const retagged = (out.match(/"material": "incorrect_for_wooden_tool"/g) || []).length
  out = out.replace(/"material": "incorrect_for_wooden_tool"/g, '"material": "mineable/pickaxe"')

  return { blocksPath, out, remapped, unmapped, retagged, pickIds: [...map.entries()], allPickaxe: pickIdSet }
}

if (require.main === module) {
  const dir = process.argv[2]
  const write = process.argv.includes('--write')
  if (!dir) { console.log('usage: node fixBedrockHarvestTools.cjs <data/bedrock/VERSION dir> [--write]'); process.exit(1) }
  const res = fixVersion(dir)
  if (!res) { console.log('no blocks.json/items.json (or no reference block) in', dir); process.exit(1) }
  console.log('pickaxe map (pcId -> bedrockId):', JSON.stringify(res.pickIds))
  console.log('remapped ids:', res.remapped, '| left unmapped:', res.unmapped, '| retagged incorrect_for_wooden_tool:', res.retagged)
  if (write) { fs.writeFileSync(res.blocksPath, res.out); console.log('WROTE', res.blocksPath) } else console.log('(dry run - pass --write to save)')
}

module.exports = { fixVersion }
