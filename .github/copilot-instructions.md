PrismarineJS/minecraft-data holds Minecraft data including game versions, protocol schemas, block/item/entity states, and more. It provides a comprehensive cross-language set of data files combined with schemas that can be consumed in any language.

## Directory Structure
- `.github/`
  - `workflows/`
    - `ci.yml` -- Runs CI here (cd tools/js && npm install && npm test)
    - `bedrock-ci.yml` -- Runs CI for Bedrock Edition via workflow dispatch to PrismarineJS/bedrock-protocol. This allows for testing and validation of Bedrock-specific changes.
    - `commands.yml` -- Slash commands
    - `handleMcpcGeneratedArtifacts.js`
  - `helper-bot/` -- Files for the GitHub Actions cron helper.
- `data/`
  - `dataPaths.json` -- map of { ['pc' | 'bedrock']: { '$version': { 'dataType': 'folderPath' } } }
  - `[pc | bedrock]/` -- Minecraft Java Edition data
    - `1.20/` -- Versioned data for Minecraft Java Edition 1.20
    - `$version/` -- Versioned data for Minecraft Java Edition $version
    - `common/` -- Common data for all Minecraft Java Edition versions
      - `protocolVersions.json` -- List of protocol versions for Minecraft Java Edition
    - `latest/` -- This holds the latest protocol yaml files. They are used to generate the protocol.json files in each versioned folder (more on this below).
- `schemas/` -- JSON schemas for validating data files
- `tools/js` -- JavaScript utilities for working with repo (holds tests, some data generators and helper scripts)

## Setup
No setup is needed as we just hold data. To set up the development environment that runs tests, run the following commands:

```bash
cd tools/js
npm install
```

This will ensure all data matches schema among other checks.

There are no 'releases' in this repo beyond updating the data itself. Instead, we have a workflow that will automatically create tagged releases if the user runs the /makerelease slash command, so you can inform the user about that if a release is needed.

## Testing
Always run tests after data changes to ensure local tests are passing:

```sh
cd tools/js
npm install
npm test -- --bail 2>&1 | tail -100
```

## Data

Most data is generated with data generators. For mcpc, data is generated with [minecraft-data-generator](https://github.com/PrismarineJS/minecraft-data-generator).

Avoid updating data manually unless necessary, like when specific data is not automated yet (for tips on what is and not, see doc/add-data-new-version.md). Instead, update the data generators or add new ones as needed. Since you don't have capability to make changes outside this repo, please inform the user what changes need to be made and be as detailed as possible.

Note we do not currently have any automation setup to generate bedrock edition data.

## Github Workflows

### Automation

Our GH Actions workflow (.github/helper-bot) auto updates the pc protocolVersions.json with new detected versions and also auto opens a scaffolding PR.

cron workflow .github/workflows/update-helper.yml -> .github/helper-bot/.

helper-bot dispatches to minecraft-data-generator so that it can run data generators for new versions. minecraft-data-generator then sends a workflow dispatch back to us so we can then take its generated artifacts and commit them here.

.github/workflows/handle-mcpc-generator.yml ->
.github/helper-bot/handleMcpcGeneratedArtifacts.js

## Notes
Not all data is generated. Some data (like protocol schemas) is manually curated on both pc and bedrock.

### Protocol data

We use a special YAML-like DSL to generate protocol.json files. Refer to doc/protocol.md for info.
These files are stored inside proto.yml (and an imported types.yml support file on bedrock) files in the latest/ folder (like bedrock/latest/proto.yml) for the latest version, otherwise in the versioned folder (like pc/1.20/proto.yml).

👉 Run `npm run build` in tools/js to regenerate protocol.json files after making changes to the protocol yaml files.

❌ Don't make changes to protocol.json files directly. Instead, update the relevant proto.yml file in latest/ and regenerate protocol.json by running `npm run build` in tools/js.

If you need to edit many files at once, consider writing a simple Node.js script to replace. E.g., from `cd tools/js && npm i && node __replace_something.js`):
```js
const cp = require('child_process')
const fs = require('fs')
const glob = require('glob')
const pcVersionsOrdered = require('../../data/pc/common/versions.json')
const after1_20_5 = pcVersionsOrdered.slice(pcVersionsOrdered.indexOf('1.20.5')) // everything after 1.20.5...
for (const version of pcVersionsOrdered) {
  // globSync, fs.readFileSync...fs.writeFileSync ; avoid async
}
```

When updating, apply minimum required changes when possible.

1. Do not rename fields or packets unless their value has changed, even if they may have 'officially' changed. If their values *have* significantly changed (varint -> i32 maybe insignificant from primitive standpoint, string to number is), it maybe a good idea to rename the field or packet.
2. Do not rename existing enums or other data, even if they were renamed in the game. You may add or remove data as is needed as this does not unnecessarily affect existing code relying on old names.
3. Always read the information in doc/protocol.md to understand our YAML format.
4. Try to inline types as much as possible--this includes mappers and switch statements. Don't create extra types unless they are actually re-used in multiple places, or very large to warrant seperation.
