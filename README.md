# minecraft-data 

[![Join the chat at https://gitter.im/PrismarineJS/minecraft-data](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/PrismarineJS/minecraft-data?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://circleci.com/gh/PrismarineJS/minecraft-data/tree/master.svg?style=shield)](https://circleci.com/gh/PrismarineJS/minecraft-data/tree/master)

Language independent module providing minecraft data for minecraft clients, servers and libraries.

Support minecraft 1.8 and 1.9.

## Wrappers

Minecraft-data is language independent, you can use it with these language specific modules :

| Wrapper name | Language | Data provided |
| --- | --- | --- |
| [node-minecraft-data](https://github.com/PrismarineJS/node-minecraft-data) | Node.js | everything |
| [python-minecraft-data](https://github.com/rom1504/python-minecraft-data) | python | everything |
| [ProtocolGen](https://github.com/Johni0702/ProtocolGen) | java | generated java files from protocol.json to read and write minecraft packets |

If you want to use minecraft-data in a new language, we advise you to [create a new wrapper](doc/make-a-new-wrapper.md)

## Data

Data provided:

| Data | Description |
| --- | --- |
| Biomes | |
| Blocks |  |
| Effect | Status/Potion effects |
| Entities | |
| Instruments | sounds emitted by blocks |
| Items |  |
| Materials | to be used with blocks data |
| Protocol | a complete description of the protocol, can be used to automatically implement the protocol |
| Recipes |to be used with blocks and items data |
| Windows | the different kind of windows and their characteristics |
| Version | |
| Versions | all the versions supported in minecraft-data |

See more information about this data in the [documentation](http://prismarinejs.github.io/minecraft-data/)

## Documentation

 * See [doc/history.md](doc/history.md)
 * [Documentation generated using the json schemas and docson](http://prismarinejs.github.io/minecraft-data)
 * [Textual documentation of the recipe format](doc/recipes.md)
  
## Projects using minecraft-data

These are the projects that use minecraft-data (through the wrappers) :

| Project name | Language | Project type | Data used |
| --- | --- | --- | --- |
| [mineflayer](https://github.com/andrewrk/mineflayer) | Node.js | bot library | biomes, blocks, entities, instruments, items, materials, recipes |
| [node-minecraft-protocol](https://github.com/PrismarineJS/node-minecraft-protocol) | Node.js | protocol serialization | protocol |
| [flying-squid](https://github.com/mhsjlw/flying-squid) | Node.js | server library | biomes, blocks, materials |
| [SpockBot](https://github.com/SpockBotMC/SpockBot) | Python | bot library | biomes, blocks, items, materials, windows, recipes |
| [PhaseBot](https://github.com/phase/PhaseBot) | Java | bot | blocks, items, materials |

## Extraction

Projects that provide data:

| Project name | Language | Source | Data provided |
| --- | --- | --- | --- |
| [minecraft-wiki-extractor](https://github.com/PrismarineJS/minecraft-wiki-extractor) | Node.js | [minecraft wiki](http://minecraft.gamepedia.com) | blocks, items, entities, recipes |
| [mcdevs-wiki-extractor](https://github.com/PrismarineJS/mcdevs-wiki-extractor) | Node.js | [wiki.vg](http://wiki.vg/Protocol) | a partial protocol |
| [minecraft-jar-extractor](https://github.com/PrismarineJS/minecraft-jar-extractor) | Node.js | minecraft server jar | a very partial but completely up to date protocol |
| [minecraft-jar-extractor in python](https://github.com/pangeacake/minecraft-jar-extractor) | Python | minecraft server jar | about the same protocol information as minecraft-jar-extractor in node.js |
| [burger](https://github.com/mcdevs/Burger) with [generate_enums](tools/js/burger_extractor/generate_enums.js) | Node.js | minecraft server jar | used to provide items, blocks, biomes and recipes |

Pages interesting to manually update the data if necessary:

| Page | Data |
| ---- | ---- |
| [wiki.vg Inventory page](http://wiki.vg/Inventory) | windows |
| [wiki.vg](http://wiki.vg/Block_Actions) | instruments |
| [a mineflayer PR](https://github.com/andrewrk/mineflayer/pull/197) | biomes |
| [mcwiki effects page](http://minecraft.gamepedia.com/Status_effect) | effects |

## Data quality

Minecraft data provides scripts to audit the data, they can be useful to check the data is correct :

 * [audit_blocks](tools/js/test/audit_blocks.js)
 * [audit_items](tools/js/test/audit_items.js)
 * [audit_recipes](tools/js/test/audit_recipes.js)
 
Minecraft data also provides json schemas in enums_schemas/ that are used in 
test/test.js to check the json file are valid relative to these schemas.
These schemas can also be used to understand better how the json files are
formatted in order to use it.
