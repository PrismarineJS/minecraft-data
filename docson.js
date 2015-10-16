function display(docson,repo,commit,json,element,enums_schemas_dir)
{
  return $.getJSON( "https://cdn.rawgit.com/"+repo+"/"+commit+"/"+enums_schemas_dir+"/"+json+"_schema.json", {format: "json"})
    .pipe(function( schema ) {
      docson.templateBaseUrl="./docson/templates";
      return docson.doc(element, schema);
    });
}
require.config({ baseUrl: "docson"});
require(["docson", "./lib/jquery"], function(docson){
  displaySchema(docson,repo,"master",enums,"schemas").done(function(){
    done();
  })
});


function displaySchema(docson,repo,branch,enums,enums_schemas_dir) {
  return $.getJSON("https://api.github.com/repos/"+repo+"/git/refs/heads/"+branch)
    .pipe(function(data) {
      var commit=data["object"]["sha"];
      var promises=enums.map(function(json){return display(docson,repo,commit,json,json,enums_schemas_dir);});
      return $.when.apply($, promises);
    });
}