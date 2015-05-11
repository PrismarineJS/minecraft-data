$j(document).ready(function() {

  loadItems();
  loadBlocks();

} );

function loadBlocks()
{
  loadData("blocks",
    function(block){return [block["id"],block["name"],block["displayName"],block["stackSize"]];},
    [
      { "title": "id" },
      { "title": "name" },
      {"title": "displayName"},
      {"title": "stackSize"}
    ]
  );
}


function loadItems()
{
  loadData("items",
    function(item){return [item["id"],item["name"],item["displayName"],item["stackSize"]];},
    [
      { "title": "id" },
      { "title": "name" },
      {"title": "displayName"},
      {"title": "stackSize"}
    ]
  );
}

function loadData(enumName,elementToArray,columns)
{
  $j.ajax("https://cdn.rawgit.com/PrismarineJS/minecraft-data/master/enums/"+enumName+".json")
    .done(function(data){
      var dataset=data.map(elementToArray);
      $j('#'+enumName+'Table').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="'+enumName+'ActualTable"></table>' );
      $j('#'+enumName+'ActualTable').dataTable( {
        "data":dataset,
        "paging":false,
        "columns": columns});
    } );
  $j( "#"+enumName+"Table").hide();
  $j( "#"+enumName+"Toggle" ).click(function() {
    $j( "#"+enumName+"Table").toggle();
  });
}

