$j(document).ready(function() {

  loadItems();
  loadBlocks();
  loadBiomes();
  loadEntities();
  loadInstruments();
  loadProtocol();
  toggleAnchor();
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

function protocolToString(protocol)
{
  return '<div id="protocolActualTable">' +
  Object.keys(protocol)
    .map(function(directionsName){return "<h1>"+directionsName+"</h1>\n"+directionsToString(protocol[directionsName]);})
    .join("\n")+
  '</div>';
}

function directionsToString(directions)
{
  return "<h2>toClient</h2>\n"+directionToString(directions["toClient"])+"\n"
    + "<h2>toServer</h2>\n"+directionToString(directions["toServer"])+"\n";
}

function directionToString(direction)
{
  return Object.keys(direction).map(function(packetName){
    return "<h3>"+packetName+" : "+direction[packetName].id+"</h3>\n"+packetToString(direction[packetName])
  }).join("\n");
}

function packetToString(packet)
{
  return "<ul>"+
      packet["fields"]
        .map(function(field){return "<li>"+field["name"]+" : "+field["type"]+"</li>"})
        .join("\n")
    +"</ul>"
}

function loadProtocol()
{
  $j.ajax("https://cdn.rawgit.com/"+repo+"/"+version+"/enums/protocol.json")
    .done(function(data){
      $j('#protocolTable').html(protocolToString(data));
    });
}

function loadData(enumName,elementToArray,fields,hiddenColumns)
{
  $j.ajax("https://cdn.rawgit.com/"+repo+"/"+version+"/enums/"+enumName+".json")
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
