/* eslint-env mocha */

const assert = require('assert')
const Ajv = require('ajv')
const schema = require('../../../schemas/tags_schema.json')

function baseTags () {
  return {
    'minecraft:block': {
      'minecraft:mineable/pickaxe': ['minecraft:granite', 'minecraft:stone']
    },
    'minecraft:item': {
      'minecraft:pickaxes': ['minecraft:diamond_pickaxe']
    }
  }
}

function tagsWith (changes) {
  return Object.assign(baseTags(), changes)
}

describe('tags schema', function () {
  const validator = new Ajv({ verbose: true })

  it('accepts namespaced registries, tags, and members', function () {
    assert.ok(validator.validate(schema, baseTags()), JSON.stringify(validator.errors, null, 2))
  })

  it('accepts path-shaped registries, empty tags, and modded namespaces', function () {
    const tags = baseTags()
    tags['minecraft:block']['minecraft:incorrect_for_diamond_tool'] = []
    tags['minecraft:worldgen/biome'] = {
      'minecraft:is_overworld': ['minecraft:plains']
    }
    tags['example:block'] = {
      'example:mineable/hammer': ['example:ore']
    }
    tags['minecraft:fluid'] = {
      'minecraft:water': ['minecraft:flowing_water', 'minecraft:water']
    }
    tags['minecraft:entity_type'] = {
      'minecraft:raiders': ['minecraft:pillager']
    }
    assert.ok(validator.validate(schema, tags), JSON.stringify(validator.errors, null, 2))
  })

  const invalid = [
    {
      name: 'missing required item registry',
      value: { 'minecraft:block': { 'minecraft:logs': [] } }
    },
    {
      name: 'missing required block registry',
      value: { 'minecraft:item': { 'minecraft:pickaxes': [] } }
    },
    {
      name: 'empty registry tag map',
      value: tagsWith({ 'minecraft:block': {} })
    },
    {
      name: 'registry without namespace',
      value: tagsWith({ block: {} })
    },
    {
      name: 'malformed registry namespace',
      value: tagsWith({ 'mine craft:block': {} })
    },
    {
      name: 'uppercase registry namespace',
      value: tagsWith({ 'Minecraft:block': {} })
    },
    {
      name: 'malformed registry path',
      value: tagsWith({ 'minecraft:block path': {} })
    },
    {
      name: 'tag without namespace',
      value: tagsWith({ 'minecraft:block': { stone: [] } })
    },
    {
      name: 'uppercase tag path',
      value: tagsWith({ 'minecraft:block': { 'minecraft:Mineable/pickaxe': [] } })
    },
    {
      name: 'member without namespace',
      value: tagsWith({ 'minecraft:block': { 'minecraft:stone': ['stone'] } })
    },
    {
      name: 'uppercase member path',
      value: tagsWith({ 'minecraft:block': { 'minecraft:stone': ['minecraft:Stone'] } })
    },
    {
      name: 'duplicate member',
      value: tagsWith({ 'minecraft:block': { 'minecraft:stone': ['minecraft:stone', 'minecraft:stone'] } })
    },
    {
      name: 'unresolved tag reference',
      value: tagsWith({ 'minecraft:block': { 'minecraft:stone': ['#minecraft:base_stone_overworld'] } })
    },
    {
      name: 'null registry',
      value: tagsWith({ 'minecraft:block': null })
    },
    {
      name: 'null tag members',
      value: tagsWith({ 'minecraft:block': { 'minecraft:mineable/pickaxe': null } })
    },
    {
      name: 'non-array tag members',
      value: tagsWith({ 'minecraft:block': { 'minecraft:stone': 'minecraft:stone' } })
    }
  ]

  for (const test of invalid) {
    it('rejects ' + test.name, function () {
      assert.equal(validator.validate(schema, test.value), false)
    })
  }
})
