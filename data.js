const queryString = require('query-string')

const parameters = queryString.parse(window.location.search)

const rawVersion = parameters['v']
const version = rawVersion || '1.13.1'
const rawActive = parameters['d']
const active = rawActive || 'items'

const enums = ['biomes', 'instruments', 'items', 'materials', 'blocks', 'recipes', 'entities', 'protocol', 'windows', 'effects']

const enumsValues = ['biomes', 'instruments', 'items', 'blocks', 'entities', 'protocol', 'windows', 'effects']

module.exports = {
  version: version,
  active: active,
  enums: enums,
  enumsValues: enumsValues
}
