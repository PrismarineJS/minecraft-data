var WikiTextParser = require('./wikitext_parser');
var fs = require('fs');

var wikiTextParser = new WikiTextParser();

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
          "name":values[5].trim(),
          "type":currentType};
      }
    }
  });
  fs.writeFile("../../enums/entities.json", JSON.stringify(entities,null,2));
});