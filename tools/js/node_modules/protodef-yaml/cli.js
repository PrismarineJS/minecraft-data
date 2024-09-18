#!/usr/bin/env node
const { compile, parse } = require('./compiler')
const htmlGen = require('./generators/html')
const fs = require('fs')

if (!process.argv[2]) {
    console.warn('usage: protodef-yaml <inputYAML> [output.json | output.html]')
    console.warn('example: protodef-yaml proto.yaml protocol.json')
    console.warn('example: protodef-yaml proto.yaml protocol.html')
} else {
    const inp = process.argv[2]
    const out = process.argv[3] || (inp.split('.', -1)[0] + '.json')

    if (out.endsWith('.html')) {
        const intermediary = parse(inp, true, true)
        const schemaSegmented = Object.keys(intermediary).some(key => key.startsWith('^') || key.startsWith('%container,^'))
        const html = htmlGen(intermediary, { includeHeader: true, schemaSegmented })
        fs.writeFileSync(out, html)
    } else {
        compile(inp, out)
    }
    console.info('✔ ', out)
}