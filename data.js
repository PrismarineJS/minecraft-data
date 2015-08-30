var rawVersion=getUrlParameter("v");
var version=rawVersion ?  rawVersion : "1.8";
var rawActive=getUrlParameter("d");
var active=rawActive ?  rawActive : "items";

var enums=["biomes","instruments","items","materials","blocks","recipes","entities","protocol","windows"];

var enumsValues=["biomes","items","blocks","entities","protocol"];

var repo="PrismarineJS/minecraft-data";