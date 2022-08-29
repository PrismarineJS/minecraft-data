/* global $j */

module.exports = function () {
  const versions = require('minecraft-data').supportedVersions
  let bar = '<strong>PC</strong> - ' + versions.pc.map(version => `<a id='v-${version}' onclick="alterVersion('${version}')">${version}</a>`).join(',\n')
  bar += '<br/><strong>Bedrock</strong> - ' + versions.bedrock.map(version => `<a id='v-bedrock_${version}' onclick="alterVersion('bedrock_${version}')">${version}</a>`).join(',\n')
  $j('#top').html(bar)
}

module.exports.selectVersion = (version) => {
  $j('.active-version-link').removeClass('active-version-link')
  document.getElementById(`v-${version}`).classList = ['active-version-link']
}
