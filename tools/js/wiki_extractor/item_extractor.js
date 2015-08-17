var WikiTextParser = require('./lib/wikitext_parser');
var async=require('async');
var fs = require('fs');

var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./lib/id_table_template_parser.js');
var DvtParser=require('./lib/dvt_template_parser.js');

var dvtParser=new DvtParser(wikiTextParser);
var infobox_field_parser=require('./lib/infobox_field_parser.js');

module.exports = {itemInfobox:itemInfobox};

writeAllItems();


function writeAllItems()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Item_IDs",cb)},
      //function(items,cb){console.log(JSON.stringify(items,null,2));cb(null,items);}
      itemsToFullItems
    ],
    write
  );
}

function write(err,fullItems){
  if(err)
  {
    console.log("problem "+err);
    return;
  }
  fs.writeFile("../../../enums/items.json", JSON.stringify(fullItems,null,2));
}


// http://minecraft.gamepedia.com/Template:Item
function itemInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    cb(null,parseItemInfobox(sectionObject["content"]))
  });
}

function parseItemInfobox(page,content)
{
  var infoBox=wikiTextParser.parseInfoBox(content);
  var values=infoBox["values"];

  return {
    "id":parseInt(values["data"]),
    "displayName":page,
    "stackSize":infobox_field_parser.parseStackable(values["stackable"]),
    "name":page.toLowerCase()
  };
}

function itemsToFullItems(items,cb)
{
  async.map(items,function(item,cb){
    async.waterfall([
      function(cb){
        wikiTextParser.getArticle(item["link"]=="Dye" ? "Ink Sac" : item["link"],function(err,pageData,title){
          if(err)
          {
            cb(err);
            return;
          }
          var sectionObject=wikiTextParser.pageToSectionObject(pageData);
          cb(err,sectionObject,title);
        });
      },
      function(sectionObject,title,cb){
        dvtParser.getVariations(title,item["id"],sectionObject,function(err,vara){
          cb(err,sectionObject,vara);
        })},
      function(sectionObject,vara,cb) {
        var data=parseItemInfobox(item["link"],sectionObject["content"]);

        cb(null,{
          "id":item["id"],
          "displayName":item["displayName"],
          "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
          "name":item["name"],
          "variations":vara!=null ? vara : undefined
        });
      }
    ],cb);
  },cb);
}