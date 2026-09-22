'use strict'
// Generate a Bedrock-specific materials.json. Bedrock currently borrows pc/1.17's materials (dataPaths bedrock.materials
// = "pc/1.17"), whose tool speeds are keyed by JAVA item ids that do not exist in bedrock items.json - so digTime never
// finds a tool speed and returns hand-time. This regenerates the table keyed by the BEDROCK item ids, by resolving each
// pc tool id -> tool name -> bedrock id (speeds unchanged). Copper tools (bedrock-only) are added at the copper tier
// (speed 5, between stone 4 and iron 6). Tools with no bedrock equivalent are dropped.
const fs = require('fs')
const path = require('path')

// Copper tier speed per mineable family (bedrock copper tool = between stone and iron). Applied to the *_copper_* tool.
const COPPER_SPEED = 5

function gen (pcMaterialsDir, bedrockDir) {
  const pcMats = JSON.parse(fs.readFileSync(path.join(pcMaterialsDir, 'materials.json'), 'utf8'))
  const pcItems = JSON.parse(fs.readFileSync(path.join(pcMaterialsDir, 'items.json'), 'utf8'))
  const bedItems = JSON.parse(fs.readFileSync(path.join(bedrockDir, 'items.json'), 'utf8'))
  const pcName = new Map(pcItems.map(i => [i.id, i.name]))
  const bedId = new Map(bedItems.map(i => [i.name, i.id]))

  const out = {}
  for (const [key, table] of Object.entries(pcMats)) {
    if (!table || typeof table !== 'object') { out[key] = table; continue }
    const next = {}
    let sawFamily = null
    for (const [pcId, speed] of Object.entries(table)) {
      const name = pcName.get(+pcId)
      if (!name) continue
      const bid = bedId.get(name)
      if (bid != null) next[bid] = speed
      const fam = /_(pickaxe|axe|shovel|hoe)$/.exec(name)
      if (fam) sawFamily = fam[1]
    }
    // Add the bedrock-only copper tool for this family at the copper tier.
    if (sawFamily) {
      const copperId = bedId.get('copper_' + sawFamily)
      if (copperId != null && next[copperId] == null) next[copperId] = COPPER_SPEED
    }
    out[key] = next
  }
  return out
}

if (require.main === module) {
  const [pcDir, bedDir] = process.argv.slice(2)
  const write = process.argv.includes('--write')
  if (!pcDir || !bedDir) { console.log('usage: node genBedrockMaterials.cjs <pc materials dir> <bedrock version dir> [--write]'); process.exit(1) }
  const mats = gen(pcDir, bedDir)
  console.log('mineable/pickaxe ->', JSON.stringify(mats['mineable/pickaxe']))
  if (write) { fs.writeFileSync(path.join(bedDir, 'materials.json'), JSON.stringify(mats, null, 2) + '\n'); console.log('WROTE', path.join(bedDir, 'materials.json')) } else console.log('(dry run)')
}

module.exports = { gen }
