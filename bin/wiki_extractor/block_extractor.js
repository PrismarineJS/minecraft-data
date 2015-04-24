var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

function blockInfobox()
{
  // values on infobox present on other pages :
  // http://minecraft.gamepedia.com/Template:Block
  // http://minecraft.gamepedia.com/index.php?title=Module:Hardness_values&action=edit
  // http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

  // breaking times : http://minecraft.gamepedia.com/Template:Breaking_row http://minecraft.gamepedia.com/Module:Breaking_row

  wikiTextParser.getArticle("Stone",function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
    console.log(infoBox);

    //var break
  });
}

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

blockQuery();