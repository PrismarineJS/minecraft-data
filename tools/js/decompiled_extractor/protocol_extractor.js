var fs = require("fs");
var async=require('async');

if(process.argv.length != 3) {
  console.log("Usage : node protocol_extractor.js <decompiledFilesDir>");
  process.exit(1);
}

var decompiledFilesDir=process.argv[2];

getProtocol();
//getFields("jd");
//getFields("hp");

function getProtocol()
{
  async.waterfall([
    readPacketsIds,
    dataToCleanLines,
    linesToProtocol
  ],write);
}

function write(err,protocol){
  if(err)
  {
    console.log("problem "+err);
    return;
  }
  //console.log(JSON.stringify(protocol,null,2));
  fs.writeFile("protocol.json", JSON.stringify(reorder(["handshaking","status","login","play"],protocol),null,2));
}

function readPacketsIds(cb)
{
  readClass('el',cb);
}

function dataToCleanLines(data,cb)
{
  var c=true;
  var lines=data.split("\n");
  cb(null,lines
    .map(function(s){return s.trim()})
    .filter(function(s){return s.indexOf("import")==-1 && s.indexOf("public")==-1 && s!="}" && s!="{" && s!="}," && s!=""})
    .filter(function(s){if(s=="};") c=false; return c;}));
}

function linesToProtocol(cleanLines,cb)
{
  var currentState;
  var currentToClientId;
  var currentToServerId;
  cb(null,cleanLines.reduce(function(protocol,line){
    var results;
    if(results=line.match(/[a-z]\((-?[0-9])\) {/)) {
      currentState = states[results[1]];
      currentToClientId=0;
      currentToServerId=0;
      protocol[currentState]={};
    }
    else if(results=line.match(/this\.a\(fg\.(a|b), ([a-z.]+)\.class\);/))
    {
      var direction=results[1]=="b" ? "toClient" : "toServer";
      var theClass=results[2];
      var id=idToHexString(direction=="toClient" ? currentToClientId : currentToServerId);
      if(protocol[currentState][direction]==undefined)
        protocol[currentState][direction]={};
      protocol[currentState][direction][theClass]={"id":id,"fields":getFields(theClass)};
      if(direction=="toClient") currentToClientId++;
      else currentToServerId++;
    }
    return protocol;
  },{}));
}

function reorder (order, obj) {
  return order.reduce (function (rslt, prop) {
    rslt[prop] = obj[prop];
    return rslt;
  }, {});
}

function idToHexString(id)
{
  var hexString=id.toString(16);
  if(hexString.length==1)
    hexString="0"+hexString;
  return "0x"+hexString;
}

var states = {
  "0": "play",
  "1": "status",
  "2": "login",
  "-1": "handshaking"
};

function readClass(className,cb)
{
  fs.readFile(decompiledFilesDir+'/'+className+'.java', "utf8", cb);
}


function readClassSync(className)
{
  return fs.readFileSync(decompiledFilesDir+'/'+className+'.java', "utf8");
}

function getFields(className)
{
  if(className.indexOf(".")!=-1) return ["error"];
  var data=readClassSync(className);
  var fields=processPacketDefinition(data);

  //console.log(fields);
  return fields;
}

// get the whole reading method instead and map the method call to types
function processPacketDefinition(data)
{
  var fields=data
    .split("\n")
    .map(function(s){return s.trim()})
    .filter(function(s){return s.indexOf("read")!=-1})
    .map(function(s){
      var results= s.match(/read(.+?)\(/);
      return results[1];
    })
    .filter(function(type){return type!==undefined})
    .map(function(type){return transformType(type)});
  return fields;
}

function transformType(type)
{
  var type=type.toLowerCase();
  return type.replace("unsigned","u");
}