function display(docson,commit,json,element)
{
  $.getJSON( "https://cdn.rawgit.com/PrismarineJS/minecraft-data/"+commit+"/enums_schemas/"+json+"_schema.json", {format: "json"})
    .done(function( schema ) {
      docson.templateBaseUrl="./docson/templates";
      docson.doc(element, schema);
    });
}
var repo="PrismarineJS/minecraft-data";
var enums=["biomes","instruments","items","materials","blocks","recipes","entities"];
require.config({ baseUrl: "docson"});
require(["docson", "./lib/jquery"], function(docson) {
  $.getJSON("https://api.github.com/repos/"+repo+"/git/refs/heads/", function(data) {
    var commit=data[1]["object"]["sha"];
    console.log(commit);
    enums.forEach(function(json){display(docson,commit,json,json);});
  });
});