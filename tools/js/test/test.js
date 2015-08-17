var assert = require('assert');

var Validator = require('jsonschema').Validator;
var v = new Validator();

Error.stackTraceLimit=0;

var enums=["biomes","instruments","items","materials","blocks","recipes","entities","protocol"];

describe("minecraft-data", function() {
  this.timeout(60 * 1000);
    enums.forEach(function(enumName){
      it(enumName+".json is valid",function(){
        var instance = require('../../../enums/'+enumName+'.json');
        var schema = require('../../../enums_schemas/'+enumName+'_schema.json');
        var result = v.validate(instance, schema);
        assert.strictEqual(result.errors.length,0,require('util').inspect(result.errors,{'depth':4}));
      })
    });
});