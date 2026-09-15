/* eslint-env mocha */

const assert = require('assert')
const path = require('path')

const dataRoot = path.resolve(__dirname, '../../../data')
const bedrockPaths = require(path.join(dataRoot, 'dataPaths.json')).bedrock

describe('Bedrock block state mappings', () => {
  const checked = new Set()

  for (const [version, paths] of Object.entries(bedrockPaths)) {
    if (!paths.blocks || !paths.blockStates) continue

    const mapping = `${paths.blocks}|${paths.blockStates}`
    if (checked.has(mapping)) continue
    checked.add(mapping)

    it(`${version} maps every runtime state to exactly one matching block`, () => {
      const blocks = require(path.join(dataRoot, paths.blocks, 'blocks.json'))
      const blockStates = require(path.join(dataRoot, paths.blockStates, 'blockStates.json'))
      const covered = new Uint8Array(blockStates.length)

      for (const block of blocks) {
        assert.ok(Number.isInteger(block.minStateId), `${block.name} has no integer minStateId`)
        assert.ok(Number.isInteger(block.maxStateId), `${block.name} has no integer maxStateId`)
        assert.ok(Number.isInteger(block.defaultState), `${block.name} has no integer defaultState`)
        assert.ok(block.minStateId >= 0, `${block.name} starts before runtime state 0`)
        assert.ok(block.minStateId <= block.maxStateId, `${block.name} has an inverted runtime state range`)
        assert.ok(block.maxStateId < blockStates.length, `${block.name} ends after the runtime state palette`)
        assert.ok(block.defaultState >= block.minStateId && block.defaultState <= block.maxStateId, `${block.name} default state is outside its runtime state range`)

        for (let stateId = block.minStateId; stateId <= block.maxStateId; stateId++) {
          assert.strictEqual(covered[stateId], 0, `runtime state ${stateId} is assigned to multiple blocks`)
          assert.strictEqual(blockStates[stateId].name, block.name, `runtime state ${stateId} belongs to ${blockStates[stateId].name}, not ${block.name}`)
          covered[stateId] = 1
        }
      }

      const gap = covered.indexOf(0)
      assert.strictEqual(gap, -1, `runtime state ${gap} is not assigned to a block`)
    })
  }
})
