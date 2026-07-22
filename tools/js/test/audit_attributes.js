/* eslint-env mocha */

const assert = require('assert')

describe('attribute protocol mappings', () => {
  it('uses the complete 1.21.4 attribute registry', () => {
    const protocol = require('../../../data/pc/1.21.4/protocol.json')
    const packet = protocol.play.toClient.types.packet_entity_update_attributes
    const mappings = findMappings(packet)

    assert.strictEqual(mappings['9'], 'player.entity_interaction_range')
    assert.strictEqual(mappings['21'], 'generic.movement_speed')
    assert.strictEqual(mappings['27'], 'generic.step_height')
  })
})

function findMappings (value) {
  if (Array.isArray(value)) {
    if (value[0] === 'mapper' && value[1]?.mappings) return value[1].mappings
    for (const child of value) {
      const mappings = findMappings(child)
      if (mappings) return mappings
    }
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) {
      const mappings = findMappings(child)
      if (mappings) return mappings
    }
  }
}
