/* eslint-env mocha */

const fs = require('fs')
const path = require('path')

const versionToNumber = (ver) => {
  const [x, y = '0', z = '0'] = ver.split('.')
  return +`${x.padStart(2, '0')}${(parseInt(y).toString().padStart(2, '0'))}${parseInt(z).toString().padStart(2, '0')}`
}

describe('audit dataRenames', function () {
  const dataRenamesPath = require.resolve('../../../data/pc/common/dataRenames.json')
  delete require.cache[dataRenamesPath]
  const dataRenames = require(dataRenamesPath)
  it('should not have missing data', function () {
    let previous
    require('./version_iterator')(function (p, versionString) {
      if (!versionString.startsWith('pc ')) return
      const ver = versionString.split(' ')[1]
      if (versionToNumber(ver) < versionToNumber('1.8')) return

      let items
      let pFile = path.join(p, 'items.json')
      if (fs.existsSync(pFile)) {
        items = JSON.parse(fs.readFileSync(pFile))
      }
      let blocks
      pFile = path.join(p, 'blocks.json')
      if (fs.existsSync(pFile)) {
        blocks = JSON.parse(fs.readFileSync(pFile))
      }

      const pickData = {
        items,
        blocks
      }

      const current = {}
      for (const [key, data] of Object.entries(pickData)) {
        if (!data) continue
        current[key] = Object.entries(data).map(([, v]) => v.name)
      }
      if (previous) {
        for (const [key] of Object.entries(current)) {
          if (!previous[key]) continue
          // console.log('check', ver, key)
          const removed = previous[key].filter(v => !current[key].includes(v))
          const added = current[key].filter(v => !previous[key].includes(v))
          if (removed.length || added.length) {
            const handledRemovedInRenamed = dataRenames[ver]?.[key]?.map(([oldName]) => oldName)
            const notHandled = removed.filter(v => !handledRemovedInRenamed?.includes(v))
            const handledForNoReason = handledRemovedInRenamed?.filter(v => !removed.includes(v))
            const incorrectlyHandled = dataRenames[ver]?.[key]?.filter(([, newName]) => !current[key].includes(newName))
            // use commented code to easily add new dataRenames
            if (notHandled.length) {
              console.log(`Not handled in renamed: ${ver} ${key}`, notHandled)
              console.log('new', added)
              // dataRenames[ver] ??= {}
              // dataRenames[ver][key] ??= []
              // dataRenames[ver][key].push(...notHandled.map(v => [v, '']))
              throw new Error('Not handled in renamed')
            }
            if (handledForNoReason?.length) {
              console.log(`Handled for no reason: ${ver} ${key} ${handledForNoReason.join(', ')}`)
              console.log('new', added)
              // dataRenames[ver][key] = dataRenames[ver][key].filter(([oldName]) => !handledForNoReason.includes(oldName))
              throw new Error('Handled for no reason')
            }
            if (incorrectlyHandled?.length) {
              console.log(`Incorrectly handled: ${ver} ${key} ${incorrectlyHandled.map(([, newName]) => newName).join(', ')}`)
              console.log('new', added)
              throw new Error('Incorrectly handled')
            }
            // diffs[ver] ??= {}
            // diffs[ver][key] = { removed, added }
          }
        }
      }
      previous = current
    })
    // fs.writeFileSync(dataRenamesPath, JSON.stringify(dataRenames, null, 4), 'utf8')
  })
})
