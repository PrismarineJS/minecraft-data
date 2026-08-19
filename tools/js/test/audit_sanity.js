/* eslint-env mocha */

const fs = require('fs')
const path = require('path')

// sanity checks on data quality
// ref: https://github.com/PrismarineJS/minecraft-data/issues/461

function getIfExist (p) {
  if (fs.existsSync(p)) return require(p)
  return null
}

require('./version_iterator')(function (p, versionString) {
  describe('audit sanity ' + versionString, function () {
    // PC only: bedrock recipes.json has a different format (keys are not item ids)
    const isPc = versionString.startsWith('pc ')

    it('recipe results and keys are present in items.json', function () {
      if (!isPc) return
      const recipes = getIfExist(path.join(p, 'recipes.json'))
      const items = getIfExist(path.join(p, 'items.json'))
      if (!recipes || !items) return
      const ids = new Set(items.map(i => i.id))
      Object.keys(recipes).forEach(key => {
        if (!ids.has(Number(key))) {
          throw new Error('recipe key ' + key + ' has no matching item id in items.json')
        }
        recipes[key].forEach(recipe => {
          if (recipe.result && recipe.result.id !== undefined && !ids.has(recipe.result.id)) {
            throw new Error('recipe ' + key + ' result id ' + recipe.result.id + ' has no matching item in items.json')
          }
        })
      })
    })

    it('defaultState is between minStateId and maxStateId', function () {
      const blocks = getIfExist(path.join(p, 'blocks.json'))
      if (!blocks) return
      blocks.forEach(block => {
        if (block.defaultState !== undefined && block.minStateId !== undefined && block.maxStateId !== undefined) {
          if (block.defaultState < block.minStateId || block.defaultState > block.maxStateId) {
            throw new Error('block ' + block.name + ' defaultState ' + block.defaultState + ' outside [' + block.minStateId + ', ' + block.maxStateId + ']')
          }
        }
      })
    })
  })
})
