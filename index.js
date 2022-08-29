const displaySchema = require('./display_schema')
const showValues = require('./showValues')
const scrollToAnchor = require('./scroll')
const tabs = require('./tabs')
const versionsLinks = require('./versionLinks')

versionsLinks()

function load () {
  const data = require('./data')()
  versionsLinks.selectVersion(data.version)
  tabs(data.active, data.enums, data.enumsValues)
  displaySchema(data.enums).then(scrollToAnchor)
  showValues(data.version)
}

window.alterVersion = (version) => {
  const url = new URL(window.location)
  url.searchParams.set('v', version)
  window.history.pushState(null, '', url.toString())
  load()
}

load()
