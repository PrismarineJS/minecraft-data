// items tests

var item_extractor = require("./../item_extractor.js");


function testArrow()
{
  item_extractor.itemInfobox("Arrow",function(err,data){
    console.log(data);
  });
}
function testWaitDisc()
{
  item_extractor.itemInfobox("Wait Disc",function(err,data){
    console.log(data);
  });
}

function testGoldenApple()
{
  item_extractor.itemInfobox("Golden Apple",function(err,data){
    console.log(data);
  });
}