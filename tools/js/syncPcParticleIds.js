// Sync particle IDs between pc/particles.json and pc/protocol.json
const fs = require('fs')
const oldParticleData = require('../../data/pc/1.19.3/particles.json')
const oldProtocolData = require('../../data/pc/1.19.3/protocol.json')
const particleData = require('../../data/pc/1.19.4/particles.json')
const protocolData = require('../../data/pc/1.19.4/protocol.json')

// const oldParticleDataByName = Object.fromEntries(oldParticleData.map(e => [e.name, e.id]))
const newParticleDataByName = Object.fromEntries(particleData.map(e => [e.name, e.id]))
const oldIdToNew = Object.fromEntries(oldParticleData.map(e => [e.id, newParticleDataByName[e.name]]))

const ppData = oldProtocolData.types.particleData[1]
const newFields = {}
for (const fieldId in ppData.fields) {
  const field = ppData.fields[fieldId]
  newFields[oldIdToNew[fieldId]] = field
}

protocolData.types.particleData[1].fields = newFields
const json = JSON.stringify(protocolData, null, 2)
// Matching the custom formatting on the JSON is annoying, let's just keep it JS/vscode default 2-space formatting for consistency
// json = json.replace(/\[\s+"option",\s+"string"\s+\],/g, '["option", "string"],').replace(/\[\s+"option",\s+"string"\s+\]/g, '["option", "string"]')
fs.writeFileSync('./protocol.json', json)
