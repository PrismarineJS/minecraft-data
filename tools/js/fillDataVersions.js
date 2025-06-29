const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', '..', 'data', 'pc', 'common', 'protocolVersions.json')
const arr = JSON.parse(fs.readFileSync(file, 'utf8'))

let current = arr.find(e => typeof e.dataVersion === 'number')?.dataVersion || 0
for (const entry of arr) {
  if (typeof entry.dataVersion === 'number') {
    current = entry.dataVersion
  } else {
    current -= 1
    entry.dataVersion = current
  }
}

const keyOrder = ['minecraftVersion', 'version', 'dataVersion', 'usesNetty', 'majorVersion', 'releaseType']
function ordered (obj) {
  const out = {}
  for (const key of keyOrder) if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key]
  for (const key of Object.keys(obj)) if (!Object.prototype.hasOwnProperty.call(out, key)) out[key] = obj[key]
  return out
}

const formatted = JSON.stringify(arr.map(ordered), null, 2)
fs.writeFileSync(file, formatted)
