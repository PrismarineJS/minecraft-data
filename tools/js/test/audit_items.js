/* eslint-env mocha */

// checks for duplicates names and jumps in ids

require('./version_iterator')(function (path, versionString) {
  let items
  try {
    items = require(path + '/items')
  } catch (e) {
    console.log('No items for version ' + versionString)
  }
  if (items) {
    describe('audit items ' + versionString, function () {
      it('audit items', function () {
        const displayNames = {}
        const names = {}
        let lastItemId = 0
        items.forEach(item => {
          if (item.displayName == null) {
            console.log('Missing displayName:', item.id)
          } else {
            const otherBlock = displayNames[item.displayName]
            if (otherBlock) {
              console.log('Duplicate displayName:', otherBlock.id, 'and', item.id,
                'both share', item.displayName)
            } else {
              displayNames[item.displayName] = item
            }
          }
          if (item.name == null) {
            console.log('Missing name:', item.id)
          } else {
            const otherBlock = names[item.name]
            if (otherBlock) {
              console.log('Duplicate name:', otherBlock.id, 'and', item.id,
                'both share', item.name)
            } else {
              names[item.name] = item
            }
          }
          const delta = item.id - lastItemId
          if (delta !== 1) {
            console.log('jump from', lastItemId, 'to', item.id)
          }
          lastItemId = item.id
        })
      })
    })
  }
})
