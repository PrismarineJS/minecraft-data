/* global $j */

const parameters = Object.fromEntries(new URLSearchParams(window.location.search))

function capitalize (s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports = function (active, enums, enumsValues) {
  const navTabs = enums.map(function (e) {
    return '<li role="presentation"' + (active === e ? ' class="active"' : '') + '><a href="#' + e + 'Tab"' +
      ' aria-controls="' + e + 'Tab" role="tab" data-toggle="tab">' + capitalize(e) + '</a></li>'
  }).join('\n')
  $j('#navTabs').html(navTabs)

  const valSet = enumsValues.reduce(function (acc, e) { acc[e] = 1; return acc }, {})
  const tabContent = enums.map(function (e) {
    return '<div role="tabpanel" class="tab-pane' + (active === e ? ' active' : '') + '" id="' + e + 'Tab"><div id="' + e + '">' +
      '</div>' + (valSet[e] ? '<div id="' + e + 'Table"></div>' : '') + '</div>'
  }).join('\n')

  $j('#tabContent').html(tabContent)

  enums.forEach(function (e) {
    const raw = parameters['v']
    $j('a[href="' + '#' + e + 'Tab' + '"]').click(function () {
      window.history.pushState('', '', '?' + (raw ? 'v=' + raw + '&' : '') + 'd=' + e)
    })
  })
}
