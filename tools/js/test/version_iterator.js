module.exports=forEach;

var minecraftTypes=["pc","pe"];

function forEach(f)
{
  minecraftTypes.forEach(function(type) {
    var versions = require('../../../data/' + type + '/common/versions');
    versions.forEach(function(version) {
      f('../../../data/' + type + '/' + version, type + " " + version);
    });
  });
}