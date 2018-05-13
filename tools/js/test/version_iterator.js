module.exports = forEach

const minecraftTypes = ['pc', 'pe']

function forEach (f) {
  minecraftTypes.forEach(function (type) {
    const versions = require('../../../data/' + type + '/common/versions')
    versions.forEach(function (version) {
      f('../../../data/' + type + '/' + version, type + ' ' + version)
    })
  })
}
