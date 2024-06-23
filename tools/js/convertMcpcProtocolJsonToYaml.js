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
  const outFile = `../../data/pc/${version}/proto.yml`
  const absPath = fs.realpathSync(`../../data/pc/${version}/`) + '/proto.yml'
  console.log(`Wrote to ${absPath}`)
  fs.writeFileSync(outFile, text)
}

if (process.argv.length < 3) {
  console.log('Usage: node convertMcpcProtocolJsonToYaml.js <version>')
  process.exit(1)
}
convert(process.argv[2])
