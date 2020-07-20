const fs = require('fs')
const path = require('path')

function getBlockId (data, name) {
  for (const prop in data) {
    const block = data[prop]
    if (`minecraft:${block.name}` === name) return block.id
  }
}

function extractDropIds (data, lootTable) {
  const blockIds = []

  // TODO Parse lootTable to provide accurate drop data.
  // if (!lootTable.pools || lootTable.pools.length === 0) return blockIds

  function recursiveDropSearch (object) {
    for (const prop in object) {
      const info = object[prop]
      if (typeof info === 'string') {
        const block = getBlockId(data, info)
        if (block !== undefined) blockIds.push(block)
        continue
      }

      recursiveDropSearch(object[prop])
    }
  }

  recursiveDropSearch(lootTable)

  return blockIds
}

function handle (inputFolder, version) {
  inputFolder += '/' + version

  const raw = path.resolve(inputFolder + '/data/loot_tables/blocks')
  const target = path.resolve('../../../data/pc/' + version + '/blocks.json')

  const data = require(target)

  let fileCount = 0
  for (const prop in data) {
    const block = data[prop]

    const inputPath = path.join(raw, block.name + '.json')
    if (!fs.existsSync(inputPath)) {
      block.drops = []
      continue
    }

    fileCount++

    const lootTable = require(inputPath)
    block.drops = extractDropIds(data, lootTable)
  }

  fs.writeFileSync(target, JSON.stringify(data, null, 2))
  console.log(`Version ${version} finished. (${fileCount} files processed)`)
}

if (process.argv.length !== 4) {
  console.log(
    'Usage: node extract_block_lootTables.js <inputFolder> <version1,version2,...>'
  )
  return
}

const inputFolder = path.resolve(process.argv[2])
const versions = process.argv[3].split(',')

for (const version of versions) handle(inputFolder, version)
