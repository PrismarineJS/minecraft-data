var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

wikiTextParser.getArticle("Blocks",function(data){
  var sectionObject=wikiTextParser.pageToSectionObject(data);

  var overworldNaturallyGenerated=sectionObject["World-generated blocks"]["The Overworld"]["Naturally generated"]["content"];
  var table=wikiTextParser.parseTable(overworldNaturallyGenerated);
  var linkTable=table.map(function(values){return values[2];});
  console.log(linkTable);
});