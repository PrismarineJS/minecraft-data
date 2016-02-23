var assert = require('assert');

var Validator = require('jsonschema').Validator;
var v = new Validator();

Error.stackTraceLimit=0;

var data=["biomes","instruments","items","materials","blocks","recipes","windows","entities","protocol","version","effects"];

var versions=require("../../../data/common/versions");

versions.forEach(function(version){
  describe("minecraft-data schemas "+version, function() {
    this.timeout(60 * 1000);
    data.forEach(function(dataName){
      try {
        var instance = require('../../../data/'+version+'/'+dataName+'.json');
      } catch (e) {
        console.log("No " + dataName + " data for version " + version);
      }
      if(instance) it(dataName+".json is valid",function(){
        var schema = require('../../../schemas/'+dataName+'_schema.json');
        var result = v.validate(instance, schema);
        assert.strictEqual(result.errors.length,0,require('util').inspect(result.errors,{'depth':null}));
      })
    });
  });
});

var commonData=["protocolVersions"];

describe("minecraft-data schemas of common data",function() {
  this.timeout(60 * 1000);
  commonData.forEach(function(dataName){
    it(dataName+".json is valid",function(){
      var instance = require('../../../data/common/'+dataName+'.json');
      var schema = require('../../../schemas/'+dataName+'_schema.json');
      var result = v.validate(instance, schema);
      assert.strictEqual(result.errors.length,0,require('util').inspect(result.errors,{'depth':null}));
    })
  });
});