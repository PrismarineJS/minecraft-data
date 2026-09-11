/* eslint-env mocha */
const assert = require('assert')
const Ajv = require('ajv')
const schema = require('../../../schemas/enchantments_schema.json')
const example = require('../../../data/pc/1.17/enchantments.json')[0]

describe('enchantment applicability and rarity schema', () => {
  const validate = new Ajv().compile(schema)
  it('accepts native 1.14 selection weights separately from rarity', () => {
    assert.strictEqual(validate([{ ...example, weight: 30, rarity: 'common' }]), true)
  })
  it('keeps the new fields optional for older data', () => {
    const { rarity, supportedItems, ...legacy } = example
    assert.strictEqual(validate([legacy]), true)
  })
  it('rejects unknown rarity classes and duplicate supported items', () => {
    assert.strictEqual(validate([{ ...example, rarity: 'unknown' }]), false)
    assert.strictEqual(validate([{ ...example, supportedItems: ['diamond_axe', 'diamond_axe'] }]), false)
  })
  it('allows an explicitly empty applicability list', () => {
    assert.strictEqual(validate([{ ...example, supportedItems: [] }]), true)
  })
})
