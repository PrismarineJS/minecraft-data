const cp = require('child_process')
const fs = require('fs')
const vm = require('vm')
const { globSync } = require('glob')
const version = process.argv[2] || '1.19.4'
if (!version) {
  console.log('Usage: node extractEntityEffects.js <version>')
  process.exit(1)
}
function versionGreaterOrEqual (otherVersion) {
  const [major, minor, patch] = version.split('.')
  const versionInt = (major << 16) | (minor << 8) | patch
  const [omajor, ominor, opatch] = otherVersion.split('.')
  const otherInt = (omajor << 16) | (ominor << 8) | opatch
  return versionInt >= otherInt
}
if (!fs.existsSync(version)) {
  cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${version} --depth 1`, { stdio: 'inherit' })
}

function toTitleCaseFromSnakeCase (string) {
  const words = string.split('_')
  return words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join('')
}

const context = {
  effects: [],
  MobEffectCategory: {
    HARMFUL: 'bad',
    BENEFICIAL: 'good',
    NEUTRAL: 'neutral'
  },
  MobEffect: function (category, color) {
    const m = {}
    this.modifiers = m
    this.category = category
    this.color = color
    this.addAttributeModifier = (attribute, uuid, modifier, operation) => {
      const lowerCamelCase = attribute.toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())
      this.modifiers[lowerCamelCase] = { uuid, modifier: Number(modifier.toFixed(2)), operation }
      return this
    }
    this.setFactorDataFactory = (fn) => {
      Object.assign(this, fn())
      return this
    }
    return this
  },
  Attributes: new Proxy({}, {
    get (target, name) {
      return name
    }
  }),
  AttributeModifier: {
    Operation: new Proxy({}, {
      get (target, name) {
        return name
      }
    })
  },
  MobEffectInstance: {
    FactorData: function (paddingDuration) {
      this.paddingDuration = paddingDuration
      return this
    }
  }
}

if (versionGreaterOrEqual('1.20.2')) {
  context.register = function (name, effect) {
    const id = context.effects.length - 1
    const prismarineName = toTitleCaseFromSnakeCase(name)
    context.effects.push({ id, name: prismarineName, protocolName: name, ...effect })
  }
} else {
  context.register = function (id, name, effect) {
    const protocolName = name
    // camel case to UpperPascalCase
    const prismarineName = toTitleCaseFromSnakeCase(name)
    context.effects.push({ id, name: prismarineName, protocolName, ...effect })
  }
}

const fails = []

// Find the registry init code, grab all the data by converting Java to runnable JS
const mobEffectsPath = globSync(`./${version}/**/MobEffects.java`)[0]
console.log('Mob Effect Path', mobEffectsPath)
const sourceCode = fs.readFileSync(mobEffectsPath, 'utf8')
for (const line of sourceCode.split(';')) {
  if (line.includes('= register(')) {
    const clean = line.replace(/[\n]/g, '')
    const [m, x] = clean.split(' = ')
    const n = x.replace(/new [a-zA-Z]+MobEffect/, 'new MobEffect').replaceAll('->', '=>')
    try {
      run(n)
    } catch (e) {
      console.log(e)
      const y = m.split('MobEffect')[1].trim()
      console.log('** Parsing Failed for', y)
      console.log(n)
      fails.push(y)
      context.effects.push(null)
    }
  }
}

function run (code) {
  vm.runInContext(code, vm.createContext(context))
}

const generatedEffects = context.effects
console.log('Generated Effects', generatedEffects)

const manualData = {
  BAD_OMEN: {
    id: 31,
    name: 'BadOmen',
    protocolName: 'bad_omen',
    modifiers: {},
    category: 'neutral',
    color: 7455580
  },
  DARKNESS: {
    id: 33,
    name: 'Darkness',
    protocolName: 'darkness',
    modifiers: {},
    category: 'bad',
    color: 2696993
  }
}

for (let i = 0; i < context.effects.length; i++) {
  const effect = context.effects[i]
  if (effect == null) {
    const fail = fails.shift()
    if (manualData[fail]) {
      console.log('Using manual data for', fail)
      generatedEffects[i] = manualData[fail]
      if (versionGreaterOrEqual('1.20.2')) {
        generatedEffects[i].id = i
      }
    } else {
      throw new Error('Missing manual data for ' + fail)
    }
  }
}

fs.writeFileSync('./_effects.json', JSON.stringify(generatedEffects, null, 2))

const dataPaths = require('../../data/dataPaths.json')

const pc = dataPaths.pc

for (const version in pc) {
  const paths = pc[version]
  const effectPath = paths.effects
  if (effectPath) {
    const effectData = require(`../../data/${effectPath}/effects.json`)
    // Make some changes
    for (const effect of effectData) {
      const n = effect.name === 'BadLuck' ? 'Unluck' : effect.name // Mojang calls what we call bad luck "unluck"
      const defaultEffectData = generatedEffects.find(e => e.name === n)
      if (!defaultEffectData) throw new Error('Missing default effect data for ' + n)
      Object.assign(effect, {
        protocolName: defaultEffectData.protocolName,
        type: defaultEffectData.category,
        modifiers: defaultEffectData.modifiers,
        color: defaultEffectData.color
      })
    }

    // Now write it back to the file
    fs.writeFileSync(`../../data/${effectPath}/effects.json`, JSON.stringify(effectData, null, 2))
  }
}

// https://github.com/pmmp/PocketMine-MP/blob/stable/src/data/bedrock/EffectIds.php#L56
const bedrockEffects = [
  'Speed',
  'Slowness',
  'Haste',
  'MiningFatigue',
  'Strength',
  'InstantHealth',
  'InstantDamage',
  'JumpBoost',
  'Nausea',
  'Regeneration',
  'Resistance',
  'FireResistance',
  'WaterBreathing',
  'Invisibility',
  'Blindness',
  'NightVision',
  'Hunger',
  'Weakness',
  'Poison',
  'Wither',
  'HealthBoost',
  'Absorption',
  'Saturation',
  // Glowing is not in bedrock
  'Levitation',
  // Luck is not in bedrock
  // BadLuck is not in bedrock
  'FatalPoison',
  'ConduitPower',
  'SlowFalling',
  'BadOmen',
  'HeroOfTheVillage',
  'Darkness'
]

// const notInBedrock = [
//   'Glowing',
//   'Luck',
//   'BadLuck',
//   'DolphinsGrace'
// ]

const bedrockExclusive = {
  FatalPoison: {
    name: 'FatalPoison',
    displayName: 'Fatal Poison',
    protocolName: 'FatalPoison',
    modifiers: {},
    color: 5149489,
    type: 'bad'
  }
}

const bedrockResults = {}
const latestPcVersion = Object.keys(dataPaths.pc)[Object.keys(dataPaths.pc).length - 1]
const latestPcPaths = dataPaths.pc[latestPcVersion]
const pcDataLatest = require(`../../data/${latestPcPaths.effects}/effects.json`)
const pcDataLatestEffects = Object.fromEntries(pcDataLatest.map(e => [e.name, e]))

for (let i = 0; i < bedrockEffects.length; i++) {
  const effectName = bedrockEffects[i]
  const defaultData = generatedEffects.find(e => e.name === effectName)
  if (!defaultData && !bedrockExclusive[effectName]) throw new Error('Missing default data for ' + effectName)
  if (bedrockExclusive[effectName]) {
    bedrockResults[effectName] = { id: i, ...bedrockExclusive[effectName] }
  } else {
    const effect = {
      ...pcDataLatestEffects[effectName],
      id: i,
      protocolName: effectName
    }
    bedrockResults[effectName] = effect
  }
}

const bedrock16data = Object.values(bedrockResults).filter(e => e.name !== 'Darkness')
const bedrock19data = Object.values(bedrockResults)

fs.writeFileSync('../../data/bedrock/1.16.201/effects.json', JSON.stringify(bedrock16data, null, 2))
fs.writeFileSync('../../data/bedrock/1.19.1/effects.json', JSON.stringify(bedrock19data, null, 2))
