// items tests

var protocol_extractor = require("./../protocol_extractor.js");

var testTable="{| class=\"wikitable\"\n" +
  " ! Packet ID\n" +
  " ! State\n" +
  " ! Bound To\n" +
  " ! Field Name\n" +
  " ! Field Type\n" +
  " ! Notes\n" +
  " |-\n" +
  " |rowspan=\"2\"| 0x0D\n" +
  " |rowspan=\"2\"| Play\n" +
  " |rowspan=\"2\"| Client\n" +
  " | Collected Entity ID\n" +
  " | VarInt\n" +
  " | \n" +
  " |- \n" +
  " | Collector Entity ID\n" +
  " | VarInt\n" +
  " | \n" +
  " |}";

var expectedTable=[
  {
    "Packet ID":"0x0D",
    "State":"Play",
    "Bound To":"Client",
    "Field Name":"Collected Entity ID",
    "Field Type":"VarInt",
    "Notes":""
  },
  {
    "Packet ID":"0x0D",
    "State":"Play",
    "Bound To":"Client",
    "Field Name":"Collector Entity ID",
    "Field Type":"VarInt",
    "Notes":""
  }
];

var expectedPacket={
  "id": "0x0D",
  "fields": [
    {
      "name": "Collected Entity ID",
      "type": "VarInt"
    },
    {
      "name": "Collector Entity ID",
      "type": "VarInt"
    }
  ]
};


var actualTable=protocol_extractor.parseWikiTable(testTable.split("\n"));
//console.log(actualTable);

var actualPacket=protocol_extractor.tableToPacket(actualTable);

//console.log(actualPacket);


var assert = require("assert");

assert.deepEqual(actualTable,expectedTable);

assert.deepEqual(actualPacket,expectedPacket);


var testTable2= "{| class=\"wikitable\"\n"+
  " ! Packet ID\n"+
  " ! State\n"+
  " ! Bound To\n"+
  " ! Field Name\n"+
  " ! Field Type\n"+
  " ! Notes\n"+
  " |-\n"+
  " |rowspan=\"3\"| 0x06\n"+
  " |rowspan=\"3\"| Play\n"+
  " |rowspan=\"3\"| Client\n"+
  " | Health\n"+
  " | Float\n"+
  " | 0 or less = dead, 20 = full HP\n"+
  " |-\n"+
  " | Food\n"+
  " | VarInt\n"+
  " | 0–20\n"+
  " |- \n"+
  " | Food Saturation\n"+
  " | Float\n"+
  " | Seems to vary from 0.0 to 5.0 in integer increments\n"+
  " |}";

//console.log(protocol_extractor.tableToPacket(protocol_extractor.parseWikiTable(testTable2.split("\n"))));


var testTable3="{| class=\"wikitable\"\n"+
  " ! Packet ID\n"+
  " ! State\n"+
  " ! Bound To\n"+
  " !colspan=\"2\"| Field Name\n"+
  " !colspan=\"2\"| Field Type\n"+
  " ! Notes\n"+
  " |-\n"+
  " |rowspan=\"6\"| 0x22\n"+
  " |rowspan=\"6\"| Play\n"+
  " |rowspan=\"6\"| Client\n"+
  " |colspan=\"2\"| Chunk X\n"+
  " |colspan=\"2\"| Int\n"+
  " | Chunk X coordinate\n"+
  " |-\n"+
  " |colspan=\"2\"| Chunk Z\n"+
  " |colspan=\"2\"| Int\n"+
  " | Chunk Z coordinate\n"+
  " |-\n"+
  " |colspan=\"2\"| Record Count\n"+
  " |colspan=\"2\"| VarInt\n"+
  " | Number of elements in the following array, a.k.a. the number of blocks affected\n"+
  " |-\n"+
  " |rowspan=\"3\"| Record\n"+
  " | Horizontal Position\n"+
  " |rowspan=\"3\"| Array\n"+
  " | Unsigned Byte\n"+
  " | The 4 most significant bits (<code>0xF0</code>) encode the X coordinate, relative to the chunk. The 4 least significant bits (<code>0x0F</code>) encode the Z coordinate, relative to the chunk.\n"+
  " |-\n"+
  " | Y Coordinate\n"+
  " | Unsigned Byte\n"+
  " | \n"+
  " |-\n"+
  " | Block ID\n"+
  " | VarInt\n"+
  " | The new block ID for the block. <code><nowiki>id &lt;&lt; 4 | data</nowiki></code>\n"+
  " |}";

// need special handling
// not done yet : colspan in th

//console.log(JSON.stringify(protocol_extractor.parseWikiTable(testTable3.split("\n")),null,2));


var testTable4= "{| class=\"wikitable\"\n"+
  " ! Packet ID\n"+
  " ! State\n"+
  " ! Bound To\n"+
  " ! Field Name\n"+
  " ! Field Type\n"+
  " ! Notes\n"+
  " |-\n"+
  " |rowspan=\"1\"| 0x00\n"+
  " | Status\n"+
  " | Server\n"+
  " |colspan=\"3\"| ''no fields''\n"+
  " |}\n";

var expectedTable4=[
  {
    "Packet ID":"0x00",
    "State":"Status",
    "Bound To":"Server",
    "Field Name":"''no fields''",
    "Field Type":"''no fields''",
    "Notes":"''no fields''"
  }
];

// need to handle colspan

var lines4=testTable4.split("\n");
//console.log(JSON.stringify(protocol_extractor.tableToRows(lines4),null,2));

var actualTable4=protocol_extractor.parseWikiTable(lines4);

//console.log(JSON.stringify(expectedTable4,null,2));
//console.log(JSON.stringify(actualTable4,null,2));

assert.deepEqual(actualTable4,expectedTable4);
//console.log(actualTable4);
//console.log(protocol_extractor.tableToPacket(actualTable4));

//console.log(protocol_extractor.tableToPacket(actualTable4));


var testTable5="{| class=\"wikitable\"\n"+
  " |-\n"+
  " ! Packet ID\n"+
  " ! State\n"+
  " ! Bound To\n"+
  " ! Field Name\n"+
  " ! Field Type\n"+
  " ! Notes\n"+
  " |-\n"+
  " |rowspan=\"6\"| 0x08\n"+
  " |rowspan=\"6\"| Play\n"+
  " |rowspan=\"6\"| Server\n"+
  " | Location\n"+
  " | Position\n"+
  " | Block position\n"+
  " |-\n"+
  " | Face\n"+
  " | Byte\n"+
  " | The face on which the block is placed (see above)\n"+
  " |-\n"+
  " | Held Item\n"+
  " | [[Slot Data|Slot]]\n"+
  " | \n"+
  " |-\n"+
  " | Cursor Position X\n"+
  " | Byte\n"+
  " | The position of the crosshair on the block\n"+
  " |-\n"+
  " | Cursor Position Y \n"+
  " | Byte\n"+
  " | \n"+
  " |-\n"+
  " | Cursor Position Z\n"+
  " | Byte\n"+
  " | \n"+
  " |}";

//console.log(JSON.stringify(protocol_extractor.tableToRows(testTable5.split("\n")),null,2));
//console.log(protocol_extractor.parseWikiTable(testTable5.split("\n")));