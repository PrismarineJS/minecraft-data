/* eslint-env mocha */
const protocolTools = require('../compileProtocol')

describe('protocol yaml', () => {
  it('should be valid and in sync with json', () => {
    protocolTools.all(protocolTools.validate)
  })
})
