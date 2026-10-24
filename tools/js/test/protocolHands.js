/* eslint-env mocha */
const assert = require('assert')
const { ProtoDef } = require('protodef')
const protocol = require('../../../data/pc/26.1/protocol.json')

// Every InteractionHand field in pc/26.1 must serialize both named hands to the id vanilla expects.
// A plain varint coerces both names to 0, silently turning an off-hand interaction into a main-hand one.
const handFields = [
  ['play', 'toClient', 'packet_open_book'],
  ['play', 'toServer', 'packet_use_entity'],
  ['play', 'toServer', 'packet_arm_animation'],
  ['play', 'toServer', 'packet_block_place'],
  ['play', 'toServer', 'packet_use_item']
]

describe('pc/26.1 InteractionHand fields', () => {
  for (const [state, direction, packet] of handFields) {
    it(`${packet}.hand writes main_hand and off_hand`, () => {
      const [, fields] = protocol[state][direction].types[packet]
      const proto = new ProtoDef(false)
      proto.addType('hand', fields.find(field => field.name === 'hand').type)
      assert.deepStrictEqual(proto.createPacketBuffer('hand', 'main_hand'), Buffer.from([0]))
      assert.deepStrictEqual(proto.createPacketBuffer('hand', 'off_hand'), Buffer.from([1]))
      assert.strictEqual(proto.parsePacketBuffer('hand', Buffer.from([1])).data, 'off_hand')
    })
  }
})
