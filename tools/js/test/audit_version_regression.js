/* eslint-env mocha */

const assert = require('assert')

/**
 * Converts a version string to a comparable integer
 * Handles semantic versioning like "1.20.1", "1.19", snapshots like "20w13b", etc.
 * Returns null for non-version strings like "latest" or cross-platform refs
 */
function versionToComparableInteger (versionPath) {
  // Skip non-version entries like "latest" or cross-platform references
  const pathParts = versionPath.split('/')
  if (pathParts.length !== 2) return null

  const [, version] = pathParts

  // Skip if this is a cross-platform reference (e.g., "pc/1.17" in bedrock data)
  // We'll validate this by checking if the version string looks like a version
  if (version === 'latest') return null

  // Handle snapshot versions like "20w13b", "17w15a", etc.
  // For snapshots, we'll try to extract a meaningful comparison number
  if (version.includes('w') && /^\d+w\d+[a-z]?$/.test(version)) {
    // Snapshot format: YYwWWx where YY=year, WW=week, x=optional letter
    const match = version.match(/^(\d+)w(\d+)([a-z]?)$/)
    if (match) {
      let year = parseInt(match[1])
      const week = parseInt(match[2])
      const letter = match[3] ? match[3].charCodeAt(0) - 96 : 0 // a=1, b=2, etc.

      // Convert 2-digit year to 4-digit year for proper comparison
      // Years 17-99 are 2017-2099, years 00-16 are 2000-2016
      if (year < 100) {
        if (year >= 17) {
          year += 2000
        } else {
          year += 2000
        }
      }

      // Map snapshots to their approximate release version for comparison
      // This is a rough mapping based on Minecraft development timeline
      let approximateRelease = 1000000000 // Default to 1.0.0 base

      if (year === 2017) {
        // 17w* snapshots are for 1.13
        approximateRelease = 1012500000 // Between 1.12 and 1.13
      } else if (year === 2018) {
        // 18w* snapshots are for 1.13
        approximateRelease = 1012900000 // Close to 1.13
      } else if (year === 2019) {
        // 19w* snapshots are for 1.14-1.15
        if (week < 30) {
          approximateRelease = 1013900000 // 1.14 snapshots
        } else {
          approximateRelease = 1014900000 // 1.15 snapshots
        }
      } else if (year === 2020) {
        // 20w* snapshots are for 1.16-1.17
        if (week < 30) {
          approximateRelease = 1015900000 // 1.16 snapshots
        } else {
          approximateRelease = 1016900000 // 1.17 snapshots
        }
      } else if (year === 2021) {
        // 21w* snapshots are for 1.17-1.18
        if (week < 30) {
          approximateRelease = 1016900000 // 1.17 snapshots
        } else {
          approximateRelease = 1017900000 // 1.18 snapshots
        }
      } else if (year >= 2022) {
        // Later snapshots - rough approximation
        const majorVersion = Math.max(18, year - 2004) // Very rough
        approximateRelease = 1000000000 + majorVersion * 1000000 + 900000
      } else {
        // Earlier snapshots (2016 and before)
        approximateRelease = 1009000000 + (year - 2015) * 1000000
      }

      // Add week and letter offset to distinguish between snapshots in same version
      return approximateRelease + week * 100 + letter
    }
  }

  // Handle release candidates and pre-releases
  let cleanVersion = version
  let suffix = 0

  if (version.includes('-pre')) {
    const parts = version.split('-pre')
    cleanVersion = parts[0]
    suffix = parseInt(parts[1]) || 0
  } else if (version.includes('-rc')) {
    const parts = version.split('-rc')
    cleanVersion = parts[0]
    suffix = 1000 + (parseInt(parts[1]) || 0) // RC gets higher priority than pre
  }

  // Handle special version formats like "0.30c"
  if (cleanVersion.match(/^\d+\.\d+[a-z]$/)) {
    const match = cleanVersion.match(/^(\d+)\.(\d+)([a-z])$/)
    if (match) {
      const major = parseInt(match[1])
      const minor = parseInt(match[2])
      const letter = match[3].charCodeAt(0) - 96 // a=1, b=2, etc.
      return major * 1000000 + minor * 10000 + letter * 100 + suffix
    }
  }

  // Handle standard semantic versioning (1.20.1, 1.19, 1.16.220, etc.)
  const versionParts = cleanVersion.split('.').map(part => parseInt(part) || 0)

  // Create comparable integer accommodating large version numbers
  // Use a more flexible approach that can handle versions like 1.16.220
  let comparable = 0
  for (let i = 0; i < Math.min(versionParts.length, 4); i++) {
    // Use progressively smaller multipliers: 1000000000, 1000000, 1000, 1
    const multiplier = Math.pow(1000, 3 - i)
    comparable += versionParts[i] * multiplier
  }

  return comparable + suffix
}

describe('audit version regression in dataPaths', function () {
  const dataPaths = require('../../../data/dataPaths.json')

  const platforms = ['pc', 'bedrock']

  platforms.forEach(function (platform) {
    if (!dataPaths[platform]) return

    describe(`${platform} version regression`, function () {
      it('should not have newer versions pointing to older data than previously seen', function () {
        const platformData = dataPaths[platform]

        // Get all versions and sort them by their comparable integer
        const versions = Object.keys(platformData)
        const sortedVersions = versions
          .map(version => ({
            version,
            comparable: versionToComparableInteger(`${platform}/${version}`)
          }))
          .filter(item => item.comparable !== null)
          .sort((a, b) => a.comparable - b.comparable)

        // Track the highest version seen for each data type
        const highestVersionForDataType = {}

        // Iterate through versions in chronological order
        for (const { version } of sortedVersions) {
          const versionData = platformData[version]

          for (const [dataType, dataPath] of Object.entries(versionData)) {
            const dataPathComparable = versionToComparableInteger(dataPath)

            // Skip non-version data paths (like "latest" or cross-platform refs)
            if (dataPathComparable === null) continue

            // Check if this data path is from the same platform
            const [dataPathPlatform] = dataPath.split('/')
            if (dataPathPlatform !== platform) continue

            // Initialize tracking for this data type if not seen before
            if (!highestVersionForDataType[dataType]) {
              highestVersionForDataType[dataType] = {
                version: dataPath,
                comparable: dataPathComparable
              }
              continue
            }

            // Check if current data path is older than the highest we've seen
            const previousHighest = highestVersionForDataType[dataType]
            if (dataPathComparable < previousHighest.comparable) {
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
                const dataPathVersion = dataPath.split('/')[1]
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
                  `  Current path: ${dataPath} (comparable: ${dataPathComparable})\n` +
                  `  Expected at least: ${previousHighest.version} (comparable: ${previousHighest.comparable})\n` +
                  '  A newer version should not point to older data than previously seen.'
                )
              }
            }

            // Update the highest version if current is newer
            if (dataPathComparable > previousHighest.comparable) {
              highestVersionForDataType[dataType] = {
                version: dataPath,
                comparable: dataPathComparable
              }
            }
          }
        }
      })
    })
  })
})
