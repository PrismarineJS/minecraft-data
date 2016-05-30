var assert = require('assert');

var Ajv = require('ajv');
var v = Ajv({verbose:true});

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