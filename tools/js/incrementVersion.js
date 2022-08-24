const fs = require('fs')
const { join } = require('path')

const root = join(__dirname, '..', '..')
const data = join(root, 'data')
const platforms = ['bedrock', 'pc']

function getJSON (path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

function writeJSON (path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
}

function alterJSON(path, callback) {
  const jsonContents = getJSON(path)
  if (callback(jsonContents) !== false) {
    writeJSON(path, jsonContents)
  }
}

if (process.argv.length != 5) {
  console.log(`Usage: npm run version <${platforms.join('|')}> {version} {protocol_version}`)
  process.exit(1)
}

const [,, platform, version, protocol] = process.argv;

if (!platforms.includes(platform)) {
  console.log(`Received platform ${platform}, expected one of (${platforms.join(', ')})`)
  process.exit(1)
}

if (fs.existsSync(join(data, platform, version))) {
  console.log(`data/${platform}/${version} already exists`)
  process.exit(1)
}


alterJSON(join(data, 'dataPaths.json'), dataPaths => {
  let latest = null;
  Object.entries(dataPaths[platform]).forEach(([ver, values]) => {
    if (values['proto'] == `${platform}/latest`) {
      latest = ver;
    }
  });

  if (latest === null) {
    console.log('Unable to determine previous version.')
    process.exit(1)
  }

  dataPaths[platform][version] = Object.assign({}, dataPaths[platform][latest])
  dataPaths[platform][version]['version'] = `${platform}/${version}`
  dataPaths[platform][latest]['proto'] = `${platform}/${latest}`
  dataPaths[platform][latest]['types'] = `${platform}/${latest}`
  fs.copyFileSync(
    join(data, platform, 'latest', 'proto.yml'),
    join(data, platform, latest, 'proto.yml'))
  fs.copyFileSync(
    join(data, platform, 'latest', 'types.yml'),
    join(data, platform, latest, 'types.yml'))
})

const protocolVersion = {
  version: protocol,
  minecraftVersion: version,
  majorVersion: version.split('.').slice(0, 2).join('.'),
  releaseType: "release"
}

alterJSON(join(data, platform, 'common', 'protocolVersions.json'), protoVers => {
  protoVers.unshift(protocolVersion)
})

alterJSON(join(data, platform, 'common', 'versions.json'), versions => {
  versions.push(version)
})

fs.mkdirSync(join(data, platform, version))
writeJSON(join(data, platform, version, 'version.json'), protocolVersion)

const protoYml = fs.readFileSync(join(data, platform, 'latest', 'proto.yml'), 'utf-8')
const protoYmlUpdate = protoYml.replace(/!version: [0-9.]+/, `!version: ${version}`)
fs.writeFileSync(join(data, platform, 'latest', 'proto.yml'), protoYmlUpdate, 'utf-8')
