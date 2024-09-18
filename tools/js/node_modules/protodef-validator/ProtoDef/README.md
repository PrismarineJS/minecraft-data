# ProtoDef

ProtoDef specification: describe your protocol, and read it with ease.

## Implementations

| Implementation | Language | Method |
| --- | --- | --- |
| [node-protodef](https://github.com/ProtoDef-io/node-protodef) | Node.js | interpretation and compilation |
| [elixir-protodef](https://github.com/ProtoDef-io/elixir-protodef) | Elixir | compilation |
| [protodefc](https://github.com/ProtoDef-io/protodefc) | Rust | compilation |
| [node-protodef-neo](https://github.com/Saiv46/node-protodef-neo) | Node.js | mixed |
| [mcd2c](https://github.com/SpockBotMC/mcd2c) | C | compilation |
| [mcd2cpp](https://github.com/SpockBotMC/RikerBot/blob/master/mcd2cpp/__init__.py#L495) | C++ | compilation |

## Documentation

Read the [datatypes](doc/datatypes.md) and [protocol](doc/protocol.md) documentation.

The [schemas](schemas) directory contain json schema of the json representation of a datatype definition.

## Projects Using ProtoDef

* [minecraft-protocol](https://github.com/PrismarineJS/node-minecraft-protocol) defines a protocol.json by minecraft version and use ProtoDef to serialize and parse packets
  * the protocol.json files are stored in [minecraft-data](https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.8/protocol.json)
  * and they can be visualized automatically in this [doc](http://prismarinejs.github.io/minecraft-data/?d=protocol)
* [prismarine-nbt](https://github.com/PrismarineJS/prismarine-nbt) defined a nbt.json to parse and serialize the NBT format
* [mineflayer](https://github.com/PrismarineJS/mineflayer/blob/master/lib/plugins/command_block.js) uses ProtoDef to parse plugin messages
* [minecraft-protocol-forge](https://github.com/PrismarineJS/node-minecraft-protocol-forge) parses and serialize forge plugin messages
* [node-raknet](https://github.com/mhsjlw/node-raknet) describe the raknet protocol in a protocol.json and uses ProtoDef to read it
* [minecraft-classic-protocol](https://github.com/mhsjlw/minecraft-classic-protocol) defines the classic minecraft protocol with ProtoDef
* [pocket-minecraft-protocol](https://github.com/mhsjlw/pocket-minecraft-protocol) defines the minecraft pocket edition protocol
* [diablo2-protocol](https://github.com/MephisTools/diablo2-protocol) Diablo 2 network protocol
* [dofus-protocol](https://github.com/AstrubTools/dofus-protocol) Network protocol for dofus : create client and servers for dofus 1.30
