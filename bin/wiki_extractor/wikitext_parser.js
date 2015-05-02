var bot = require('nodemw');
var _ = require('underscore');

module.exports = WikiTextParser;

function WikiTextParser()
{
  this.client= new bot({
    server: 'minecraft.gamepedia.com',
    path: '/',
    debug: false
  });
}



WikiTextParser.prototype.getArticle=function(title,cb)
{
  var self=this;
  this.client.getArticle(title, function(err, data) {
    if (err || !data) {
      //console.log("error in page "+title);
      //console.error(err);
      cb(err ? err : new Error("can't get the data"));
      return;
    }
    // somehow use ...&redirects=&... to silently follow redirects
    var redirectPage;
    if(redirectPage=data.match(/#REDIRECT \[\[(.+)\]\]/i))
    {
      self.getArticle(redirectPage[1],cb);
    }
    else
      cb(null,data);
  });
};

// useful ? (see http://minecraft.gamepedia.com/Talk:Crafting#Wiki_source_of_the_recipes)
WikiTextParser.prototype.dplQuery=function(query,cb)
{
  var params = {
    action: 'parse',
    text: query};

  this.client.api.call(params, function(err, info, next, data) {
    cb(null,info.text["*"]);
  });
};

WikiTextParser.prototype.getSimplePagesInCategory=function(category,cb)
{
  this.client.getPagesInCategory(category,function(err,pages){
    cb(null,pages
      .map(function(item){return item.title;})
      .filter(function(title){return !title.startsWith("Category:")}));
  });
};

function extractTitle(titleLine) {
  return titleLine.replace(/=|\[|\]/g,"").trim();
}

function extractDepth(titleLine) {
  var depth = 0;
  for (var x = 0; x < titleLine.length; x++) {
    var c = titleLine.charAt(x);
    if (c == '=')
      depth++;
    else return depth;
  }
}

function findFirstDefinedDepth(sections,currentDepth)
{
  for(var i=currentDepth-1;i>=0;i--)
  {
    if(i in sections)
      return i;
  }
  return -1;
}


if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
  };
}
WikiTextParser.prototype.pageToSectionObject = function(data) {
  var currentDepth = 0;
  var a = data.split("\n");
  var m = {};
  var currentLineArray = [];
  var currentTitle = "";
  var currentSection = {};
  var previousSections = {0: m};//indexed by depth
  a.forEach(function (line) {
    if (line.startsWith("=")) {
      if (currentLineArray.length != 0) {
        previousSections[currentDepth]["content"] = currentLineArray;
        currentLineArray = [];
      }
      currentTitle = extractTitle(line);
      currentDepth = extractDepth(line);

      var p=findFirstDefinedDepth(previousSections,currentDepth);
      var newSection={};
      previousSections[p][currentTitle] = newSection;
      previousSections[currentDepth] = newSection;
      currentSection = newSection;
    }
    else
      currentLineArray.push(line);
  });
  previousSections[currentDepth]["content"] = currentLineArray;
  return m;
};


WikiTextParser.prototype.parseTable = function(sectionLineArray)
{
  var array=[];
  sectionLineArray.forEach(function(line){
    if(line.startsWith("{{") && line != "{{-}}")
      array.push(line.replace(/{|}/g,"").split("|"));
  });
  return array;
};

WikiTextParser.prototype.parseInfoBox = function(sectionLineArray)
{
  var text=sectionLineArray.join("");
  var results=this.parseTemplate(text);
  if(results==null) {
    console.log("problem with parsing template "+text);
    return null;
  }
  var namedParts=results.namedParts;
  var simpleParts=results.simpleParts;
  return {
    template:results.template,
    values:results.namedParts
  };
};

WikiTextParser.prototype.parseTemplate = function(text)
{
  var matches=text.match(/^.*?\{\{(.+)\}\}.*?$/);
  if(!matches || matches.length!=2)
    return null;
  var inside=matches[1];
  var parts=inside.split("|");
  var template=parts.shift();
  var simpleParts=parts.filter(function(part){return part.indexOf("=")==-1;});
  var namedParts=parts
    .filter(function(part){return part.indexOf("=")!=-1;})
    .reduce(function(acc,part){
      var eparts=part.split("=");
      acc[eparts[0].trim()]=eparts[1].trim();
      return acc;
    },{});
  return {template:template,namedParts:namedParts,simpleParts:simpleParts};
};