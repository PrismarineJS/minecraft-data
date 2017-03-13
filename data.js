var queryString=require("query-string");

var parameters=queryString.parse(location.search);

var rawVersion=parameters["v"];
var version=rawVersion ?  rawVersion : "1.11.2";
var rawActive=parameters["d"];
var active=rawActive ?  rawActive : "items";

var enums=["biomes","instruments","items","materials","blocks","recipes","entities","protocol","windows","effects"];

var enumsValues=["biomes","instruments","items","blocks","entities","protocol","windows","effects"];

module.exports={
  version:version,
  active:active,
  enums:enums,
  enumsValues:enumsValues
};