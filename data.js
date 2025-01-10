module.exports = () => {
  const parameters = Object.fromEntries(new URLSearchParams(window.location.search))

  const rawVersion = parameters.v
  const version = rawVersion || '1.21.4'
  const rawActive = parameters.d
  const active = rawActive || 'items'

  const enums = ['biomes', 'instruments', 'items', 'materials', 'blocks', 'recipes', 'entities', 'protocol', 'windows', 'effects']

  const enumsValues = ['biomes', 'instruments', 'items', 'blocks', 'entities', 'protocol', 'windows', 'effects']

  return {
    version,
    active,
    enums,
    enumsValues
  }
}
