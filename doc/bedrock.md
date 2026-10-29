## Minecraft Bedrock Edition data

### Generated data

Starting with 1.16.201, `blocks.json`, `blockStates.json`, `blockCollisionShapes.json`, `materials.json`, and `items.json`
are generated directly from Bedrock Dedicated Server data, rather than adapted from Java Edition data:

* [bedrock-data-generator][4] converts the extracted bedrock server data into minecraft-data files for each supported version   and updates `dataPaths.json`. If a file's contents match those of the previous version, its path points to the existing file instead of storing a duplicate. Each generated data commit records the source bedrock-data commit and the generator run that produced it.

`items.json` contains each build's item registry, sent in the `start_game` packet's `itemstates` field before
1.21.60 and in the `item_registry` packet starting with 1.21.60. Each item's `id` is its runtime ID, and
`componentBased` corresponds to the registry entry's `component_based` field. Starting with 1.21.60, `version` and
`nbt` are also preserved from the registry entry. These fields allow the item registry to be reconstructed, although
the server's original item order is not preserved.

Data is generated for every minecraft-data version from 1.16.201 through 1.26.51. Versions 0.14, 0.15, and 1.0 have
no dedicated server and retain their existing files.

To generate the data manually, follow the [bedrock-data-generator README][4].

### Obtaining data

| File name | Description | How to obtain | Schema |
|-|-|-|-|
| blockStates.json | The global block palette for a Minecraft version, containing all possible block states. A block state's index in the palette is its palette ID, which can identify the state instead of a string. | [bedrock-data-generator][4] starting with 1.16.201 (see [Generated data](#generated-data)); [bedrock-extractor][1] for earlier versions (the `BlockStates.json` file) |  |
| steve.json | Default Steve skin data for clients connecting to Bedrock Edition servers. | [bedrock-protocol][2] (capture through a proxy) |  |
| blockMappings.json | Output of bedrock-extractor. | | |
| language.json | Translation keys and their English string values. | [extract-minecraft-lang][3] (run for each new version, then copy the JSON file to minecraft-data) | |

### Updating protocol data

* Open `data/bedrock/latest` (or replace `latest` with an older version) and update `proto.yml` and `types.yml`.
* In `tools/js`, run `npm install`, then `npm run build` to update the ProtoDef JSON files.

To update to a new protocol version:

1. Copy the files from `data/bedrock/latest` into the previous version's folder.
2. Update `proto.yml` and `types.yml` in `data/bedrock/latest`, including the `!version` field at the top.
3. In `tools/js`, run `npm install`, then `npm run build` to update the ProtoDef JSON files.

After either update, run `npm test` in `tools/js` to validate the data.

### Status of data

<!--StartFragment-->
File name | Available? | How to obtain | Notes
-- | -- | -- | --
protocol.json | ✔ | Updated manually | Work in progress.
blocks.json | ✔ | [bedrock-data-generator][4] starting with 1.16.201; bedrock-extractor for earlier versions | &nbsp;
items.json | ✔ | [bedrock-data-generator][4] starting with 1.16.201; bedrock-extractor for earlier versions | Each build's item registry: runtime IDs, `componentBased`, and, starting with 1.21.60, `version` and `nbt`.
entities.json | ✔ | bedrock-extractor | &nbsp;
recipes.json | ✔ | bedrock-protocol dumper | The new schema adds furnace and other special recipes. It supports multiple outputs and ingredients with damage values and specific counts.
blockCollisionShapes.json | ✔ | [bedrock-data-generator][4] starting with 1.16.201 (each build's collision boxes); Java Edition data for earlier versions | Block names map to a single shape ID or an array of shape IDs indexed by block state. For an array entry, the block state ID is `minStateId + array index`, allowing each state to have a different collision shape.
commands.json | ❌ | bedrock-protocol + dumper | Requires a custom schema; the current Java Edition schema is too low-level.
biomes.json | ✔ | bedrock-extractor (via Amulet) |
instruments | ✔ | Obtained manually | &nbsp;
materials.json | ✔ | [bedrock-data-generator][4] starting with 1.16.201 (which blocks each item can dig and at what speed); Java Edition data for earlier versions | &nbsp;
windows.json | ✔ | Obtained manually through a proxy | &nbsp;
version.json | ✔ | bedrock-protocol |
effects.json | ❌ | Java Edition data | &nbsp;
enchantments.json | ✔ | bedrock-extractor (via Geyser, using Java Edition data) | &nbsp;
language.json | ✔ | [extract-minecraft-lang][3] (extracted from the dedicated server) | &nbsp;
particles.json | 🔵 | bedrock-protocol documentation | IDs are handled by the protocol and are not needed here.
blockLoot.json | 🔵 | Manually collected data for 1.18 | &nbsp;
entityLoot.json | 🔵 | Manually collected data for 1.18 | &nbsp;
mapIcons.json | 🔵 | ? | ?

<!--EndFragment-->

[1]: https://github.com/extremeheat/minecraft-data-extractor/tree/master/bedrock
[2]: https://github.com/PrismarineJS/bedrock-protocol
[3]: https://github.com/CreeperG16/extract-minecraft-lang
[4]: https://github.com/mc-zuri/bedrock-data-generator
