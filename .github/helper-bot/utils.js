const cp = require('child_process')
const github = require('gh-helpers')()

function exec (file, args = [], options = {}) {
  const opts = { stdio: 'inherit', ...options }
  console.log('> ', file, args.join(' '), options.cwd ? `(cwd: ${options.cwd})` : '')
  return github.mock ? undefined : cp.execFileSync(file, args, opts)
}

const sanitizeBranch = (branchName) => branchName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()

async function createInitialPR (edition, issueUrl, { version, protocolVersion }) {
  exec('npm', ['install'], { cwd: 'tools/js' })
  exec('npm', ['run', 'version', edition, version, protocolVersion], { cwd: 'tools/js' })
  exec('npm', ['run', 'build'], { cwd: 'tools/js' })
  const branchNameVersion = sanitizeBranch(version)
  const branchName = `${edition}-${branchNameVersion}`
  const title = `🎈 Add Minecraft ${edition} ${version} data`
  // First, delete any existing branch
  try {
    exec('git', ['branch', '-D', branchName])
  } catch (e) {
    // Branch doesn't exist, ignore error
  }
  exec('git', ['checkout', '-b', branchName])
  exec('git', ['config', 'user.name', 'github-actions[bot]'])
  exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
  exec('git', ['add', '--all'])
  exec('git', ['commit', '--allow-empty', '-m', title])
  exec('git', ['push', 'origin', branchName, '--force'])
  const body = `
This automated PR sets up the relevant boilerplate for Minecraft ${edition} version ${version}. Fixes ${issueUrl}.

Related:
- Issue: ${issueUrl}
- Protocol Version: ${protocolVersion}
<!--minecraft-data-generator-placeholder-->

* You can help contribute to this PR by opening a PR against this <code branch>${branchName}</code> branch instead of <code>master</code>.
`
  const pr = await github.createPullRequest(title, body, branchName, 'master')
  pr.branchName = branchName
  return pr
}

module.exports = { createInitialPR, exec }
