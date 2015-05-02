var WikiTextParser = require('./wikitext_parser');
var wikiTextParser = new WikiTextParser();
var async=require('async');
var fs = require('fs');

//getAliases();
writeAllRecipes();

// http://minecraft.gamepedia.com/Talk:Crafting#Wiki_source_of_the_recipes
// used to display all the recipes in the recipes page in the wiki
// (see http://minecraft.gamepedia.com/index.php?title=Module:Recipe_list&action=edit
// and http://minecraft.gamepedia.com/Crafting#Complete_recipe_list
// http://minecraft.gamepedia.com/Module:Crafting : useful for shapeless for example
// http://minecraft.gamepedia.com/Module:Grid/Aliases
// http://minecraft.gamepedia.com/Talk:Crafting
// http://minecraft.gamepedia.com/Template:Grid
// http://minecraft.gamepedia.com/Module:Grid
// http://minecraft.gamepedia.com/Mushroom_Stew : shapeless
// http://minecraft.gamepedia.com/Template:Grid/Crafting_Table

// type : not necessarily useful, description useful to exclude pocket (http://minecraft.gamepedia.com/index.php?title=Book&action=edit&section=3)

// http://minecraft.gamepedia.com/Module:Grid : important : not really

// http://minecraft.gamepedia.com/Template:Crafting : this is what is really used
// this http://minecraft.gamepedia.com/Module:Crafting

function writeAllRecipes()
{
  async.waterfall([
      recipeQuery,
     //function(recipes,cb){console.log(recipes);cb(null,recipes);},
      //getUnrecognizedNames,
      removeConsolePocket,
      function(recipes,cb){getAliases(function(err,aliases){cb(null,recipes,aliases);});},
      recipesNameToId,
      formatRecipes,
      removeDuplicates,
      indexRecipes
    ]
    , write
  );
}



function write(err,recipes)
{
  //console.log(recipes);
  //console.log(JSON.stringify(recipes,null,2));
  fs.writeFile("../../enums/recipes.json", JSON.stringify(recipes,null,2));
}


// sometimes "ingredients" : see http://minecraft.gamepedia.com/index.php?title=Pickaxe&action=edit&section=4 : probably not useful though
var rkeys=["1","2","3","4","5","6","7","8","9","A1","B1","C1","A2","B2","C2","A3","B3","C3","Output"];
var keys=rkeys.concat(["type","description"]);

function recipeQuery(cb)
{
  wikiTextParser.dplQuery(
    '{{#dpl:categorymatch=%recipe' +
    "|include={Crafting}:1:2:3:4:5:6:7:8:9:A1:B1:C1:A2:B2:C2:A3:B3:C3:Output:type:description" +
    "|mode = userformat" +
    "|secseparators = ====" +
    "|multisecseparators = ====" +
    "}}",
    function (err,info) {
      var rawRecipes=info.split("====");
      var recipes=rawRecipes
        .slice(1) // remove the <p> at the beginning
        .map(function(rawRecipe){
          return rawRecipe
            .split("|")
            .map(function(ingredient){
              return ingredient.trim();
            })
        })
        .map(function(arrayRecipe){
          var recipeObject={};
          for(var i=0;i<keys.length;i++)
            recipeObject[keys[i]]=arrayRecipe[i];
          return recipeObject;
        });
      cb(null,recipes);
    }
  );
}

function removeConsolePocket(recipes,cb)
{
  cb(null,recipes.filter(function(recipe){
    return (recipe["description"].toLowerCase().indexOf("pocket")==-1 && recipe["description"].toLowerCase().indexOf("console")==-1) || recipe["description"].toLowerCase().indexOf("pc")!=-1 ;
  }));
}

var items=require("../../enums/items.json");
var itemsByName=Object.keys(items).reduce(function(acc,key){acc[items[key]["displayName"]]=items[key]["id"];return acc;},{});
var blocks=require("../../enums/blocks.json");
var blocksByName=Object.keys(blocks).reduce(function(acc,key){acc[blocks[key]["displayName"]]=blocks[key]["id"];return acc;},{});


function nameToId(name)
{
  if(name == "")
    return null;
  if(name in itemsByName)
    return itemsByName[name];
  if(name in blocksByName)
    return blocksByName[name];
  return undefined;
}

// http://minecraft.gamepedia.com/Template:Dvt
// http://minecraft.gamepedia.com/Data_values#Flowers
// http://minecraft.gamepedia.com/Category:Data_value_pages
// http://minecraft.gamepedia.com/Category:Block_state_pages

// should probably be handled by collecting variations from the wiki and storing them in a file + metadata variations display names
// (example : http://minecraft.gamepedia.com/Sunflower#Flower_biomes)

// see also : redirections
var edgeVariations={
  "Ink Sac":"Dye",
  "Bone Meal":"Dye",
  "Dandelion Yellow":"Dye",
  "Sugar Canes":"Sugar Cane",
  "Lapis Lazuli":"Dye",
  "Cactus Green":"Dye",
  "Rose Red":"Dye",
  "Cocoa Beans":"Dye",

  // + metadata 1
  "Blue Orchid":"Poppy",
  "Orange Tulip":"Poppy",
  "White Tulip":"Poppy",
  "Pink Tulip":"Poppy",
  "Oxeye Daisy":"Poppy",
  "Allium":"Poppy",
  "Azure Bluet":"Poppy",
  "Red Tulip":"Poppy",
  // + metadata 5
  "Rose Bush":"Large Flowers",
  "Large Fern":"Large Flowers",
  "Peony":"Large Flowers",
  "Sunflower":"Large Flowers",
  "Lilac":"Large Flowers",

  "Mushroom":"Red Mushroom",

  // other
  "Oak Wood Planks":"Wood Planks",
  "Charcoal":"Coal",
  "Diorite":"Stone",
  "Andesite":"Stone",
  "Polished Andesite":"Stone",
  "Polished Diorite":"Stone",
  "Red Sand":"Sand",
  "Granite":"Stone",
  "Polished Granite":"Stone",
  "Mossy Cobblestone Wall":"Cobblestone Wall",
  "Quartz Slab":"Stone Slab",
  "Chiseled Quartz Block":"Block of Quartz",
  "Pillar Quartz Block":"Block of Quartz",
  "Head":"Mob head",
  "Button":"Wooden Button",
  "Prismarine Bricks":"Prismarine",
  "Dark Prismarine":"Prismarine",
  "Any Firework Star":"Firework Star",

  "Oak Wood":"Wood",
  "Dark Oak Wood":"Wood (Acacia/Dark Oak)",
  "Spruce Wood":"Wood",
  "Birch Wood": "Wood",
  "Jungle Wood": "Wood",
  "Acacia Wood":"Wood (Acacia/Dark Oak)",
  "Black Stained Glass Pane":"Stained Glass Pane",

  "Sandstone Slab":"Stone Slab",
  "Redstone Lamp":"Redstone Lamp (inactive)",
  "Coarse Dirt":"Dirt",
  "Mossy Stone Bricks":"Stone Bricks",
  "Stone Bricks Slab":"Double Stone Slab",
  "Chiseled Stone Bricks":"Stone Bricks",
  "Oak Fence Gate":"Fence Gate",
  "Wooden Trapdoor":"Trapdoor",
  "Redstone Torch":"Redstone Torch (inactive)",
  "Enchanted Golden Apple":"Golden Apple",
  "Oak Fence":"Fence",
  "Dark Oak Wood Slab":"Wooden Slab",
  "Cracked Stone Bricks":"Stone Bricks",
  "Cobblestone Slab":"Stone Slab",
  "Bricks Slab":"Stone Slab",
  "Nether Brick Slab":"Stone Slab",
  "Creeper Head":"Mob head",
  "Wither Skeleton Skull":"Mob head",

  "Melon (block)":"Melon",
  "Clay (block)":"Clay",
  "Nether Brick (item)":"Nether Brick"




};

function replaceName(name)
{
  // should be done properly with metadata
  var firstStep=name
    .replace(/^.*Banner$/,"Banner")
    .replace(/^.*Dye$/,"Dye")
    .replace(/^.*Sandstone$/,"Sandstone")
    .replace(/^.*Stained Glass$/,"Stained Glass")
    .replace(/^.*Stained Glass Pane$/,"Stained Glass Pane")
    .replace(/^.*Stained Clay$/,"Stained Clay")
    .replace(/^.*Wool$/,"Wool")
    .replace(/^.*Wood Slab$/,"Wooden Slab")
    .replace(/^.*Carpet$/,"Carpet")
    .replace(/^.*Wood Planks$/,"Wood Planks")
    .replace(/Damaged /,"")
    //.replace(/\(.+\)/,"")
    .trim();
  if(firstStep in edgeVariations)
    return edgeVariations[firstStep];
  else return firstStep;
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

function removeAllTheSame(a)
{
  if(a.length<=1) return a;
  if(a.every(function(e){
      if(e instanceof Object && a[0] instanceof Object)
        return e["id"]==a[0]["id"] && e["amount"]==a[0]["amount"] && e["meta"]==a[0]["meta"];
      else
        return e==a[0];
    }))
    return [a[0]];
  return a;
}


// for recipes with several items in one box : first item of first box correspond to first item of second box (or always the first if there's only one)
// for theses recipes : generation of several recipes (example : http://minecraft.gamepedia.com/Banner#Crafting)
function recipesNameToId(recipes,aliases,cb)
{
  var unreco={};
  var newRecipes=recipes
    .map(function(recipe){
    var newRecipe=rkeys.reduce(function(newRecipe,key){
      var name=recipe[key];
      name=name.replace("&#160","").trim();
      if(name!="")
      {
        var names=name.split(";");
        names=[].concat.apply([],names
          .map(function(name){return name.trim()})
          .map(function(name){
            var parts=name.split(",");
            name=parts[0];
            var amount=parts.length>1 ? parseInt(parts[1]) : null;
            return name in aliases ? aliases[name].split(";").map(function(name){
              return name+(amount!=null ? ","+amount : "");
            }) : [name+(amount!=null ? ","+amount : "")]
          }));
        newRecipe[key]=/*removeAllTheSame(*/names
          .map(function(name){return name.trim()})
          //.filter(function(name){return name!="";})
          .map(function(name){

            var parts=name.split(",");
            name=parts[0];
            var amount=parts.length>1 ? parseInt(parts[1]) : 1;

            name=replaceName(name);
            var id=nameToId(name);
            if(typeof id == "undefined")
              unreco[name]=true;
            return amount!=null && (amount!=1 || key=="Output") && (typeof id != "undefined") ? {"amount":amount,"id":id,"meta":0} : id;
          })/*)*/;
      }
      else
        newRecipe[key]=null;
      return newRecipe;
    },{});

    //newRecipe["type"]=recipe["type"];
    //newRecipe["description"]=recipe["description"];
    return newRecipe;
  })
    // drop if can't find the id
    .filter(function(r){
      return rkeys.every(function(k){
        return r[k]==null || r[k].every(function(i){return typeof i != "undefined"});
      });
    });

  //console.log(newRecipes);
  var unrecoNames=Object.keys(unreco);
  if(unrecoNames.length>0)
  {
    console.log("There are some unrecognized names :");
    console.log(unrecoNames);
    console.log(recipes.length);
    console.log(newRecipes.length);
  }

  var unitRecipes=[].concat.apply([],newRecipes.map(function(recipe){
    var multipleKey=rkeys.find(function(key){return recipe[key]!=null && recipe[key].length>1;});
    var n=multipleKey==null ? 1 : recipe[multipleKey].length;
    var splitRecipes=[];
    for(var i=0;i<n;i++)
    {
      var nRecipe=rkeys.reduce(function(nRecipe,key){
        // recipe[key].length>i instead of recipe[key].length>1 because of http://minecraft.gamepedia.com/Bed#Crafting
        nRecipe[key]=recipe[key]==null ? null : (recipe[key].length>i ? recipe[key][i] : recipe[key][0]);
        return nRecipe;
      },{});
      splitRecipes.push((nRecipe));
    }
    return splitRecipes;
  }));
  //console.log(unitRecipes);
  //console.log(unitRecipes.length);

  cb(null,unitRecipes);
  //cb(null,recipes);
}


// plan :
// 1. map item to ids (and metadata ??) : ok
// 2. map recipes using item mapping : ok
// 3. check whether the format is correct relative to recipes.json

var nums=["1","2","3","4","5","6","7","8","9"];
var letters=["A1","A2","A3","B1","B2","B3","C1","C2","C3"];


// http://minecraft.gamepedia.com/Coal#Crafting is actually shapeless, why not written as so ?
function formatShapelessRecipe(recipe)
{
  var result=recipe["Output"];
  var ingredients=nums
    .filter(function(num){return recipe[num]!=null;})
    .map(function(num){return recipe[num];});
  // see "Automatic shapeless positioning" in http://minecraft.gamepedia.com/Module:Crafting
  if(ingredients.length==1)
    return formatShapedRecipe({"Output":result,"A1":ingredients[0]});
  else if(ingredients.length==9 && ingredients.every(function(e){return e==ingredients[0];}))
    return formatShapedRecipe(letters.reduce(function(newRecipe,l){newRecipe[l]=ingredients[0];return newRecipe;},{"Output":result}));
  else
    return {
    "ingredients":ingredients,
    "result":result
  };
}
var cake=[
  [
    325,
    325,
    325
  ],
  [
    null,
    null,
    null
  ],
  [
    null,
    null,
    null
  ]];

// check 425 : banner...
function formatShapedRecipe(recipe)
{
  var result=recipe["Output"];
  var inShape=
    [
      [recipe["A1"],recipe["B1"],recipe["C1"]],
      [recipe["A2"],recipe["B2"],recipe["C2"]],
      [recipe["A3"],recipe["B3"],recipe["C3"]]
    ];

  return {
    "inShape":removeMostNulls(inShape),
    "outShape":result["id"]==92 ? cake : undefined,
    "result":result
  };
}
// need outShape and one more transformation to remove the unneeded nulls (see transform2_recipes.js)

// useful for example for recipes that fit in the inventory crafting
function removeMostNulls(shape)
{
  var r=shape;
  var nr=[];
  var uselessLines=[];
  var uselessColumns=[];
  var remove;
  var k,l;

  //find useless lines
  remove=1;
  for(k=0;k<3;k++)
  {
    for(l=0;l<3;l++)
    {
      if(r[k][l]!=null)
      {
        remove=0;
        break;
      }
    }
    if(remove) uselessLines.push(k);
    else break;
  }
  remove=1;
  for(k=2;k>=0;k--)
  {
    for(l=0;l<3;l++)
    {
      if(r[k][l]!=null)
      {
        remove=0;
        break;
      }
    }
    if(remove) uselessLines.push(k);
    else break;
  }
  //find useless columns
  remove=1;
  for(k=0;k<3;k++)
  {
    for(l=0;l<3;l++)
    {
      if(r[l][k]!=null)
      {
        remove=0;
        break;
      }
    }
    if(remove) uselessColumns.push(k);
    else break;
  }
  remove=1;
  for(k=2;k>=0;k--)
  {
    for(l=0;l<3;l++)
    {
      if(r[l][k]!=null)
      {
        remove=0;
        break;
      }
    }
    if(remove) uselessColumns.push(k);
    else break;
  }

  // remove useless lines and columns
  var m=0;
  for(k=0;k<3;k++)
  {
    if(uselessLines.indexOf(k)===-1)
    {
      nr.push([]);
      for(l=0;l<3;l++)
      {
        if(uselessColumns.indexOf(l)===-1)
        {
          nr[m].push(r[k][l]);
        }
      }
      m++;
    }
  }
  return nr;
}

function formatRecipes(recipes,cb)
{
  cb(null,recipes.map(function(recipe){
// 42 ? iron ? http://minecraft.gamepedia.com/Block_of_Iron : shape ? same for http://minecraft.gamepedia.com/Block_of_Emerald
    // see http://minecraft.gamepedia.com/Module:Crafting ctrl+f shapeless
    // not considered shapeless in the wiki but they are shapeless !
    // recipe["1"]!=null can't be used because of map and book recipes (which now work except for the outShape)
    var shapeless=nums.some(function(num){return recipe[num]!=null;});
    return shapeless ? formatShapelessRecipe(recipe) : formatShapedRecipe(recipe);
  }).filter(function(recipe){return recipe!=null;}));
}

function indexRecipes(recipes,cb)
{
  cb(null,recipes.reduce(function(indexedRecipes,recipe){
    //console.log(recipe);
    //console.log(":");
    var resultId=recipe["result"]["id"].toString();
    if(resultId in indexedRecipes)
      indexedRecipes[resultId].push(recipe);
    else
      indexedRecipes[resultId]=[recipe];
    return indexedRecipes;
  },{}));
}

function removeDuplicates(recipes,cb)
{
  var o=recipes.reduce(function(o,e){o[JSON.stringify(e)]=e;return o;},{});
  cb(null,Object.keys(o).map(function(k){return o[k];}));
}


// http://minecraft.gamepedia.com/Module:Grid/Aliases
function getAliases(cb)
{
  wikiTextParser.getArticle("Module:Grid/Aliases",function(err,data){
    //console.log(data);

    var lines=data.split("\n");
    var coloredDyes=lines.find(function(line){return line.indexOf("coloredDyes")!=-1}).split("=")[1].replace(/'/g,"").replace(/\[.+\]/,"").trim();
    var dyedWool=lines.find(function(line){return line.indexOf("dyedWool")!=-1}).split("=")[1].replace(/'/g,"").replace(/\[.+\]/,"").trim();
    var anys=lines
      .filter(function(line){return line.indexOf("'Any")!=-1 && line.indexOf("coloredDyes")==-1 && line.indexOf("dyedWool")==-1 && line.indexOf("Any Firework Star")==-1})
      .reduce(function(anys,any){
        var matches=any.match(/\['(.+)'\] = '(.+)'/);
        anys[matches[1]]=matches[2].replace(/\[.+\]/,"");
        return anys;
      },{});
    anys["Any Dye"]="Bone Meal;"+coloredDyes;
    anys["Any Wool"]="White Wool;"+dyedWool;
    anys["Any Colored Dye"]=coloredDyes;
    anys["Any Dyed Wool"]=dyedWool;

    cb(null,anys);
  });
}

