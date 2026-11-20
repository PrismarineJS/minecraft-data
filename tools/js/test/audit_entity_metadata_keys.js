/* eslint-env mocha */

const fs = require('fs')
const path = require('path')

// checks that all pc entities from 1.19.4+ have metadataKeys
// ref: https://github.com/PrismarineJS/mineflayer/pull/3713#issuecomment-3193880222

require('./version_iterator')(function (p, versionString) {
  describe('audit entity metadataKeys ' + versionString, function () {
    it('audit entity metadataKeys', function () {
      if (!versionString.startsWith('pc ')) return
      const [major, minor, patch] = versionString.split(' ')[1].split('.').map(Number)
      // metadataKeys only exist from 1.19.4 onward
      const isAtLeast = (major > 1) || (major === 1 && minor > 19) || (major === 1 && minor === 19 && (patch === undefined ? false : patch >= 4))
      if (!isAtLeast) return
      const pFile = path.join(p, 'entities.json')
      if (!fs.existsSync(pFile)) return
      const entities = require(pFile)
      const missing = entities.filter(e => e.metadataKeys === undefined).map(e => e.name)
      if (missing.length > 0) {
        throw new Error('Missing metadataKeys in entities.json for ' + versionString + ': ' + missing.join(', '))
      }
    })
  })
})
