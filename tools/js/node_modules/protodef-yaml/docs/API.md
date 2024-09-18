# API

Simple conversion of protodef-yaml format to ProtoDef schema JSON:

```js
const { compile } = require('protodef-yaml')
compile(inputFile = 'proto.yaml', out = 'proto.json')
```

Turn the YAML into standard JSON (intermediate representation, not ProtoDef schema):
```js
const { parse } = require('protodef-yaml')
parse(inputFile = 'proto.yaml', includeComments = true)
```

Turn the YAML into HTML documentation:
```js
const fs = require('fs')
const { parse, genHTML } = require('protodef-yaml')
const inter = parse(inputFile = 'proto.yaml', includeComments = true, followImports = true)
const html = genHTML(inter, { includeHeader: true })
fs.writeFileSync('proto.html', html)
```

You can also convert JSON syntax into protodef-yaml syntax:
```js
const { genYAML } = require('protodef-yaml')
const yaml = genYAML({
  integer: 'i32',
  someContainer: ['container', [
    { name: 'SomeField', type: 'bool' }
  ]]
}, 0)
assert.strictEqual(yaml, 'integer: i32\nsomeContainer:\n  SomeField: bool\n')
```

## Caret syntax for output transformation
For some complex schemas you may need to segment the protocol schema into different parts.
For example, the Minecraft protocol uses different schemas for different game states.
In these cases, your desired JSON may not look flat and may be structured.

To handle this, protodef-yaml supports a new "caret" syntax to notate how the output JSON
should look.

For example, this
```yml
^serverbound.types:
    int: i32
^clientbound.types:
    int: li32
```

will be moved from move `^path.to.final` into `{path:{to:{final}}}`.

```json
{
  "serverbound": {
    "types": {
      "int": "i32"
    }
  },
  "clientbound": {
    "types": {
      "int": "li32"
    }
  }
}
```

.. and so forth for more complex protocol schemas.

## Methods

### compile(inputFile: string, outputFile: string)
Compile input YAML file into output JSON file


### parse(inputFile: string, includeComments?: boolean, followImports?: boolean)
Compile input YAML file into a JavaScript object.

### genHTML(toTransform: object, options?: { toTitleCase, includeHeader, schemaSegmented })
* toTransform - Intermediary YAML turned to JSON
* options - Generation options
  * includeHeader - Add extra css, specifiy this unless you want to embed into a existing webpage
  * schemaSegmented - If the schema is segmented into different groups, using the above caret syntax

### genYAML(json: object)
Convertthe JSON into protodef-yaml syntax