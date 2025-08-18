const fs = require('fs')
const cp = require('child_process')
const github = require('gh-helpers')()
const exec = (file, args) => (console.log('> ', file, args.join(' ')), cp.execFileSync(file, args, { stdio: 'inherit' }))

const { join } = require('path')
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
  if (!fs.existsSync(destDir)) {
    console.warn(`⚠️ Version ${version} not found (checked ${destDir}) ; cannot continue.`)
    process.exit(1)
  }

  // Update our PR body
  await github.updateIssue(ourPR.number, {
    body: ourPR.body.replace('<!--minecraft-data-generator-placeholder-->', `- https://github.com/PrismarineJS/minecraft-data-generator/pull/${genPullNo}`)
  })

  console.log('Handling PR:', ourPR)

  // Ensure output dir exists
  fs.mkdirSync('./artifacts', { recursive: true })

  // Download the artifacts. Since the repo is public we don't need any auth.
  exec('curl', ['-fSL', '--retry', '3', artifactURL, '-o', './artifacts.zip'])

  // Use 7z to extract only the `version` folder from the artifacts.zip
  // Use 'x' to preserve directories; pass the path inside the archive as an argument
  exec('7z', ['x', './artifacts.zip', `${version}/*`, '-o./artifacts/', '-y'])

  // Now copy artifacts/*.json to data/pc/$version/*.json
  for (const file of fs.readdirSync('./artifacts')) {
    if (file.endsWith('.json')) {
      const src = `./artifacts/${file}`
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
  exec('git', ['add', '--all'])
  exec('git', ['commit', '-m', `[Auto] Apply generated data from PrismarineJS/minecraft-data-generator#${genPullNo}`])
  exec('git', ['push', 'origin', 'HEAD'])
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
