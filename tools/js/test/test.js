/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const Ajv = require('ajv')
const v = new Ajv({ verbose: true })

const Validator = require('protodef-validator')

Error.stackTraceLimit = 0

// The suite used to take ~3min, almost all of it in protodef-validator < 1.5.0 (quadratic
// dataType validation) and Ajv's O(n^2) uniqueItems. Fail if it ever gets that slow again.
after('the test suite stays fast', function () {
  const ms = performance.now() // measured from process start
  assert.ok(ms < 40 * 1000, `the test suite took ${Math.round(ms)}ms, expected < 40s`)
})

function resolveType (type, types, seen = new Set()) {
  if (typeof type === 'string' && types[type] && !seen.has(type)) {
    seen.add(type)
    return resolveType(types[type], types, seen)
  }
  return type
}

function checkProtocolSwitches (protocol, versionString) {
  const issues = []

  function visitType (type, scope, location, active = new Set()) {
    if (!Array.isArray(type) || active.has(type)) return
    active.add(type)
    const [kind, options] = type
    if (kind === 'container' && Array.isArray(options)) {
      const fields = { ...scope }
      for (const field of options) {
        if (!field || typeof field !== 'object') continue
        const fieldType = resolveType(field.type, protocol.types)
        if (Array.isArray(fieldType) && fieldType[0] === 'mapper') {
          fields[field.name] = new Set(Object.values(fieldType[1].mappings || {}))
        }
        visitType(fieldType, fields, location + '/' + (field.name || '?'), active)
      }
    } else if (kind === 'switch' && options) {
      const mapper = scope[options.compareTo]
      if (mapper) {
        for (const value of Object.keys(options.fields || {})) {
          if (!mapper.has(value)) issues.push(`${location}: ${options.compareTo} -> ${value}`)
        }
      } else if (options.compareTo) {
        console.log(`${versionString}: unable to find ${options.compareTo} for switch at ${location}`)
      }
      for (const [value, fieldType] of Object.entries(options.fields || {})) {
        visitType(fieldType, scope, location + '/' + value, active)
      }
      if (options.default) visitType(options.default, scope, location + '/default', active)
    } else if (kind === 'array' || kind === 'option') {
      visitType(options && options.type, scope, location + '/type', active)
    } else if (kind === 'registryEntryHolder') {
      visitType(options && options.otherwise && options.otherwise.type, scope, location + '/otherwise', active)
    }
    active.delete(type)
  }

  function visit (value, location) {
    if (Array.isArray(value)) {
      if (typeof value[0] === 'string' && ['container', 'switch', 'array', 'option', 'mapper', 'registryEntryHolder'].includes(value[0])) {
        visitType(value, {}, location)
      } else {
        value.forEach((item, index) => visit(item, location + '/' + index))
      }
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => visit(item, location + '/' + key))
    }
  }

  visit(protocol, versionString)
  assert.deepEqual(issues, [], `${versionString} has switches with undefined mapper values:\n${issues.join('\n')}`)
}

const data = ['attributes', 'biomes', 'commands', 'instruments', 'items', 'materials', 'blocks', 'blockCollisionShapes', 'recipes', 'windows', 'entities', 'protocol', 'version', 'effects', 'enchantments', 'language', 'foods', 'particles', 'blockLoot', 'entityLoot', 'mapIcons', 'tints', 'blockMappings', 'sounds', 'blockStates']

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
            checkProtocolSwitches(instance, versionString)
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
    it('features in features.json are sorted by name', () => {
      const names = require('../../../data/' + type + '/common/features.json').map(f => f.name)
      const sorted = [...names].sort()
      const firstMismatch = names.findIndex((name, i) => name !== sorted[i])
      assert.equal(firstMismatch, -1, `features.json is not sorted by name: "${names[firstMismatch]}" should come after "${sorted[firstMismatch]}". Sorting by name keeps concurrent PRs from conflicting at the end of the file.`)
    })
  })
})
