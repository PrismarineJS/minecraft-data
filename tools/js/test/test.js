var assert = require('assert');

var Ajv = require('ajv');
var v = new Ajv({verbose:true});
v.addSchema(require("../../../schemas/protocol_types/array.json"),"array");
v.addSchema(require("../../../schemas/protocol_types/bitfield.json"),"bitfield");
v.addSchema(require("../../../schemas/protocol_types/buffer.json"),"buffer");
v.addSchema(require("../../../schemas/protocol_types/container.json"),"container");
v.addSchema(require("../../../schemas/protocol_types/count.json"),"count");
v.addSchema(require("../../../schemas/protocol_types/datatype.json"),"dataType");
v.addSchema(require("../../../schemas/protocol_types/definitions.json"),"definitions");
v.addSchema(require("../../../schemas/protocol_types/entity_metadata_item.json"),"entityMetadataItem");
v.addSchema(require("../../../schemas/protocol_types/entity_metadata_loop.json"),"entityMetadataLoop");
v.addSchema(require("../../../schemas/protocol_types/mapper.json"),"mapper");
v.addSchema(require("../../../schemas/protocol_types/option.json"),"option");
v.addSchema(require("../../../schemas/protocol_types/pstring.json"),"pstring");
v.addSchema(require("../../../schemas/protocol_types/switch.json"),"switch");

Error.stackTraceLimit=0;

var data=["biomes","instruments","items","materials","blocks","recipes","windows","entities","protocol","version","effects"];

require("./version_iterator")(function(path,versionString){
  describe("minecraft-data schemas "+versionString, function() {
    this.timeout(60 * 1000);
    data.forEach(function(dataName){
      try {
        var instance = require(path+'/'+dataName+'.json');
      } catch (e) {
        console.log("No " + dataName + " data for version " + versionString);
      }
      if(instance) it(dataName+".json is valid",function(){
        var schema = require('../../../schemas/'+dataName+'_schema.json');
        var valid = v.validate(schema,instance);
        assert.ok(valid, JSON.stringify(v.errors,null,2));
      })
    });
  });
});

var commonData=["protocolVersions"];
var minecraftTypes=["pc","pe"];

minecraftTypes.forEach(function(type){
  describe("minecraft-data schemas of common data of "+type,function() {
    this.timeout(60 * 1000);
    commonData.forEach(function(dataName){
      it(dataName+".json is valid",function(){
        var instance = require('../../../data/'+type+'/common/'+dataName+'.json');
        var schema = require('../../../schemas/'+dataName+'_schema.json');
        var valid = v.validate(schema,instance);
        assert.ok(valid, JSON.stringify(v.errors,null,2));
      })
    });
  });
});