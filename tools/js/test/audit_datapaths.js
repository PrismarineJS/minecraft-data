/* eslint-env mocha */

const fs = require('fs')
const { join } = require('path')
const assert = require('assert')

describe('audit dataPaths', function () {
  const dataPaths = require('../../../data/dataPaths.json')
  it('should have a dataPath for each file', function () {
    require('./version_iterator')(function (p, versionString) {
      const [type, version] = versionString.split(' ')
      const dp = dataPaths[type][version]
      const files = fs.readdirSync(p).map(f => f.split('.')[0])
      for (const file of files) {
        assert(dp[file], `missing dataPath for ${type} ${version} ${file}`)
      }
    })
  })

  it('dataPath should point to valid files', function () {
    for (const version in dataPaths) {
      for (const type in dataPaths[version]) {
        const dp = dataPaths[version][type]
        for (const file in dp) {
          const path = dp[file]
          const p = join(__dirname, '../../../data/' + path + '/' + file)
          const exists = fs.existsSync(p + '.json') || fs.existsSync(p + '.yml')
          assert(exists, `missing file for ${type} ${version} ${file}, path: ${p}`)
        }
      }
    }
  })
})
