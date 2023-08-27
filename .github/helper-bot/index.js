const fs = require('fs')
const cp = require('child_process')
const helper = require('./github-helper')
const pcManifestURL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
const changelogURL = 'https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs'

const download = (url, dest) => cp.execSync(`curl -L ${url} -o ${dest}`)

function buildFirstIssue (title, result, jarData) {
  const protocolVersion = jarData?.protocol_version || 'Failed to obtain from JAR'
  const name = jarData?.name || result.id
  const date = result.releaseTime

  return {
    title,
    body: `
A new Minecraft Java Edition version is available (as of ${date}), version **${result.id}**
## Official Changelog
* ${changelogURL}
## Protocol Details
(I will close this issue automatically if "${result.id}" is added to data/pc/common/versions.json on "master")
<table>
  <tr><td><b>Name</b></td><td>${name}</td>
  <tr><td><b>Protocol ID</b></td><td>${protocolVersion}</td>
  <tr><td><b>Release Date</b></td><td>${date}</td>
  <tr><td><b>Release Type</b></td><td>${result.type}</td>
  <tr><td><b>Data Version</b></td><td>${jarData?.world_version}</td>
  <tr><td><b>Java Version</b></td><td>${jarData?.java_version}</td>
</table>
<hr/>
🤖 I am a bot, I check for updates every 2 hours without a trigger. You can close this issue to prevent any further updates.
    `
  }
}

const protocolVersions = {
  pc: require('../../data/pc/common/protocolVersions.json'),
  bedrock: require('../../data/bedrock/common/protocolVersions.json')
}
const supportedVersions = {
  pc: require('../../data/pc/common/versions.json'),
  bedrock: require('../../data/bedrock/common/versions.json')
}

async function updateManifestPC () {
  const manifest = await fetch(pcManifestURL).then(res => res.json())
  // fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2))
  const knownVersions = protocolVersions.pc.reduce((acc, cur) => (acc[cur.minecraftVersion] = cur, acc), {})
  const latestVersion = manifest.latest.snapshot
  const latestVersionData = manifest.versions.find(v => v.id === latestVersion)
  const latestVersionIsSnapshot = latestVersionData.type !== 'release'

  const title = `Support Minecraft PC ${latestVersion}`
  const issueStatus = await helper.getIssueStatus(title)

  if (latestVersionIsSnapshot) {
    // don't make issues for snapshots
    if (supportedVersions.pc.includes(latestVersion) || knownVersions[latestVersion]) {
      console.log('Latest version is a known snapshot, no work to do')
      return
    }
  } else {
    if (supportedVersions.pc.includes(latestVersion)) {
      if (issueStatus.open) {
        helper.close(issueStatus.id, `Closing as PC ${latestVersion} is now supported`)
      }
      console.log('Latest PC version is supported.')
      return
    } else if (knownVersions[latestVersion]) {
      console.log(`Latest PC version ${latestVersion} is known in protocolVersions.json, but not in versions.json (protocol version ${knownVersions[latestVersion].version})`)
      return
    } else {
      console.log(`Latest PC version ${latestVersion} is not known in protocolVersions.json, adding and making issue`)
    }
  }

  let versionJson
  try {
    versionJson = await addEntryFor(latestVersion, latestVersionData)
  } catch (e) {
    console.error(e)

    if (latestVersionIsSnapshot) {
      console.warn('Failed to update protocolVersions.json for the snapshot', latestVersion)
    } else {
      console.log('Latest PC version is not supported and we failed to load data. Opening issue...')
      const issuePayload = buildFirstIssue(title, latestVersionData)
      helper.createIssue(issuePayload)

      fs.writeFileSync('./issue.md', issuePayload.body)
      console.log('OK, wrote to ./issue.md', issuePayload)
    }
  }

  if (!latestVersionIsSnapshot && !issueStatus.open && !issueStatus.closed) {
    console.log('Opening issue', versionJson)
    const issuePayload = buildFirstIssue(title, latestVersionData, versionJson)

    helper.createIssue(issuePayload)

    fs.writeFileSync('./issue.md', issuePayload.body)
    console.log('OK, wrote to ./issue.md', issuePayload)
  }

  async function addEntryFor (releaseVersion, releaseData) {
    const latestReleaseManifest = await fetch(releaseData.url).then(res => res.json())
    // Download client jar
    if (!fs.existsSync(`./${releaseVersion}.jar`)) {
      const clientJarUrl = latestReleaseManifest.downloads.client.url
      console.log('Downloading client jar', clientJarUrl)
      download(clientJarUrl, `./${releaseVersion}.jar`)
    }

    // Log the byte size of the client jar
    const clientJarSize = fs.statSync(`./${releaseVersion}.jar`).size
    console.log(`Downloaded client jar ${releaseVersion}.jar (${clientJarSize} bytes), extracting its version.json...`)

    // unzip with tar / unzip, Actions image uses 7z
    if (process.platform === 'win32') cp.execSync(`tar -xf ./${releaseVersion}.jar version.json`)
    else cp.execSync(`7z -y e ./${releaseVersion}.jar version.json`, { stdio: 'inherit' })
    const versionJson = require('./version.json')

    let majorVersion
    try {
      majorVersion = versionJson.id.split('.', 2).join('.')
    } catch (e) {
      console.error('Failed to get major version from version.json.id', versionJson.id, ', falling back to protocolVersions.json latest (may be incorrect)')
      majorVersion = protocolVersions.pc[0].majorVersion
    }

    const newEntry = {
      minecraftVersion: versionJson.id,
      version: versionJson.protocol_version,
      dataVersion: versionJson.world_version,
      usesNetty: true,
      majorVersion,
      releaseType: latestVersionData.type
    }
    console.log('Adding new entry to pc protocolVersions.json', newEntry)
    const updatedProtocolVersions = [newEntry, ...protocolVersions.pc]
    fs.writeFileSync('../../data/pc/common/protocolVersions.json', JSON.stringify(updatedProtocolVersions, null, 2))

    if (process.env.CI) {
      console.log('Committing changes to protocolVersions.json')
      // https://github.com/actions/checkout/pull/1184
      cp.execSync('git config user.name "github-actions[bot]"')
      cp.execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
      cp.execSync('git add ../../data/pc/common/protocolVersions.json')
      cp.execSync(`git commit -m "Add ${versionJson.id} to pc protocolVersions.json"`)
      cp.execSync('git push')
    }

    return versionJson
  }
}

updateManifestPC()
