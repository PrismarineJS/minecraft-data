/* eslint-env mocha */

const assert = require('assert')
const cp = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

describe('extractSlotComponents.js command injection regression', function () {
  const scriptPath = path.join(__dirname, '../extractSlotComponents.js')

  it('rejects a version containing shell metacharacters without executing them', function () {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'mcdata-extract-test-'))
    const markerFile = path.join(cwd, 'pwned')

    const result = cp.spawnSync('node', [scriptPath, `1.21; touch ${markerFile}`], { cwd, encoding: 'utf8' })

    assert.notStrictEqual(result.status, 0)
    assert.match(result.stderr, /Invalid version/)
    assert.strictEqual(fs.existsSync(markerFile), false)

    fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('accepts an ordinary dotted version label', function () {
    const version = '1.21.4'
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'mcdata-extract-test-'))
    // Pre-create the expected source dir so the script skips the git clone entirely.
    fs.mkdirSync(path.join(cwd, `mcsrc-${version}`))

    const result = cp.spawnSync('node', [scriptPath, version], { cwd, encoding: 'utf8' })

    assert.doesNotMatch(result.stderr, /Invalid version/)

    fs.rmSync(cwd, { recursive: true, force: true })
  })
})
