var WikiTextParser = require('./wikitext_parser');
var async=require('async');
var fs = require('fs');

var wikiTextParser = new WikiTextParser();

function parseStackable(stackable)
{
  if(stackable == undefined) return null;
  if(stackable.indexOf("No")!=-1) return 1;
  var result=stackable.match(new RegExp("Yes \\(([0-9]+)\\)"));
  if(result==null) return null;
  return parseInt(result[1]);
}

function itemInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values=infoBox["values"];

    var outputData={
      "id":parseInt(values["data"]),
      "displayName":page,
      "stackSize":parseStackable(values["stackable"]),
      "name":page.toLowerCase()
    };
    cb(outputData);
  });
}

function tableToObjectTable(table)
{
  return table
    .filter(function(element){return element[1]!="" && element[1].indexOf("=")==-1;})
    .map(function(element){
      var object={};
      object["displayName"]=element[1];
      if(element.length>=3 && element[2].indexOf("=")==-1)
        object["note"]=element[2];
      for(var i=2;i<element.length;i++)
      {
        if(element[i].indexOf("=")!=-1)
        {
          var parts=element[i].split("=");
          object[parts[0]]=parts[1];
        }
      }
      return object;
    });
}

function objectTableToItems(objectTable)
{
  var id;
  return objectTable.map(function(object){
    if("dv" in object)
      id=parseInt(object["dv"]);
    else
      id++;
    return {
      "id":id,
      "displayName":object["displayName"],
      "link":"link" in object ? object["link"] : object["displayName"],
      "name":"nameid" in object ? object["nameid"] : object["displayName"].toLowerCase().replace(/ /g,"_")
    };
  });
}

function itemsToFullItems(items,cb)
{
  async.map(items,function(item,cb){
    itemInfobox(item["link"],function(data){
      cb(null,{
        "id":item["id"],
        "displayName":item["displayName"],
        "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
        "name":item["name"]
      });
    });
  },function(err,results){
    cb(null,results);
  });
}

// http://minecraft.gamepedia.com/Template:ID_table
// algo : dv=256 start the counter, +1 for next items, until there's a new dv
// nameid is the name in lower case if not defined
function parseItemDataValues(cb)
{
  wikiTextParser.getArticle("Data_values/Item_IDs",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var itemsText=sectionObject["content"];
    var table=wikiTextParser.parseTable(itemsText);
    var objectTable=tableToObjectTable(table);
    var items=objectTableToItems(objectTable);
    console.log(items);
    cb(null,items);
  });
}

function writeAllItems()
{
  async.waterfall([
    parseItemDataValues,
    itemsToFullItems
  ],
    function(err,fullItems){
      var items={};
      for(var i in fullItems)
      {
        items[fullItems[i]["id"]]=fullItems[i];
      }
      fs.writeFile("../../enums/items.json", JSON.stringify(items,null,2));
    });
}

writeAllItems();

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
  itemInfobox("Arrow",function(data){
    console.log(data);
  });
}
function testWaitDisc()
{
  itemInfobox("Wait Disc",function(data){
    console.log(data);
  });
}

function testGoldenApple()
{
  itemInfobox("Golden Apple",function(data){
    console.log(data);
  });
}

function parseAllItems()
{
  items(function(pages){
    console.log(pages.length);
    async.map(pages,function(page,cb){
      itemInfobox(page,function(data){
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