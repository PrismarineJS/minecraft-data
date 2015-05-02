var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

module.exports={parseDvt:parseDvt};

function parseDvt(text)
{
  var dv=0;
  return text
    .split("\n")
    .filter(function(element){return element!="" && element.indexOf("{")!=-1 && element.indexOf("On ")==-1;}) // get rid of the unrelated beginning and ending lines
    .map(function(element){
      var r=wikiTextParser.parseTemplate(element);
      if(r==null || ["dvt"].indexOf(r.template)==-1) {
        console.log(r);
        console.log("problem with parsing template "+element);
        return null;
      }
      return r;
    })
    .filter(function(r){return r!=null && r.simpleParts.length!=0 && r.simpleParts[0]!="";})
    .map(function(r){
      dv="dv" in r.namedParts ? parseInt(r.namedParts["dv"]) : dv;
      var r={
        dv:dv,
        description: r.simpleParts[0],
        spritetype:"spritetype" in r.namedParts ? r.namedParts["spritetype"] : "block",
        sprite:"sprite" in r.namedParts ? r.namedParts["sprite"] : "air"
      };
      dv++;
      return r;
    });
}
