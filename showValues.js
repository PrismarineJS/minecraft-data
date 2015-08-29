var _ = DOMBuilder;

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

function flatten(array, mutable) {
    var result = [];
    var nodes = (mutable && array) || array.slice();
    var node;

    if (!array.length) {
        return result;
    }

    node = nodes.pop();

    do {
        if (Array.isArray(node))
            nodes.push.apply(nodes, node);
        else
            result.push(node);
    } while (nodes.length && (node = nodes.pop()) !== undefined);

    result.reverse(); // we reverse result to restore the original order
    return result;
}

function protocolToString(protocol)
{
  return _('div#protocolActualTable')._(
    flatten(Object.keys(protocol).map(function (state) {
      return [_('h1').text(state),
        directionsToString(state, protocol[state])];
    }))
  ).H();
}

function directionsToString(state, directions)
{
  return [_('h2').text('toClient'), directionToString(state, "toClient", directions["toClient"]),
          _('h2').text('toServer'), directionToString(state, "toServer", directions["toServer"])];
}

function directionToString(state, direction, packets)
{
  return Object.keys(packets).map(function(packetName){
    return [_('h3').text(packetName + ' : ' + packets[packetName].id),
            packetToString(state, direction, packets[packetName])];
  })
}

function countRows(packet) {
  return packet.fields.length;
}

function getFieldInfo(type) {
  if (typeof type === "string")
    return { "type": type };
  else if (Array.isArray(type))
    return { "type": type[0], "typeArgs": type[1] };
  else
    return type;
}

function packetToString(state, direction, packet)
{
  var rows = countRows(packet);
  if (rows == 0)
    rows = 1;
  function fieldLine(field) {
    var fieldType = getFieldInfo(field.type);
    if (fieldType.type === 'array') {
      return [_('td').T(field.name), _('td').T("array<" + fieldType.typeArgs.countType + "," + fieldType.typeArgs.type + ">")];
    } else {
      return [_('td').T(field.name), _('td').T(field.type)];
    }
  }
  function generateFirstLine() {
    var rslt = [
      _('td', { rowspan: rows }).T(packet.id),
      _('td', { rowspan: rows }).T(state),
      _('td', { rowspan: rows }).T(direction)
    ];
    if (packet.fields.length > 0)
      rslt = rslt.concat(fieldLine(packet.fields[0]));
    else
      rslt = rslt.concat([_('td', { colspan: 2 })._([_('i').T('no fields')])]);
    return rslt;
  }
  function generateLines() {
    return packet.fields.slice(1).reduce(function (acc, field) {
      acc.push(_('tr')._(fieldLine(field)));
      return acc;
    }, [_('tr')._(generateFirstLine())]);
  }
  return _('table.packet')
    ._([
      _('thead')._([
        _('tr')._([
          _('th').T('Packet ID'),
          _('th').T('State'),
          _('th').T('Bound To'),
          _('th').T('Field Name'),
          _('th').T('Field Type')
        ])
      ]),
      _('tbody')._(generateLines())
    ]);
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
