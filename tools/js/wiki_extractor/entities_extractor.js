var WikiTextParser = require('./lib/wikitext_parser');
var fs = require('fs');

var wikiTextParser = new WikiTextParser();

function getText(rawText)
{
  return rawText
    .replace(/\[\[(?:.+?\|)?(.+?)\]\]/g,"$1") // remove links
    .replace(/\(.+\)/g,"") // remove text in parenthesis
    .replace(/^(.+)<br \/>.+$/,"$1") // keep only the first line if two lines
    .trim();
}

wikiTextParser.getArticle("Data_values/Entity_IDs",function(err,data){
  var sectionObject=wikiTextParser.pageToSectionObject(data);

  var entitiesText=sectionObject["content"];
  var entities={};
  var currentType="";
  entitiesText.forEach(function(line){
    if(line.startsWith("| ")) {
      if(line.startsWith("| colspan"))
        currentType=line.split(" | ")[1];
      else
      {
        var values=line.split("||");
        var id=values[0].replace(/\| /g,"").trim();
        entities[id]={
          "id":parseInt(id),
          "displayName":getText(values[4]),
          "name":values[5].trim(),
          "type":currentType};
      }
    }
  });
  fs.writeFile("../../../enums/entities.json", JSON.stringify(Object.keys(entities).map(function(key){return entities[key];}),null,2));
});