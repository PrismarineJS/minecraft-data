$j(document).ready(function() {

  loadItems();
  loadBlocks();
  loadBiomes();
  loadEntities();
  loadInstruments();

} );

function loadBlocks()
{
  loadData("blocks",
    function(block){return [block["id"],block["name"],block["displayName"],block["stackSize"],block["hardness"]
      ,block["diggable"],block["boundingBox"],block["material"] ? block["material"] : null];},
    [
      { "title": "id" },
      { "title": "name" },
      {"title": "displayName"},
      {"title": "stackSize"},
      {"title": "hardness"},
      {"title": "diggable"},
      {"title": "boundingBox"},
      {"title": "material"}
    ],[6,7]
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
    ],[]
  );
}


function loadBiomes()
{
  loadData("biomes",
    function(e){return [e["id"],e["name"],e["color"],e["temperature"],e["rainfall"]];},
    [
      { "title": "id" },
      { "title": "name" },
      {"title": "color"},
      {"title": "temperature"},
      {"title": "rainfall"}
    ],[]
  );
}


function loadEntities()
{
  loadData("entities",
    function(e){return [e["id"],e["name"],e["displayName"],e["type"]];},
    [
      { "title": "id" },
      { "title": "name" },
      {"title": "displayName"},
      {"title": "type"}
    ],[]
  );
}

function loadInstruments()
{
  loadData("instruments",
    function(e){return [e["id"],e["name"]];},
    [
      { "title": "id" },
      { "title": "name" }
    ],[]
  );
}

function loadData(enumName,elementToArray,columns,hiddenColumns)
{
  $j.ajax("https://cdn.rawgit.com/PrismarineJS/minecraft-data/master/enums/"+enumName+".json")
    .done(function(data){
      var dataset=data.map(elementToArray);
      $j('#'+enumName+'Table').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="'+enumName+'ActualTable"></table>' );
      $j('#'+enumName+'ActualTable').dataTable( {
        "data":dataset,
        "paging":false,
        "columns": columns,
        "dom": 'C<"clear">lfrtip',
          "columnDefs": [
            { visible: false, targets: hiddenColumns }
           ]
        }
      );
    } );
  $j( "#"+enumName+"Table").hide();
  $j( "#"+enumName+"Toggle" ).click(function() {
    $j( "#"+enumName+"Table").toggle();
  });
}

