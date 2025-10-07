/* eslint-env mocha */

const assert = require('assert')

/**
 * Gets the chronological index of a version from the versions.json file
 * Returns -1 if version is not found, or null for non-version strings like "latest"
 */
function getVersionIndex (platform, version) {
  // Skip non-version entries like "latest"
  if (version === 'latest') return null

  try {
    const versions = require(`../../../data/${platform}/common/versions.json`)
    return versions.indexOf(version)
  } catch (error) {
    return -1
  }
}

describe('audit version regression in dataPaths', function () {
  const dataPaths = require('../../../data/dataPaths.json')

  const platforms = ['pc', 'bedrock']

  platforms.forEach(function (platform) {
    if (!dataPaths[platform]) return

    describe(`${platform} version regression`, function () {
      it('should not have newer versions pointing to older data than previously seen', function () {
        const platformData = dataPaths[platform]

        // Load the chronological version order from versions.json
        const versions = require(`../../../data/${platform}/common/versions.json`)

        // Track the highest version index seen for each data type
        const highestVersionIndexForDataType = {}

        // Iterate through versions in chronological order, but only process ones in dataPaths
        for (const version of versions) {
          if (!platformData[version]) continue

          const versionData = platformData[version]

          for (const [dataType, dataPath] of Object.entries(versionData)) {
            // Skip non-version data paths (like "latest" or cross-platform refs)
            const pathParts = dataPath.split('/')
            if (pathParts.length !== 2) continue

            const [dataPathPlatform, dataPathVersion] = pathParts

            // Skip cross-platform references (e.g., bedrock data pointing to pc data)
            if (dataPathPlatform !== platform) continue

            // Get the chronological index of the data path version
            const dataPathIndex = getVersionIndex(platform, dataPathVersion)

            // Skip if version not found in versions.json (like "latest")
            if (dataPathIndex === null || dataPathIndex === -1) continue

            // Initialize tracking for this data type if not seen before
            if (!highestVersionIndexForDataType[dataType]) {
              highestVersionIndexForDataType[dataType] = {
                version: dataPath,
                index: dataPathIndex
              }
              continue
            }

            // Check if current data path is older than the highest we've seen
            const previousHighest = highestVersionIndexForDataType[dataType]
            if (dataPathIndex < previousHighest.index) {
              assert.fail(
                `Version regression detected in ${platform}:\n` +
                `  Version: ${version}\n` +
                `  Data type: ${dataType}\n` +
                `  Current path: ${dataPath} (index: ${dataPathIndex})\n` +
                `  Expected at least: ${previousHighest.version} (index: ${previousHighest.index})\n` +
                '  A newer version should not point to older data than previously seen.'
              )
            }

            // Update the highest version if current is newer
            if (dataPathIndex > previousHighest.index) {
              highestVersionIndexForDataType[dataType] = {
                version: dataPath,
                index: dataPathIndex
              }
            }
          }
        }
      })
    })
  })
})
