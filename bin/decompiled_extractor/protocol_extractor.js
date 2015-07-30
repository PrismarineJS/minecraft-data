var fs = require("fs");
var async=require('async');

if(process.argv.length != 3) {
  console.log("Usage : node protocol_extractor.js <decompiledFilesDir>");
  process.exit(1);
}

var decompiledFilesDir=process.argv[2];

getProtocol();

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
  fs.readFile(decompiledFilesDir+'/el.java', "utf8", function (err, data) {
    if (err){
      cb(err);
      return;
    }
    cb(null,data);
  });
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
  var currentId;
  cb(null,cleanLines.reduce(function(protocol,line){
    var results;
    if(results=line.match(/[a-z]\((-?[0-9])\) {/)) {
      currentState = states[results[1]];
      currentId=0;
      protocol[currentState]={};
    }
    else if(results=line.match(/this\.a\(fg\.(a|b), ([a-z.]+)\.class\);/))
    {
      var direction=results[1]=="b" ? "toClient" : "toServer";
      var theClass=results[2];
      var id=idToHexString(currentId);
      if(protocol[currentState][direction]==undefined)
        protocol[currentState][direction]={};
      protocol[currentState][direction][theClass]={"id":id};
      currentId++;
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