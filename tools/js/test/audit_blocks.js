/* eslint-env mocha */

// checks for duplicates names and jumps in ids

require('./version_iterator')(function (path, versionString) {
  let blocks
  try {
    blocks = require(path + '/blocks')
  } catch (e) {
    console.log('No blocks for version ' + versionString)
  }
  if (blocks) {
    describe('audit blocks ' + versionString, function () {
      it('audit blocks', function () {
        const all = []
        blocks.forEach(block => {
          all[block.id] = block
        })

        const displayNames = {}
        const names = {}
        for (let i = 0; i < all.length; ++i) {
          const block = all[i]
          if (block) {
            if (block.displayName == null) {
              console.log('Missing displayName:', i)
            } else {
              const otherBlock = displayNames[block.displayName]
              if (otherBlock) {
                console.log('Duplicate displayName:', otherBlock.id, 'and', block.id,
                  'both share', block.displayName)
              } else {
                displayNames[block.displayName] = block
              }
            }
            if (block.name == null) {
              console.log('Missing name:', i)
            } else {
              const otherBlock = names[block.name]
              if (otherBlock) {
                console.log('Duplicate name:', otherBlock.id, 'and', block.id,
                  'both share', block.name)
              } else {
                names[block.name] = block
              }
            }
          } else {
            console.log('Missing:', i)
          }
        }
      })
    })
  }
})
