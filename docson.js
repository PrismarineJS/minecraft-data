function display(docson,repo,commit,json,element,enums_schemas_dir)
{
  $.getJSON( "https://cdn.rawgit.com/"+repo+"/"+commit+"/"+enums_schemas_dir+"/"+json+"_schema.json", {format: "json"})
    .done(function( schema ) {
      docson.templateBaseUrl="./docson/templates";
      docson.doc(element, schema);
    });
}
var repo="PrismarineJS/minecraft-data";
var enums=["biomes","instruments","items","materials","blocks","recipes","entities","protocol"];
require.config({ baseUrl: "docson"});
require(["docson", "./lib/jquery"], function(docson){
  displaySchema(docson,repo,enums,"enums_schemas");
});

function displaySchema(docson,repo,enums,enums_schemas_dir) {
  $.getJSON("https://api.github.com/repos/"+repo+"/git/refs/heads/", function(data) {
    var commit=data[1]["object"]["sha"];
    enums.forEach(function(json){display(docson,repo,commit,json,json,enums_schemas_dir);});
  });
}