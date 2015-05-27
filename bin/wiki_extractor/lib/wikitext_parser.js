var bot = require('nodemw');
var _ = require('underscore');

module.exports = WikiTextParser;

function WikiTextParser(server)
{
  this.client= new bot({
    server: server ? server : 'minecraft.gamepedia.com',
    path: '/',
    debug: false
  });
}


if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}


WikiTextParser.prototype.getArticle=function(title,cb) {
  if (title == "") {
    cb(new Error("empty title"));
    return;
  }
  var self=this;
  this.client.getArticle(title, function(err, data) {
    if (err || !data) {
      //console.log("error in page "+title);
      //console.error(err);
      cb(err ? err : new Error("can't get the data of "+title));
      return;
    }
    // somehow use ...&redirects=&... to silently follow redirects
    var redirectPage;
    if(redirectPage=data.match(/#REDIRECT \[\[(.+)\]\]/i))
    {
      self.getArticle(redirectPage[1],function(err,data){
        cb(err,data,redirectPage[1]);
      });
    }
    else
      cb(null,data,title);
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
  sectionLineArray=sectionLineArray.filter(function(line){return !line.toLowerCase().startsWith("{{about") && !line.startsWith("{{split")});
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

function splitOutside(text) // don't split links (see history in http://minecraft.gamepedia.com/index.php?title=Wood&action=edit )
{
  var parts=[];
  var currentPart="";
  var inLink=false;
  var inTemplate=false;
  for(var i=0;i<text.length;i++)
  {
    if(text[i]=="[" && text[i+1]=="[")
    {
      currentPart+="[";
      inLink=true;
      i++;
    }
    else if(text[i]=="]" && text[i+1]=="]")
    {
      currentPart+="]";
      inLink=false;
      i++;
    }
    if(text[i]=="{" && text[i+1]=="{")
    {
      currentPart+="{";
      inTemplate=true;
      i++;
    }
    else if(text[i]=="}" && text[i+1]=="}")
    {
      currentPart+="}";
      inTemplate=false;
      i++;
    }
    if(text[i]=="|" && !inLink && !inTemplate)
    {
      parts.push(currentPart);
      currentPart="";
    }
    else
    {
      currentPart+=text[i];
    }
  }
  parts.push(currentPart);
  return parts;
}

// might be better to do that with jison (?)
function findTemplate(text)
{
  var templateLevel=0;
  var inside="";
  for(var i=0;i<text.length;i++)
  {
    if(text[i]=="{" && text[i+1]=="{")
    {
      if(templateLevel>=1)
        inside+="{{";
      templateLevel++;
      i++;
      continue;
    }
    if(text[i]=="}" && text[i+1]=="}")
    {
      templateLevel--;
      if(templateLevel>=1)
        inside+="}}";
      i++;
      if(templateLevel==0)
        break;
      continue;
    }
    if(templateLevel>=1)
      inside+=text[i];
  }
  if(templateLevel!=0)
    return null;
  return inside;
}

WikiTextParser.prototype.parseTemplate = function(text)
{
  var inside=findTemplate(text);
  if(inside==null)
    return null;
  var parts=splitOutside(inside);
  var template=parts.shift();
  var simpleParts=parts.filter(function(part){return part.indexOf("=")==-1;});
  var namedParts=parts
    .filter(function(part){return part.indexOf("=")!=-1;})
    .reduce(function(acc,part){
      var eparts=part.split("=");
      acc[eparts[0].trim()]=eparts.slice(1).join("=").trim();
      return acc;
    },{});
  return {template:template,namedParts:namedParts,simpleParts:simpleParts};
};