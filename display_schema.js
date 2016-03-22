var docson=require("docson");

function displaySchema(enums) {
  return Promise.all(enums.map(function(json){
    return docson.doc(json, require("minecraft-data").schemas[json]);
  }));
}

module.exports=displaySchema;