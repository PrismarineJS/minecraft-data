//counts the number of recipes with a shape, without one and with an outShape

var versions=require("../../../data/common/versions");

versions.forEach(function(version) {
  describe("audit recipes "+version,function(){
    var recipes = require('../../../data/'+version+'/recipes');
    it("audit recipes",function(){
      var shapeCount = 0, shapelessCount = 0;
      var outShapeCount = 0;
      for(var key in recipes) {
        var list = recipes[key];
        for(var i = 0; i < list.length; ++i) {
          var recipe = list[i];
          if(recipe.inShape != null) {
            shapeCount += 1;
          } else if(recipe.ingredients != null) {
            shapelessCount += 1;
          } else {
            console.log("inShape or ingredients required:", key);
          }
          if(recipe.outShape) outShapeCount += 1;
        }
      }

      console.log("normal recipes:", shapeCount);
      console.log("shapeless recipes:", shapelessCount);
      console.log("how many have an outShape:", outShapeCount);
    })
  });
});