var WikiTextParser = require('./wikitext_parser');
var async=require('async');

var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./id_table_template_parser.js');
var infobox_field_parser=require('./infobox_field_parser.js');

function blockInfobox(page,cb)
{
  // values on infobox present on other pages :
  // http://minecraft.gamepedia.com/Template:Block
  // http://minecraft.gamepedia.com/index.php?title=Module:Hardness_values&action=edit
  // http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

  // breaking times : http://minecraft.gamepedia.com/Template:Breaking_row http://minecraft.gamepedia.com/Module:Breaking_row

  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values=infoBox["values"];

    var outputData={
      "id":parseInt(values["data"]),
      "displayName":page,
      "stackSize":infobox_field_parser.parseStackable(values["stackable"]),
      "name":page.toLowerCase()
    };
    cb(null,outputData);
  });
}

function testStone()
{
  blockInfobox("Stone",function(err,data){
    console.log(data);
  });
}
function testAir()
{
  blockInfobox("Air",function(err,data){
    console.log(data);
  });
}

function blocksToFullBlocks(blocks,cb)
{
  async.map(blocks,function(block,cb){
    blockInfobox(block["link"],function(err,data){
      cb(null,{
        "id":block["id"],
        "displayName":block["displayName"],
        "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
        "name":block["name"]
      });
    });
  },function(err,results){
    cb(null,results);
  });
}

function writeAllBlocks()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Block_IDs",cb)},
      //function(blocks,cb){cb(null,blocks.slice(0,10))},
      blocksToFullBlocks
    ],
    function(err,fullBlocks){
      var blocks={};
      for(var i in fullBlocks)
      {
        blocks[fullBlocks[i]["id"]]=fullBlocks[i];
      }
      console.log(blocks);
      //fs.writeFile("../../enums/blocks.json", JSON.stringify(items,null,2));
    });
}

writeAllBlocks();
//testAir();
//testStone();
/*id_table_parser.parseDataValues("Data_values/Block_IDs",function(err,blocks){
  console.log(blocks);
});*/


// not used after all
function recipeQuery()
{
  wikiTextParser.dplQuery(
    '{{#dpl:categorymatch=%recipe' +
    "|include={Crafting}:1:2:3:4:5:6:7:8:9:A1:B1:C1:A2:B2:C2:A3:B3:C3:Output" +
    "|mode = userformat" +
    "|secseparators = ====" +
    "|multisecseparators = ====" +
    "}}",
    function (err,info) {
      console.log(info.split("===="));
    }
  );
}

// doesn't get all the information : limited
function blockQuery()
{
  wikiTextParser.dplQuery(
    '{{#dpl:category=Natural_blocks' +
    "|include={Block}:data:nameid:type:tntres" +
    "|mode = userformat" +
    "|secseparators = ====" +
    "|multisecseparators = ====" +
    "}}",
    function (err,info) {
      console.log(info.split("\n")[0].split("===="));
    }
  );
}

function getBlocks()
{
  wikiTextParser.getArticle("Blocks",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var overworldNaturallyGenerated=sectionObject["World-generated blocks"]["The Overworld"]["Naturally generated"]["content"];
    var table=wikiTextParser.parseTable(overworldNaturallyGenerated);
    var linkTable=table.map(function(values){return values[2];});
    console.log(linkTable);
  });
}