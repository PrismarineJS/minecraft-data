const fs = require('fs')
const { join } = require('path')

const data = join(__dirname, '..', '..', 'data')

function getJSON (path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

function writeJSON (path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
}

function alterJSON (path, callback) {
  const jsonContents = getJSON(path)
  if (callback(jsonContents) !== false) {
    writeJSON(path, jsonContents)
  }
}

function pcProtocol (version, protocol) {
  throw new Error('Not Implemented')
}

function bedrockProtocol (version, protocol) {
  const dataRoot = join(data, 'bedrock')
  if (fs.existsSync(join(data, 'bedrock', version))) {
    console.log(`data/bedrock/${version} already exists`)
    process.exit(1)
  }

  const protocolVersion = {
    version: parseInt(protocol),
    minecraftVersion: version,
    majorVersion: version.split('.').slice(0, 2).join('.'),
    releaseType: 'release'
  }

  alterJSON(join(data, 'dataPaths.json'), dataPaths => {
    let latest = null
    const paths = dataPaths.bedrock
    Object.entries(paths).forEach(([ver, values]) => {
      if (values.proto === 'bedrock/latest') {
        latest = ver
      }
    })

    if (latest === null) {
      console.log('Unable to determine previous version.')
      process.exit(1)
    }

    paths[version] = Object.assign({}, paths[latest])
    paths[version].version = `bedrock/${version}`
    paths[version].protocol = `bedrock/${version}`
    paths[latest].proto = `bedrock/${latest}`
    paths[latest].types = `bedrock/${latest}`
    fs.copyFileSync(
      join(dataRoot, 'latest', 'proto.yml'),
      join(dataRoot, latest, 'proto.yml'))
    fs.copyFileSync(
      join(dataRoot, 'latest', 'types.yml'),
      join(dataRoot, latest, 'types.yml'))
  })

  alterJSON(join(dataRoot, 'common', 'protocolVersions.json'), protoVers => {
    protoVers.unshift(protocolVersion)
  })

  alterJSON(join(dataRoot, 'common', 'versions.json'), versions => {
    versions.push(version)
  })

  fs.mkdirSync(join(dataRoot, version))
  writeJSON(join(dataRoot, version, 'version.json'), protocolVersion)

  const protoYml = fs.readFileSync(join(dataRoot, 'latest', 'proto.yml'), 'utf-8')
  const protoYmlUpdate = protoYml.replace(/!version: [0-9.]+/, `!version: ${version}`)
  fs.writeFileSync(join(dataRoot, 'latest', 'proto.yml'), protoYmlUpdate, 'utf-8')
}

const platforms = {
  bedrock: bedrockProtocol,
  pc: pcProtocol
}

if (process.argv.length !== 5) {
  console.log(`Usage: npm run version <${Object.keys(platforms).join('|')}> {version} {protocol_version}`)
  process.exit(1)
}

const [,, platform, version, protocol] = process.argv

if (platforms[platform] === undefined) {
  console.log(`Received platform "${platform}", expected one of (${Object.keys(platforms).join(', ')})`)
  process.exit(1)
}

platforms[platform](version, protocol)
