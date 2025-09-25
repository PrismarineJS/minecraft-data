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

We use a special yaml-like DSL to generate protocol.json files. Refer to doc/protocol.md for info.
These files are stored inside proto.yml files in the latest/ folder (like bedrock/latest/proto.yml) for the latest version, otherwise in the versioned folder (like pc/1.20/proto.yml).

 Notably, run `npm run build` in tools/js to regenerate protocol.json files after making changes to the protocol yaml files. So, don't make changes to protocol.json files directly. Instead, update the relevant proto.yml file in latest/ and regenerate protocol.json by running `npm run build` in tools/js.
