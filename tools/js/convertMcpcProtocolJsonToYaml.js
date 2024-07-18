const { genYAML } = require('protodef-yaml')
const { join } = require('path')
const fs = require('fs')

function addDataPath (version, key, value) {
  const dataPaths = require('../../data/dataPaths.json')
  if (dataPaths.pc[version][key]) return
  dataPaths.pc[version][key] = value
  console.log('Updating datapath for', version, key, value)
  fs.writeFileSync(join(__dirname, '../../data/dataPaths.json'), JSON.stringify(dataPaths, null, 2))
}

function convert (version) {
  let text = '!version: ' + version + '\n\n'
  const protocol = require(`../../data/pc/${version}/protocol.json`)
  for (const state in protocol) {
    const data = protocol[state]
    if (state === 'types') {
      text += '^types:\n'
      text += genYAML(data, 1)
    }
    // 0.30c (stateless)
    if (state === 'toClient') {
      text += '\n^toClient.types:\n'
      text += genYAML(data.types, 1)
    }
    if (state === 'toServer') {
      text += '\n^toServer.types:\n'
      text += genYAML(data.types, 1)
    }
    // Rest of versions have states
    if (data.toClient) {
      text += `\n^${state}.toClient.types:\n`
      text += genYAML(data.toClient.types, 1)
    }
    if (data.toServer) {
      text += `\n^${state}.toServer.types:\n`
      text += genYAML(data.toServer.types, 1)
    }
  }
  const outFile = `../../data/pc/${version}/proto.yml`
  const absPath = fs.realpathSync(`../../data/pc/${version}/`) + '/proto.yml'
  console.log(`Wrote to ${absPath}`)
  fs.writeFileSync(outFile, text)
  addDataPath(version, 'proto', 'pc/' + version)
}

if (process.argv.length < 3) {
  console.log('Usage: node convertMcpcProtocolJsonToYaml.js <version>')
  process.exit(1)
}

const version = process.argv[2]
if (version === 'all') {
  const dataPaths = require('../../data/dataPaths.json')
  for (const version in dataPaths.pc) {
    try {
      convert(version)
    } catch (e) {
      console.log('Failed for', version, e)
    }
  }
} else {
  convert(version)
}
