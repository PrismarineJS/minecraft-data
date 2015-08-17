var WikiTextParser = require('./lib/wikitext_parser');
var async=require('async');
var fs = require('fs');

var wikiTextParser = new WikiTextParser("wiki.vg");

module.exports = {
  tableToRows:tableToRows,
  parseWikiTable:parseWikiTable,
  tableToPacket:tableToPacket
};

writeProtocol();

function writeProtocol()
{
  async.waterfall([
      getProtocol
    ],
    write
  );
}


function retrieveProtocol(cb)
{
  wikiTextParser.getArticle("Protocol", function(err, data) {
    if(err)
    {
      cb(err);
      return;
    }
    var sectionObject = wikiTextParser.pageToSectionObject(data);
    cb(err,sectionObject);
  });
}

function getProtocol(cb) {
  async.waterfall([
    retrieveProtocol,
    extractProtocol,
    transformProtocol
  ],cb);
}

function write(err,protocol){
  if(err)
  {
    console.log("problem "+err);
    return;
  }
  //console.log(JSON.stringify(protocol,null,2));
  fs.writeFile("../../../enums/protocol.json", JSON.stringify(protocol,null,2));
}

function extractProtocol(sectionObject,cb)
{
  var notStates = ["content", "Definitions", "Packet format"];

  var protocol = Object
    .keys(sectionObject)
    .filter(function(key) {
      return notStates.indexOf(key) == -1;
    })
    .reduce(function(protocol, state) {
      protocol[state] = Object
        .keys(sectionObject[state])
        .filter(function(key) {
          return key != "content"
        })
        .reduce(function(stateO, direction) {
          stateO[direction] = Object
            .keys(sectionObject[state][direction])
            .filter(function(key) {
              return key != "content"
            })
            .reduce(function(packetsO, packetName) {
              packetsO[packetName] = parsePacket(sectionObject[state][direction][packetName]['content']);
              return packetsO;
            }, {});
          return stateO;
        }, {});
      return protocol;
    }, {});

  cb(null,protocol);
}


function parsePacket(packetText)
{
  return tableToPacket(parseWikiTable(getFirstTable(packetText)));
}

function getFirstTable(lines)
{
  var afterFirstTable=false;
  var inTable=false;
  return lines.filter(function(line){
    if(afterFirstTable) return false;
    if(line == '{| class="wikitable"')
      inTable=true;

    if(inTable && line == ' |}') {
      inTable = false;
      afterFirstTable = true;
      return true;
    }

    return inTable;
  });
}

function tableToRows(lines)
{
  lines=lines.slice(1);
  if(lines[0].trim()=="|-")
    lines.shift();
  var rows=[];
  var currentRow=[];
  lines.forEach(function(line){
    if(line.trim()=="|-" || line == " |}")
    {
      rows.push(currentRow);
      currentRow=[];
    }
    else currentRow.push(line);
  });
  return rows;
}

// output format : one object by line, repetition of the row in case of rowspan>1 (for example repetition of Packet Id)
// for colspan>1 : [first element,second element] or {colName:first element,...} if ! are given
// need to implement colspan
function rowsToSimpleRows(rows)
{
  // for recursive arrays ( / colspan ) : have a currentCols : no : rec
  var rawCols=rows[0];
  var colNames=rawCols.map(function(rawCol){
    return rawCol.split("!")[1].trim();
  });

  // for rowspan
  var currentValues={};
  var values=[];
  return rows.slice(1).map(function(row)
  {
    var currentColValue="";
    var currentColRemaining=0;

    var colToAdd=colNames.length-row.length;
    var i;
    for(i=0;i<colToAdd;i++) if(currentValues[i]!==undefined && currentValues[i].n>0) row.unshift("");
    var fields=[];
    for(i=0;i<row.length;i++)
    {
      var col=row[i];
      col=col.substring(2);
      var parts,value,n;
      if(col.indexOf("colspan")!=-1)
      {
        parts=col.split("|");
        value=parts[1].trim();
        n=parts[0].replace(/^.*colspan="([0-9]+)".*/,'$1');
        currentColValue=value;
        currentColRemaining=n;
      }
      else if(col.indexOf("rowspan")!=-1)
      {
        parts=col.split("|");
        value=parts[1].trim();
        n=parts[0].replace(/^.*rowspan="([0-9]+)".*/,'$1');
        currentValues[i]={n:n,value:value};
      }
      if(currentValues[i]!==undefined && currentValues[i].n>0)
      {
        currentValues[i].n--;
        fields.push(currentValues[i].value);
      }
      else if(currentColRemaining!=0)
      {
        while(currentColRemaining>0)
        {
          fields.push(currentColValue);
          currentColRemaining--;
        }
      }
      else fields.push(col.trim());
    }
    return fields.reduce(function(values,value,i){
      values[colNames[i]]=value;
      return values;
    },{});
  });
}


function parseWikiTable(lines)
{
  var rows=tableToRows(lines);
  return rowsToSimpleRows(rows);
}


function tableToPacket(table)
{
  var packet={};
  if(table.length==0 || table[0]["Packet ID"]==undefined)
    return null;
  packet["id"]=table[0]["Packet ID"];
  packet["fields"]=table
    .filter(function(value){
      return !value["Field Name"] || value["Field Name"]!="''no fields''"
    })
    .map(function(value){
    if(value["Field Name"]==undefined || value["Field Type"]==undefined) {
      //console.log(value);
      return null;
    }
    return {
      "name":value["Field Name"],
      "type":value["Field Type"]
    }
  });
  return packet;
}

// transforms
function transformProtocol(protocol,cb)
{
  var transformedProtocol = Object
    .keys(protocol)
    .reduce(function(transformedProtocol, state) {
      var transformedState=transformState(state);
      transformedProtocol[transformedState] = Object
        .keys(protocol[state])
        .reduce(function(stateO, direction) {
          var transformedDirection=transformDirection(direction);
          stateO[transformedDirection] = Object
            .keys(protocol[state][direction])
            .reduce(function(packetsO, packetName) {
              var transformedPacket=transformPacket(protocol[state][direction][packetName],transformedState,transformedDirection);
              var transformedPacketName=transformPacketName(packetName,transformedState,transformedDirection,transformedPacket ? transformedPacket["id"] : null);
              packetsO[transformedPacketName] = transformedPacket;
              return packetsO;
            }, {});
          return stateO;
        }, {});
      return transformedProtocol;
    }, {});
  transformedProtocol=reorder(["handshaking","status","login","play"],transformedProtocol);
  cb(null,transformedProtocol);
}

function reorder (order, obj) {
  return order.reduce (function (rslt, prop) {
    rslt[prop] = obj[prop];
    return rslt;
  }, {});
}

function transformPacket(packet,state,direction)
{
  if(!packet)
    return null;
  var transformedId=transformId(packet["id"]);
  return {
    "id":transformedId,
    "fields":packet["fields"] ? packet["fields"].map(function(field){return transformField(field,state,direction,transformedId);}) : null
  };
}

function transformId(id)
{
  return id ? id.toLowerCase() : null;
}

function transformField(field,state,direction,id)
{
  return field ? {
    "name":transformFieldName(field["name"],state,direction,id),
    "type":transformFieldType(field["type"])
  } : null;
}


function transformState(state)
{
  return state.toLowerCase();
}

function transformDirection(direction)
{
  if(direction=="Serverbound") return "toServer";
  if(direction=="Clientbound") return "toClient";
}

function toSnakeCase(name)
{
  return name.split(" ").map(function(word){return word.toLowerCase();}).join("_");
}

function toCamelCase(name)
{
  var words=name.split(" ");
  words[0]=words[0].toLowerCase();
  for(i=1;i<words.length;i++) words[i]=words[i].charAt(0).toUpperCase()+words[i].slice(1).toLowerCase();
  return words.join("");
}

var oldNames={
  "handshaking": {
    "toServer": {
      "0x00":"set_protocol"
    }
  },
  "status": {
    "toClient": {
      "0x00":"server_info",
      "0x01":"ping"
    },
    "toServer": {
      "0x00":"ping_start"
    }
  },
  "login": {
    "toClient": {
      "0x01":"encryption_begin",
      "0x02":"success",
      "0x03":"compress"
    },
    "toServer": {
      "0x01":"encryption_begin"
    }
  },
  "play": {
    "toClient":{
      "0x01":"login",
      "0x02":"chat",
      "0x03":"update_time",
      "0x08":"position",
      "0x09":"held_item_slot",
      "0x0a":"bed",
      "0x0c":"named_entity_spawn",
      "0x0d":"collect",
      "0x0e":"spawn_entity",
      "0x0f":"spawn_entity_living",
      "0x10":"spawn_entity_painting",
      "0x11":"spawn_entity_experience_orb",
      "0x13":"entity_destroy",
      "0x15":"rel_entity_move",
      "0x17":"entity_move_look",
      "0x19":"entity_head_rotation",
      "0x1f":"experience",
      "0x20":"update_attributes",
      "0x21":"map_chunk",
      "0x28":"world_event",
      "0x29":"named_sound_effect",
      "0x2a":"world_particles",
      "0x2b":"game_state_change",
      "0x2c":"spawn_entity_weather",
      "0x31":"craft_progress_bar",
      "0x32":"transaction",
      "0x34":"map",
      "0x35":"tile_entity_data",
      "0x36":"open_sign_entity",
      "0x38":"player_info",
      "0x39":"abilities",
      "0x3a":"tab_complete",
      "0x3c":"scoreboard_score",
      "0x3d":"scoreboard_display_objective",
      "0x3e":"scoreboard_team",
      "0x3f":"custom_payload",
      "0x40":"kick_disconnect",
      "0x41":"difficulty",
      "0x47":"playerlist_header"
    },
    "toServer": {
      "0x01":"chat",
      "0x03":"flying",
      "0x04":"position",
      "0x05":"look",
      "0x06":"position_look",
      "0x07":"block_dig",
      "0x08":"block_place",
      "0x09":"held_item_slot",
      "0x0a":"arm_animation",
      "0x0e":"window_click",
      "0x0f":"transaction",
      "0x10":"set_creative_slot",
      "0x13":"abilities",
      "0x14":"tab_complete",
      "0x15":"settings",
      "0x16":"client_command",
      "0x17":"custom_payload",
      "0x19":"resource_pack_receive"
    }
  }
};

function toOldNames(name,state,direction,id)
{
  return oldNames[state] && oldNames[state][direction] && oldNames[state][direction][id] ? oldNames[state][direction][id] : name;
}

function transformPacketName(packetName,state,direction,id)
{
  return toOldNames(toSnakeCase(packetName),state,direction,id);
}

function transformFieldType(fieldType)
{
  fieldType=fieldType.toLowerCase().replace("unsigned ","u").replace("boolean","bool").replace("[[chat]]","string")
    .replace("angle","byte").replace("uuid","UUID");
  if(fieldType.indexOf("slot")!=-1) return "slot";
  if(fieldType.indexOf("entity metadata")!=-1) return "entityMetadata";
  if(fieldType.indexOf("nbt")!=-1) return "restBuffer";
  return fieldType;
}

// specific has priority over general

// specific
var newToOldFieldNamesSpecific={
  "status":{
    "toClient":{
      "0x01":{
        "payload":"time"
      }
    },
    "toServer":{
      "0x01":{
        "payload":"time"
      }
    }
  },
  "login": {
    "toServer": {
      "0x00":{
        "name":"username"
      }
    }
  },
  "play": {
    "toClient": {
      "0x01":{
        "gamemode":"gameMode"
      },
      "0x0e":{
        "data":"objectData"
      },
      "0x21":{
        "data":"chunkData"
      },
      "0x2b":{
        "value":"gameMode"
      },
      "0x2f":{
        "slotData":"item"
      },
      "0x30":{
        "slotData":"items"
      },
      "0x32":{
        "actionNumber":"action"
      },
      "0x3b":{
        "mode":"action",
        "objectiveName":"name"
      },
      "0x3c":{
        "scoreName":"itemName",
        "objectiveName":"scoreName"
      },
      "0x3d":{
        "scoreName":"name"
      }
    },
    "toServer":{
      "0x02":{
        "type":"mouse"
      },
      "0x08":{
        "face":"direction",
        "cursorPositionX":"cursorX",
        "cursorPositionY":"cursorY",
        "cursorPositionZ":"cursorZ"
      },
      "0x09":{
        "slot":"slotId"
      },
      "0x0b":{
        "payload":"actionId"
      },
      "0x0c":{
        "flags":"jump"
      },
      "0x0e":{
        "actionNumber":"action"
      },
      "0x0f":{
        "actionNumber":"action"
      },
      "0x16":{
        "actionId":"payload"
      }
    }
  }
};

// should probably be converted entirely in the specific format
// general
var newToOldFieldNamesGeneral={
  "serverAddress":"serverHost",
  "jsonResponse":"response",
  "jsonData":"message",
  "worldAge":"age",
  "timeOfDay":"time",
  "playerUuid":"playerUUID",
  "deltaX":"dX",
  "deltaY":"dY",
  "deltaZ":"dZ",
  "chunkX":"x",
  "chunkZ":"z",
  "ground-upContinuous":"groundUp",
  "primaryBitMask":"bitMap",
  "size":"chunkDataLength",
  "blockId":"type",
  "blockType":"blockId",
  "recordCount":"count",
  "records":"affectedBlockOffsets",
  "disableRelativeVolume":"global",
  "effectPositionX":"x",
  "effectPositionY":"y",
  "effectPositionZ":"z",
  "particleCount":"particles",
  "windowType":"inventoryType",
  "numberOfSlots":"slotCount",
  "line1":"text1",
  "line2":"text2",
  "line3":"text3",
  "line4":"text4",
  "objectiveValue":"displayText",
  "teamName":"team",
  "teamDisplayName":"name",
  "teamPrefix":"prefix",
  "teamSuffix":"suffix",
  "targetX":"x",
  "targetY":"y",
  "targetZ":"z",
  "feetY":"y",
  "button":"mouseButton",
  "clickedItem":"item",
  "lookedAtBlock":"block",
  "chatMode":"chatFlags",
  "displayedSkinParts":"skinParts",
  "targetPlayer":"target"
};

function toOldFieldName(fieldName,state,direction,id)
{
  if(newToOldFieldNamesSpecific[state]
    && newToOldFieldNamesSpecific[state][direction]
    && newToOldFieldNamesSpecific[state][direction][id]
    && newToOldFieldNamesSpecific[state][direction][id][fieldName])
    return newToOldFieldNamesSpecific[state][direction][id][fieldName];
  if(newToOldFieldNamesGeneral[fieldName])
    return newToOldFieldNamesGeneral[fieldName];
  return fieldName;
}

function transformFieldName(fieldName,state,direction,id)
{
  return toOldFieldName(toCamelCase(fieldName),state,direction,id);
}

