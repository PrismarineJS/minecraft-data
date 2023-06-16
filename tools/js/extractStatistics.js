const fs = require('fs')
const cp = require('child_process')
const version = process.argv[2] || '1.19.4'

if (!version) {
  console.log('Usage: node extractStatistics.js <version>')
  process.exit(1)
}

if (!fs.existsSync(version)) {
  cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${version} --depth 1`, { stdio: 'inherit' })
}

const baseStatTypes = []
const baseCustomStats = []

let fileData
const files = [
  `./${version}/client/net/minecraft/stats/Stats.java`,
  `./${version}/client/net/minecraft/stats/StatList.java`,
  `./${version}/client/net/minecraft/stats/StatsList.java`
]

for (const f of files) {
  try {
    fileData = fs.readFileSync(f, 'utf8').split('\n')
  } catch (e) {
  }
}

if (!fileData) {
  console.log('Could not find corresponding statistics file for version <version>')
  process.exit(1)
}

for (const line of fileData) {
  const typeMatches = [
    line.match(/makeRegistryStatType\("([^"]+?)", .+?\)/),
    line.match(/new (?:StatCrafting|StatBase)\("(stat\.[^"]+)\.".*?\)/),
    line.match(/func_.+?\("(.+?)", IRegistry\..+?\)/)
  ]

  const customMatches = [
    line.match(/makeCustomStat\("(.+?)", .+?\)/),
    line.match(/new StatBasic\("(.+?)", .+?\)/),
    line.match(/func_.+?\("(.+?)", IStatFormater\..+?\)/)
  ]

  for (const m of typeMatches) {
    if (m) baseStatTypes.push(m[1])
  }

  for (const m of customMatches) {
    if (m) baseCustomStats.push(m[1])
  }
}

const statTypes = baseStatTypes.map((x, i) => {
  return {
    id: i,
    name: x,
    protocolName: x.includes('.') ? x.split('.', 2).join(':') : `minecraft:${x}`
  }
})

const customStats = baseCustomStats.map((x, i) => {
  return {
    id: i,
    name: x,
    protocolName: x.includes('.') ? x.split('.', 2).join(':') : `minecraft:${x}`,
    actionId: i
  }
})

fs.writeFileSync(`../../data/pc/${version}/statTypes.json`, JSON.stringify(statTypes, null, 2))
fs.writeFileSync(`../../data/pc/${version}/customStats.json`, JSON.stringify(customStats, null, 2))
