const fs = require('fs')
const browserify = require('browserify')
const through = require('through')

const blockedFiles = ['steve.json', 'blockMappings.json', 'blockCollisionShapes.json', 'blocksJ2B.json', 'blocksB2J.json']
const stubs = { 'blockCollisionShapes.json': '{"blocks":{},"shapes":{}}' }

const bundle = fs.createWriteStream('bundle.js')
const bundler = browserify()
bundler.transform(function (file, options) {
  for (const blockedFile of blockedFiles) {
    if (file.endsWith(blockedFile)) {
      console.log('Blocked', file)
      return through(function write() {
        // no op
      }, function end () {
        this.queue(stubs[blockedFile] || '[]')
        this.queue(null)
      })
    }
  }
  return through()
}, { global: true })
bundler.add('./index.js')
bundler.bundle().pipe(bundle)
