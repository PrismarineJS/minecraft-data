const { genYAML } = require('protodef-yaml')
const fs = require('fs')

function convert (version) {
  let text = '!version: ' + version + '\n\n'
  const protocol = require(`../../data/pc/${version}/protocol.json`)
  for (const state in protocol) {
    const data = protocol[state]
    if (state === 'types') {
      text += '^types:\n'
      text += genYAML(data, 1)
    }
    if (data.toClient) {
      text += `^${state}.toClient.types:\n`
      text += genYAML(data.toClient.types, 1)
    }
    if (data.toServer) {
      text += `^${state}.toServer.types:\n`
      text += genYAML(data.toServer.types, 1)
    }
  }
  fs.writeFileSync(`../../data/pc/${version}/proto.yml`, text)
}

if (process.argv.length < 3) {
  console.log('Usage: node convertMcpcProtocolJsonToYaml.js <version>')
  process.exit(1)
}
convert(process.argv[2])