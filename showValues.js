/* global $j */

const loadProtocol = require('./loadProtocol')

module.exports = function (version) {
  loadItems(version)
  loadBlocks(version)
  loadBiomes(version)
  loadEntities(version)
  loadInstruments(version)
  loadProtocol(version)
  loadWindows(version)
  loadEffects(version)
  toggleAnchor()
}

function toggleAnchor () {
  $j(window.location.hash.substr(0, window.location.hash.length - 1)).show()
}

function fieldsToColumns (fields) {
  return fields.map(function (field) {
    return { title: field }
  })
}

function nameToImage (version, name) {
  let assetsVersion
  if (version.substr(0, 3) === '1.8') {
    assetsVersion = '1.8.8'
  } else if (version.substr(0, 3) === '1.9') {
    assetsVersion = '1.9'
  } else if (version.substr(0, 4) === '1.10') {
    assetsVersion = '1.10'
  } else if (version.substr(0, 4) === '1.11') {
    assetsVersion = '1.11'
  } else if (version.substr(0, 4) === '1.12') {
    assetsVersion = '1.12'
  } else if (version.substr(0, 4) === '1.13') {
    assetsVersion = '1.13'
  } else if (version.substr(0, 4) === '1.14') {
    assetsVersion = '1.14.4'
  } else if (version.substr(0, 4) === '1.15') {
    assetsVersion = '1.15.2'
  } else {
    assetsVersion = '1.13'
  }

  const mcAssets = require('minecraft-assets')(assetsVersion)
  if (!mcAssets.textureContent[name]) {
    return ''
  }
  const texture = mcAssets.textureContent[name].texture
  return texture ? '<img style="width:16px;height:16px;" src="' + texture + '" />' : ''
}

function loadBlocks (version) {
  loadData(
    version,
    'blocks',
    function (block) {
      return [
        nameToImage(version, block.name),
        block.id,
        '<a href="#' + block.name + '">' + block.name + '</a>',
        block.displayName,
        block.stackSize,
        block.hardness,
        block.diggable,
        block.boundingBox,
        block.material ? block.material : null,
        block.transparent,
        block.emitLight,
        block.filterLight
      ]
    },
    [
      'texture',
      'id',
      'name',
      'displayName',
      'stackSize',
      'hardness',
      'diggable',
      'boundingBox',
      'material',
      'transparent',
      'emitLight',
      'filterLight'
    ],
    [7, 8, 9, 10, 11],
    1
  )
}

function loadItems (version) {
  loadData(
    version,
    'items',
    function (item) {
      return [
        nameToImage(version, item.name),
        item.id,
        '<a href="#' + item.name + '">' + item.name + '</a>',
        item.displayName,
        item.stackSize
      ]
    },
    ['texture', 'id', 'name', 'displayName', 'stackSize'],
    [],
    1
  )
}

function loadBiomes (version) {
  loadData(
    version,
    'biomes',
    function (biome) {
      return [
        biome.id,
        '<a href="#' + biome.name + '">' + biome.name + '</a>',
        biome.color === undefined ? '' : biome.color,
        biome.temperature,
        biome.rainfall == null ? 'N/A' : biome.rainfall
      ]
    },
    ['id', 'name', 'color', 'temperature', 'rainfall'],
    [],
    0
  )
}

function loadEntities (version) {
  loadData(
    version,
    'entities',
    function (entity) {
      return [
        entity.id,
        '<a href="#' + entity.name + '">' + entity.name + '</a>',
        entity.displayName,
        entity.type,
        entity.internalId ? entity.internalId : '',
        entity.width,
        entity.height,
        entity.category ? entity.category : ''
      ]
    },
    ['id', 'name', 'displayName', 'type', 'internalId', 'width', 'height', 'category'],
    [],
    0
  )
}

function loadInstruments (version) {
  loadData(
    version,
    'instruments',
    function (instrument) {
      return [
        instrument.id,
        '<a href="#' + instrument.name + '">' + instrument.name + '</a>'
      ]
    },
    ['id', 'name'],
    [],
    0
  )
}

function loadWindows (version) {
  loadData(
    version,
    'windows',
    function (window) {
      return [
        window.id,
        '<a href="#' + window.name + '">' + window.name + '</a>'
      ]
    },
    ['id', 'name'],
    [],
    0
  )
}

function loadEffects (version) {
  loadData(
    version,
    'effects',
    function (effect) {
      return [
        effect.id,
        '<a href="#' + effect.name + '">' + effect.name + '</a>',
        effect.displayName,
        effect.type
      ]
    },
    ['id', 'name', 'displayName', 'type'],
    [],
    0
  )
}

function loadData (version, enumName, elementToArray, fields, hiddenColumns, orderColumn) {
  const data = require('minecraft-data')(version)[enumName + 'Array']
  if (!data) return

  const dataset = data.map(elementToArray)

  $j('#' + enumName + 'Table').html(
    '<table cellpadding="0" cellspacing="0" border="0"' +
      ' class="display" id="' +
      enumName +
      'ActualTable"></table>'
  )

  $j('#' + enumName + 'ActualTable').dataTable({
    serverSide: true,
    ajax: function (data, callback) {
      const start = data.start
      const length = data.length
      const filteredData = dataset.slice(start, start + length)
      // eslint-disable-next-line n/no-callback-literal
      callback({
        data: filteredData,
        recordsTotal: dataset.length,
        recordsFiltered: dataset.length
      })
    },
    deferRender: true,
    scrollY: '400px',
    scrollCollapse: true,
    scroller: true,
    paging: true,
    columns: fieldsToColumns(fields),
    dom: 'C<"clear">lfrtip',
    columnDefs: [{ visible: false, targets: hiddenColumns }],
    order: [[orderColumn || 0, 'asc']]
  })
}
