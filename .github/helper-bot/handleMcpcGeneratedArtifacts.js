const fs = require('fs')
const cp = require('child_process')
const github = require('gh-helpers')()
const { join } = require('path')

function exec (file, args, options = {}) {
  const opts = { stdio: 'inherit', ...options }
  console.log('> ', file, args.join(' '), options.cwd ? `(cwd: ${options.cwd})` : '')
  return github.mock ? undefined : cp.execFileSync(file, args, opts)
}

const artifactsDir = join(__dirname, './artifacts')
const root = join(__dirname, '..', '..')

async function handle (ourPR, genPullNo, version, artifactURL) {
  const dataPaths = require('../../data/dataPaths.json')
  const dataPath = dataPaths.pc[version]

  const branch = ourPR.headBranch
  exec('git', ['remote', 'add', 'fo', ourPR.headCloneURL])
  exec('git', ['pull', 'fo', branch])
  exec('git', ['checkout', branch])

  const destDir = join(root, `./data/pc/${version}`)
  if (!fs.existsSync(destDir) || !dataPath) {
    console.warn(`⚠️ Version ${version} not found (checked ${destDir}) ; cannot continue.`)
    process.exit(1)
  }

  await github.updateIssue(ourPR.number, {
    body: ourPR.body.replace('<!--minecraft-data-generator-placeholder-->', `- https://github.com/PrismarineJS/minecraft-data-generator/pull/${genPullNo}`)
  })

  console.log('Handling PR:', ourPR)

  fs.mkdirSync(artifactsDir, { recursive: true })

  // https://github.com/PrismarineJS/minecraft-data-generator/actions/runs/17261281146/artifacts/3861320839
  const s = artifactURL.split('github.com/')[1]
  const [ownerName, repoName, _actions, _runs, _runId, _artifacts, artifactId] = s
  await github.downloadArtifactIdFrom(ownerName, repoName, artifactId, artifactsDir)

  console.log(fs.readdirSync(artifactsDir, { recursive: true }))

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

  // Now, we need to commit the changes
  exec('git', ['config', 'user.name', 'github-actions[bot]'])
  exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
  exec('git', ['add', '--all'])
  exec('git', ['commit', '-m', `[Auto] Apply generated data from PrismarineJS/minecraft-data-generator#${genPullNo}`])
  exec('git', ['push', 'fo', branch])
}

async function main (versions, genPullNo, artifactUrl) {
  const version = versions.at(-1)
  const pr = await github.findPullRequest({ titleIncludes: '🎈', author: null })
  console.log('Found PR', pr)
  if (pr && pr.isOpen) {
    const details = await github.getPullRequest(pr.id)
    console.log('PR', details)
    await handle(details, genPullNo, version, artifactUrl)
  } else {
    console.log('No PR found with "🎈" prefix')
    process.exit(1)
  }
}

main(
  JSON.parse(process.env.TRIGGER_MC_VERSIONS),
  process.env.TRIGGER_PR_NO,
  process.env.TRIGGER_ARTIFACT_URL
)
