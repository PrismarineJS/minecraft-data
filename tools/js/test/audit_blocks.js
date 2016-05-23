// checks for duplicates names and jumps in ids

require("./version_iterator")(function(path,versionString){
  try {
    var blocks = require(path + '/blocks');
  } catch (e) {
    console.log("No blocks for version " + versionString);
  }
  if(blocks) describe("audit blocks " + versionString, function() {
    it("audit blocks", function() {

      var all = [];
      for(var key in blocks) {
        var block = blocks[key];
        all[block.id] = block;
      }

      var displayNames = {};
      var names = {};
      for(var i = 0; i < all.length; ++i) {
        var block = all[i];
        if(block) {
          if(block.displayName == null) {
            console.log("Missing displayName:", i);
          } else {
            var otherBlock = displayNames[block.displayName];
            if(otherBlock) {
              console.log("Duplicate displayName:", otherBlock.id, "and", block.id,
                "both share", block.displayName);
            } else {
              displayNames[block.displayName] = block;
            }
          }
          if(block.name == null) {
            console.log("Missing name:", i);
          } else {
            var otherBlock = names[block.name];
            if(otherBlock) {
              console.log("Duplicate name:", otherBlock.id, "and", block.id,
                "both share", block.name);
            } else {
              names[block.name] = block;
            }
          }
        } else {
          console.log("Missing:", i);
        }
      }
    });
  });
});