const fs = require('fs')
const { join } = require('path')

const rootPath = join(__dirname, '..', '..')
const data = join(__dirname, '..', '..', 'data')

function getJSON (path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

function writeJSON (path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
}

// Reads and updates the JSON after processing in callback
function alterJSON (path, callback) {
  const jsonContents = getJSON(path)
  if (callback(jsonContents) !== false) {
    writeJSON(path, jsonContents)
  }
}

function bumpReadmeVersion (edition, version) {
  const readmePath = join(rootPath, 'README.md')
  let readmeContents = fs.readFileSync(readmePath, 'utf-8')
  if (!readmeContents.includes(version)) {
    if (edition === 'pc') readmeContents = readmeContents.replace('\n<!--NEXT PC-->', `, ${version}\n<!--NEXT PC-->`)
    if (edition === 'bedrock') readmeContents = readmeContents.replace('\n<!--NEXT BEDROCK-->', `, ${version}\n<!--NEXT BEDROCK-->`)
  }
  fs.writeFileSync(readmePath, readmeContents, 'utf-8')
}

function updateProtocol (edition, version, protocolVersionNumber) {
  const dataRoot = join(data, edition)
  const protocolVersionsPath = join(dataRoot, 'common', 'protocolVersions.json')
  const versionsPath = join(dataRoot, 'common', 'versions.json')
  const versionPath = join(dataRoot, version, 'version.json')

  const protocolVersionsEntry = {
    version: parseInt(protocolVersionNumber),
    minecraftVersion: version,
    majorVersion: version.split('.').slice(0, 2).join('.'),
    releaseType: 'release'
  }

  let didUpdateProtocol = false

  // Move the latest/proto.yml to its associated folder defined in the !version meta field
  const latestProtoPath = join(dataRoot, 'latest', 'proto.yml')
  const protoYml = fs.readFileSync(latestProtoPath, 'utf-8')
  const oldProtoVersion = protoYml.match(/!version: ([0-9.]+)/)[1]
  // Check if $oldVersion/proto.yml already exists
  const oldProtoPath = join(dataRoot, oldProtoVersion, 'proto.yml')
  if (fs.existsSync(oldProtoPath)) {
    console.log(`Can't move ${latestProtoPath} to ${oldProtoPath} because the file already exists.`)
  } else {
    fs.copyFileSync(latestProtoPath, oldProtoPath)
    if (edition === 'bedrock') {
      fs.copyFileSync(join(dataRoot, 'latest', 'types.yml'), join(dataRoot, oldProtoVersion, 'types.yml'))
    }
    didUpdateProtocol = true
    // Update references to the old version in the dataPaths.json file
    alterJSON(join(data, 'dataPaths.json'), dataPaths => {
      let latestVersionData
      for (const v in dataPaths[edition]) {
        const e = dataPaths[edition][v]
        // if .proto points to latest, update it to the old version
        if (e.proto === `${edition}/latest`) {
          e.proto = `${edition}/${oldProtoVersion}`
        }
        latestVersionData = structuredClone(e) // eslint-disable-line
      }
      if (!dataPaths[edition][version]) {
        dataPaths[edition][version] = latestVersionData
      }
      latestVersionData.proto = `${edition}/latest`
      latestVersionData.protocol = `${edition}/${version}`
      latestVersionData.version = `${edition}/${version}`
    })
  }

  // Update commons/protocolVersions.json (pc does this auto with cron)
  alterJSON(protocolVersionsPath, protoVers => {
    if (!protoVers.find(v => v.version === protocolVersionsEntry.version)) {
      protoVers.unshift(protocolVersionsEntry)
    }
  })
  // Update commons/version.json
  alterJSON(versionsPath, versions => {
    if (!versions.includes(version)) {
      versions.push(version)
    }
  })

  // Update the $version/version.json file
  fs.mkdirSync(join(dataRoot, version), { recursive: true })
  if (!fs.existsSync(versionPath)) {
    writeJSON(versionPath, protocolVersionsEntry)
  }

  // Update the '!version' meta field in the latest/proto.yml
  if (didUpdateProtocol) {
    const protoYmlUpdate = protoYml.replace(/!version: [0-9.]+/, `!version: ${version}`)
    fs.writeFileSync(join(dataRoot, 'latest', 'proto.yml'), protoYmlUpdate, 'utf-8')
  }
}

const platforms = {
  bedrock: updateProtocol,
  pc: updateProtocol
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

platforms[platform](platform, version, protocol)
bumpReadmeVersion(platform, version)
