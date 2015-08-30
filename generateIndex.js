// convenience file, this should probably be actually generated dynamically in index.js

var enums=["biomes","instruments","items","materials","blocks","recipes","entities","protocol","windows"];
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
var active="items";
enums.forEach(function(e){
  console.log('<li role="presentation"'+(active==e ? ' class="active"' : '')+'><a href="#'+e+'Tab"' +
  ' aria-controls="'+e+'Tab" role="tab" data-toggle="tab">'+ e.capitalize()+'</a></li>')
});

var enumsValues=["biomes","items","blocks","entities","protocol"];
var valSet=enumsValues.reduce(function(acc,e){acc[e]=1;return acc;},{});
enums.forEach(function(e){
  console.log('<div role="tabpanel" class="tab-pane active" id="'+e+'Tab"><div id="'+e+'">' +
    '</div>'+(valSet[e] ? '<div id="'+e+'Table"></div>' : '')+'</div>')
});
