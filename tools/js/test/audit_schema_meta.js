/* eslint-env mocha */

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const Ajv = require('ajv')
const ajv = new Ajv({ meta: false }) // don't auto-add meta schemas; we add draft-07 explicitly
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07.json'))

// Validate that all schemas in the schemas/ directory are themselves valid JSON Schemas
// (draft-07, since ajv@6 uses draft-07).
// ref: https://github.com/PrismarineJS/minecraft-data/issues/1057

describe('JSON schemas are valid against the JSON Schema meta-schema', function () {
  const schemasDir = path.join(__dirname, '../../../schemas')
  const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('_schema.json'))
  files.forEach(function (file) {
    it(file + ' is a valid JSON Schema', function () {
      const schema = require(path.join(schemasDir, file))
      const valid = ajv.validateSchema(schema)
      assert.ok(valid, JSON.stringify(ajv.errors, null, 2))
    })
  })
})
