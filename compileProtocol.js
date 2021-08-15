const fs = require('fs')
const { join, dirname } = require('path')
const { parse, genHTML } = require('protodef-yaml')
const mcData = require('minecraft-data')
const dataPath = join(dirname(require.resolve('minecraft-data')), 'minecraft-data/data/')

function createDocs () {
  fs.writeFileSync('packet_map.yml', '!import: types.yml')
  const inter = parse('proto.yml', true, true)
  const version = inter['!version']
  const html = genHTML(inter, { includeHeader: true })
  const out = `${__dirname}/protocol/bedrock/${version}`
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(`${out}/index.html`, html)
  fs.unlinkSync('packet_map.yml')
  return `bedrock/${version}`
}

function main (dir, ver = 'latest') {
  process.chdir(join(dir, ver))
  if (!fs.existsSync('./proto.yml')) return
  return createDocs(ver)
}

const makeHp = list => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protocol Versions</title>
    <style>
        html, body { width: 100%; height: 100%; font-family: sans-serif; padding: 0; margin: 0; }
        .container { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 100vh; }
        .version { padding: 10px; margin: 10px; font-size: 18px; height: 5%; border: 2px solid paleturquoise; font-weight: bold; text-align: center; }
        .version:hover { background-color: paleturquoise; }
        a { text-decoration: none; }
   </style>
</head>
<body>
    <div class='container'>
        <h3>Minecraft Bedrock Protocol Docs</h3>
        ${list}
    </div>
</body>
</html>
`
let out = []
for (const version of mcData.supportedVersions.bedrock) {
  console.log(version)
  let ret = main(dataPath + 'bedrock/', version)

  if (ret) out.push(`<div class="version"><a href="${ret}">${version}</a></div>`)
}

fs.writeFileSync(join(__dirname, '/protocol/index.html'), makeHp(out.reverse().join('\n')))
