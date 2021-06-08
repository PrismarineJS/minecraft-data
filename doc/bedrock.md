## minecraft bedrock edition data

#### Obtaining data

| file name | info | how to get | schema |
|-|-|-|-|
| blockStates.json | Contains the global block palette for a Minecraft version. <br>Contains all of the possible block states. <br><br><br>The index of a Block State instance here is the paletted ID, <br>which can be used to idenfify this block state<br>instead of a string. | [bedrock-extractor][1] ("BlockStates.json" file) |  |
| steve.json | Skin data for clients connecting to BE servers, for default Steve character | [bedrock-protocol][2] (capture from proxy) |  |
| skinGeometry.json | Skin geometry data for clients connecting to BE servers (merge with steve.json) | [bedrock-protocol][2] (capture with proxy) |  |
| steveSkin.bin | Skin image data | [bedrock-protocol][2] (capture with proxy) |  |


[1]: https://github.com/extremeheat/minecraft-data-extractor/tree/master/bedrock
[2]: https://github.com/PrismarineJS/bedrock-protocol
