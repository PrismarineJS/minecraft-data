const { compile, parse } = require('./compiler')
const genHTML = require('./generators/html')
const genYAML = require('./generators/json2yml')

module.exports = { compile, parse, genHTML, genYAML }

if (typeof window !== 'undefined') window.protoyaml = module.exports