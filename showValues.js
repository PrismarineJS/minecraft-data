var _ = DOMBuilder;

$j(document).ready(function() {
  $j.getJSON("https://api.github.com/repos/"+repo+"/git/refs/heads/"+version)
    .done(function(data) {
      version = data.object.sha;
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
    return [
      _('h3#' + direction + '_' + packetName)._([
          _('a.glyphicon.glyphicon-link', { href: '#' + direction + '_' + packetName })
      ]).T(' ' + packetName),
      packetToString(state, direction, packets[packetName])
    ];
  })
}

function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

function countRows(fields) {
  return fields.reduce(function(acc, item) {
    var fieldType = getFieldInfo(item.type);
    if (fieldType.type === 'container')
      return acc + countRows(fieldType.typeArgs);
    else if (fieldType.type === 'array') {
      if (fieldType.typeArgs.countType)
        return acc + countRows([
            { type: fieldType.typeArgs.countType },
            { type: fieldType.typeArgs.type }
        ]);
      else
        return acc + countRows([{ type: fieldType.typeArgs.type }]);
    } else if (fieldType.type === 'switch') {
      var x = uniq(objValues(fieldType.typeArgs.fields)
                .map(JSON.stable.stringify))
                .map(JSON.parse.bind(JSON))
                .map(function(item) { return { type: item }; });
      if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void')
        x.push({ type: fieldType.typeArgs.default });
      return acc + countRows(x);
    } else
      return acc + 1;
  }, 0);
}

function countCols(fields) {
  return fields.reduce(function(acc, item) {
    var fieldType = getFieldInfo(item.type);
    if (fieldType.type === 'container')
      return Math.max(acc, 1 + countCols(fieldType.typeArgs));
    else if (fieldType.type === 'array') {
      if (fieldType.typeArgs.countType)
        return Math.max(acc, 1 + countCols([{ type: fieldType.typeArgs.countType },
                                            { type: fieldType.typeArgs.type }]));
      else
        return Math.max(acc, 1 + countCols([{ type: fieldType.typeArgs.type }]));
    } else if (fieldType.type === 'switch') {
      var x = objValues(fieldType.typeArgs.fields)
        .map(function(item) { return { type: item } });
      if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void')
        x.push({ type: fieldType.typeArgs.default });
      return Math.max(acc, 1 + countCols(x));
    }
    else
      return acc;
  }, 1);
}

function getFieldInfo(type) {
  if (typeof type === "string")
    return { "type": type };
  else if (Array.isArray(type))
    return { "type": type[0], "typeArgs": type[1] };
  else
    return type;
}

function objValues(obj) {
  var x = Object.keys(obj).map(function(key) {
    return obj[key];
  });
  return x;
}

function eqs(compareTo, k) {
  return k.slice(1).reduce(function(acc, elem) {
    return acc + ' || ' + compareTo + ' == ' + elem;
  }, compareTo + ' == ' + k[0]);
}

function packetToString(state, direction, packet)
{
  var rows = countRows(packet.fields, packet.id === '0x0e');
  var totalCols = countCols(packet.fields);
  if (rows == 0)
    rows = 1;
  function genNameLine(field, depth, getVal) {
    function td(opts) {
      opts = opts || {};
      opts.colspan = totalCols - depth;
      return _('td', opts);
    }
    var fieldType = getFieldInfo(field.type);
    switch (fieldType.type) {
      case 'switch':
        var firstLine = true;
        // First, group together lines
        var elems = Object.keys(fieldType.typeArgs.fields).reduce(function(acc, key) {
          var k = JSON.stable.stringify(fieldType.typeArgs.fields[key]);
          if (acc.hasOwnProperty(k))
            acc[k].push(key);
          else
            acc[k] = [key];
          return acc;
        }, {});
        var lines = Object.keys(elems).reduce(function(acc, key) {
          acc = acc.concat(genNameLine({ "name": (firstLine ? '' : 'else ') + 'if (' + eqs(fieldType.typeArgs.compareTo, elems[key]) + ')', "type": JSON.parse(key) }, depth + 1, getVal));
          firstLine = false;
          return acc;
        }, []);
        var x = uniq(objValues(fieldType.typeArgs.fields)
                .map(JSON.stable.stringify))
                .map(JSON.parse.bind(JSON))
                .map(function(item) { return { type: item }; });
        if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void') {
          lines = lines.concat(genNameLine({ "name": "else", "type": fieldType.typeArgs.default }, depth + 1, getVal));
          x.push({ type: fieldType.typeArgs.default });
        }
        if (lines.length > 0)
          lines[0].unshift(
            _('td', { rowspan: countRows(x) })
            .T(getVal(field, fieldType)));
        else
          lines.push([
            _('td', { rowspan: countRows(x) })
            .T(getVal(field, fieldType))
          ]);
        return lines;
      case 'array':
        var countLine;
        if (fieldType.typeArgs.countType)
          countLine = genNameLine({
            name: '$countType',
            type: fieldType.typeArgs.countType
          }, depth + 1, getVal);
        else
          countLine = [];
        var contentLine = genNameLine({
          name: '$content',
          type: fieldType.typeArgs.type
        }, depth + 1, getVal);
        countLine = countLine.concat(contentLine);
        if (fieldType.typeArgs.countType)
          countLine[0].unshift(_('td', {
            rowspan: countRows([{ type: fieldType.typeArgs.countType },
                                { type: fieldType.typeArgs.type }])
          }).T(getVal(field, fieldType)));
        else
          countLine[0].unshift(_('td', {
            rowspan: countRows([{ type: fieldType.typeArgs.type }])
          }).T(getVal(field, fieldType)));
        return countLine;
      case 'container':
        var lines = fieldType.typeArgs.reduce(function(acc, item) {
          return acc.concat(genNameLine(item, depth + 1, getVal));
        }, []);
        if (lines.length > 0)
          lines[0].unshift(
            _('td', { rowspan: countRows(fieldType.typeArgs) })
            .T(getVal(field, fieldType)));
        else
          lines.push([
            _('td', { rowspan: countRows(fieldType.typeArgs) })
            .T(getVal(field, fieldType))
          ]);
        return lines;
      default:
        return [[td().T(getVal(field, fieldType))]];
    }
  }

  function generateLines() {
    var first = 0;
    return packet.fields.reduce(function (acc, field) {
      var name = genNameLine(field, 0, function(field, fieldInfo) {
        return field.name;
      });
      var type = genNameLine(field, 0, function(field, fieldInfo) {
        return fieldInfo.type;
      });
      if (name.length !== type.length) {
        throw new Error("GAAH");
      }
      for (var i = 0; i < name.length; i++) {
        acc.push(name[i].concat(type[i]));
      }
      return acc;
    }, []).map(function(field) {
      if (first++ === 0)
        field.unshift(
          _('td', { rowspan: rows }).T(packet.id),
          _('td', { rowspan: rows }).T(state),
          _('td', { rowspan: rows }).T(direction));
      return _('tr')._(field);
    });
  }
  return _('table#packets.table.table-striped.table-bordered')
    ._([
      _('thead')._([
        _('tr')._([
          _('th').T('Packet ID'),
          _('th').T('State'),
          _('th').T('Bound To'),
          _('th', { colspan: totalCols }).T('Field Name'),
          _('th', { colspan: totalCols }).T('Field Type'),
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
