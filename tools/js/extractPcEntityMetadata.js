#!/usr/bin/env node
const fs = require('fs')
const cp = require('child_process')
const { globSync } = require('glob')

/**
 * Normalize decompiler output into an array of "statements"/lines.
 * @param {string} raw
 * @returns {string[]}
 */
function prepLines (raw) {
  const lines = raw.replaceAll(' {\n', ' {;\n').split(';')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.includes('static final') && !line.includes(' = ')) {
      const varName = line.split(' ').pop()
      for (let j = 0; j < lines.length; j++) {
        const line2 = lines[j].trim()
        if (line2.startsWith(varName + ' = ')) {
          lines[i] = line.replace(varName, line2)
          lines[j] = ''
        }
      }
    }
  }
  return lines
}

/**
 * Read entity types from the client EntityType.java and return mappings.
 * @param {string} versionDir
 * @returns {[Record<string,string>, Record<string,string>]}
 */
function getEntityTypes (versionDir) {
  const entityTypes = fs.readFileSync(`${versionDir}/client/net/minecraft/world/entity/EntityType.java`, 'utf8')
  const entityTypesLines = prepLines(entityTypes)
  const classNameTo = {}
  const nameToClass = {}
  for (const line of entityTypesLines) {
    if (line.includes('= register(')) {
      // Given the line: public static final EntityType<Allay> ALLAY = register( "allay", EntityType.Builder.<Allay>of(Allay::new, MobCategory.CREATURE).sized(0.35F, 0.6F).clientTrackingRange(8).updateInterval(2) );
      // we extract Allay and "allay"
      const regex = line.match(/EntityType<(.*)> (.*) = register\(\W*"([a-z0-9_]+)"/)
      if (regex) {
        const [, type, , name] = regex
        classNameTo[type] = name
        nameToClass[name] = type
      }
    }
  }
  return [classNameTo, nameToClass]
}

/**
 * Read EntityDataSerializers.java and return serializer names in order.
 * @param {string} versionDir
 * @returns {string[]}
 */
function getEntityMetadataSerializers (versionDir) {
  const output = []
  const entityTypes = fs.readFileSync(`${versionDir}/client/net/minecraft/network/syncher/EntityDataSerializers.java`, 'utf8')
  const entityTypesLines = prepLines(entityTypes)
  for (const line of entityTypesLines) {
    if (line.includes('registerSerializer')) {
      // From:       registerSerializer(BYTE);
      // We extract: BYTE
      const regex = line.match(/ {2}registerSerializer\((.*)\)/)
      if (regex) {
        const [, type] = regex
        output.push(type)
      }
    }
  }
  return output.map(e => e.toLowerCase())
}

/**
 * Main function to extract and optionally update mcdata files.
 * @param {string} version - directory name for extracted src (e.g. "1.20")
 * @param {string} [mcdataVersion] - mcdata version to update (defaults to version)
 * @param {{write?:boolean, cloneIfMissing?:boolean}} [opts]
 * @returns {{tree:object, flat:object, serializers:string[], classNameToRegistryName:object, entityNameToClass:object, metadatas:object}}
 */
function extractPcEntityMetadata (version, mcdataVersion = version, opts = {}) {
  if (!version) {
    throw new Error('Usage: extractPcEntityMetadata(version, [mcdataVersion])')
  }
  const write = opts.write !== false
  const cloneIfMissing = opts.cloneIfMissing !== false

  if (!fs.existsSync(version)) {
    if (!cloneIfMissing) {
      throw new Error(`Version directory "${version}" does not exist`)
    }
    cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${version} --depth 1`, { stdio: 'inherit' })
  }

  const serializers = getEntityMetadataSerializers(version)
  const [classNameToRegistryName, entityNameToClass] = getEntityTypes(version)

  const allEntityFiles = globSync(`${version}/**/entity/**/*.java`)
  const allEntityFileCodes = Object.fromEntries(allEntityFiles.map(file => [
    file.split(/\\|\//g).pop().replace('.java', ''),
    fs.readFileSync(file, 'utf8')
  ]))

  const entityPreTree = []
  const metadatas = {}

  for (const file in allEntityFileCodes) {
    const code = allEntityFileCodes[file]
    const lines = prepLines(code)
    let lastClass
    for (const line of lines) {
      let lineWithoutGenerics = line.replace(/<.*>/g, '')
      const bloatMods = ['abstract', 'static']
      for (const mod of bloatMods) lineWithoutGenerics = lineWithoutGenerics.replace(` ${mod} `, ' ')

      if (lineWithoutGenerics.includes('public class ')) {
        const className = lineWithoutGenerics.split('public class ')[1]?.split(' ')[0]
        lastClass = className
        const extend = lineWithoutGenerics.split('extends ')[1]?.split(' ')[0]
        if (className === file) {
          if (extend) entityPreTree.push([extend, file])
          else entityPreTree.push([file])
        } else if (extend === file) {
          lastClass = `${file}.${className}`
          entityPreTree.push([file, lastClass])
        }
      }

      if (line.match(/SynchedEntityData\..*defineId\(/)) {
        // from:    private static final EntityDataAccessor<Sniffer.State> DATA_STATE = SynchedEntityData.defineId(Sniffer.class, EntityDataSerializers.SNIFFER_STATE);
        // extract: DATA_STATE, SNIFFER_STATE
        const r = line.match(/> ([A-Z_0-9]+) = .*EntityDataSerializers.([A-Z_0-9]+)/s)
        if (r) {
          const [, data, serializer] = r
          ; (metadatas[lastClass] ??= []).push([data, serializer])
        } else {
          throw new Error('Failed to parse line: ' + line)
        }
      }
    }
  }

  const tree = {}
  const flat = {}
  const handledNames = []
  function build (ele, root = tree, arr = []) {
    const name = classNameToRegistryName[ele]
    const metadata = metadatas[ele]
    root[ele] = { children: {}, name, metadata }
    if (name) flat[name] = arr.concat(metadata ?? [])
    handledNames.push(ele)
    for (const [key, val] of entityPreTree) {
      if (key === ele) {
        build(val, root[key].children, arr.concat(metadata ?? []))
      }
    }
  }
  build('Entity')

  for (const key in classNameToRegistryName) {
    if (!handledNames.includes(key)) throw new Error('Unhandled entity ' + key)
  }

  function updateMcDataEntitiesJSON () {
    const presentMcDataPath = `../../data/pc/${mcdataVersion}/entities.json`
    const presentMcData = require(presentMcDataPath)
    for (const entry of presentMcData) {
      const cls = entityNameToClass[entry.name]
      const regName = classNameToRegistryName[cls]
      entry.metadataKeys = (flat[regName] || []).map(e => e[0].replace('DATA_', '').replace('_ID', '').replace('ID_', '').toLowerCase())
    }
    fs.writeFileSync(presentMcDataPath, JSON.stringify(presentMcData, null, 2))
  }

  function updateMcDataProtocolJSON () {
    const presentMcDataPath = `../../data/pc/${mcdataVersion}/protocol.json`
    const mcdata = require(presentMcDataPath)
    const mapper = { type: 'varint', mappings: {} }
    for (let i = 0; i < serializers.length; i++) {
      mapper.mappings[i] = serializers[i].toLowerCase()
    }
    mcdata.types.entityMetadata[1].type[1] = [
      { name: 'key', type: 'u8' },
      { name: 'type', type: ['mapper', mapper] },
      { name: 'value', type: ['entityMetadataItem', { compareTo: 'type' }] }
    ]
    fs.writeFileSync(presentMcDataPath, JSON.stringify(mcdata, null, 2))
  }

  if (write) {
    updateMcDataEntitiesJSON()
    updateMcDataProtocolJSON()
  }

  return {
    tree,
    flat,
    serializers,
    classNameToRegistryName,
    entityNameToClass,
    metadatas,
    entityPreTree
  }
}

// Expose functions for use as a library
module.exports = {
  extractPcEntityMetadata,
  prepLines,
  getEntityTypes,
  getEntityMetadataSerializers
}

// If run directly from the CLI, call the function with process.argv
if (require.main === module) {
  const version = process.argv[2]
  const mcdataVersion = process.argv[3] || process.argv[2]
  if (!version) {
    console.log('Usage: node extractEntityMetadata.js <codeVersion> [mcdataVersion]')
    process.exit(1)
  }

  try {
    extractPcEntityMetadata(version, mcdataVersion, { write: true, cloneIfMissing: true })
    // finished successfully
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}
