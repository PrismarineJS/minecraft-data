/* eslint-env mocha */

const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('dataPaths.json consistency with versions.json', function () {
  const dataPathsFile = path.join(__dirname, '../../../data/dataPaths.json')
  const dataPaths = require(dataPathsFile)

  const editions = ['pc', 'bedrock']

  editions.forEach(function (edition) {
    describe(`${edition} versions consistency`, function () {
      const versionsFile = path.join(
        __dirname,
        `../../../data/${edition}/common/versions.json`
      )
      assert.ok(
        fs.existsSync(versionsFile),
        `Missing versions.json for ${edition}`
      )

      const versionsList = require(versionsFile)
      const manifestVersions = Object.keys(dataPaths[edition] || {})

      it('all manifest versions are present in versions.json', function () {
        const missing = manifestVersions.filter(
          (v) => !versionsList.includes(v)
        )
        assert.deepStrictEqual(
          missing,
          [],
          `The following ${edition} versions are in dataPaths.json but not in versions.json: ${missing.join(', ')}`
        )
      })

      it('no extra versions exist in versions.json compared to manifest', function () {
        const extra = versionsList.filter((v) => !manifestVersions.includes(v))
        assert.deepStrictEqual(
          extra,
          [],
          `The following ${edition} versions are in versions.json but not in dataPaths.json: ${extra.join(', ')}`
        )
      })
    })
  })
})
