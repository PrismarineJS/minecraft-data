module.exports = forEach

const path = require('path')

const minecraftTypes = ['pc', 'bedrock']

function forEach (f) {
  minecraftTypes.forEach(function (type) {
    const versions = require('../../../data/' + type + '/common/versions')
    versions.forEach(function (version) {
      f(path.join(__dirname, '../../../data', type, version), type + ' ' + version)
    })
  })
}
