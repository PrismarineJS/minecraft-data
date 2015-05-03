module.exports={nameToId:nameToId};

function dnt(dn)
{
  return dn.toLowerCase().replace(/ (facing|with).+$/,"");
}

var items=require("../../../enums/items.json");
var itemsByName=Object.keys(items).reduce(function(acc,key){acc[items[key]["displayName"]]=items[key]["id"];return acc;},{});
var blocks=require("../../../enums/blocks.json");
var blocksByName=Object.keys(blocks).reduce(function(acc,key){acc[blocks[key]["displayName"]]=blocks[key]["id"];return acc;},{});
var itemsVariationsByName=Object.keys(items).reduce(function(acc,key){
  if("variations" in items[key])
    return items[key]["variations"].reduce(function(acc,variation){
      acc[dnt(variation["displayName"])]={"id":items[key]["id"],"metadata":variation["metadata"]};
      return acc;
    },acc);
  else return acc;
},{});
var blocksVariationsByName=Object.keys(blocks).reduce(function(acc,key){
  if("variations" in blocks[key])
    return blocks[key]["variations"].reduce(function(acc,variation){
      acc[dnt(variation["displayName"])]={"id":blocks[key]["id"],"metadata":variation["metadata"]};
      return acc;
    },acc);
  else return acc;
},{});

function findItem(name)
{
  var itemVariation=itemsVariationsByName[name.toLowerCase()];
  return typeof itemVariation !== "undefined" ? itemVariation : itemsByName[name];
}

function findBlock(name)
{
  var blockVariation=blocksVariationsByName[name.toLowerCase()];
  return typeof blockVariation !== "undefined" ? blockVariation : blocksByName[name];
}

function nameToId(name)
{
  if(name == "")
    return null;
  var p=name.match(/^(.+) \((block|item)\)$/i);
  if(p!=null && p.length==3)
  {
    var itemP=findItem(p[1]);
    var blockP=findBlock(p[1]);
    if(p[2].toLowerCase()=="item" && typeof itemP !== 'undefined')
      return itemP;
    if(p[2].toLowerCase()=="block" && typeof blockP !== 'undefined')
      return blockP;
  }
  var item=findItem(name);
  var block=findBlock(name);
  if(typeof item !== 'undefined')
    return item;
  if(typeof block !== 'undefined')
    return block;
  return undefined;
}