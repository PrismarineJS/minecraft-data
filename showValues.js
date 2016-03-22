var loadProtocol=require("./loadProtocol");

module.exports=function(version) {
    loadItems(version);
    loadBlocks(version);
    loadBiomes(version);
    loadEntities(version);
    loadInstruments(version);
    loadProtocol(version);
    loadWindows(version);
    loadEffects(version);
    toggleAnchor();
};

function toggleAnchor()
{
  $j(window.location.hash.substr(0,window.location.hash.length-1)).show();
}

function fieldsToColumns(fields)
{
  return fields.map(function(field){return {"title":field};});
}


function nameToImage(version,name) {
  var assetsVersion;
  if(version=="1.9")
    assetsVersion="1.9";
  else if(version=="1.8")
    assetsVersion="1.8.8";
  else
    assetsVersion="1.9";

  var mcAssets=require("minecraft-assets")(assetsVersion);
  if(!mcAssets.textureContent[name])
    return '';
  var texture=mcAssets.textureContent[name].texture;
  return texture ? '<img style="width:16px;height:16px;" src="'+texture+'" />' : '';
}

function loadBlocks(version)
{
  loadData(version,"blocks",
    function(block){
      return [nameToImage(version,block['name']),block["id"],'<a href="#'+block["name"]+'">'+block["name"]+'</a>',
      block["displayName"],block["stackSize"],block["hardness"]
      ,block["diggable"],block["boundingBox"],block["material"] ? block["material"] : null,
    block["transparent"],block["emitLight"],block["filterLight"]];
    },
    ["texture","id","name","displayName","stackSize","hardness","diggable","boundingBox","material","transparent","emitLight","filterLight"],
    [7,8,9,10,11],
    1
  );
}

function loadItems(version)
{
  loadData(version,"items",
    function(item){return [nameToImage(version,item['name']),item["id"],'<a href="#'+item["name"]+'">'+item["name"]+'</a>',
      item["displayName"],item["stackSize"]];},
    ["id","name","displayName","stackSize"],[],1
  );
}


function loadBiomes(version)
{
  loadData(version,"biomes",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'
      ,e["color"],e["temperature"],e["rainfall"]];},
    ["id","name","color","temperature","rainfall"],
    []
  );
}


function loadEntities(version)
{
  loadData(version,"entities",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'
      ,e["displayName"],e["type"],e["internalId"] ? e["internalId"] : "",e["width"],e["height"],e["category"] ? e["category"] : ""];},
    ["id","name","displayName","type","internalId","width","height","category"],
    []
  );
}

function loadInstruments(version)
{
  loadData(version,"instruments",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'];},
    ["id","name"],
    []
  );
}

function loadWindows(version)
{
  loadData(version,"windows",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>'];},
    ["id","name"],
    []
  );
}

function loadEffects(version)
{
  loadData(version,"effects",
    function(e){return [e["id"],'<a href="#'+e["name"]+'">'+e["name"]+'</a>',e["displayName"],e["type"]];},
    ["id","name","displayName","type"],
    []
  );
}

function loadData(version,enumName,elementToArray,fields,hiddenColumns,orderColumn)
{
  var data=require("minecraft-data")(version)[enumName+"Array"];
  if(!data) return;
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
       ],
    "order": [[ orderColumn ? orderColumn : 0, "asc" ]]
    }
  );
}
