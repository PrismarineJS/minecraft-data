module.exports=function(){
  $j("#top").html(require('minecraft-data').supportedVersions.pc.map(version => `<a href="?v=${version}">${version}</a>`).join("\n"));
};