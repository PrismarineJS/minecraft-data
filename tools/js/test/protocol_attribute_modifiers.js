/* eslint-env mocha */

const assert = require('assert')

const protocol12111 = require('../../../data/pc/1.21.11/protocol.json')
const protocol1219 = require('../../../data/pc/1.21.9/protocol.json')

function getAttributeModifiersType (protocol) {
  return protocol.types.SlotComponent[1][1].type[1].fields.attribute_modifiers
}

describe('pc 1.21.11 attribute_modifiers protocol shape', () => {
  it('keeps display on each attribute entry', () => {
    const attributeModifiers = getAttributeModifiersType(protocol12111)

    assert.strictEqual(attributeModifiers[0], 'array')
    assert.strictEqual(attributeModifiers[1].countType, 'varint')

    const entryFields = attributeModifiers[1].type[1]
    assert.strictEqual(entryFields.at(-1).name, 'display')

    assert.deepStrictEqual(attributeModifiers, getAttributeModifiersType(protocol1219))
  })
})
