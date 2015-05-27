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
    extractProtocol
  ],cb);
}

function write(err,protocol){
  if(err)
  {
    console.log("problem "+err);
    return;
  }
  //console.log(JSON.stringify(protocol,null,2));
  fs.writeFile("../../../node-minecraft-protocol/protocol/protocol.json", JSON.stringify(reorder(["handshaking","status","login","play"],protocol),null,2));
}

function reorder (order, obj) {
  return order.reduce (function (rslt, prop) {
    rslt[prop] = obj[prop];
    return rslt;
  }, {});
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
      protocol[transformState(state)] = Object
        .keys(sectionObject[state])
        .filter(function(key) {
          return key != "content"
        })
        .reduce(function(stateO, direction) {
          stateO[transformDirection(direction)] = Object
            .keys(sectionObject[state][direction])
            .filter(function(key) {
              return key != "content"
            })
            .reduce(function(packetsO, packetName) {
              packetsO[transformPacketName(packetName)] = parsePacket(sectionObject[state][direction][packetName]['content']);
              return packetsO;
            }, {});
          return stateO;
        }, {});
      return protocol;
    }, {});

  cb(null,protocol);
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
    var colToAdd=colNames.length-row.length;
    for(i=0;i<colToAdd;i++) row.unshift("");
    return row
      .map(function(col,i){

      col=col.substring(2);
      if(col.indexOf("rowspan")!=-1)
      {
        var parts=col.split("|");
        var value=parts[1].trim();
        var n=parts[0].replace(/^.*rowspan="([0-9])".*/,'$1');
        currentValues[i]={n:n,value:value};
      }
      if(currentValues[i]!==undefined && currentValues[i].n>0)
      {
        currentValues[i].n--;
        return currentValues[i].value;
      }
      else return col.trim();
    })
      .reduce(function(values,value,i){
        values[colNames[i]]=value;
        return values;
      },{});
  });
}


// output format : one object by line, repetition of the row in case of rowspan>1 (for example repetition of Packet Id)
// for colspan>1 : [first element,second element] or {colName:first element,...} if ! are given
function parseWikiTable(lines)
{
  var rows=tableToRows(lines);
  return rowsToSimpleRows(rows);
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

function transformPacketName(packetName)
{
  return toSnakeCase(packetName);
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

function transformFieldName(fieldName)
{
  return toCamelCase(fieldName);
}

function tableToPacket(table)
{
  var packet={};
  if(table.length==0 || table[0]["Packet ID"]==undefined)
    return null;
  packet["id"]=table[0]["Packet ID"].toLowerCase();
  packet["fields"]=table.map(function(value){
    if(value["Field Name"]==undefined || value["Field Type"]==undefined) {
      //console.log(value);
      return null;
    }
    return {
      "name":transformFieldName(value["Field Name"]),
      "type":transformFieldType(value["Field Type"])
    }
  });
  return packet;
}

