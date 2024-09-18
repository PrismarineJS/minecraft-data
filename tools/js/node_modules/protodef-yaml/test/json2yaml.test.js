const { compile, genYAML } = require('protodef-yaml')
const assert = require('assert')

describe('json2yaml', function () {
  it('basic conversion', function () {
    const yaml = genYAML({
      integer: 'i32',
      someContainer: ['container', [
        { name: 'SomeField', type: 'bool' }
      ]]
    }, 0)
    assert.strictEqual(yaml, 'integer: i32\nsomeContainer:\n   SomeField: bool\n')
  })
  let text = ''
  it('convert JSON into YAML with structured outputs', function () {
    const protocol = require('./json/mcpc.json')
    for (const state in protocol) {
      const data = protocol[state]
      if (state === 'types') {
        text += `^types:\n`
        text += genYAML(data, 1)
      }
      if (data.toClient) {
        text += `^${state}.toClient.types:\n`
        text += genYAML(data.toClient.types, 1)
      }
      if (data.toServer) {
        text += `^${state}.toServer.types:\n`
        text += genYAML(data.toServer.types, 1)
      }
    }
    assert(text)
  })
  it('can turn that YAML back to JSON', () => {
    console.log('ok to json')
    const newJson = compile({ main: text })
    assert(newJson)
  })
})



