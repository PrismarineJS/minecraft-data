# minecraft-data 
[![NPM version](https://badge.fury.io/js/minecraft-data.png)](http://badge.fury.io/js/minecraft-data) [![Build Status](https://circleci.com/gh/PrismarineJS/minecraft-data.png?style=shield)](https://circleci.com/gh/PrismarineJS/minecraft-data)

Provide minecraft data for minecraft clients, servers and libraries.

Support minecraft 1.8.3.

## Documentation

 * See [doc/api.md](doc/api.md)
 * See [doc/history.md](doc/history.md)
 * [Documentation generated using the json schemas and docson](http://prismarinejs.github.io/minecraft-data/)
 * [Textual documentation of the recipe format](doc/recipes.md)

## Extractors

Minecraft data provides a few extractors to update the data :

 * bin/wiki_extractor/item_extractor.js extract items.json from the minecraft wiki
 * bin/wiki_extractor/entities_extractor.js extract entities.json from the minecraft wiki
 * bin/wiki_extractor/blocks_extractor.js extract blocks.json from the minecraft wiki
 * manual filling of materials.json : this file is very simple, it is there to make it easier to handle some edge cases
 * manual filling of instruments.json : data coming from http://wiki.vg/Block_Actions
 