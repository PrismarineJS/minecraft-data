const fs = require('fs')
const browserify = require('browserify')
const through = require('through')

const blockedFiles = ['steve.json', 'blockMappings.json', 'blockCollisionShapes.json', 'blocksJ2B.json', 'blocksB2J.json', 'blocks_models.json', 'blocks_states.json', 'entityLoot.json', 'blockLoot.json', 'language.json', 'blockStates.json', 'commands.json']
const stubs = { 'blockCollisionShapes.json': '{"blocks":{},"shapes":{}}' }

function len(file) {
  return fs.statSync(file).size
}

const bundle = fs.createWriteStream('bundle.js')
const bundler = browserify()
const files = []
bundler.transform(function (file, options) {
  for (const blockedFile of blockedFiles) {
    if (file.endsWith(blockedFile)) {
      console.log('Blocked', file)
      return through(function write () {
        // no op
      }, function end () {
        this.queue(stubs[blockedFile] || '[]')
        this.queue(null)
      })
    }
  }
  console.log('Using', file, len(file), 'bytes')
  files.push([len(file), file])
  return through()
}, { global: true })
bundler.add('./index.js')
bundler.bundle().pipe(bundle)
.addListener('finish', () => {
  console.log('Biggest: ', files.sort((a, b) => b[0] - a[0]))
})
