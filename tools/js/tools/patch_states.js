const fs = require('fs')
const path = require('path')
const request = require('request')

function getJSON (url, cb) {
  request.get({
    url: url,
    json: true,
    headers: { 'User-Agent': 'request' }
  }, (err, res, data) => {
    if (err || res.statusCode !== 200) {
      cb(null)
    } else {
      cb(data)
    }
  })
}

require('../test/version_iterator')((p, versionString) => {
  if (!versionString.startsWith('pc')) return
  const blockFile = path.join(p, 'blocks.json')
  if (!fs.existsSync(blockFile)) {
    console.log('No blocks for version ' + versionString)
    return
  }
  const blocks = require(blockFile)
  const version = versionString.split(' ')[1]

  getJSON(`https://apimon.de/mcdata/${version}/blocks.json`, (data) => {
    if (!data) {
      console.log('No api for ' + version)
      return
    }
    for (const block of blocks) {
      const apiblock = data['minecraft:' + block.name]
      if (!apiblock) {
        console.log('Missing block in api: ' + block.name)
        continue
      }

      // Update states
      block.states = []
      if (apiblock.properties) {
        for (const [prop, values] of Object.entries(apiblock.properties)) {
          let type = 'enum'
          if (values[0] === 'true') type = 'bool'
          if (values[0] === '0') type = 'int'
          const state = {
            name: prop,
            type,
            num_values: values.length
          }
          if (type === 'enum') {
            state.values = values
          }
          block.states.push(state)
        }
      }

      // Set defaultState
      block.defaultState = block.minState
      for (const state of apiblock.states) {
        if (state.default) {
          block.defaultState = state.id
          break
        }
      }
    }

    fs.writeFileSync(blockFile, JSON.stringify(blocks, null, 2))
  })
})
