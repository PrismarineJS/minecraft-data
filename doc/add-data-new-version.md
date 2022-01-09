# How to add data for a new version ?

For bedrock edition see [bedrock.md](bedrock.md)

| file name | auto? | how to get it | notes |
| -- | -- | -- | -- |
| protocol.json | No | Follow [Pre-release Protocol][3] |
| blocks.json | Yes | Use [Burger][1], then use [burger-extractor][2] |
| items.json | Yes | Use [Burger][1], then use [burger-extractor][2], then use [turbo-invention][6] |
| entities.json | Yes | Use [Burger][1], then use [burger-extractor][2] |
| recipes.json | Yes | Use [Burger][1], then use [burger-extractor][2] | should eventually be changed to native data generators |
| blockCollisionShapes.json | Yes | Use [McDataExtracting][4] |
| commands.json | No? |Use [mc-data-command-generator][5] | link to jar files have to be manually added |
| biomes.json | Yes | Use [Burger][1], then use [burger-extractor][2] | [extra info][13] |
| instruments | No | [wiki.vg block actions][11] |
| materials.json | No | [import from previous version](18) or [fix it properly](19) |
| windows.json | No | Look at [wiki.vg inventories][7] |
| version.json | No | Look at [Protocol Versions][9] | [wiki.vg protocol numbers][8] |
| effects.json | No | Look at [minecraft wiki effects][12] |
| enchantments.json | No | Duplicate enchantments.json from the latest version and add manually the missing enchantments. Enchantments data could be found by looking into the deobfuscated classe files of each enchantments, as well as in the Enchantments registry. |
| language.json | Yes | Use [minecraft-jar-extractor][10] |
| particles.json | Yes | Use [Burger][1], then use [burger-extractor][2] |
| blockLoot.json | Yes | Use [minecraft-jar-extractor][10] |
| entityLoot.json | Yes | Use [minecraft-jar-extractor][10] |
| mapIcons.json | No | Icons can be found in the Minecraft jar file where they are added as a single sprite. The file location is `/assets/minecraft/textures/map/map_icons.png`. Alternatively you might be able to look up the icons from the following page on the [Minecraft wiki][15] or from [wiki.vg][16]. | [minecraft-data pr mapIcons][14] |

* All files that say Yes for auto can be gotten from [minecraft-data-auto-updater][17]

[1]: https://github.com/Pokechu22/Burger
[2]: https://github.com/PrismarineJS/burger-extractor
[3]: https://wiki.vg/Pre-release_protocol
[4]: https://github.com/PrismarineJS/McDataExtracting
[5]: https://github.com/Miro-Andrin/mc-data-command-generator
[6]: https://github.com/u9g/turbo-invention
[7]: https://wiki.vg/Inventory
[8]: https://wiki.vg/Protocol_version_numbers
[9]: https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/common/protocolVersions.json
[10]: https://github.com/PrismarineJS/minecraft-jar-extractor
[11]: http://wiki.vg/Block_Actions
[12]: http://minecraft.gamepedia.com/Status_effect
[13]: https://github.com/PrismarineJS/mineflayer/pull/197
[14]: https://github.com/PrismarineJS/minecraft-data/pull/348#issue-545841883
[15]: https://minecraft.gamepedia.com/Map#Map_icons
[16]: https://wiki.vg/Protocol#Map_Data
[17]: https://github.com/PrismarineJS/minecraft-data-auto-updater
[18]: https://github.com/PrismarineJS/minecraft-data/pull/282#issue-612896577
[19]: https://github.com/PrismarineJS/minecraft-data/issues/412#issuecomment-1008202471

