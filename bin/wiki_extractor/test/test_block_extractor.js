// blocks tests

var WikiTextParser = require('./../lib/wikitext_parser');
var wikiTextParser = new WikiTextParser();

var block_extractor = require("./../block_extractor.js");


//getHardnessValues();
//testNetherBrickFence();
//getMaterials(function(err,data){console.log(data);});
//testAir();
//testStone();
//testWheat();
//testWood();
//testPumpkin();
//testCarrot();
//testMelon();
/*id_table_parser.parseDataValues("Data_values/Block_IDs",function(err,blocks){
 console.log(blocks);
 });*/


function testNetherBrickFence()
{
  block_extractor.blockInfobox("Nether Brick Fence",function(err,data){
    console.log(data);
  });
}

function testMelon()
{
  block_extractor.blockInfobox("Melon",function(err,data){
    console.log(data);
  });
}

function testStone()
{
  block_extractor.blockInfobox("Stone",function(err,data){
    console.log(data);
  });
}
function testAir()
{
  block_extractor.blockInfobox("Air",function(err,data){
    console.log(data);
  });
}
function testWheat()
{
  block_extractor.blockInfobox("Wheat",function(err,data){
    console.log(data);
  });
}
function testWood() {
  wikiTextParser.getArticle("Wood", function (err, data) {
    var sectionObject = wikiTextParser.pageToSectionObject(data);

    var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values = infoBox["values"];
    console.log(values);
  });
}
// starting with {{about
function testPumpkin() {
  wikiTextParser.getArticle("Pumpkin", function (err, data) {
    var sectionObject = wikiTextParser.pageToSectionObject(data);

    console.log(sectionObject["content"]);
    var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values = infoBox["values"];
    console.log(values);
  });
}
// starting with {{about
function testCarrot() {
  wikiTextParser.getArticle("Carrot", function (err, data) {
    var sectionObject = wikiTextParser.pageToSectionObject(data);

    console.log(sectionObject["content"]);
    var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
    var values = infoBox["values"];
    console.log(values);
  });
}