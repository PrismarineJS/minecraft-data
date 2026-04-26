/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const Ajv = require('ajv')
const v = new Ajv({ verbose: true })

const Validator = require('protodef-validator')

Error.stackTraceLimit = 0

const data = ['attributes', 'biomes', 'commands', 'instruments', 'items', 'materials', 'blocks', 'blockCollisionShapes', 'recipes', 'windows', 'entities', 'protocol', 'version', 'effects', 'enchantments', 'language', 'foods', 'particles', 'blockLoot', 'entityLoot', 'mapIcons', 'tints', 'blockMappings', 'sounds']

require('./version_iterator')(function (p, versionString) {
  describe('minecraft-data schemas ' + versionString, function () {
    this.timeout(60 * 1000)
    data.forEach(function (dataName) {
      let instance
      const pFile = path.join(p, dataName + '.json')
      if (fs.existsSync(pFile)) {
        instance = require(pFile)
      }
      if (instance) {
        it(dataName + '.json is valid', function () {
          // Skip tints schema validation for PC 1.21.4, as it doesn't meet the
          // maxItems: 1 check for the constant tints.
          if (dataName === 'tints' && versionString === 'pc 1.21.4') {
            this.skip()
          }

          if (dataName === 'protocol') {
            const validator = new Validator()

            instance.types.LatinString = 'native' // TODO: Update protodef validator
            validator.addType('entityMetadataItem', require('../../../schemas/protocol_types/entity_metadata_item.json'))
            validator.addType('entityMetadataLoop', require('../../../schemas/protocol_types/entity_metadata_loop.json'))
            validator.validateProtocol(instance)
          } else {
            const schema = require('../../../schemas/' + dataName + '_schema.json')
            const valid = v.validate(schema, instance)
            assert.ok(valid, JSON.stringify(v.errors, null, 2))
          }
        })
      }
    })
  })
})

const commonData = ['protocolVersions', 'features']
const minecraftTypes = ['pc', 'bedrock']

minecraftTypes.forEach(function (type) {
  describe('minecraft-data schemas of common data of ' + type, function () {
    this.timeout(60 * 1000)
    commonData.forEach(function (dataName) {
      it(dataName + '.json is valid', function () {
        const instance = require('../../../data/' + type + '/common/' + dataName + '.json')
        const schema = require('../../../schemas/' + dataName + '_schema.json')
        const valid = v.validate(schema, instance)
        assert.ok(valid, JSON.stringify(v.errors, null, 2))
      })
    })
  })
  describe('features.json quality is good', function () {
    it('there is no duplicate feature in features.json', () => {
      const features = require('../../../data/' + type + '/common/features.json')
      const countPerFeature = {}
      for (const feature of features) {
        countPerFeature[feature.name] = countPerFeature[feature.name] ? countPerFeature[feature.name] + 1 : 1
      }
      let duplicateCount = 0
      for (const [name, count] of Object.entries(countPerFeature)) {
        if (count > 1) {
          console.log(`feature ${name} is duplicated ${count} times, please remove ${count - 1}`)
          duplicateCount += 1
        }
      }
      assert.equal(duplicateCount, 0, `${duplicateCount} duplicates found. Please remove them.`)
    })
  })
})
