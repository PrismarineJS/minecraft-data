const fs = require('fs')
const cp = require('child_process')
const github = require('gh-helpers')()
const exec = (cmd) => github.mock ? console.log('> ', cmd) : (console.log('> ', cmd), cp.execSync(cmd, { stdio: 'inherit' }))
const pcManifestURL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
const changelogURL = 'https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs'

const download = (url, dest) => exec(`curl -L ${url} -o ${dest}`)

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

async function createInitialPull (edition, issueUrl, { version, protocolVersion }) {
  exec('cd tools/js && npm install')
  exec(`cd tools/js && npm run version ${edition} ${version} ${protocolVersion}`)
  const branchNameVersion = version.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase()
  const branchName = `${edition}-${branchNameVersion}`
  const title = `Initial data for ${edition} ${version}`
  exec(`git checkout -b ${branchName}`)
  exec(`git add --all`)
  exec(`git commit -m "${title}"`)
  exec(`git push origin ${branchName}`)
  //     createPullRequest(title: string, body: string, fromBranch: string, intoBranch?: string): Promise<{ number: number, url: string }>;
  const pr = await github.createPullRequest(title, `${title}.\n\nRef: ${issueUrl}`, branchName, 'master')
  return pr
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
  const issueStatus = await github.findIssue({ titleIncludes: title }) || {}

  if (latestVersionIsSnapshot) {
    // don't make issues for snapshots
    if (supportedVersions.pc.includes(latestVersion) || knownVersions[latestVersion]) {
      console.log('Latest version is a known snapshot, no work to do')
      return
    }
  } else {
    if (supportedVersions.pc.includes(latestVersion)) {
      if (issueStatus.isOpen) {
        github.close(issueStatus.id, `Closing as PC ${latestVersion} is now supported`)
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
      github.createIssue(issuePayload)

      fs.writeFileSync('./issue.md', issuePayload.body)
      console.log('OK, wrote to ./issue.md', issuePayload)
    }
  }

  if (!latestVersionIsSnapshot && !issueStatus.isOpen && !issueStatus.isClosed) {
    console.log('Opening issue', versionJson)
    const issuePayload = buildFirstIssue(title, latestVersionData, versionJson)

    const issue = await github.createIssue(issuePayload)

    fs.writeFileSync('./issue.md', issuePayload.body)
    console.log('Created issue', issue)

    // Now create an initial PR with the new version data
    const pr = await createInitialPull('pc', issue.url, {
      minecraftVersion: versionJson.id,
      version: latestVersion,
      protocolVersion: versionJson.protocol_version
    })
    console.log('Created PR', pr)
    // Ask minecraft-data-generator to handle new update
    const dispatchPayload = {
      owner: 'PrismarineJS',
      repo: 'minecraft-data-generator',
      workflow: 'handle-mcdata-update.yml',
      branch: 'main',
      inputs: {
        version: latestVersion
      }
    }
    console.log('Sending workflow dispatch', dispatchPayload)
    await github.sendWorkflowDispatch(dispatchPayload)
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
    if (versionJson.id && versionJson.id.includes('.')) {
      majorVersion = versionJson.id.split('.', 2).join('.')
    } else {
      console.error(`Version '${versionJson.id}' appears to be a snapshot (no dot in name). Using the last known majorVersion in protocolVersions.json for this version (may be incorrect)`)
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
