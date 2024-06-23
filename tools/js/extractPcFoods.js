const fs = require('fs')
const cp = require('child_process')
const version = process.argv[2]
if (!version) {
  console.log('Usage: node extractPcFoods.js <version>')
  process.exit(1)
}

if (!fs.existsSync(version)) {
  cp.execSync(`git clone -b client${version} https://github.com/extremeheat/extracted_minecraft_data.git ${version} --depth 1`, { stdio: 'inherit' })
}

const mcDataItems = require(`../../data/pc/${version}/items.json`)
const outputItems = []
function getItemDataFor (itemName) {
  return mcDataItems.find(e => e.name === itemName)
}

const foodsFile = fs.readFileSync(`./${version}/client/net/minecraft/world/food/Foods.java`, 'utf8')

function add (name, satMod, nut) {
  console.log(name, satMod, nut)
  // for correct order, we assign undefineds
  const entry = {
    id: undefined,
    name: name.toLowerCase(),
    stackSize: null,
    displayName: undefined,
    foodPoints: parseFloat(nut),
    saturation: undefined,
    effectiveQuality: undefined,
    // There is a ratio*2 modifier as of 1.20.5 in https://github.com/extremeheat/extracted_minecraft_data/blob/dc3974eeb6bea61fb26f8f1feece761d0b812d6a/client/net/minecraft/world/food/FoodConstants.java#L35
    // also done in https://github.com/PrismarineJS/minecraft-data-generator-server/blob/44f49b4ab51fb92f72209d7fdf7c6e42030de8dd/1.7/src/main/java/dev/u9g/minecraftdatagenerator/generators/FoodsDataGenerator.java#L24
    saturationRatio: parseFloat(satMod).toFixed(2) * 2
  }
  Object.assign(entry, getItemDataFor(entry.name))
  entry.saturation = Number((entry.foodPoints * entry.saturationRatio).toFixed(2)) // round by 2 decimal digits
  entry.effectiveQuality = entry.foodPoints + entry.saturation
  outputItems.push(entry)
}

for (const line of foodsFile.replaceAll('\n', '').split(';')) {
  if (!line.includes('final FoodProperties')) continue
  if (line.includes('stew(')) {
    // special case for stew
    const name = line.match(/ ([A-Z0-9+_]+) =/)[1]
    const satMod = 0.6
    const nut = line.match(/stew\(([0-9.fFeE]+)\)/)[1]
    add(name, satMod, nut)
  } else {
    const name = line.match(/ ([A-Z0-9+_]+) =/)[1]
    const satMod = line.match(/saturationModifier\(([0-9.fFeE]+)\)/)[1]
    const nut = line.match(/nutrition\(([0-9.fFeE]+)\)/)[1]
    add(name, satMod, nut)
  }
}
outputItems.sort((a, b) => a.id - b.id)
fs.writeFileSync(`../../data/pc/${version}/foods.json`, JSON.stringify(outputItems, null, 2))
