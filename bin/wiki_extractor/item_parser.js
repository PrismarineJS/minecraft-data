var WikiTextParser = require('./wikitext_parser');
var async=require('async');

var wikiTextParser = new WikiTextParser();

function parseStackable(stackable)
{
  if(stackable == undefined) return null;
  if(stackable=="No") return 1;
  var result=stackable.match(new RegExp("^Yes \\(([0-9]+)\\)$"));
  if(result==null) return null;
  return parseInt(result[1]);
}

function itemInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(data){
    //console.log(page);
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values=infoBox["values"];

    var outputData={
      "id":parseInt(values["data"]),
      "displayName":page,
      "stackSize":parseStackable(values["stackable"]),
      "name":page.toLowerCase()
    };
    if(isNaN(outputData["id"]))
    {
      //console.log(page+" has no id");
      cb(null);
      return;
    }
    cb(outputData);
    //var break
  });
}

function items(cb)
{
  async.parallel([
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Items",function(pages){
        cb(null,pages);
      });
    },
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Pocket Edition‎",function(pages){
        cb(null,pages);
      });
    },
    function(cb){
      wikiTextParser.getSimplePagesInCategory("Console Edition‎",function(pages){
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

function parseAllItems()
{
  //itemInfobox();
  items(function(pages){
    console.log(pages.length);
    async.map(pages,function(page,cb){
      itemInfobox(page,function(data){
        //console.log(data);
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

parseAllItems();



