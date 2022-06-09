## 3.4.0
* Add bedrock 1.19 protocol data, 1.18 protocol corrections

## 3.3.0
* Update dimension descriptions (#565)
* Add 1.19-pre4 to pc/common/protocolVersions.json
* Add bedrock 1.18.30 block, item, recipe data
* bedrock: 1.18 protocol fixes
* Add 1.19 to common/protocolVersions.json

## 3.2.0
* Fix 1.17+ biome colors (@Karang)
* Fix shulker box and ender pearl stack sizes (@RoseChilds)
* Fixed hardness & resistance of copper_ore (@sefirosweb)
* Fix guitar spelling in instruments.json (@MrAwesome)
* Add bedrock 1.18 block/entity loot data, recipe data fix (@extremeheat)

## 3.1.1
* Fix Github CI release action

## 3.1.0
* bedrock: Add 1.18.30 protocol data

## 3.0.0
* remove findItemOrBlockById and findItemOrBlockByName entirely

## 2.221.0
* Add bedrock 1.18.11 data
* Fix to 1.18.2 login packet

## 2.220.0
* Fix effect names in 1.17

## 2.119.0
* reverse bedrock version list

## 2.118.0
* Add prismarine-item features

## 2.117.0
* Add "metadataIxOfItem" feature

## 2.116.0
* Fix loginPacket for 1.18.2

## 2.115.1
* Fix name conflict with existing "version" and type from features.json

## 2.115.0
* Add features.json from mineflayer

## 2.114.1
* fix 1.18.2 data paths

## 2.114.0
* mcpc 1.18.2 protocol support

## 2.113.3
* bedrock: correction to protocol data for subchunk packets without caching for 1.18.11

## 2.113.2
* new release because 2.113.1 of nmd already exists

## 2.113.1
* bedrock: Corrections to protocol data for subchunk packets for 1.18.11

## 2.113.0
* bedrock: add 1.18.11 protocol data

## 2.112.0
* bedrock: version data parity, block state and protocol fixes

## 2.111.0
* pc: add missing attributes pointer for 1.18

## 2.110.0
* pc: add cake outshapes (@nickelpro, @SaubereSache)

## 2.109.0
* pc: fix version for 1.18.1

## 2.108.0
* pc: support 1.18.1

## 2.107.0
* pc: y is signed in 1.18 packet_multi_block_change

## 2.106.0
* pc: add materials 1.18

## 2.105.0
* bedrock: Add block data for 1.16.220, 1.17.0 (@extremeheat)

## 2.104.0
* pc: fix biomes for 1.18

## 2.103.0
* pc: biomes for 1.18

## 2.102.0
* pc: loginPacket for 1.18

## 2.101.0
* pc: fix states in blocks 1.18

## 2.100.0
* pc: add more 1.18 data
* bedrock: update protocol
* pc: add attribute support

## 2.99.3
* pc: rename x_sec and z_sec to x and z in chunk block entity

## 2.99.2
* pc: change nbtData field of chunkBlockEntity to optionalNbt in 1.18

## 2.99.1
* pc: fix simulation distance packet in 1.18

## 2.99.0
* pc: fix version path in 1.18 (@u9g)
* bedrock: update 1.18 data (@extremeheat)

## 2.98.1
* pc: Properly prefix particle resourceIDs in 1.17+ (@nickelpro)

## 2.98.0
* pc: Add 1.18 protocol data (@nickelpro)

## 2.97.0
* bedrock: Add 1.18.0 data (@extremeheat)

## 2.96.0
* Add bedrock 1.17.40 protocol data (@extremeheat)

## 2.95.0
* bedrock: Add 1.17.30 protocol data

## 2.94.0
* bedrock: Add skin data paths for older versions

## 2.93.0
* Fix enchantment.json saying that thorns goes on chestplate (@u9g)

## 2.92.0
* protocol packet field type mismatch fix (@Gnog3)
* Add bedrock protocol data (@extremeheat)
* remap u32 to varint in protocol.json (@kvoli)
* bedrock: remove minecraft: prefix from blockstates (@extremeheat)

## 2.91.0
* Rename `clicked_item` to `cursorItem` in 1.17+ window_click packet (@nickelpro)

## 2.90.0
* Add 1.17 recipes (@nickelpro)
* Rename 1.17.1 entity_destroy (@u9g)
* 1.7 protocol fix (thanks @Beaness)

## 2.89.2
* fixes to bedrock paths

## 2.89.1
* fix some remaining occurences of pe

## 2.89.0
* Relocate smelting_format and tags to types map (@nickelpro)
* Rework and extract all items.json (@nickelpro)
* Add bedrock edition data (@extremeheat)

## 2.88.0
* change primaryBitMask to bitMap in 1.17.x protocol.jsons (@Karang)

## 2.87.0
* add 1.17.1 protocol support (@u9g)
* add promptMessage arg to 1.17 (@u9g)

## 2.86.0
* add 1.17 login packet (@u9g)

## 2.85.3
* fix warningBlocks

## 2.85.2
* Remove additional s in 1.17 protocol
* Brigadier fix (@nickelpro)

## 2.85.1
* small 1.17 protocol fix (@nickelpro)

## 2.85.0
* 1.17.0 support (@Archengius and @nickelpro)
* Add netherite tools to harvestTools (@timoreo22)
* fix recipe shape (x/z flipped) in 1.16.2 protocol declare_recipes (@Gjum)

## 2.84.0
* Add legacy.json 1.12 -> 1.13 mappings

## 2.83.1
* Fix 21w07a protocol (@U9G)

## 2.83.0
* Fix biomes (@IceTank)

## 2.82.2
* fix 21w07a protocol (@U9G)

## 2.82.1
* fix datapath

## 2.82.0
* 21w07a protocol (@U9G)
* Fixed spawn painting for 1.7 (@SiebeDW)

## 2.81.0
* Add blast resistance (thanks @Moondarker)

## 2.80.0
* Add tints.json (thanks @Moondarker)

## 2.79.0
* Add properties to items.json (maxDurability, fixedWith, enchantCategories)

## 2.78.0
* Finish propogating all new properties to old enchantment.json files & remove enchant multipliers

## 2.77.0
* Propogate enchant categories & max levels of enchants to all old enchantments.json files

## 2.76.0
* Add enchantment multipliers

## 2.75.0
* Fix 1.16 collision shapes

## 2.74.0
* Add more biome data

## 2.73.1
* Add 1.16.5 to datapaths

## 2.73.0
* Add 1.16.4 and 1.13 enchantments data

## 2.72.0
* Fix upside-down recipes in 1.11-1.16 and improve recipe audit (thanks @Karang)

## 2.71.0
* Added map icons (@FalcoG)

## 2.70.1
* fix 1.16.2 block.json file (thanks @DeltaEvo)

## 2.70.0
* 1.16.4 support

## 2.69.0
* add example login packet (required in new versions) (thanks @GroobleDierne)

## 2.68.1
* add command to datapath file

## 2.68.0
* 1.16.3 support (same as 1.16.2)
* command entries

## 2.67.0
* use stack size range property in loots
* fix enchantments in recent versions

## 2.66.0
* add loottable information (thanks @TheDudeFromCI)
* add more 1.16.2 data (thanks @DrakoTrogdor)

## 2.65.0
* fix particle type (thanks @nickelpro)
* 1.16.2 (thanks @nickelpro)

## 2.64.0
* add particles (thanks @nickelpro)

## 2.63.0
* update instruments.json from 1.13 onward (thanks @Naomi)
* add correct drops for 1.13 onward (thanks @TheDudeFromCI)
* various protocol fix (thanks @nickelpro)

## 2.62.1
* fix items 1.16.1

## 2.62.0
* add foods data (thanks @AppDevMichael)

## 2.61.0
* extract proper states + default state from minecraft generator (thanks @Karang)

## 2.60.0
* full 1.16 support (thanks @AppDevMichael)

## 2.59.0
* 1.16.1 protocol support (thanks @Health123)

## 2.58.0
* 1.16 support

## 2.57.0
* fix abilities and recipes packets for 1.16-rc1

## 2.56.0
* add 1.16-rc1 support

## 2.55.0
* entity metadata type is a varint since 1.13

## 2.54.0
* complete items.json files all version (thanks @Karang)

## 2.53.0
* point to other version files for 1.15, 1.15.1, 1.14 and 1.14.1

## 2.52.0
* fix and add block shapes for more versions (thanks @Karang)

## 2.51.0
* more 1.15.2 data (thanks @uncovery)

## 2.50.0
* fix for elyctra (thanks @Mstrodl)
* more 1.14.4 data

## 2.49.0
* fix 1.14.4 blocks (and tests)

## 2.48.0
* fix bounding boxes (@Karang)
* fix some categories (@ImHarvol)

## 2.47.0
* add biomes, blocks, entities, items and recipes for 1.14.4

## 2.46.0
* fix entities for 1.13

## 2.45.0
* fix grass bounding box for 1.13
* last 1.16 snapshots support

## 2.44.0
* small fix to success packet for 20w13b

## 2.43.0
* Provide block collision shapes (thanks @Gjum)
* support snapshot 20w13b of 1.16 (thanks @sbh1311)

## 2.42.0
* Fix mushrooms' bounding boxes (thanks @IdanHo)
* 1.15.2 protocol support

## 2.41.0
* 1.15 protocol support

## 2.40.0
* 1.15.1 protocol support
* various data corrections for blocks (thanks @kemesa7)
* fix stack sizes (thanks @timmyRS)
* add item durability (thanks @timmyRS)

## 2.39.0
* 1.14.4 support

## 2.38.0
* 1.14.3 support

## 2.37.5
* fix intfield -> objectData in spawn_entity in all versions > 1.8

## 2.37.4
* add protocol to 1.14

## 2.37.3
* fix stonecutting in declare_recipes 1.14.1 : only one ingredient

## 2.37.2
* u32 -> i32 in 1.14

## 2.37.1
* add missing version file in 1.14.1 and 1.14

## 2.37.0
* fix redstone
* fix some block properties
* 1.14 support : protocol.json and some of the data : not everything is there yet

## 2.36.0
* fix team prefix and suffix in 1.13

## 2.35.0
* add block state data for 1.13 and 1.13.2

## 2.34.0
* support 1.13.2-pre2 and 1.13.2

## 2.33.0
* fix version definition for 1.13.2-pre1

## 2.32.0
* support 1.13.2-pre1

## 2.31.0
* fix 1.13.1 datapath

## 2.30.0
* update ajv, mocha and standard

## 2.29.0
* full 1.13 and 1.13.1 support (thanks @lluiscab for doing this)

## 2.28.0
* support of 1.13.1 protocol

## 2.27.0
* support of 1.13 protocol

## 2.26.0
* move js tests to standard

## 2.25.0
* fix packet_title starting from 1.11 (see http://wiki.vg/index.php?title=Protocol&oldid=8543#Title)

## 2.24.0
* fix brigadier:string parser properties

## 2.23.0
* some fixes for 17w50a protocol

## 2.22.0
* mcpc 17w50a support (first supported 1.13 snapshot)

## 2.21.0
* mcpc 1.12.2 support

## 2.20.0
* mcpc 1.12.1 support

## 2.19.0
* add language data

## 2.18.0
* mcpc 1.12 : add all the data (in addition to protocol)

## 2.17.0
* mcpc 1.12 support

## 2.16.0
* supports 1.12-pre4

## 2.15.0
* supports 17w18b

## 2.14.0
* supports 17w15a

## 2.13.2
* correct file names

## 2.13.1

* fix id for custom_payload in 1.11.2

## 2.13.0

* protocol_comments -> protocolComments

## 2.12.0

* add protocol comments

## 2.11.0

* add dataPaths file

## 2.10.0

* complete 1.11 data

## 2.9.0

* mcpc 1.11.2 support

## 2.8.0

* mcpe 1.0 support (except the protocol)

## 2.7.0

* 1.11 support (only the protocol)

## 2.6.0

* add classic blocks (thanks @mhsjlw)

## 2.5.0

* add 16w35a
* add enchantments data

## 2.4.0

* fix spelling error in protocol.json (catagory)
* add mcpe 0.15 protocol, blocks and items and update mcpe versions file
* add mcpc 1.10.1 and 1.10.2 and update mcpc versions file

## 2.3.1

* fix 1.10 version

## 2.3.0

* add 1.10 data

## 2.2.0

 * add license
 * add pe protocol

## 2.1.0

 * add 1.10-pre1

## 2.0.0

 * fix minecraftVersion in 16w20a
 * add a regex to validate the version strings
 * add pe blocks.json and items.json
 * BREAKING : move all pc data to pc dir

## 1.1.0

 * add 1.10 support (16w20a)

## 1.0.0

 * lot of minecraft version added
 * improve entities.json
 * add windows.json
 * other improvements : see commits log

## 1.8-0.1.0
 * first version after the versions split
 * move js files to tools/js
 * use countType in protocol.json

## 0.4.0
 * add some basic (to be used for manual updating) protocol extractors
 * import protocol.json from node-minecraft-protocol for version 1.8 of minecraft

## 0.3.0
 * remove id indexing from biomes, blocks, entities, items and instruments : let users (for examples node-minecraft-data) provide their indexing (by id, name,...)

## 0.2.1
 * entities is now in the API

## 0.2.0
 * update blocks, entities, items and recipes enums with new wiki extractors
 * add entities displayName
 * add drops in blocks
 * add metadata variations in blocks and drops
 * update recipes with variations of blocks and items
 * amount -> count and meta -> metadata in recipes
 * reorganize and improve wiki extractors

## 0.1.1
 * some new wiki extractors : beginning of work for blocks, entities
 * fix some recipes
 * add entities.json file

## 0.1.0
 * add json schemas to check the enums schemas
 * use circle ci the check the enums schemas automatically
 * add docson documentation for the schemas
 * change the format of recipes
 * add doc/recipes.md

## 0.0.1

 * first version
 * enums in enums/
 * scripts to audit and generate the enums in bin/
 * support minecraft 1.8 with some missing data
