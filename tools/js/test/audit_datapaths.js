/* eslint-env mocha */

const fs = require('fs')
const assert = require('assert')

describe('audit dataPaths', function () {
  const dataPaths = require('../../../data/dataPaths.json')
  require('./version_iterator')(function (p, versionString) {
    const [type, version] = versionString.split(' ')
    const dp = dataPaths[type][version]
    const files = fs.readdirSync(p).map(f => f.split('.')[0])
    for (const file of files) {
      assert(dp[file], `missing dataPath for ${type} ${version} ${file}`)
    }
  })
})
