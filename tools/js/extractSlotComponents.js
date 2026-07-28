const fs = require('fs')
const cp = require('child_process')
const version = process.argv[2]
const sourceDir = `mcsrc-${version}`
const extractTypes = process.argv[3] === '-types'

if (!version) {
  console.log('Usage: node extractEntityMetadata.js <codeVersion> [-types]')
  process.exit(1)
}

if (!fs.existsSync(sourceDir)) {
  cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${sourceDir} --depth 1`, { stdio: 'inherit' })
}

const componentsFile = fs.readFileSync(`./${sourceDir}/client/net/minecraft/core/component/DataComponents.java`, 'utf8')
const nameRe = /register\("(.+)",/gm
const typeRe = /\((.+?)\).*?;/gm
const nameMatches = componentsFile.matchAll(nameRe)
const typeMatches = componentsFile.matchAll(typeRe)
typeMatches.next()
for (const match of nameMatches) {
  console.log(`- ${match[1]}${extractTypes ? ' : ' + typeMatches.next().value?.[1] : ''}`)
}
