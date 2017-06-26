const assert = require('assert');

const Ajv = require('ajv');
const v = new Ajv({verbose:true});

const Validator = require('protodef-validator');

Error.stackTraceLimit=0;

var data=["biomes","instruments","items","materials","blocks","recipes","windows","entities","protocol","version","effects", "enchantments","language"];

require("./version_iterator")(function(path,versionString){
  describe("minecraft-data schemas "+versionString, function() {
    this.timeout(60 * 1000);
    data.forEach(function(dataName){
      let instance;
      try {
        instance = require(path+'/'+dataName+'.json');
      } catch (e) {
        console.log("No " + dataName + " data for version " + versionString);
      }
      if(instance) it(dataName+".json is valid",function(){
        if(dataName=="protocol") {
          const validator = new Validator();

          validator.addType("entityMetadataItem", require("../../../schemas/protocol_types/entity_metadata_item.json"));
          validator.addType("entityMetadataLoop", require("../../../schemas/protocol_types/entity_metadata_loop.json"));
          validator.validateProtocol(instance);
        }
        else {
          const schema = require('../../../schemas/'+dataName+'_schema.json');
          const valid = v.validate(schema,instance);
          assert.ok(valid, JSON.stringify(v.errors,null,2));
        }
      })
    });
  });
});

const commonData=["protocolVersions"];
const minecraftTypes=["pc","pe"];

minecraftTypes.forEach(function(type){
  describe("minecraft-data schemas of common data of "+type,function() {
    this.timeout(60 * 1000);
    commonData.forEach(function(dataName){
      it(dataName+".json is valid",function(){
        const instance = require('../../../data/'+type+'/common/'+dataName+'.json');
        const schema = require('../../../schemas/'+dataName+'_schema.json');
        const valid = v.validate(schema,instance);
        assert.ok(valid, JSON.stringify(v.errors,null,2));
      })
    });
  });
});