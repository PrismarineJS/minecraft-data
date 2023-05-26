const fs = require('fs')
const cp = require('child_process')
const https = require('https')
const helper = require('./github-helper')
const pcManifestURL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
const changelogURL = 'https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs'

// this is a polyfill for node <18
const fetch = globalThis.fetch || function (url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          ok: true,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        })
      })
    }).on('error', reject)
  })
}
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
  const latestRelease = manifest.latest.release

  const title = `Support Minecraft PC ${latestRelease}`
  const issueStatus = await helper.getIssueStatus(title)

  if (supportedVersions.pc.includes(latestRelease)) {
    if (issueStatus.open) {
      helper.close(issueStatus.id, `Closing as PC ${latestRelease} is now supported`)
    }
    console.log('Latest PC version is supported.')
    return
  } else if (knownVersions[latestRelease]) {
    console.log(`Latest PC version ${latestRelease} is known in protocolVersions.json, but not in versions.json (protocol version ${knownVersions[latestRelease].version})`)
    return
  } else {
    console.log(`Latest PC version ${latestRelease} is not known in protocolVersions.json, adding and making issue`)
  }
  const latestReleaseData = manifest.versions.find(v => v.id === latestRelease)

  // Note: We don't use the below check to track if the version is supported properly or not
  // (data like protocol/blocks/items/etc is present), just to make sure the known protocol version is correct.
  try {
    const latestReleaseManifest = await fetch(latestReleaseData.url).then(res => res.json())
    // Download client jar
    if (!fs.existsSync(`./${latestRelease}.jar`)) {
      const clientJarUrl = latestReleaseManifest.downloads.client.url
      console.log('Downloading client jar', clientJarUrl)
      download(clientJarUrl, `./${latestRelease}.jar`)
    }

    // Log the byte size of the client jar
    const clientJarSize = fs.statSync(`./${latestRelease}.jar`).size
    console.log(`Downloaded client jar ${latestRelease}.jar (${clientJarSize} bytes), extracting its version.json...`)

    // unzip with tar / unzip, Actions image uses 7z
    if (process.platform === 'win32') cp.execSync(`tar -xf ./${latestRelease}.jar version.json`)
    else cp.execSync(`7z -y e ./${latestRelease}.jar version.json`, { stdio: 'inherit' })
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
      releaseType: latestReleaseData.type
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

    if (!issueStatus.open && !issueStatus.closed) {
      console.log('Opening issue', versionJson)
      const issuePayload = buildFirstIssue(title, latestReleaseData, versionJson)

      helper.createIssue(issuePayload)

      fs.writeFileSync('./issue.md', issuePayload.body)
      console.log('OK, wrote to ./issue.md', issuePayload)
    }
  } catch (e) {
    console.error(e)

    console.log('Latest PC version is not supported and we failed to load data. Opening issue...')
    const issuePayload = buildFirstIssue(title, latestReleaseData)
    helper.createIssue(issuePayload)

    fs.writeFileSync('./issue.md', issuePayload.body)
    console.log('OK, wrote to ./issue.md', issuePayload)
  }
}

updateManifestPC()
