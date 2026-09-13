/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

function protocol (version) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, `../../../data/pc/${version}/protocol.json`)))
}

function definition (version, direction, packet, name) {
  const packetType = protocol(version).play[direction].types[packet]
  const definition = packetType[1].find(entry => entry.name === name)
  assert(definition, `${version} ${direction} ${packet}.${name} is missing`)
  return definition
}

function field (version, direction, packet, name) {
  const fieldDefinition = definition(version, direction, packet, name)
  assert.strictEqual(fieldDefinition.type[0], 'mapper', `${version} ${packet}.${name} is not a mapper`)
  return fieldDefinition.type[1].mappings
}

describe('PC protocol enum mappings', () => {
  it('keeps client commands separate from player commands', () => {
    assert.deepStrictEqual(field('1.21.4', 'toServer', 'packet_client_command', 'actionId'), {
      0: 'perform_respawn',
      1: 'request_stats'
    })
    assert.deepStrictEqual(field('1.21.4', 'toServer', 'packet_entity_action', 'actionId'), {
      0: 'press_shift_key',
      1: 'release_shift_key',
      2: 'leave_bed',
      3: 'start_sprinting',
      4: 'stop_sprinting',
      5: 'start_horse_jump',
      6: 'stop_horse_jump',
      7: 'open_vehicle_inventory',
      8: 'start_elytra_flying'
    })
  })

  it('scopes legacy client-command values to their removal version', () => {
    const legacy = {
      0: 'perform_respawn',
      1: 'request_stats',
      2: 'open_inventory_achievement'
    }
    const current = {
      0: 'perform_respawn',
      1: 'request_stats'
    }
    assert.deepStrictEqual(field('1.7', 'toServer', 'packet_client_command', 'payload'), legacy)
    assert.deepStrictEqual(field('1.11', 'toServer', 'packet_client_command', 'actionId'), legacy)
    assert.deepStrictEqual(field('16w35a', 'toServer', 'packet_client_command', 'actionId'), legacy)
    assert.deepStrictEqual(field('17w15a', 'toServer', 'packet_client_command', 'actionId'), current)
    assert.deepStrictEqual(field('1.12', 'toServer', 'packet_client_command', 'actionId'), current)
    assert.deepStrictEqual(field('1.21.11', 'toServer', 'packet_client_command', 'actionId'), current)
    assert.deepStrictEqual(field('26.1', 'toServer', 'packet_client_command', 'actionId'), {
      ...current,
      2: 'request_gamerule_values'
    })
  })

  it('uses the historical 1.7 and 1.8 player-command indexes', () => {
    assert.strictEqual(field('1.7', 'toServer', 'packet_entity_action', 'actionId')['3'], 'leave_bed')
    assert.strictEqual(field('1.7', 'toServer', 'packet_entity_action', 'actionId')['6'], 'start_horse_jump')
    assert.deepStrictEqual(field('1.8', 'toServer', 'packet_entity_action', 'actionId'), {
      0: 'press_shift_key',
      1: 'release_shift_key',
      2: 'leave_bed',
      3: 'start_sprinting',
      4: 'stop_sprinting',
      5: 'start_horse_jump',
      6: 'open_vehicle_inventory'
    })
  })

  it('scopes game-event reasons to their introduction versions', () => {
    const reasons17 = field('1.7', 'toClient', 'packet_game_state_change', 'reason')
    const reasons18 = field('1.8', 'toClient', 'packet_game_state_change', 'reason')
    const reasons114 = field('1.14.4', 'toClient', 'packet_game_state_change', 'reason')
    const reasons115 = field('1.15', 'toClient', 'packet_game_state_change', 'reason')
    const reasons1202 = field('1.20.2', 'toClient', 'packet_game_state_change', 'reason')
    const reasons1203 = field('1.20.3', 'toClient', 'packet_game_state_change', 'reason')
    assert.strictEqual(reasons17['10'], undefined)
    assert.strictEqual(reasons18['9'], undefined)
    assert.strictEqual(reasons18['10'], 'guardian_elder_effect')
    assert.strictEqual(reasons114['11'], undefined)
    assert.strictEqual(reasons115['11'], 'immediate_respawn')
    assert.strictEqual(reasons1202['12'], 'limited_crafting')
    assert.strictEqual(reasons1202['13'], undefined)
    assert.strictEqual(reasons1203['13'], 'level_chunks_load_start')
  })

  it('applies game-event transitions to snapshot schemas', () => {
    const reasons17w50a = field('17w50a', 'toClient', 'packet_game_state_change', 'reason')
    const reasons20w13b = field('20w13b', 'toClient', 'packet_game_state_change', 'reason')
    assert.strictEqual(reasons17w50a['9'], undefined)
    assert.strictEqual(reasons17w50a['10'], 'guardian_elder_effect')
    assert.strictEqual(reasons20w13b['11'], 'immediate_respawn')
  })

  it('maps both difficulty packets without changing their wire types', () => {
    const difficulty = {
      0: 'peaceful',
      1: 'easy',
      2: 'normal',
      3: 'hard'
    }
    assert.deepStrictEqual(field('1.21.6', 'toClient', 'packet_difficulty', 'difficulty'), difficulty)
    assert.deepStrictEqual(field('1.21.6', 'toServer', 'packet_set_difficulty', 'newDifficulty'), difficulty)
    assert.strictEqual(definition('1.21.5', 'toClient', 'packet_difficulty', 'difficulty').type[1].type, 'u8')
    assert.strictEqual(definition('1.21.6', 'toClient', 'packet_difficulty', 'difficulty').type[1].type, 'varint')
  })

  it('uses the seven-entry player-command enum from 1.21.6', () => {
    const mappings = field('1.21.6', 'toServer', 'packet_entity_action', 'actionId')
    assert.deepStrictEqual(mappings, {
      0: 'leave_bed',
      1: 'start_sprinting',
      2: 'stop_sprinting',
      3: 'start_horse_jump',
      4: 'stop_horse_jump',
      5: 'open_vehicle_inventory',
      6: 'start_elytra_flying'
    })
  })
})
