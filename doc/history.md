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
