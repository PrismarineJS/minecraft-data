# How to add data for a new version ?

## Protocol

Follow https://wiki.vg/Pre-release_protocol

## Blocks, Items, Entities, Recipes

use https://github.com/PrismarineJS/burger-extractor

then use https://github.com/u9g/turbo-invention to add some more properties to the items.json

## Block collision shape 

https://github.com/PrismarineJS/minecraft-data/blob/master/doc/blockCollisionShapes.md#data-source

## Loot table

https://github.com/PrismarineJS/minecraft-jar-extractor#block-loot-table-extractor

## Map icons
Icons can be found in the Minecraft jar file where they are added as a single sprite. 

The file location is `/assets/minecraft/textures/map/map_icons.png`.

Alternatively you might be able to look up the icons from the following page on the [Minecraft wiki](https://minecraft.gamepedia.com/Map#Map_icons) or from [wiki.vg](https://wiki.vg/Protocol#Map_Data).

## Enchantments

Duplicate enchantments.json from the latest version and add manually the missing enchantments. Enchantments data could be found by looking into the deobfuscated classe files of each enchantments, as well as in the Enchantments registry.

## WIP

This guide is WIP, more information will be added here


If something doesn't work, look at the list of extractors for ideas https://github.com/PrismarineJS/minecraft-data#extraction
