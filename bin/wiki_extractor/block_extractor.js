var WikiTextParser = require('./wikitext_parser');
var async=require('async');
var fs = require('fs');
var wikiTextParser = new WikiTextParser();
var id_table_parser=require('./id_table_template_parser.js');
var infobox_field_parser=require('./infobox_field_parser.js');

// values on infobox present on other pages :
// http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

// breaking times : http://minecraft.gamepedia.com/Template:Breaking_row http://minecraft.gamepedia.com/Module:Breaking_row : not useful

// http://minecraft.gamepedia.com/Breaking : useful to get the breaking times (materials.json) and the harvestTools field (and the material field)
// check http://minecraft.gamepedia.com/Breaking#Speed vs https://github.com/andrewrk/mineflayer/blob/master/lib/plugins/digging.js#L88
// materials.json has redundancies

//getHardnessValues();
writeAllBlocks();
//testNetherBrickFence();
//getMaterials(function(err,data){console.log(data);});
//testAir();
//testStone();
//testWheat();
//testMelon();
/*id_table_parser.parseDataValues("Data_values/Block_IDs",function(err,blocks){
 console.log(blocks);
 });*/



function writeAllBlocks()
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Block_IDs",cb)},
      addHardness,
      addMaterial,
      //function(blocks,cb){console.log(blocks);cb(null,blocks);},
      //function(blocks,cb){cb(null,blocks.slice(0,10))},
      blocksToFullBlocks
    ]
    , indexAndWrite
  );
}



function indexAndWrite(err,fullBlocks)
{
  var blocks={};
  fullBlocks.forEach(function(fullBlock){
    blocks[fullBlock["id"]]=fullBlock;
  });
  //console.log(blocks);
  fs.writeFile("../../enums/blocks.json", JSON.stringify(blocks,null,2));
}


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

    if(!("stackable" in values)) values["stackable"]="N/A";

    var stackSize=infobox_field_parser.parseStackable(values["stackable"]);
    if(stackSize==null)
    {
      console.log("can't parse stackable of "+page);
      console.log(values);
    }

    //if("tool2" in values)
    //  console.log(page);

    //console.log(page);
    //console.log(page+" "+values["tool"]);
    var outputData={
      "id":parseInt(values["data"]),
      "name":page.toLowerCase(),
      "displayName":page,
      "stackSize":stackSize,
      //TODO: to fix by properly parsing the tool (break for http://minecraft.gamepedia.com/Water)
      // see http://minecraft.gamepedia.com/Breaking and http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
      "liquid":values["type"] && values["type"].trim().toLowerCase() == "fluid",
      "tool":"tool" in values ? values["tool"] : null ,
      "tool2":"tool2" in values ? values["tool2"] : null ,
      "harvestTools":toolToHarvestTools(values["tool"],page=="Cobweb"),
      "harvestTools2":toolToHarvestTools(values["tool2"],page=="Cobweb"),
      "boundingBox" : values["type"] && values["type"].trim().toLowerCase() in wikitypeToBoundingBox ? wikitypeToBoundingBox[values["type"].trim().toLowerCase()] : "block"
    };
    cb(null,outputData);
  });
}

// see http://minecraft.gamepedia.com/Module:Breaking_row materialGrade
var toolMaterials=["wooden","golden","stone","iron","diamond"];
var items=require("../../enums/items.json");
var itemsByName=Object.keys(items).reduce(function(acc,key){
  acc[items[key]["name"]]=key;
  return acc;
},{});

function toolToHarvestTools(tool,cobweb)
{
  if(tool === undefined)
    return undefined;
  tool=tool.toLowerCase().trim();
  if(["any","n/a","all","none","bucket"].indexOf(tool)!=-1) // not sure what to do about bucket (is it digging ?)
    return undefined;
  if(["axe","shovel","pickaxe","spade","sword","shears"].indexOf(tool)!=-1 && !cobweb)
   // : not required tools (the fact that they make digging faster is already handled by materials.json)
    return undefined;
  if(["axe","pickaxe","wooden pickaxe","iron pickaxe","stone pickaxe","diamond pickaxe","shovel","shears","spade","bucket","sword","wooden shovel"].indexOf(tool)==-1) {
    console.log(tool); // this shouldn't happen
    return undefined;
  }
  var harvestTools=[];
  if(tool=="sword") tool="wooden sword";//for cobweb
  if(tool=="shears") harvestTools=[itemsByName[tool]];
  else
  {
    var parts=tool.split(" ");
    var cmaterial=parts[0];
    var ctool=parts[1];
    var adding=false;
    toolMaterials.forEach(function(toolMaterial){
      if(toolMaterial==cmaterial)
        adding=true;
      if(adding) harvestTools.push(itemsByName[toolMaterial+"_"+ctool]);
    });
  }

  return harvestTools.reduce(function(acc,harvestTool){
    acc[harvestTool]=true;
    return acc;
  },{});
}

function testNetherBrickFence()
{
  blockInfobox("Nether Brick Fence",function(err,data){
    console.log(data);
  });
}

function testMelon()
{
  blockInfobox("Melon",function(err,data){
    console.log(data);
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

// useful for pages like http://minecraft.gamepedia.com/Stairs with two tools : one for rock material, one for wood material
function chooseCorrectHarvestTools(tool,tool2,harvestTools,harvestTools2,material)
{
  if(!tool2)
    return harvestTools;
  if(material=="web")
  {
    // http://minecraft.gamepedia.com/Cobweb : both tools
    return Object.keys(harvestTools).concat(Object.keys(harvestTools2)).reduce(function(acc,e){acc[e]=true;return acc;},{});
  }
  if(material=="rock")
    return tool.toLowerCase().indexOf("pick")!=-1 ? harvestTools : harvestTools2;
  if(material=="wood")
    return tool.toLowerCase().indexOf("pick")!=-1 ? harvestTools2 : harvestTools;
  console.log("shouldn't happen material:"+material);
  return harvestTools; // shouldn't happen
}

function blocksToFullBlocks(blocks,cb)
{
  async.map(blocks,function(block,cb){
    blockInfobox(block["link"],function(err,data){
      if(data==null)
        console.log("can't get infobox of "+block);
      if(!(data!=null && "stackSize" in data))
        console.log("stackSize problem in "+block+" "+data);
      //if(data["tool2"])
      //  console.log("ht2 | "+block["displayName"]+" | "+block["material"]+" | "+data["tool"]+" | "+data["tool2"]);
      cb(null,{
        "id":block["id"],
        "displayName":block["displayName"],
        "name":block["name"],
        "hardness": block["hardness"],
        "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
        // see http://minecraft.gamepedia.com/Breaking and http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
        // or use this http://minecraft.gamepedia.com/Breaking#Best_tools
        "diggable": block["id"]==59 || (!data["liquid"] && block["hardness"] !== null && (!data["tool"] || data["tool"]!="N/A")),
        "boundingBox": data["boundingBox"],
        "material":block["material"],
        "harvestTools":chooseCorrectHarvestTools(data["tool"],data["tool2"],data["harvestTools"],data["harvestTools2"],block["material"])
      });
    });
  },function(err,results){
    cb(null,results);
  });
}
/*
function parseItemLink(text)
{
  var inside=text.replace("\{\{.+\}\}","$1");
  var parts=inside.split("|");
  var simpleParts=[];
  var namedParts={};
  parts.forEach(function(part){

  });
}*/

// http://minecraft.gamepedia.com/Breaking#Best_tools
function getMaterials(cb)
{
  wikiTextParser.getArticle("Breaking",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);
    var tableContent=sectionObject["Speed"]["Best tools"]["content"];
    var blockToMaterial={};
    var materialToBestTool={};
    var currentMaterial="";
    var currentTool="";
    var prevMaterials=[];
    var currentBlocks=[];
    var currentColumn=0;
    var started=false;
    //console.log(tableContent);
    tableContent.forEach(function(line){
      if(line.startsWith("|rowspan")){

        if(currentTool != "")
        {
          prevMaterials.forEach(function(material){
            materialToBestTool[material]=currentTool;
          });
          prevMaterials=[];
        }

        line=line.replace(/\|rowspan="[0-9]+"\|/,"").trim();
        line=line.replace(/\{\{ItemLink\|(.+)\}\}/,"$1");
        if(line.indexOf("all tools")!=-1) line="all tools";
        if(line.indexOf("instantly breaks")!=-1) line="instantly breaks";
        if(line.indexOf("unbreakable")!=-1) line="unbreakable";
        currentTool=line;
        started=true;
        return;
      }
      if(!started) return;
      currentColumn++;
      if(line == "|-")
      {
        currentColumn=0;
        currentBlocks.forEach(function(block){
          blockToMaterial[block]=currentMaterial;
        });
      }
      else if(currentColumn==1) {
        currentMaterial = line.replace("|", "").trim();
        prevMaterials.push(currentMaterial);
      }
      else if(currentColumn==2)
      {
        line=line.replace("|","").trim();
        currentBlocks=line=="" ? [] : line
          .split("<br>")
          .map(function(row){
            var dt=parseBlockItemTemplate(row);
            return dt["text"].length>dt["link"].length ? dt["text"] : dt["link"];
            //return dt["text"];
          });
      }
    });
    currentBlocks.forEach(function(block){
      blockToMaterial[block]=currentMaterial;
    });
    prevMaterials.forEach(function(material){
      materialToBestTool[material]=currentTool;
    });

    //console.log(blockToMaterial);
    //console.log(materialToBestTool);
    cb(null,{blockToMaterial:blockToMaterial,materialToBestTool:materialToBestTool});
  });
}

function parseBlockItemTemplate(text)
{
  var results=wikiTextParser.parseTemplate(text);
  if(results==null || ["BlockLink","ItemLink"].indexOf(results.template)==-1) {
    console.log(results);
    console.log("problem with parsing template "+text);
    return null;
  }
  var namedParts=results.namedParts;
  var simpleParts=results.simpleParts;
  // might be possible to make a more general version of that for handling defaults
  return {
    id:"id" in namedParts ? namedParts["id"] : simpleParts[0],
    text:"text" in namedParts ? namedParts["text"] : (simpleParts.length==2 ? simpleParts[1] : simpleParts[0]),
    link:"link" in namedParts ? namedParts["link"] : simpleParts[0]
  };
}

function generateMaterials(materialToBestTool,cb)
{

}

var wikiMaterialToSimpleMaterial={
  Plants: 'plant',
  Wood: 'wood',
  Ice: 'rock',
  'Metal I': 'rock',
  'Metal II': 'rock',
  'Metal III': 'rock',
  Rail: 'rock',
  'Rock I': 'rock',
  'Rock II': 'rock',
  'Rock III': 'rock',
  'Rock IV': 'rock',
  Leaves: 'leaves',
  Web: 'web',
  Wool: 'wool',
  Ground: 'dirt',
  Snow: 'dirt',
  Circuits: '',
  Glass: '',
  Other: '',
  Piston: '',
  Liquid: ''
};

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

function getWithVariations(object,variations,verbose)
{
  var correctVariation=variations.find(function(variation){return variation in object;});
  if(correctVariation !==undefined)
    return object[correctVariation];
  else
  {
    if(verbose) console.log("can't find "+variations);
    return null;
  }
}

function addMaterial(blocks,cb)
{
  getMaterials(function(err,data){
    blockToMaterial=data["blockToMaterial"];
    //console.log(blockToMaterial);
    cb(null,blocks.map(function(block){
      var changedDisplayName=block["displayName"]
        .replace(/Spruce Door|Birch Door|Jungle Door|Acacia Door|Dark Oak Door|Oak Door/,"Wooden Door")
        .replace(/^Trapdoor$/,"Wooden Trapdoor")
        .replace(/^Iron Door$/,"Door")
        .replace(/^Portal$/,"Nether Portal")
        .replace(/^Grass$/,"Grass Block")
        .replace(/^Double /,"")
        .replace(/^Potato$/,"Potatoes")
        .replace(/^Red Mushroom$/,"Mushroom_(block)")
        .replace(/^Brown Mushroom$/,"Mushroom_(block)")
        .replace(/^.+Wood Stairs$/,"Wooden Stairs");
      var wikiMaterial=getWithVariations(blockToMaterial,[changedDisplayName,changedDisplayName.replace(/s$/,""),
          changedDisplayName+"s",
        block["link"],block["link"].replace(/s$/,""),block["link"]+"s"],

        ["Air","Piston Head","Block moved by Piston"].indexOf(block["displayName"])==-1);
      if(wikiMaterial!=null)
      {
        var material=wikiMaterialToSimpleMaterial[wikiMaterial];
        if(material!="") block["material"]=material;
      }
      return block;
    }));
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