module.exports={nameToId:nameToId};

function dnt(dn)
{
  return dn.toLowerCase().replace(/ (facing|with).+$/,"");
}

var items=require("../../../enums/items.json");
var itemsByName=items.reduce(function(acc,item){acc[item["displayName"]]=item["id"];return acc;},{});
var blocks=require("../../../enums/blocks.json");
var blocksByName=blocks.reduce(function(acc,block){acc[block["displayName"]]=block["id"];return acc;},{});
var itemsVariationsByName=items.reduce(function(acc,item){
  if("variations" in item)
    return item["variations"].reduce(function(acc,variation){
      acc[dnt(variation["displayName"])]={"id":item["id"],"metadata":variation["metadata"]};
      return acc;
    },acc);
  else return acc;
},{});
var blocksVariationsByName=blocks.reduce(function(acc,block){
  if("variations" in block)
    return block["variations"].reduce(function(acc,variation){
      acc[dnt(variation["displayName"])]={"id":block["id"],"metadata":variation["metadata"]};
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