module.exports = forEach

const path = require('path')

const minecraftTypes = ['pc', 'bedrock']

function forEach (f) {
  minecraftTypes.forEach(function (type) {
    getVersionsToTest(type).forEach(function (version) {
      f(path.join(__dirname, '../../../data', type, version), type + ' ' + version)
    })
  })
}

function getVersionsToTest (minecraftType) {
  const dataPathsForMinecraftType = require('../../../data/dataPaths.json')[minecraftType]

  const versions = new Set()
  for (const pathsForVersion of Object.values(dataPathsForMinecraftType)) {
    for (const versionPath of Object.values(pathsForVersion)) {
      const [mcType, mcVer] = versionPath.split('/')
      if (mcType === minecraftType) {
        // TODO: We need to just replace this with the latest version
        //       as a string with numbers although more than likely
        //       this is already going to be already, so probably unnecessary
        if (mcVer === 'latest') continue
        versions.add(mcVer)
      }
    }
  }

  return versions
}
