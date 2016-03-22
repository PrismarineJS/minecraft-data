function scroll()
{
  if(window.location.hash=="") return;
  var anchor=$j('a[href="'+window.location.hash+'"]');
  if(anchor) $j(window).scrollTop(anchor.offset().top);
}
function done(){
  scroll();
  $j("a").click(function(){setTimeout(scroll,0);setTimeout(scroll,50)});
}

module.exports=done;