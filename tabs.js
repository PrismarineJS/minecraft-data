var queryString=require("query-string");
var parameters=queryString.parse(location.search);

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports=function(active,enums,enumsValues) {
  var navTabs=enums.map(function(e){
    return '<li role="presentation"'+(active==e ? ' class="active"' : '')+'><a href="#'+e+'Tab"' +
      ' aria-controls="'+e+'Tab" role="tab" data-toggle="tab">'+ e.capitalize()+'</a></li>'
  }).join("\n");
  $j("#navTabs").html(navTabs);


  var valSet=enumsValues.reduce(function(acc,e){acc[e]=1;return acc;},{});
  var tabContent=enums.map(function(e){
    return '<div role="tabpanel" class="tab-pane'+(active==e ? ' active' : '')+'" id="'+e+'Tab"><div id="'+e+'">' +
      '</div>'+(valSet[e] ? '<div id="'+e+'Table"></div>' : '')+'</div>';
  }).join("\n");

  $j("#tabContent").html(tabContent);


  enums.forEach(function(e){
    var raw=parameters["v"];
    $j( 'a[href="'+'#'+e+'Tab'+'"]').click(function() {
      window.history.pushState('', '', '?'+(raw ? 'v='+raw+'&' : '')+'d='+e);
    });
  });
};
