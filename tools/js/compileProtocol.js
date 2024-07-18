/**
 * This is a utility script that converts the YAML here into ProtoDef schema code
 * You can run this with `npm run build`
 */
const fs = require('fs')
const { join } = require('path')
const { parse, compile } = require('protodef-yaml')

function getJSON (path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

// Parse the YML files and turn to JSON
function genProtoSchema (createPacketMap) {
  // Create the packet_map.yml from proto.yml
  const parsed = parse('./proto.yml')
  const version = parsed['!version']

  if (createPacketMap) {
    // On bedrock the packet maps are created automatically here
    const packets = []
    for (const key in parsed) {
      if (key.startsWith('%container')) {
        const [, name] = key.split(',')
        if (name.startsWith('packet_')) {
          const children = parsed[key]
          const packetName = name.replace('packet_', '')
          const packetID = children['!id']
          packets.push([packetID, packetName, name])
        }
      }
    }
    let l1 = ''
    let l2 = ''
    for (const [id, name, fname] of packets) {
      l1 += `      0x${id.toString(16).padStart(2, '0')}: ${name}\n`
      l2 += `      if ${name}: ${fname}\n`
    }
    // TODO: skip creating packet_map.yml and just generate the ProtoDef map JSON directly
    const t = `#Auto-generated from proto.yml, do not modify\n!import: types.yml\nmcpe_packet:\n   name: varint =>\n${l1}\n   params: name ?\n${l2}`
    fs.writeFileSync('./packet_map.yml', t)
  }

  const json = compile('./proto.yml')
  fs.rmSync('./packet_map.yml', { force: true }) // temp file
  return [version, json]
}

function visitor (key, value) {
  // Convert decimal to hex in protocol.json for packet mapper fields
  if ((key === 'packet') && (value?.[1]?.[0]?.name === 'name')) {
    const mapper = value[1][0].type[1].mappings
    for (const key in mapper) {
      if (key.startsWith('0x')) continue
      mapper['0x' + Number(key).toString(16).padStart(2, '0')] = mapper[key]
      delete mapper[key]
    }
  }
  return value
}

function convert (edition, ver, path) {
  process.chdir(path || join(__dirname, `../../data/${edition}/${ver}`))
  const [version, json] = genProtoSchema(edition === 'bedrock')
  fs.mkdirSync(`../${version}`, { recursive: true })
  if (edition === 'bedrock') {
    fs.writeFileSync(`../${version}/protocol.json`, JSON.stringify({ types: json }, visitor, 2))
  } else if (edition === 'pc') {
    fs.writeFileSync(`../${version}/protocol.json`, JSON.stringify(json, visitor, 2))
  }
  return version
}

function validate (edition, ver, path) {
  process.chdir(path || join(__dirname, `../../data/${edition}/${ver}`))
  console.log(process.cwd())
  const [version, json] = genProtoSchema(edition === 'bedrock')

  const expected = edition === 'bedrock'
    ? JSON.stringify({ types: json }, visitor, 2)
    : JSON.stringify(json, visitor, 2)

  // If you crash here, no protocol.json was generated - run `npm run build`
  const actual = JSON.stringify(getJSON(`../${version}/protocol.json`), null, 2)

  // Make sure the protocol_expected.json file equals the protocol.json file; otherwise the JSON must be rebuilt
  if (expected !== actual) {
    throw Error(`${ver} (${version}) / protocol.json is desynced from yaml, please run 'npm run build'`)
  }

  console.log('ok', `../${version}/protocol.json`)
  return version
}

const dataPaths = require('../../data/dataPaths.json')
function all (fn) {
  for (const edition in dataPaths) {
    const versions = dataPaths[edition]
    for (const versionId in versions) {
      console.log('⏳', fn.name, 'protocol for', edition, versionId)
      const paths = versions[versionId]
      if (paths.proto) {
        fn(edition, versionId, join(__dirname, '../../data/' + paths.proto))
      }
    }
  }
}

// If no argument, build everything
if (!module.parent) {
  if (!process.argv[2]) {
    all(convert)
  } else { // build the specified version
    convert(process.argv[2], process.argv[3])
  }
}

module.exports = { convert, validate, all }
