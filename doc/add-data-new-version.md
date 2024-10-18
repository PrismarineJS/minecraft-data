# How to add data for a new version ?

For bedrock edition see [bedrock.md](bedrock.md)

| file name | auto? | how to get it | notes |
| -- | -- | -- | -- |
| protocol.json | No | Follow [Pre-release Protocol][1] | Always double check by looking at the Minecraft source files. |
| blocks.json | Yes | Use [minecraft-data-generator-server][2] |
| items.json | Yes | Use [minecraft-data-generator-server][2] |
| entities.json | Yes | Use [minecraft-data-generator-server][2]  and run `extractPcEntityMetadata.js` script in tools/js to generate entity metadata in entities.json and protocol.json |
| recipes.json | Yes | Use [Burger][12], then use [burger-extractor][13] | should eventually be changed to native data generators |
| blockCollisionShapes.json | Yes | Use [minecraft-data-generator-server][2] |
| commands.json | No? |Use [mc-data-command-generator][3] | Link to jar files have to be manually added |
| biomes.json | Yes | Use [minecraft-data-generator-server][2] |
| instruments | Yes | Use [minecraft-data-generator-server][2] |
| materials.json | Yes | Use [minecraft-data-generator-server][2] |
| windows.json | No | Look at [wiki.vg inventories][4] |
| version.json | No | Look at [Protocol Versions][5] | [wiki.vg protocol numbers][6] |
| effects.json | Yes | Use [minecraft-data-generator-server][2] |
| enchantments.json | Yes  | Use [minecraft-data-generator-server][2] |
| language.json | Yes | Use [minecraft-data-generator-server][2] |
| particles.json | Yes | Use [minecraft-data-generator-server][2] |
| blockLoot.json | No | Use [minecraft-jar-extractor][11] | Extractor can be very be tempermental at times
| entityLoot.json | No |  Use [minecraft-jar-extractor][11] | Extractor can be very be tempermental at times
| mapIcons.json | No | Icons data can be found in the Minecraft source directly. Alternatively you might be able to look up the icons from the following page on the [Minecraft wiki][7] or from [wiki.vg][8]. | [minecraft-data pr mapIcons][9] | 
| loginPacket.json | Yes | Running tests on [node-minecraft-protocol][10] |
| sounds.json | Yes | Use [minecraft-data-generator-server][2] | Make sure to check the packets that use this and the friendlybytebuffer functions to check if an offset is needed in the generator code.
| foods.json| Yes | Use [minecraft-data-generator-server][2] | move file obtained with [minecraft-data-generator-server][2] to the correct location and run `extractPcFoods.js` script located in `tools/js`|


* All files that say Yes for auto can be gotten from [minecraft-data-auto-updater][9] (that uses [minecraft-data-generator-server][2]). This is the preferred way to extract the data.
* **Note**, there is a script inside the `tools/js` folder that can be run with `npm run version` with usage of `npm run version <bedrock|pc> {version} {protocol_version}` to automatically copy over old data including the protocol in support for a new version and update entries in the dataPaths.json.

After generating and creating the new files for the version in its own directory, the version must be added to dataPaths.json in the data folder.
Additionally in data/pc/common the versions.json file needs to be updated with the new version.

## Protocol data
* See [protocol.md] for information on the protocol and how to update the data
  
[1]: https://wiki.vg/Pre-release_protocol
[2]: https://github.com/PrismarineJS/minecraft-data-generator-server
[3]: https://github.com/Miro-Andrin/mc-data-command-generator
[4]: https://wiki.vg/Inventory
[5]: https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/common/protocolVersions.json
[6]: https://wiki.vg/Protocol_version_numbers
[7]: https://minecraft.wiki/Map#Map_icons
[8]: https://wiki.vg/Protocol#Map_Data
[9]: https://github.com/PrismarineJS/minecraft-data-auto-updater
[10]: https://github.com/PrismarineJS/node-minecraft-protocol
[11]:  https://github.com/PrismarineJS/minecraft-jar-extractor
[12]: https://github.com/Pokechu22/Burger
[13]: https://github.com/PrismarineJS/burger-extractor
