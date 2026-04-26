const fs = require('fs')
const github = require('gh-helpers')()
const { join } = require('path')
const { extractPcEntityMetadata } = require('../../tools/js/extractPcEntityMetadata')
const { exec, createInitialPR } = require('./utils')

const artifactsDir = join(__dirname, './artifacts')
const root = join(__dirname, '..', '..')

async function handle (ourPR, genPullNo, version, artifactURL, shouldPull) {
  const branchNameVersion = version.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const branch = ourPR.headBranch || `pc-${branchNameVersion}`
  if (shouldPull) exec('git', ['pull', 'origin'])

  // if external PR:
  // const branch = ourPR.headBranch
  // exec('git', ['remote', 'add', 'fo', ourPR.headCloneURL])
  // exec('git', ['fetch', 'fo', branch])
  // exec('git', ['checkout', '-b', branch, `fo/` + branch])

  try {
    exec('git', ['checkout', branch])
  } catch (err) {
    console.error('Error checking out branch:', err)
    process.exit(1)
  }

  const dataPaths = require('../../data/dataPaths.json')
  const dataPath = dataPaths.pc[version]

  const destDir = join(root, `./data/pc/${version}`)
  if (!fs.existsSync(destDir) || !dataPath) {
    console.warn(`⚠️ Version ${version} not found (checked ${destDir}) ; cannot continue.`, fs.existsSync(destDir), dataPath)
    process.exit(1)
  }

  if (ourPR.body) {
    await github.updateIssue(ourPR.number, {
      body: ourPR.body.replace('<!--minecraft-data-generator-placeholder-->', `- https://github.com/PrismarineJS/minecraft-data-generator/pull/${genPullNo}`)
    })
  }

  console.log('Handling PR:', ourPR)

  fs.mkdirSync(artifactsDir, { recursive: true })

  // https://github.com/PrismarineJS/minecraft-data-generator/actions/runs/17261281146/artifacts/3861320839
  const s = artifactURL.split('github.com/')[1]
  const [ownerName, repoName, _actions, _runs, _runId, _artifacts, artifactId] = s.split('/') // eslint-disable-line
  console.log('Downloading artifacts', { ownerName, repoName, artifactId, artifactsDir })
  await github.artifacts.downloadIdFrom(ownerName, repoName, artifactId, artifactsDir)

  console.log(fs.readdirSync(artifactsDir))

  // Now copy artifacts/${version}/*.json to data/pc/$version/*.json
  const versionArtifactsDir = join(artifactsDir, version)
  for (const file of fs.readdirSync(versionArtifactsDir)) {
    if (file.endsWith('.json')) {
      const src = join(versionArtifactsDir, file)
      const dest = join(destDir, file)
      fs.mkdirSync(destDir, { recursive: true })
      console.log(`copy ${src} => ${dest}`)
      fs.copyFileSync(src, dest)
      dataPath[file.replace('.json', '')] = 'pc/' + version
    }
  }

  // Commit the new dataPath
  fs.writeFileSync(join(root, 'data', 'dataPaths.json'), JSON.stringify(dataPaths, null, 2))

  try {
    process.chdir(join(__dirname, '../../tools/js'))
    extractPcEntityMetadata(version, version, { write: true, cloneIfMissing: true })
  } catch (e) {
    console.log('Failed to extract PC entity metadata', e)
  }

  // Now, we need to commit the changes
  exec('git', ['config', 'user.name', 'github-actions[bot]'])
  exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
  exec('git', ['add', '--all'])
  exec('git', ['commit', '-m', `[Auto] Apply generated data from PrismarineJS/minecraft-data-generator#${genPullNo}`])
  exec('git', ['push', 'origin', branch])
}

async function main (versions, genPullNo, artifactUrl, createPR) {
  const version = versions.at(-1)
  const pr = await github.findPullRequest({ titleIncludes: '🎈', author: null })
  console.log('Found PR', pr)
  if (pr && pr.isOpen) {
    const details = await github.getPullRequest(pr.id)
    console.log('PR', details)
    await handle(details, genPullNo, version, artifactUrl, true)
  } else if (createPR) {
    const pr = await createInitialPR('pc', '(This issue was created for a minecraft-data-generator PR)', {
      version,
      protocolVersion: null
    })
    console.log('Created PR', pr)
    const details = await github.getPullRequest(pr.number)
    console.log('PR', details)
    await handle(details, genPullNo, version, artifactUrl, false)
  } else {
    process.exit(1)
  }
}

main(
  JSON.parse(process.env.TRIGGER_MC_VERSIONS),
  process.env.TRIGGER_PR_NO,
  process.env.TRIGGER_ARTIFACT_URL,
  process.env.CREATE_PR_IF_NONE
)
