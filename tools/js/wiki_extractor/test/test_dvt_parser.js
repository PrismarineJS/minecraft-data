var WikiTextParser = require('./../lib/wikitext_parser');
var wikiTextParser = new WikiTextParser();

var DvtParser = require("./../lib/dvt_template_parser.js");




var dvtParser=new DvtParser(new WikiTextParser());


// dvtParser tests

//testSlabs2();
//testStone();
//testFlower();
//testDye();
testCarpet();

// testing : several data value in the page
function testSlabs()
{
  dvtParser.wikiTextParser.getArticle("Slabs", function (err, data) {
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    console.log(processDataValues(sectionObject));
  });
}

// testing : different kind of section where the data value is
function testCobblestoneWall()
{
  dvtParser.wikiTextParser.getArticle("Cobblestone Wall", function (err, data) {
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    console.log(processDataValues(sectionObject));
  });
}

function testCobblestoneWall2()
{
  dvtParser.wikiTextParser.getArticle("Cobblestone Wall", function (err, data) {
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    dvtParser.getVariations("Cobblestone Wall",139,sectionObject,function(err,variation){
      if(err) console.log("error");
      console.log(variation);
    });
  });
}
function testStone3()
{
  dvtParser.wikiTextParser.getArticle("Stone", function (err, data) {
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    dvtParser.getVariations("Stone",1,sectionObject,function(err,variation){
      if(err) console.log("error");
      console.log(variation);
    });
  });
}


function testSlabs2()
{
  dvtParser.wikiTextParser.getArticle("Slabs", function (err, data) {
    if(err) console.log("error getting slab page "+err);
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    dvtParser.getVariations("Slabs",125,sectionObject,function(err,variation){
      if(err) console.log("error getting dv page "+err);
      console.log(variation);
    });
  });
}


function testFlower()
{
  dvtParser.wikiTextParser.getArticle("Flowers", function (err, data,title) {
    if(err) console.log("error getting Flower page "+err);
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    dvtParser.getVariations(title,175,sectionObject,function(err,variation){
      if(err) console.log("error getting dv page "+err);
      console.log(variation);
    });
  });
}


function testDye()
{
  dvtParser.wikiTextParser.getArticle("Ink Sac", function (err, data,title) {
    if(err) console.log("error getting Dye page "+err);
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

    dvtParser.getVariations(title,351,sectionObject,function(err,variation){
      if(err) console.log("error getting dv page "+err);
      console.log(variation);
    });
  });
}


function testCarpet()
{
  dvtParser.wikiTextParser.getArticle("Carpet", function (err, data,title) {
    if(err) console.log("error getting Carpet page "+err);
    var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);
    dvtParser.getVariations(title,171,sectionObject,function(err,variation){
      if(err) console.log("error getting dv page "+err);
      console.log(variation);
    });
  });
}
