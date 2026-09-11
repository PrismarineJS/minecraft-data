/* eslint-env mocha */
const assert = require('assert')
const path = require('path')
const fixture = require('./fixtures/recipe-serializers.json')

// Mapper/switch agreement alone does not establish that serializer IDs match
// the game. This order comes from the independent official sources in the fixture.
describe('recipe serializer registry IDs', function () {
  for (const version of fixture.versions) {
    it(version + ' matches the official recipe serializer order', function () {
      const protocol = require(path.join('../../../data/pc', version, 'protocol.json'))
      const packet = protocol.play.toClient.types.packet_declare_recipes
      const recipes = packet[1].find(field => field.name === 'recipes')
      const entryFields = recipes.type[1].type[1]
      const type = entryFields.find(field => field.name === 'type').type
      assert.strictEqual(type[0], 'mapper')
      assert.strictEqual(type[1].type, 'varint')
      const expected = Object.fromEntries(fixture.serializers.map((name, id) => [String(id), name]))
      assert.deepStrictEqual(type[1].mappings, expected)
    })
  }
})
