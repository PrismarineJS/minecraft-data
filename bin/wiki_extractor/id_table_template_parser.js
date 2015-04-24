var WikiTextParser = require('./wikitext_parser');

var wikiTextParser = new WikiTextParser();

module.exports={parseDataValues:parseDataValues};

function tableToObjectTable(table)
{
  return table
    .filter(function(element){return element[1]!="" && element[1].indexOf("=")==-1;})
    .map(function(element){
      var object={};
      object["displayName"]=element[1];
      if(element.length>=3 && element[2].indexOf("=")==-1)
        object["note"]=element[2];
      for(var i=2;i<element.length;i++)
      {
        if(element[i].indexOf("=")!=-1)
        {
          var parts=element[i].split("=");
          object[parts[0]]=parts[1];
        }
      }
      return object;
    });
}

function objectTableToItems(objectTable)
{
  var id;
  return objectTable.map(function(object){
    if("dv" in object)
      id=parseInt(object["dv"]);
    else
      id++;
    return {
      "id":id,
      "displayName":object["displayName"],
      "link":"link" in object ? object["link"] : object["displayName"].replace(/ \(.+?\)/g,""),
      "name":"nameid" in object ? object["nameid"] : object["displayName"].toLowerCase().replace(/ \(.+?\)/g,"").replace(/ /g,"_")
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
    var table=wikiTextParser.parseTable(itemsText);
    var objectTable=tableToObjectTable(table);
    var items=objectTableToItems(objectTable);
    cb(null,items);
  });
}