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

        // Iterate through versions in chronological order
        for (const version of versions) {
          // Skip versions that don't exist in dataPaths
          if (!platformData[version]) continue

          const versionData = platformData[version]

          for (const [dataType, dataPath] of Object.entries(versionData)) {
            // Skip non-version data paths (like "latest" or cross-platform refs)
            const pathParts = dataPath.split('/')
            if (pathParts.length !== 2) continue

            const [dataPathPlatform, dataPathVersion] = pathParts

            // Skip cross-platform references
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
              // Skip flagging pre-releases and release candidates for using older data,
              // as this appears to be intentional behavior (they reuse previous stable data)
              const isPreRelease = version.includes('-pre') || version.includes('-rc')

              // Skip flagging snapshots for using older data, as they are development versions
              const isSnapshot = version.includes('w') && /^\d+w\d+[a-z]?$/.test(version)

              // Skip certain data types that are commonly shared across versions
              const isProtocolType = ['protocol', 'version', 'proto'].includes(dataType)

              // Check if this is a minor release using the same protocol as its major release
              // e.g., 1.10.1 using pc/1.10 protocol when 1.10-pre1 used pc/1.10-pre1
              const isSameBaseMajorVersion = (() => {
                if (!isProtocolType) return false

                // Extract base version (e.g., "1.10" from "1.10.1")
                const currentBaseParts = version.split('.')
                const currentBase = currentBaseParts.slice(0, 2).join('.') // e.g., "1.10"

                // Extract base version from data path (e.g., "1.10" from "pc/1.10")
                const dataPathBaseParts = dataPathVersion.split('.')
                const dataPathBase = dataPathBaseParts.slice(0, 2).join('.') // e.g., "1.10"

                return currentBase === dataPathBase
              })()

              // Only flag clear regressions in stable releases
              if (!isPreRelease && !isSnapshot && !isSameBaseMajorVersion) {
                assert.fail(
                  `Version regression detected in ${platform}:\n` +
                  `  Version: ${version}\n` +
                  `  Data type: ${dataType}\n` +
                  `  Current path: ${dataPath} (index: ${dataPathIndex})\n` +
                  `  Expected at least: ${previousHighest.version} (index: ${previousHighest.index})\n` +
                  '  A newer version should not point to older data than previously seen.'
                )
              }
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
