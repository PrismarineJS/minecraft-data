/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '../../..')
const dataRoot = path.join(root, 'data')
const pcDataRoot = path.join(dataRoot, 'pc')
const dataPaths = require('../../../data/dataPaths.json')
const registryFiles = {
  'minecraft:block': 'blocks',
  'minecraft:item': 'items',
  'minecraft:entity_type': 'entities',
  'minecraft:worldgen/biome': 'biomes',
  'minecraft:enchantment': 'enchantments'
}
const resourceLocation = /^[a-z0-9_.-]+:[a-z0-9/._-]+$/

function assertObject (value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
}

function assertSorted (values, label) {
  assert.deepStrictEqual(values, values.slice().sort(), `${label} must be sorted`)
}

function auditTagDocument (tags, options = {}) {
  const label = options.label || 'tags.json'
  const official = options.official || false
  const registryMembers = options.registryMembers || {}

  assertObject(tags, label)
  const registries = Object.keys(tags)
  assertSorted(registries, `${label} registry keys`)

  for (const registry of registries) {
    assert(resourceLocation.test(registry), `${label}: invalid registry ${registry}`)
    if (official) assert(registry.startsWith('minecraft:'), `${label}: non-vanilla registry ${registry}`)
    const tagMap = tags[registry]
    assertObject(tagMap, `${label} ${registry}`)

    const tagNames = Object.keys(tagMap)
    assert(tagNames.length > 0, `${label} ${registry} must contain at least one named tag`)
    assertSorted(tagNames, `${label} ${registry} tag keys`)

    for (const tagName of tagNames) {
      assert(resourceLocation.test(tagName), `${label}: invalid tag ${tagName}`)
      if (official) assert(tagName.startsWith('minecraft:'), `${label}: non-vanilla tag ${tagName}`)
      const members = tagMap[tagName]
      assert(Array.isArray(members), `${label} ${tagName} must map to an array`)
      assertSorted(members, `${label} ${tagName} members`)
      assert.equal(new Set(members).size, members.length, `${label} ${tagName} has duplicate members`)

      for (const member of members) {
        assert.equal(typeof member, 'string', `${label} ${tagName} has a non-string member`)
        assert(!member.startsWith('#'), `${label} ${tagName} contains unresolved tag ${member}`)
        assert(resourceLocation.test(member), `${label} ${tagName} has invalid member ${member}`)
        if (official) assert(member.startsWith('minecraft:'), `${label}: non-vanilla member ${member}`)
        if (registryMembers[registry]) {
          assert(registryMembers[registry].has(member), `${label} ${tagName} has dangling member ${member}`)
        }
      }
    }
  }

  if (official) {
    for (const required of ['minecraft:block', 'minecraft:item']) {
      assert(Object.prototype.hasOwnProperty.call(tags, required),
        `${label}: missing required registry ${required}`)
    }
  }
}

function namesForRegistry (dataPath, registry, label) {
  const fileName = registryFiles[registry]
  if (!fileName) return null

  const target = dataPath[fileName]
  assert(target, `${label}: missing ${fileName} dataPath for ${registry}`)
  const file = path.join(dataRoot, target, fileName + '.json')
  assert(fs.existsSync(file), `${label}: missing ${file}`)
  const entries = JSON.parse(fs.readFileSync(file))
  assert(Array.isArray(entries), `${label}: ${fileName}.json must be an array`)

  return new Set(entries.map(entry => {
    assert(entry && typeof entry.name === 'string', `${label}: ${fileName}.json entry has no name`)
    return entry.name.includes(':') ? entry.name : 'minecraft:' + entry.name
  }))
}

function findTagsFiles (dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      findTagsFiles(file, files)
    } else if (entry.name === 'tags.json') {
      files.push(path.resolve(file))
    }
  }
  return files
}

function getPcDataPaths (allDataPaths) {
  return allDataPaths.pc || {}
}

describe('audit tags', function () {
  it('keeps dataPaths and repository tags files consistent', function () {
    const referenced = new Set()

    for (const version in getPcDataPaths(dataPaths)) {
      const dataPath = dataPaths.pc[version]
      if (!dataPath.tags) continue

      const label = `pc ${version}`
      const tagsFile = path.resolve(dataRoot, dataPath.tags, 'tags.json')
      assert(fs.existsSync(tagsFile), `${label}: missing ${tagsFile}`)
      referenced.add(tagsFile)

      const tags = JSON.parse(fs.readFileSync(tagsFile))
      const registryMembers = {}
      for (const registry of Object.keys(tags)) {
        const names = namesForRegistry(dataPath, registry, label)
        if (names) registryMembers[registry] = names
      }
      auditTagDocument(tags, { label, official: true, registryMembers })
    }

    for (const tagsFile of findTagsFiles(pcDataRoot)) {
      assert(referenced.has(tagsFile), `tags file is not referenced by dataPaths: ${tagsFile}`)
    }
  })

  it('does not apply the Java tag contract to non-PC data paths', function () {
    const paths = getPcDataPaths({
      pc: {},
      bedrock: { future: { tags: 'bedrock/future' } }
    })
    assert.deepStrictEqual(paths, {})
  })

  function validTags () {
    return {
      'minecraft:block': {
        'minecraft:mineable/axe': ['minecraft:oak_log'],
        'minecraft:mineable/pickaxe': ['minecraft:granite', 'minecraft:stone']
      },
      'minecraft:fluid': {
        'minecraft:water': ['minecraft:flowing_water', 'minecraft:water']
      },
      'minecraft:item': {
        'minecraft:pickaxes': ['minecraft:diamond_pickaxe']
      }
    }
  }

  function members () {
    return {
      'minecraft:block': new Set(['minecraft:granite', 'minecraft:oak_log', 'minecraft:stone']),
      'minecraft:item': new Set(['minecraft:diamond_pickaxe'])
    }
  }

  it('accepts sorted data and structurally audits unmapped registries', function () {
    auditTagDocument(validTags(), { official: true, registryMembers: members() })
  })

  it('rejects registries without named tags while preserving empty member arrays', function () {
    const tags = validTags()
    tags['minecraft:block'] = {}

    assert.throws(
      () => auditTagDocument(tags, { official: true }),
      /must contain at least one named tag/
    )

    tags['minecraft:block'] = { 'minecraft:incorrect_for_diamond_tool': [] }
    auditTagDocument(tags, { official: true })
  })

  it('audits PC artifacts for required block and item registries', function () {
    const tags = validTags()
    delete tags['minecraft:block']

    assert.throws(
      () => auditTagDocument(tags, { label: 'pc fixture', official: true }),
      /missing required registry minecraft:block/
    )
  })

  it('leaves the goat horn instrument registry structurally audited and unmapped', function () {
    assert.equal(namesForRegistry({}, 'minecraft:instrument', 'test'), null)
    const baseTags = validTags()
    const tags = {
      'minecraft:block': baseTags['minecraft:block'],
      'minecraft:fluid': baseTags['minecraft:fluid'],
      'minecraft:instrument': {
        'minecraft:goat_horns': ['minecraft:ponder_goat_horn']
      },
      'minecraft:item': baseTags['minecraft:item']
    }
    auditTagDocument(tags, { official: true })
  })

  it('rejects malformed resource locations', function () {
    assert.throws(
      () => auditTagDocument({ 'minecraft:bad path': {} }),
      /invalid registry/
    )
    assert.throws(
      () => auditTagDocument({
        'minecraft:block': { 'minecraft:bad path': [] }
      }),
      /invalid tag/
    )
    assert.throws(
      () => auditTagDocument({
        'minecraft:block': { 'minecraft:stone': ['minecraft:bad path'] }
      }),
      /invalid member/
    )
  })

  it('rejects non-vanilla namespaces in official data', function () {
    assert.throws(
      () => auditTagDocument({ 'example:block': {} }, { official: true }),
      /non-vanilla registry/
    )
    assert.throws(
      () => auditTagDocument({
        'minecraft:block': { 'example:mineable/pickaxe': [] }
      }, { official: true }),
      /non-vanilla tag/
    )
    assert.throws(
      () => auditTagDocument({
        'minecraft:block': { 'minecraft:mineable/pickaxe': ['example:stone'] }
      }, { official: true }),
      /non-vanilla member/
    )
  })

  it('rejects unsorted registry keys', function () {
    const tags = {
      'minecraft:item': {},
      'minecraft:block': {}
    }
    assert.throws(() => auditTagDocument(tags), /registry keys must be sorted/)
  })

  it('rejects unsorted tag keys', function () {
    const tags = validTags()
    tags['minecraft:block'] = {
      'minecraft:mineable/pickaxe': ['minecraft:stone'],
      'minecraft:mineable/axe': ['minecraft:oak_log']
    }
    assert.throws(() => auditTagDocument(tags), /tag keys must be sorted/)
  })

  it('rejects unsorted member arrays', function () {
    const tags = validTags()
    tags['minecraft:block']['minecraft:mineable/pickaxe'] = ['minecraft:stone', 'minecraft:granite']
    assert.throws(() => auditTagDocument(tags), /members must be sorted/)
  })

  it('rejects duplicate members in PC tag documents', function () {
    const tags = validTags()
    tags['minecraft:block']['minecraft:mineable/pickaxe'] = ['minecraft:stone', 'minecraft:stone']
    assert.throws(() => auditTagDocument(tags, { label: 'pc fixture', official: true }), /duplicate members/)
  })

  it('rejects unresolved tag members', function () {
    const tags = validTags()
    tags['minecraft:block']['minecraft:mineable/pickaxe'] = ['#minecraft:base_stone_overworld']
    assert.throws(() => auditTagDocument(tags), /unresolved tag/)
  })

  it('rejects dangling members for mapped registries', function () {
    const tags = validTags()
    tags['minecraft:block']['minecraft:mineable/pickaxe'] = ['minecraft:andesite', 'minecraft:stone']
    assert.throws(
      () => auditTagDocument(tags, { registryMembers: members() }),
      /dangling member minecraft:andesite/
    )
  })
})

module.exports = { auditTagDocument }
