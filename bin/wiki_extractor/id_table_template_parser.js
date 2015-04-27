var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

module.exports={parseDataValues:parseDataValues};

function tableToItems(table)
{

  var id;
  return table
    .filter(function(element){return element!="" && element.indexOf("{")!=-1;}) // get rid of the unrelated beginning and ending lines
    .map(function(element){
      var r=wikiTextParser.parseTemplate(element);
      if(r==null || ["id table"].indexOf(r.template)==-1) {
        console.log(r);
        console.log("problem with parsing template "+element);
        return null;
      }
      return r;
    })
    .filter(function(r){return r!=null && r.simpleParts.length!=0 && r.simpleParts[0]!="";})
    .map(function(r){
      id="dv" in r.namedParts ? parseInt(r.namedParts["dv"]) : id+1;
      return {
        id:id,
        displayName: (r.simpleParts.length==3 ? r.simpleParts[2]+" " : "")+r.simpleParts[0],
        link:"link" in r.namedParts ? r.namedParts["link"] : r.simpleParts[0].replace(/ \(.+?\)/g,""),
        name:"nameid" in r.namedParts ? r.namedParts["nameid"] : r.simpleParts[0].toLowerCase().replace(/ \(.+?\)/g,"").replace(/ /g,"_"),
        note:r.simpleParts.length>=2 ? r.simpleParts[1] : undefined
      };
    });
}

// http://minecraft.gamepedia.com/Template:ID_table
// algo : dv=256 start the counter, +1 for next items, until there's a new dv
// nameid is the name in lower case if not defined
function parseDataValues(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var itemsText=sectionObject["content"];
    var items=tableToItems(itemsText);
    cb(null,items);
  });
}