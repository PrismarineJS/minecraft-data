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
  setupTabSwitchHandler()
  toggleAnchor()
}

function toggleAnchor () {
  $j(window.location.hash.substr(0, window.location.hash.length - 1)).show()
}

function setupTabSwitchHandler () {
  $j('a[data-toggle="tab"]').on('shown.bs.tab', function () {
    const activeTable = $j('.tab-pane.active .dataTable')
    if ($j.fn.DataTable.isDataTable(activeTable)) {
      activeTable.DataTable().columns.adjust()
    }
  })
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
  destroyDataTable('blocksActualTable')
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
  destroyDataTable('itemsActualTable')
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
  destroyDataTable('biomesActualTable')
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
  destroyDataTable('entitiesActualTable')
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
  destroyDataTable('instrumentsActualTable')
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
  destroyDataTable('windowsActualTable')
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
  destroyDataTable('effectsActualTable')
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

      // Apply filtering
      const filteredData = data.search.value
        ? dataset.filter(row =>
          row.some(field => field && field.toString().toLowerCase().includes(data.search.value.toLowerCase()))
        )
        : dataset

      // Apply ordering
      const order = data.order[0]
      if (order) {
        const columnIndex = order.column
        const dir = order.dir === 'asc' ? 1 : -1
        filteredData.sort((a, b) => {
          if (a[columnIndex] < b[columnIndex]) return -dir
          if (a[columnIndex] > b[columnIndex]) return dir
          return 0
        })
      }

      // Slice for pagination
      const paginatedData = filteredData.slice(start, start + length)

      // eslint-disable-next-line n/no-callback-literal
      callback({
        data: paginatedData,
        recordsTotal: dataset.length,
        recordsFiltered: filteredData.length
      })
    },
    columns: fieldsToColumns(fields),
    paging: true,
    deferRender: true,
    scrollY: '400px',
    scrollCollapse: true,
    scroller: true,
    dom: 'C<"clear">lfrtip',
    columnDefs: [{ visible: false, targets: hiddenColumns }],
    order: [[orderColumn || 0, 'asc']]
  })
}

function destroyDataTable (tableId) {
  const table = $j('#' + tableId)
  if ($j.fn.DataTable.isDataTable(table)) {
    table.DataTable().destroy()
    table.empty()
  }
}
