$j(document).ready(function() {
  $j.getJSON("https://api.github.com/repos/"+repo+"/git/refs/heads/master")
    .done(function(data) {
      commit = data.object.sha;
      loadItems();
      loadBlocks();
      loadBiomes();
      loadEntities();
      loadInstruments();
      loadProtocol();
      toggleAnchor();
    });
});

function toggleAnchor()
{
  $j(window.location.hash.substr(0,window.location.hash.length-1)).show();
}

function fieldsToColumns(fields)
{
  return fields.map(function(field){return {"title":field};});
}

function loadBlocks()
{
  loadData("blocks",
    function(block){return [block["id"],'<a href="#'+block["name"]+'">'+block["name"]+'</a>',
      block["displayName"],block["stackSize"],block["hardness"]
      ,block["diggable"],block["boundingBox"],block["material"] ? block["material"] : null];},
    ["id","name","displayName","stackSize","hardness","diggable","boundingBox","material"],
    [6,7]
  );
}


function loadItems()
{
  loadData("items",
    function(item){return [item["id"],'<a href="#'+item["name"]+'">'+item["name"]+'</a>',
      item["displayName"],item["stackSize"]];},
    ["id","name","displayName","stackSize"],[]
  );
}


function loadBiomes()
{
  loadData("biomes",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'
      ,e["color"],e["temperature"],e["rainfall"]];},
    ["id","name","color","temperature","rainfall"],
    []
  );
}


function loadEntities()
{
  loadData("entities",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'
      ,e["displayName"],e["type"]];},
    ["id","name","displayName","type"],
    []
  );
}

function loadInstruments()
{
  loadData("instruments",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'];},
    ["id","name"],
    []
  );
}

function loadData(enumName,elementToArray,fields,hiddenColumns)
{
  $j.ajax("https://cdn.rawgit.com/"+repo+"/"+commit+"/data/"+version+"/"+enumName+".json")
    .done(function(data){
      var dataset=data.map(elementToArray);
      $j('#'+enumName+'Table').html( '<table cellpadding="0" cellspacing="0" border="0"' +
        ' class="display" id="'+enumName+'ActualTable"></table>' );
      $j('#'+enumName+'ActualTable').dataTable( {
        "data":dataset,
        "paging":false,
        "columns": fieldsToColumns(fields),
        "dom": 'C<"clear">lfrtip',
          "columnDefs": [
            { visible: false, targets: hiddenColumns }
           ]
        }
      );
    });
}
