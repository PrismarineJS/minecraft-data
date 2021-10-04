/**
 * This is a utility script that converts the YAML here into ProtoDef schema code
 * You can run this with `npm run build`
 */
const fs = require('fs')
const { join } = require('path')

function getJSON (path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

// Parse the YML files and turn to JSON
function genProtoSchema () {
  const { parse, compile } = require('protodef-yaml')

  // Create the packet_map.yml from proto.yml
  const parsed = parse('./proto.yml')
  const version = parsed['!version']
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

  compile('./proto.yml', 'proto.json')
  return version
}

function convert (ver, path) {
  process.chdir(path || join(__dirname, '../../data/bedrock/' + ver))
  const version = genProtoSchema()
  try { fs.mkdirSync(`../${version}`) } catch {}
  fs.writeFileSync(`../${version}/protocol.json`, JSON.stringify({ types: getJSON('./proto.json') }, null, 2))
  fs.unlinkSync('./proto.json') // remove temp file
  fs.unlinkSync('./packet_map.yml') // remove temp file
  return version
}

// If no argument, build everything
if (!module.parent) {
  if (!process.argv[2]) {
    const versions = require('../../data/dataPaths.json').bedrock
    for (const versionId in versions) {
      console.log('Compiling bedrock protocol', versionId)
      const ver = versions[versionId]
      if (ver.proto) {
        convert(ver.proto.includes('latest') ? 'latest' : versionId)
      }
    }
  } else { // build the specified version
    convert(process.argv[2])
  }
}

module.exports = { convert }
