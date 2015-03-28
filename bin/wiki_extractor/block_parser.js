var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

wikiTextParser.getArticle("Stone",function(data){
  var sectionObject=wikiTextParser.pageToSectionObject(data);

  var infoBox=wikiTextParser.parseInfoBox(sectionObject["content"]);
  console.log(infoBox);
});