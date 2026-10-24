/* eslint-env mocha */
const assert = require('assert')
const path = require('path')
const paths = require('../../../data/dataPaths.json')

describe('selection shape references', () => {
  for (const [version, files] of Object.entries(paths.pc)) {
    if (!files.blockSelectionShapes) continue
    it(version + ' has valid state and shape indices', () => {
      const shapes = require(path.join('../../../data', files.blockSelectionShapes, 'blockSelectionShapes.json'))
      const blocks = require(path.join('../../../data', files.blocks, 'blocks.json'))
      const definitions = Object.fromEntries(blocks.map(block => [block.name, block]))
      for (const [name, reference] of Object.entries(shapes.blocks)) {
        const refs = Array.isArray(reference) ? reference : [reference]
        for (const id of refs) assert.ok(shapes.shapes[id], name + ': missing shape ' + id)
        if (shapes.stateMetadata) {
          const count = shapes.stateMetadata[name].length
          assert.equal(shapes.stateProperties[name].length, count)
          assert.ok(Number.isInteger(shapes.blockIds[name]))
          if (Array.isArray(reference)) assert.equal(refs.length, count)
          if (shapes.offsets?.[name]) assert.equal(shapes.offsets[name].length, count)
          if (['wheat', 'carrots', 'potatoes', 'beetroots', 'nether_wart'].includes(name)) {
            for (let index = 0; index < count; index++) {
              assert.equal(shapes.stateMetadata[name][index], Number(shapes.stateProperties[name][index].age), name + ': crop age must survive metadata encoding')
            }
          }
        } else {
          const definition = definitions[name]
          assert.ok(definition, 'Unknown modern block: ' + name)
          const count = definition.maxStateId - definition.minStateId + 1
          if (Array.isArray(reference)) assert.equal(refs.length, count)
          if (shapes.offsets?.[name]) assert.equal(shapes.offsets[name].length, count)
        }
      }
      for (const boxes of Object.values(shapes.shapes)) {
        for (const box of boxes) {
          for (let axis = 0; axis < 3; axis++) assert.ok(box[axis] <= box[axis + 3], 'Inverted box')
        }
      }
    })
  }
})
