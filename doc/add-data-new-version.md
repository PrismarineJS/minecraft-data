# How to add data for a new version ?

For bedrock edition see [bedrock.md](bedrock.md)

| file name | auto? | how to get it | notes |
| -- | -- | -- | -- |
| protocol.json | No | Follow [Pre-release Protocol][1] |
| blocks.json | Yes | Use [minecraft-data-generator-server][2] |
| items.json | Yes | Use [minecraft-data-generator-server][2] |
| entities.json | Yes | Use [minecraft-data-generator-server][2] |
| recipes.json | Yes | Use [minecraft-data-generator-server][2] | make sure that `-1` in output are replaced with `null` |
| blockCollisionShapes.json | Yes | Use [minecraft-data-generator-server][2] |
| commands.json | No? |Use [mc-data-command-generator][3] | link to jar files have to be manually added |
| biomes.json | Yes | Use [minecraft-data-generator-server][2] |
| instruments | Yes | Use [minecraft-data-generator-server][2] |
| materials.json | Yes | Use [minecraft-data-generator-server][2] |
| windows.json | No | Look at [wiki.vg inventories][4] |
| version.json | No | Look at [Protocol Versions][5] | [wiki.vg protocol numbers][6] |
| effects.json | Yes | Use [minecraft-data-generator-server][2] |
| enchantments.json | Yes  |Use [minecraft-data-generator-server][2] |
| language.json | Yes | Use [minecraft-data-generator-server][2] |
| particles.json | Yes | Use [minecraft-data-generator-server][2] |
| blockLoot.json | No | Use [minecraft-jar-extractor][7] | Currently no extractor seems to works for this
| entityLoot.json | No | Use [minecraft-jar-extractor][7] | Currently no extractor seems to works for this
| mapIcons.json | No | Icons data can be found in the Minecraft src directly. Alternatively you might be able to look up the icons from the following page on the [Minecraft wiki][15] or from [wiki.vg][16]. | [minecraft-data pr mapIcons][14] | 

* All files that say Yes for auto can be gotten from [minecraft-data-auto-updater][8] (that uses [minecraft-data-generator-server][2]). This is the preferred way to extract the data.
  
[1]: https://wiki.vg/Pre-release_protocol
[2]: https://github.com/PrismarineJS/minecraft-data-generator-server
[3]: https://github.com/Miro-Andrin/mc-data-command-generator
[4]: https://wiki.vg/Inventory
[5]: https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/common/protocolVersions.json
[6]: https://wiki.vg/Protocol_version_numbers
[7]: https://github.com/PrismarineJS/minecraft-jar-extractor
[8]: https://github.com/PrismarineJS/minecraft-data-auto-updater


