const fs = require('fs')
const cp = require('child_process')
const { globSync } = require('glob')
const version = process.argv[2]
if (!version) {
  console.log('Usage: node extractEntityMetadata.js <version>')
  process.exit(1)
}

if (!fs.existsSync(version)) {
  cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${version} --depth 1`, { stdio: 'inherit' })
}

function getEntityTypes () {
  const entityTypes = fs.readFileSync(`./${version}/client/net/minecraft/world/entity/EntityType.java`, 'utf8')
  const entityTypesLines = entityTypes.split(';')
  const classNameTo = {}
  for (const line of entityTypesLines) {
    if (line.includes('= register(')) {
      // Given the line: public static final EntityType<Allay> ALLAY = register( "allay", EntityType.Builder.<Allay>of(Allay::new, MobCategory.CREATURE).sized(0.35F, 0.6F).clientTrackingRange(8).updateInterval(2) );
      // we extract Allay and "allay"
      const regex = line.match(/EntityType<(.*)> (.*) = register\(\W+"([a-z0-9_]+)"/)
      if (regex) {
        const [, type, , name] = regex
        classNameTo[type] = name
      }
    }
  }
  return classNameTo
}

function getEntityMetadataSerializers () {
  const output = []
  const entityTypes = fs.readFileSync(`./${version}/client/net/minecraft/network/syncher/EntityDataSerializers.java`, 'utf8')
  const entityTypesLines = entityTypes.split(';')
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

const serializers = getEntityMetadataSerializers()
const classNameToRegistryName = getEntityTypes()

const allEntityFiles = globSync(`${version}/**/entity/**/*.java`)
const allEntityFileCodes = Object.fromEntries(allEntityFiles.map(file => [
  file.split(/\\|\//g).pop().replace('.java', ''),
  fs.readFileSync(file, 'utf8')
]))

const entityPreTree = []
const metadatas = {}

for (const file in allEntityFileCodes) {
  const code = allEntityFileCodes[file]
  const lines = code.split(';')
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

    if (line.includes('SynchedEntityData.defineId(')) {
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
  const presentMcDataPath = `../../data/pc/${version}/entities.json`
  const presentMcData = require(presentMcDataPath)
  for (const entry of presentMcData) {
    entry.metadataKeys = flat[entry.name].map(e => e[0].replace('DATA_', '').replace('_ID', '').replace('ID_', '').toLowerCase())
  }
  fs.writeFileSync(presentMcDataPath, JSON.stringify(presentMcData, null, 2))
}

function updateMcDataProtocolJSON () {
  const presentMcDataPath = `../../data/pc/${version}/protocol.json`
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
  // One time code to remap integers to strings in protocol.json for the entityMetadataItem type
  // const metadataItems = mcdata.types.entityMetadataItem[1].fields
  // const next = {}
  // for (const key in metadataItems) {
  //   next[serializers[key]] = metadataItems[key]
  // }
  // mcdata.types.entityMetadataItem[1].fields = next
  fs.writeFileSync(presentMcDataPath, JSON.stringify(mcdata, null, 2))
}

// fs.writeFileSync(`./entityTree.json`, JSON.stringify(tree, null, 2))
// fs.writeFileSync(`./entityFlat.json`, JSON.stringify(flat, null, 2))
updateMcDataEntitiesJSON()
updateMcDataProtocolJSON()
