## minecraft bedrock edition data

### Obtaining edition specific data

| file name | info | how to get | schema |
|-|-|-|-|
| blockStates.json | Contains the global block palette for a Minecraft version. <br>Contains all of the possible block states. <br><br><br>The index of a Block State instance here is the paletted ID, <br>which can be used to idenfify this block state<br>instead of a string. | [bedrock-extractor][1] ("BlockStates.json" file) |  |
| steve.json | Skin data for clients connecting to BE servers, for default Steve character | [bedrock-protocol][2] (capture from proxy) |  |
| blockMappings.json | Output of bedrock-extractor |

### Updating protocol data

* To update bedrock protocol data, open `data/bedrock/latest` (or replace "latest" with some older version) and update the `proto.yml` and `types.yml` files.
* Go to `tools/js`, run `npm install` then `npm run build` to update the protodef JSON files

To update to a new protocol version:
* Copy `data/bedrock/latest` files into the old version's folder.
* Open `data/bedrock/latest` and update the `proto.yml` and `types.yml` files and update the `!version` part at the top
* Go to `tools/js`, run `npm install` then `npm run build` to update the protodef JSON files

then run `npm test` to test validity

### Status of data

<!--StartFragment-->
file name     | have? | how to get it | notes
--            | -- | -- | --
attributes    | ✔ | MANUAL | &nbsp;
blocks        | ✔ | bedrock-extractor  | &nbsp;
biomes        | ✔ | bedrock-extractor (via Amulet) | 
blockCollisionShapes | ✔ | bedrock-extractor | New schema: block IDs map to an array of block state indexes, to get the block stateID, minStateId + index of array. This way different copies of the block with different state IDs can have unique collisions. 
commands      | ❌ | bedrock-protocol + dumper | must be custom schema, current JE schema too low level
effects       | ✔ | MANUAL | &nbsp;
enchantments  | ✔ | bedrock-extractor (via Geyser -> pc data) | &nbsp;
entities      | ✔ | bedrock-extractor  | &nbsp;
instruments   | ✔ | manual | &nbsp;
items         | ✔ | bedrock-extractor  | &nbsp;
language      | ❌ | (extract from game) | &nbsp;
mapIcons      | 🔵 | ? | ?
materials     | ❌ | (from pc data) | &nbsp;
particles     | 🔵 | bedrock-protocol docs | IDs not needed, handled in protocol

protocol      | ✔ | MANUAL updated     | wip
recipes       | ✔ |  bedrock-extractor | new schema: adds furnace and other special recipes. <br/> Some recipes can have multiple outputs, also allow for recipe ingredients with damage values and specific counts.
version       | ✔ | from bedrock-protocol | 
windows       | ✔ | manual obtained via proxy | &nbsp;

blockLoot     | 🔵 | manual data for 1.18 | &nbsp;
entityLoot    | 🔵 | manual data for 1.18 | &nbsp;


<!--EndFragment-->

[1]: https://github.com/extremeheat/minecraft-data-extractor/tree/master/bedrock
[2]: https://github.com/PrismarineJS/bedrock-protocol
