const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', '..', 'data', 'pc', 'common', 'protocolVersions.json')
const arr = JSON.parse(fs.readFileSync(file, 'utf8'))

const startVersion = '1.6.4'
const startIndex = arr.findIndex(e => e.minecraftVersion === startVersion)
if (startIndex === -1) throw new Error('start version not found')
const prevDataVersion = arr[startIndex - 1].dataVersion
let current = prevDataVersion - 1
for (let i = startIndex; i < arr.length; i++) {
  arr[i].dataVersion = current--
}

const keyOrder = ['minecraftVersion', 'version', 'dataVersion', 'usesNetty', 'majorVersion', 'releaseType']
function ordered (obj) {
  const out = {}
  for (const key of keyOrder) if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key]
  for (const key of Object.keys(obj)) if (!Object.prototype.hasOwnProperty.call(out, key)) out[key] = obj[key]
  return out
}

fs.writeFileSync(file, JSON.stringify(arr.map(ordered), null, 2))
