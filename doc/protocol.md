## Updating Minecraft protocols

The protocol data is manually updated. It is updated by looking at changes made to the Minecraft protocol through various sources.

### Sources
#### Minecraft Java Edition
* https://wiki.vg/Protocol -- a manually updated version of the Minecraft protocol
* [Minecraft source code changes](https://github.com/extremeheat/extracted_minecraft_data/tree/clientlatest) - comparing decompiled Java output for the current version against the previous version

#### Minecraft Bedrock Edition
* [PocketMine](https://github.com/pmmp/PocketMine-MP) - PHP
* [gophertunnel](https://github.com/Sandertv/gophertunnel) - Go
* [CloudburstMC](https://github.com/CloudburstMC/Protocol) - Java

### Protocol schema

This project uses ProtoDef's schema for representing Minecraft protocol packets in JSON. These protocol.json files can then be used to generate code to serialize and deserialize Minecraft packets in any language. See the documentation for [node-protodef here](https://github.com/ProtoDef-io/node-protodef) for a Node.js implementation. In PrismarineJS/minecraft-protocol and PrismarineJS/bedrock-protocol, JavaScript code is generated from the JSON through the node-protodef compiler.

#### YAML syntax

For easier maintainability, the protocol JSON is generated from a more human readable YAML format. You can read more [here](https://github.com/extremeheat/protodef-yaml). Some documentation is below.

These YAML files can be found in data/pc/latest and data/bedrock/latest. Old protocol YAML data can be found in `data/<pc|bedrock>/<version>`.

In bedrock data, types and packets are sperated into proto.yml and types.yml files. On pc there is one single proto.yml file with all packets and types for all the states, and these states are sperated under different top-level regions like `^handshaking.toClient.types` and `^play.toServer.types` (which both inherit from the top `^types`).

Note: Minecraft Java Edition uses big endian encoding by default, whereas Minecraft Bedrock Edition uses little endian. Note that varints are always little endian.

```yml
# This defines a new data structure, a ProtoDef container.
Position:
    # Variable `x` in this struct has a type of `li32`, a little-endian 32-bit integer
    x: li32
    # `z` is a 32-bit LE *unsigned* integer
    z: lu32
    # `b` is an **optional** 32-bit LE floating point
    y?: lf32

# Fields starting with `packet_` are structs representing Minecraft packets
packet_player_position:
    # Fields starting with ! are ignored by the parser. '!id' is used by the parser when generating the packet map
    !id: 0x29 # This packet is ID #0x29
    !bound: client # `client` or `server` bound, just for documentation purposes. This has no other effect.

    # Read `on_ground` as a boolean
    on_ground: bool
    # Read `position` as custom data type `Position` defined above.
    position: Position

    # Reads a 8-bit unsigned integer, then maps it to a string
    movement_reason: u8 =>
        0: player_jump
        1: player_autojump
        2: player_sneak
        3: player_sprint
        4: player_fall
   
   # A `_` as a field name declares an anonymous data structure which will be inlined. Adding a '?' at the end will start a `switch` statement 
    _: movement_reason ?
        # if the condition matches to the string "player_jump" or "player_autojump", there is a data struct that needs to be read
        if player_jump or player_autojump:
            # read `original_position` as a `Position`
            original_position: Position
            jump_tick: li64
        # if the condition matches "player_fall", read the containing field
        if player_fall:
            original_position: Position
        default: void
   
    # Another way to declare a switch, without an anonymous structure. `player_hunger` will be read as a 8-bit int if movement_reason == "player_sprint"
    player_hunger: movement_reason ?
        if player_sprint: u8
        # The default statement as in a switch statement
        default: void

    # Square brackets notate an array. At the left is the type of the array values, at the right is the type of
    # the length prefix. If no type at the left is specified, the type is defined below.

    # Reads an array of `Position`, length-prefixed with a ProtoBuf-type unsigned variable length integer (VarInt)
    last_positions: Position[]varint

    # Reads an array, length-prefixed with a zigzag-encoded signed VarInt  
    # The data structure for the array is defined underneath
    keys_down: []zigzag32
        up: bool
        down: bool
        shift: bool
```

The above roughly translates to the following JavaScript code to read a packet:
```js
function read_position(stream) {
    const ret = {}
    ret.x = stream.readLI32()
    ret.z = stream.readLU32()
    if (stream.readBool()) ret.y = stream.readLF32()
    return ret
}

function read_player_position(stream) {
    const ret = {}
    ret.on_ground = Boolean(stream.readU8())
    ret.position = read_position(stream)
    let __movement_reason = stream.readU8()
    let movement_reason = { 0: 'player_jump', 1: 'player_autojump', 2: 'player_sneak', 3: 'player_sprint', 4: 'player_fall' }[__movement_reason]
    switch (movement_reason) {
        case 'player_jump':
        case 'player_autojump':
            ret.original_position = read_position(stream)
            ret.jump_tick = stream.readLI64()
            break
        case 'player_fall':
            ret.original_position = read_position(stream)
            break
        default: break
    }
    ret.player_hunger = undefined
    if (movement_reason == 'player_sprint') ret.player_hunger = stream.readU8()
    ret.last_positions = []
    let __latest_positions_len = stream.readUnsignedVarInt()
    for (let i = 0; i < __latest_positions_len; i++) {
        ret.last_positions.push(read_player_position(stream))
    }
    ret.keys_down = []
    let __keys_down_len = stream.readZigZagVarInt()
    for (let i = 0; i < __keys_down_len; i++) {
        const ret1 = {}
        ret1.up = Boolean(stream.readU8())
        ret1.down = Boolean(stream.readU8())
        ret1.shift = Boolean(stream.readU8())
        ret.keys_down.push(ret1)
    }
    return ret
}
```

and the results in the following JSON for the packet:
```json
{
    "on_ground": false,
    "position": { "x": 0, "y": 2, "z": 0 },
    "movement_reason": "player_jump",
    "original_position": { "x": 0, "y": 0, "z": 0 },
    "jump_tick": 494894984,
    "last_positions": [{ "x": 0, "y": 1, "z": 0 }],
    "keys_down": []
}
```

Custom ProtoDef types can be inlined as JSON:
```yml
string: ["pstring",{"countType":"varint"}]
```

#### Compiling to JSON
Once the protocol YAML files have been updated, run `npm run build` inside `tools/js` to generate protocol.json for each of the protocol YAML files.
