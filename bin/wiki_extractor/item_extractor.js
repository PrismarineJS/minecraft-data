var WikiTextParser = require('./wikitext_parser');
var async=require('async');
var fs = require('fs');

var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./id_table_template_parser.js');
var DvtParser=require('./dvt_template_parser.js');

var dvtParser=new DvtParser(wikiTextParser);
var infobox_field_parser=require('./infobox_field_parser.js');


writeAllItems();
//getDataValue("Coal/DV");
//getDataValue("Stone/DV");



function writeAllItems()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Item_IDs",cb)},
      //function(items,cb){console.log(JSON.stringify(items,null,2));cb(null,items);}
      itemsToFullItems
    ],
     indexWrite
  );
}

function indexWrite(err,fullItems){
  if(err)
  {
    console.log("problem "+err);
    return;
  }
  var items={};
  for(var i in fullItems)
  {
    items[fullItems[i]["id"]]=fullItems[i];
  }
  fs.writeFile("../../enums/items.json", JSON.stringify(items,null,2));
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


        //var d=dvt_parser.getAllDataValues(sectionObject);
        //if(d.length>0)
        //  console.log(item["link"]+" "+d);


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


// functions that aren't used in the end
function items(cb)
{
  async.parallel([
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Items",function(err,pages){
        cb(null,pages);
      });
    },
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Pocket Edition‎",function(err,pages){
        cb(null,pages);
      });
    },
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Console Edition‎",function(err,pages){
        cb(null,pages);
      });
    }
  ],function(err,results)
  {
    cb(results[0]
        .filter(function(e){return results[1].indexOf(e) == -1;})
        .filter(function(e){return results[2].indexOf(e) == -1;})
    )
  });

}
function testArrow()
{
  itemInfobox("Arrow",function(err,data){
    console.log(data);
  });
}
function testWaitDisc()
{
  itemInfobox("Wait Disc",function(err,data){
    console.log(data);
  });
}

function testGoldenApple()
{
  itemInfobox("Golden Apple",function(err,data){
    console.log(data);
  });
}

function parseAllItems()
{
  items(function(pages){
    console.log(pages.length);
    async.map(pages,function(page,cb){
      itemInfobox(page,function(err,data){
        cb(null,data);
      });
    },function(err,results){
      var r=results.filter(function(item){return item!=null;});
      var items={};
      for(var i in r)
      {
        items[r[i]["id"]]=r[i];
      }
      console.log(r.length);
      console.log(items);
    });
  });
}