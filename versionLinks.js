/* global $j */

module.exports = function () {
  const versions = require('minecraft-data').supportedVersions
  let bar = '<strong>PC</strong> - ' + versions.pc.map(version => `<a href="?v=${version}">${version}</a>`).join(',\n')
  bar += '<br/><strong>Bedrock</strong> - ' + versions.bedrock.map(version => `<a href="?v=bedrock_${version}">${version}</a>`).join(',\n')
  $j('#top').html(bar)
}
