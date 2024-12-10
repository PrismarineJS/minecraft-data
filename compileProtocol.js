const fs = require('fs')
const { join, dirname } = require('path')
const { parse, genHTML } = require('protodef-yaml')
const mcData = require('minecraft-data')
const dataPath = join(dirname(require.resolve('minecraft-data')), 'minecraft-data/data/')

const makeHp = (pcList, bedrockList) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protocol Versions</title>
  <style>
    html, body { width: 100%; height: 100%; font-family: sans-serif; padding: 0; margin: 0; }
    .container { text-align: center; }
    .versions { display: ruby; }
    .version { padding: 10px; margin: 10px; font-size: 18px; height: 5%; border: 2px solid paleturquoise; font-weight: bold; text-align: center; }
    .version:hover { background-color: paleturquoise; }
    a { text-decoration: none; }
  </style>
</head>
<body>
    <div class='container'>
      <h2>Protocol docs</h2>
      <h3>Minecraft Java Edition</h3>
      <div class="versions">${pcList}</div>
      <h3>Minecraft Bedrock Edition protocol docs</h3>
      <div class="versions">${bedrockList}</div>
    </div>
</body>
</html>
`

const createDocs = {
  bedrock () {
    fs.writeFileSync('packet_map.yml', '!import: types.yml')
    const inter = parse('proto.yml', true, true)
    const version = inter['!version']
    const html = genHTML(inter, { includeHeader: true })
    const out = join(__dirname, 'protocol/bedrock/', version.toString())
    fs.mkdirSync(out, { recursive: true })
    fs.writeFileSync(`${out}/index.html`, html)
    fs.unlinkSync('packet_map.yml')
    return `bedrock/${version}`
  },
  pc () {
    let inter = parse('proto.yml', true, true)
    const version = inter['!version']
    try {
      inter = prepareMcpc(inter)
    } catch (e) {
      console.log(e)
    }
    const html = genHTML(inter, { includeHeader: true, schemaSegmented: true })
    const out = join(__dirname, 'protocol/pc/', version.toString())
    fs.mkdirSync(out, { recursive: true })
    fs.writeFileSync(`${out}/index.html`, html)
    return `pc/${version}`
  }
}

function main (edition, dir, ver = 'latest') {
  process.chdir(join(dir, ver))
  if (!fs.existsSync('./proto.yml')) return
  return createDocs[edition](ver)
}

const out = { pc: [], bedrock: [] }
for (const edition of ['pc', 'bedrock']) {
  for (const version of [...mcData.supportedVersions[edition], 'latest']) {
    console.log(edition, version)
    const ret = main(edition, dataPath + edition + '/', version)
    if (ret) out[edition].push(`<div class="version"><a href="${ret}">${version}</a></div>`)
  }
}

fs.writeFileSync(join(__dirname, '/protocol/index.html'), makeHp(
  out.pc.reverse().join('\n'),
  out.bedrock.reverse().join('\n')
))

// Add additional information to the schema before passing to HTML gen
function prepareMcpc (intermediary) {
  const updated = structuredClone(intermediary)
  function get (x, y) {
    if (!x) return
    for (const k in x) {
      const [, n] = k.split(',')
      if (n === y) return x[k]
    }
  }
  for (const key in updated) {
    if (key.startsWith('%container,^')) {
      const region = key.split(',')[1].replace('^', '')
      const [status, direction] = region.split('.')
      const entries = updated[key]
      const packetMapper = entries['%container,packet,']
      const packetMapperName = get(packetMapper, 'name')
      if (packetMapper && packetMapperName) {
        const n = Object.entries(packetMapperName)
        const p = Object.fromEntries(Object.entries(packetMapper['%switch,params,name'] ?? {}).map(([k, v]) => [k.replace('if ', ''), v]))
        const packetMap = Object.fromEntries(n.map(([k, v]) => [p[v], k.split(',')[1]]))
        for (const k in entries) {
          if (!entries[k]) continue
          if (k.startsWith('%container,')) {
            const [, name] = k.split(',')
            const id = parseInt(packetMap[name])
            entries[k]['!typedoc'] = `${status} / ${direction} / ${name}`
            if (isNaN(id)) {
              entries[k]['!id'] = packetMap[name]
            } else {
              const hex = '0x' + id.toString(16).padStart(2, '0')
              entries[k]['!id'] = id
              entries[k]['!typedoc'] += ` (${hex})`
            }
            entries[k]['!bound'] = direction === 'toServer' ? 'server' : 'client'
          }
        }
      }
    }
  }
  return updated
}
