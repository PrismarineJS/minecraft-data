var WikiTextParser = require('./wikitext_parser');
var async=require('async');

var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./id_table_template_parser.js');
var infobox_field_parser=require('./infobox_field_parser.js');

// values on infobox present on other pages :
// http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

// breaking times : http://minecraft.gamepedia.com/Template:Breaking_row http://minecraft.gamepedia.com/Module:Breaking_row : not useful


//getHardnessValues();
writeAllBlocks();
//testAir();
//testStone();
//testWheat();
/*id_table_parser.parseDataValues("Data_values/Block_IDs",function(err,blocks){
 console.log(blocks);
 });*/


var wikitypeToBoundingBox={
  "solid block":"block",
  "non-solid block":"empty",
  "plant":"empty",
  "fluid":"empty",
  "non-solid":"empty",
  "technical":"block",
  "solid":"block",
  "ingredient<br>block":"block",
  "nonsolid block":"empty",
  "block entity":"block",
  "item":"empty",
  "foodstuff":"empty",
  "tile entity":"block",
  "tool":"empty",
  "food":"empty",
  "semi-solid":"block",
  "light-emitting block":"block",
  "plants":"empty",
  "block":"block",
  "non-solid; plant":"empty",
  "wearable items; solid block":"block",
  "solid, plants":"block",
  "non-solid; plants":"empty"
};

// TODO: automatically get the correct section for link like http://minecraft.gamepedia.com/Technical_blocks#Piston_Head
// check Nether Brick Fence

// http://minecraft.gamepedia.com/Template:Block
function blockInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values=infoBox["values"];

    if(values["type"] && !(values["type"].trim().toLowerCase() in wikitypeToBoundingBox))
      console.log(page+" : "+values["type"]);

    var outputData={
      "id":parseInt(values["data"]),
      "displayName":page,
      "stackSize":infobox_field_parser.parseStackable(values["stackable"]),
      "name":page.toLowerCase(),
      //TODO: to fix by properly parsing the tool (break for http://minecraft.gamepedia.com/Water)
      // see http://minecraft.gamepedia.com/Breaking and http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
      "liquid":values["type"] && values["type"].trim().toLowerCase() == "fluid",
      "tool":"tool" in values ? values["tool"] : null ,
      "boundingBox" : values["type"] && values["type"].trim().toLowerCase() in wikitypeToBoundingBox ? wikitypeToBoundingBox[values["type"].trim().toLowerCase()] : null
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
function testWheat()
{
    blockInfobox("Wheat",function(err,data){
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
        "hardness": block["hardness"],
        "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
        "name":block["name"],
        // see http://minecraft.gamepedia.com/Breaking and http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
        "diggable": !data["liquid"] && block["hardness"] !== null && (!data["tool"] || data["tool"]!="N/A"),
        "boundingBox": data["boundingBox"]
      });
    });
  },function(err,results){
    cb(null,results);
  });
}


//http://minecraft.gamepedia.com/Breaking#Blocks_by_hardness
// http://minecraft.gamepedia.com/Module:Hardness_values : keys are links in lowercase with _ removed
// http://minecraft.gamepedia.com/Module:Breaking_row
// http://minecraft.gamepedia.com/Module:Block_value

function getHardnessValues(cb)
{
  wikiTextParser.getArticle("Module:Hardness_values",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);
    var linkToHardness=sectionObject["content"]
        .filter(function(element){return element.indexOf("=")!=-1})
        .reduce(function(acc,element){
          var parts=element.split("=");
          var key=parts[0].trim().replace(/'|\t|\[|\]/g,"");
          acc[key]=parseFloat(parts[1].trim());
          return acc;
        },{});
    cb(null,linkToHardness);
  });
}

// http://minecraft.gamepedia.com/Module:Block_value
function displayNameToBlockValueKey(displayName)
{
  var key=displayName.replace(/ \(.+?\)/g,"").replace(/ /g,"").toLowerCase();
  var keepS = [
    "glass",
    "steps",
    "stairs",
    "bars",
    "cactus" ,
    "leaves",
    "grass",
    "potatoes"
    ];

  if(!keepS.some(function(keep){return key.indexOf(keep)!=-1;}))
    key=key.replace(/s$/,"");

  key=key.replace( 'wooden', 'wood' )
      .replace( 'mossy', 'moss' )
      .replace( 'steps', 'stairs' )
      .replace(/^.+woodstairs/,"woodstairs")
      .replace(/sprucedoor|birchdoor|jungledoor|acaciadoor|darkoakdoor|oakdoor/,"wooddoor")
      .replace(/^.+#/,"")
      .replace(/'/,"");
  return key;
}

function transformHardness(hardness)
{
  return hardness==-1 ? null : hardness; // bedrock and some other blocks
}

function addHardness(blocks,cb)
{
  getHardnessValues(function(err,linkToHardness){
    cb(null,blocks.map(function(block){
      var key1=displayNameToBlockValueKey(block["displayName"]);
      var key2=displayNameToBlockValueKey(block["link"]);
      if(!(key1 in linkToHardness) && !(key2 in linkToHardness))
        console.log("hardness not found for : "+key1+" "+key2);
      block["hardness"]=key1 in linkToHardness ? linkToHardness[key1] : (key2 in linkToHardness ? linkToHardness[key2] : 0);
      block["hardness"]=transformHardness(block["hardness"]);
      return block;
    }));
  });
}

function indexAndWrite(err,fullBlocks)
{
  var blocks={};
  for(var i in fullBlocks)
  {
    blocks[fullBlocks[i]["id"]]=fullBlocks[i];
  }
  console.log(blocks);
  //fs.writeFile("../../enums/blocks.json", JSON.stringify(items,null,2));
}

function writeAllBlocks()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Block_IDs",cb)},
        addHardness,
        //function(blocks,cb){console.log(blocks);cb(null,blocks);},
      //function(blocks,cb){cb(null,blocks.slice(0,10))},
      blocksToFullBlocks
    ]
     , indexAndWrite
  );
}



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