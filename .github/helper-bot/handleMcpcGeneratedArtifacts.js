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

  const branchNameVersion = version.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const branch = `pc-${branchNameVersion}`
  try {
    exec('git', ['checkout', '-b', branch])
  } catch (err) {
    console.error('Error checking out branch:', err)
    process.exit(1)
  }

  const destDir = join(root, `./data/pc/${version}`)
  if (!fs.existsSync(destDir) || !dataPath) {
    console.warn(`⚠️ Version ${version} not found (checked ${destDir}) ; cannot continue.`)
    process.exit(1)
  }

  // Update our PR body
  await github.updateIssue(ourPR.number, {
    body: ourPR.body.replace('<!--minecraft-data-generator-placeholder-->', `- https://github.com/PrismarineJS/minecraft-data-generator/pull/${genPullNo}`)
  })

  console.log('Handling PR:', ourPR)

  // Ensure output dir exists
  fs.mkdirSync(artifactsDir, { recursive: true })

  // Download the artifacts. Since the repo is public we don't need any auth.
  exec('curl', ['-fSL', '--retry', '3', artifactURL, '-o', join(artifactsDir, 'artifacts.zip')])

  // Use 7z to extract only the `version` folder from the artifacts.zip
  // Use 'x' to preserve directories; pass the path inside the archive as an argument
  exec('7z', ['x', join(artifactsDir, 'artifacts.zip'), `${version}/*`, `-o${artifactsDir}`, '-y'])

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
  exec('git', ['push', 'origin', branch])
}

async function main (version, genPullNo, artifactUrl) {
  const prs = await github.findPullRequests({ titleIncludes: '🎈' })
  console.log('Found PRs', prs)
  for (const pr of prs) {
    if (!pr.isOpen) continue
    await handle(pr, genPullNo, version, artifactUrl)
  }
}

main(
  process.env.MC_VERSION,
  process.env.TRIGGER_PR_NO,
  process.env.TRIGGER_ARTIFACT_URL
)
