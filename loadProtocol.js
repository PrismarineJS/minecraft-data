/* global DOMBuilder, $j */

const stringify = require('json-stable-stringify')
const marked = require('marked')
const renderer = new marked.Renderer()
renderer.table = function (header, body) {
  return "<table class='packets table table-striped table-bordered'><thead>" + header + '</thead><tbody>' + body + '</tbody></table>'
}
marked.setOptions({
  gfm: true,
  tables: true,
  renderer: renderer
})

const _ = DOMBuilder

function flatten (array, mutable) {
  const result = []
  const nodes = (mutable && array) || array.slice()
  let node

  if (!array.length) {
    return result
  }

  node = nodes.pop()

  do {
    if (Array.isArray(node)) { nodes.push.apply(nodes, node) } else { result.push(node) }
  } while (nodes.length && (node = nodes.pop()) !== undefined)

  result.reverse() // we reverse result to restore the original order
  return result
}

function protocolToString (protocol, comments) {
  return _('div#protocolActualTable')._(
    flatten(protocol['toClient'] ? directionsToLines('', protocol, comments) : Object.keys(protocol).filter(function (state) { return state !== 'types' }).map(function (state) {
      return [_('h1').text(state),
        directionsToLines(state, protocol[state], comments && comments[state])]
    }))
  ).H()
}

function directionsToLines (state, directions, comments) {
  return [_('h2').text('toClient'), directionToLines(state, 'toClient', directions['toClient'].types, comments && comments['toClient']),
    _('h2').text('toServer'), directionToLines(state, 'toServer', directions['toServer'].types, comments && comments['toServer'])]
}

function reverseObject (o) {
  return Object.keys(o).reduce(function (acc, k) { acc[o[k]] = k; return acc }, {})
}

function directionToLines (state, direction, packets, comments) {
  const typesToNames = reverseObject(packets['packet'][1][1]['type'][1]['fields'])
  const namesToIds = reverseObject(packets['packet'][1][0]['type'][1]['mappings'])
  return Object.keys(packets).filter(function (packetName) { return packetName !== 'packet' }).map(function (packetType) {
    const packetName = typesToNames[packetType]
    const packetId = namesToIds[packetName]
    return [
      _('h3#' + direction + '_' + packetName)._([
        _('a.glyphicon.glyphicon-link', { href: '#' + direction + '_' + packetName })
      ]).T(' ' + packetName),
      packetToString(state, direction, packets[packetType], packetId, comments && comments[packetName])
    ]
  })
}

function packetToString (state, direction, packet, packetId, comments) {
  if (packet[0] !== 'container') {
    return _('div')
  }
  let rows = countRows(packet[1])
  const totalCols = countCols(packet[1])
  if (rows === 0) { rows = 1 }

  function ini () {
    const arr = []
    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) arr.push(arguments[i])
    }
    return arr
  }

  function generateLines () {
    let packets = packet[1].reduce(function (acc, field) {
      const name = fieldToLines(totalCols, field, 0, function (field, fieldInfo) {
        return field.name
      })
      const type = fieldToLines(totalCols, field, 0, function (field, fieldInfo) {
        return fieldInfo.type
      })
      if (name.length !== type.length) {
        throw new Error('GAAH')
      }
      for (let i = 0; i < name.length; i++) {
        acc.push(name[i].concat(type[i]))
      }
      return acc
    }, [])
    if (packets.length > 0) {
      packets[0].unshift(_('td', { rowspan: rows }).T(direction))
      if (state !== '') packets[0].unshift(_('td', { rowspan: rows }).T(state))
      packets[0].unshift(_('td', { rowspan: rows }).T(packetId))
    } else {
      packets = [ini(
        _('td', { rowspan: rows }).T(packetId),
        state === '' ? undefined : _('td', { rowspan: rows }).T(state),
        _('td', { rowspan: rows }).T(direction),
        _('td', { colspan: 2 })._([_('i').T('no fields')])
      )]
    }
    return packets.map(function (field) {
      return _('tr')._(field)
    })
  }
  return _('div')._([
    _('div').H(comments ? marked(comments.before.join('\n')) : ''),
    _('table.packets.table.table-striped.table-bordered')._([
      _('thead')._([
        _('tr')._(ini(
          _('th').T('Packet ID'),
          state === '' ? undefined : _('th').T('State'),
          _('th').T('Bound To'),
          _('th', { colspan: totalCols }).T('Field Name'),
          _('th', { colspan: totalCols }).T('Field Type')
        ))
      ]),
      _('tbody')._(generateLines())
    ]),
    _('div').H(comments ? marked(comments.after.join('\n')) : '')
  ])
}

function fieldToLines (totalCols, field, depth, getVal) {
  function td (opts) {
    opts = opts || {}
    opts.colspan = totalCols - depth
    return _('td', opts)
  }
  const fieldType = getFieldInfo(field.type)
  switch (fieldType.type) {
    case 'switch':
      return switchToLines(totalCols, field, fieldType, depth, getVal)
    case 'array':
      return arrayToLines(totalCols, field, fieldType, depth, getVal)
    case 'container':
      return containerToLines(totalCols, field, fieldType, depth, getVal)
    default:
      return [[td().T(getVal(field, fieldType))]]
  }
}

function switchToLines (totalCols, field, fieldType, depth, getVal) {
  let firstLine = true
  // First, group together lines
  const elems = Object.keys(fieldType.typeArgs.fields).reduce(function (acc, key) {
    const k = stringify(fieldType.typeArgs.fields[key])
    if (acc.hasOwnProperty(k)) { acc[k].push(key) } else { acc[k] = [key] }
    return acc
  }, {})
  let lines = Object.keys(elems).reduce(function (acc, key) {
    acc = acc.concat(fieldToLines(totalCols, { 'name': (firstLine ? '' : 'else ') +
    'if (' + eqs(fieldType.typeArgs.compareTo, elems[key]) + ')',
    'type': JSON.parse(key) }, depth + 1, getVal))
    firstLine = false
    return acc
  }, [])
  const x = uniq(objValues(fieldType.typeArgs.fields)
    .map(stringify))
    .map(JSON.parse.bind(JSON))
    .map(function (item) { return { type: item } })
  if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void') {
    lines = lines.concat(fieldToLines(totalCols, { 'name': 'else', 'type': fieldType.typeArgs.default }, depth + 1, getVal))
    x.push({ type: fieldType.typeArgs.default })
  }
  if (lines.length > 0) {
    lines[0].unshift(
      _('td', { rowspan: countRows(x) })
        .T(getVal(field, fieldType)))
  } else {
    lines.push([
      _('td', { rowspan: countRows(x) })
        .T(getVal(field, fieldType))
    ])
  }
  return lines
}

function arrayToLines (totalCols, field, fieldType, depth, getVal) {
  let countLine
  if (fieldType.typeArgs.countType) {
    countLine = fieldToLines(totalCols, {
      name: '$countType',
      type: fieldType.typeArgs.countType
    }, depth + 1, getVal)
  } else { countLine = [] }
  const contentLine = fieldToLines(totalCols, {
    name: '$content',
    type: fieldType.typeArgs.type
  }, depth + 1, getVal)
  countLine = countLine.concat(contentLine)
  if (fieldType.typeArgs.countType) {
    countLine[0].unshift(_('td', {
      rowspan: countRows([{ type: fieldType.typeArgs.countType },
        { type: fieldType.typeArgs.type }])
    }).T(getVal(field, fieldType)))
  } else {
    countLine[0].unshift(_('td', {
      rowspan: countRows([{ type: fieldType.typeArgs.type }])
    }).T(getVal(field, fieldType)))
  }
  return countLine
}

function containerToLines (totalCols, field, fieldType, depth, getVal) {
  const lines = fieldType.typeArgs.reduce(function (acc, item) {
    return acc.concat(fieldToLines(totalCols, item, depth + 1, getVal))
  }, [])
  if (lines.length > 0) {
    lines[0].unshift(
      _('td', { rowspan: countRows(fieldType.typeArgs) })
        .T(getVal(field, fieldType)))
  } else {
    lines.push([
      _('td', { rowspan: countRows(fieldType.typeArgs) })
        .T(getVal(field, fieldType))
    ])
  }
  return lines
}

function uniq (a) {
  const seen = {}
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true)
  })
}

function countRows (fields) {
  return fields.reduce(function (acc, item) {
    const fieldType = getFieldInfo(item.type)
    if (fieldType.type === 'container') { return acc + countRows(fieldType.typeArgs) } else if (fieldType.type === 'array') {
      if (fieldType.typeArgs.countType) {
        return acc + countRows([
          { type: fieldType.typeArgs.countType },
          { type: fieldType.typeArgs.type }
        ])
      } else { return acc + countRows([{ type: fieldType.typeArgs.type }]) }
    } else if (fieldType.type === 'switch') {
      const x = uniq(objValues(fieldType.typeArgs.fields)
        .map(stringify))
        .map(JSON.parse.bind(JSON))
        .map(function (item) { return { type: item } })
      if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void') { x.push({ type: fieldType.typeArgs.default }) }
      return acc + countRows(x)
    } else { return acc + 1 }
  }, 0)
}

function countCols (fields) {
  return fields.reduce(function (acc, item) {
    const fieldType = getFieldInfo(item.type)
    if (fieldType.type === 'container') { return Math.max(acc, 1 + countCols(fieldType.typeArgs)) } else if (fieldType.type === 'array') {
      if (fieldType.typeArgs.countType) {
        return Math.max(acc, 1 + countCols([{ type: fieldType.typeArgs.countType },
          { type: fieldType.typeArgs.type }]))
      } else { return Math.max(acc, 1 + countCols([{ type: fieldType.typeArgs.type }])) }
    } else if (fieldType.type === 'switch') {
      const x = objValues(fieldType.typeArgs.fields)
        .map(function (item) { return { type: item } })
      if (fieldType.typeArgs.default && fieldType.typeArgs.default !== 'void') { x.push({ type: fieldType.typeArgs.default }) }
      return Math.max(acc, 1 + countCols(x))
    } else { return acc }
  }, 1)
}

function getFieldInfo (type) {
  if (typeof type === 'string') { return { 'type': type } } else if (Array.isArray(type)) { return { 'type': type[0], 'typeArgs': type[1] } } else { return type }
}

function objValues (obj) {
  const x = Object.keys(obj).map(function (key) {
    return obj[key]
  })
  return x
}

function eqs (compareTo, k) {
  return k.slice(1).reduce(function (acc, elem) {
    return acc + ' || ' + compareTo + ' == ' + elem
  }, compareTo + ' == ' + k[0])
}

function loadProtocol (version) {
  if (version.startsWith('bedrock')) {
    const [, v] = version.split('_')
    $j('#protocolTable').html(`<iframe src="protocol/bedrock/${v}" frameborder="0" style='width: 100%; height: 80vh;'><a href="protocol/bedrock/${v}">Click here</a></iframe>`)
  } else {
    const data = require('minecraft-data')(version).protocol
    const comments = require('minecraft-data')(version).protocolComments
    $j('#protocolTable').html(protocolToString(data, comments))
  }
}

module.exports = loadProtocol
