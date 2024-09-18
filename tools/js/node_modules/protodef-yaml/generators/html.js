const showdown = require('showdown')


/**
 * 
 * @param {object} toTransform Intermediary YAML turned to JSON
 * @param {{ toTitleCase, includeHeader }} options Generation options 
 */
function generate(parsedSchema, options = {}) {
    let rows = options.includeHeader ? defaultHeader : ''
    const converter = new showdown.Converter()
    const md = text => converter.makeHtml(text)

    const thead = `<thead><tr><td>Field Name</td><td>Field Type</td><td>Notes</td></tr></thead>`

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    const isStatement = key => key.startsWith('if ') || key == 'default'
    const tfName = (key, parent) => {
        if (isStatement(key) && (parent?.includes('%switch'))) return `<span class='fake'>${key.replace('if', 'is').replace(/_/g, ' ')}</span>`
        return key.startsWith('_') ? key : key.replace(/_/g, ' ').replace('$', '').replace('?', '')
    }

    function work(toTransform, idPrefix = '') {
        let lastComment = ''
        const nextComment = () => { const c = lastComment; lastComment = null; return md(c?.replace(/\n\n/g, '<br/>\n') || ''); }

        function parseContainer(key, val, depth = 1, parent) {
            const pad = str => str.padStart(depth * 2) + '\n'
            // Ignore comments
            if (key.startsWith('!')) {
                if (key.startsWith('!comment')) lastComment = lastComment ? lastComment + val : val
                return
            }
            if (Array.isArray(val)) return

            let extraTag = ''
            const aname = key.startsWith('%') ? key.split(',')[1] : key
            if (aname.endsWith('?')) extraTag += `<div class='tag tag-optional'>optional</div>`

            if (typeof val === 'object') {
                if (key.startsWith('%switch')) {
                    const [_, what, condition] = key.split(',')
                    rows += pad(`<tr><td><b class='name'>${what.startsWith('_') ? '&#128257;' : tfName(what)}</b><br/><br/>${extraTag}<i><div class='tag tag-switch'>if <span class='name'>${tfName(condition)}</span></div></i></td><td colspan=2><table>`)
                    for (let k in val) {
                        let condition = k.startsWith('%') ? k.split(',')[1] : k
                        // rows += pad(`<tr><td>${condition}</td><td><table>`)
                        let v = val[k]
                        parseContainer(k, v, depth + 1, key)
                        // rows += pad(`</table></td></tr>`)
                    }
                    rows += pad(`</table></td></tr>`)
                } else if (key.startsWith('%container') || key.startsWith('if ')) {
                    const name = key.startsWith('%') ? key.split(',')[1] : key
                    rows += pad(`<tr><td class='name'>${tfName(name, parent)} ${extraTag}</td><td colspan=2 class='bordered'><table>`)
                    for (const k in val) {
                        let v = val[k]
                        parseContainer(k, v, depth + 1, key)
                    }
                    rows += pad(`</table></td></tr>`)
                } else if (key.startsWith('%map')) {
                    const [_, what, type] = key.split(',')
                    rows += pad(`<tr><td class='name field-name'>${tfName(what, parent)} ${extraTag}</td><td colspan=2>${type} <span class='tag tag-enum'>enum</span><hr/> <table style='width:100%'>`)
                    for (const k in val) {
                        let v = val[k]
                        if (k.startsWith('!')) {
                            if (k.startsWith('!comment')) lastComment = lastComment ? lastComment + v : v
                            continue
                        }

                        rows += pad(`  <tr><td class='name'>${tfName(k.startsWith('%') ? k.split(',')[1] : k)}</td><td class='name'>${tfName(v)}</td><td>${nextComment()}</td></tr>`)
                        // parseContainer(k, v, depth + 1)
                    }
                    rows += pad(`</table></td></tr>`)
                } else if (key.startsWith('%array')) {
                    const [_, what, type, prefix] = key.split(',')
                    if (prefix) { // Prepend the length prefix
                        if (prefix.startsWith('$'))
                            rows += pad(`<tr><td colspan=2><i>Length for <span class='name'>${tfName(what, parent)}</span> below is <b class='name'>${tfName(prefix)}</b> from above</td><td ${type ? 'rowspan=2' : ''}>${nextComment()}</i></td></tr>`)
                        else
                            rows += pad(`<tr><td class='field-name'><span class='name'>${tfName(what, parent)}</span> length</td><td>${prefix}</td><td ${type ? 'rowspan=2' : ''}>${nextComment()}</td></tr>`)
                    }
                    if (type) { // Inline array
                        rows += pad(`<tr><td class='field-name'><span class='name'>${tfName(what, parent)}</span> <div class="tag tag-array">array</div></td><td>${type}</td><td>${nextComment()}</td></tr>`)
                    } else {
                        rows += pad(`<tr><td class='field-name'><span class='name'>${tfName(what, parent)}</span> <div class="tag tag-array">array</div></td><td colspan=2><table>`)
                        for (const k in val) {
                            let v = val[k]
                            parseContainer(k, v, depth + 1, key)
                        }
                        rows += pad(`</table></td></tr>`)
                    }
                }
                // rows += pad('</td></tr>')
            } else if (typeof val === 'string') {
                rows += pad(`<tr><td class='field-name name'>${tfName(key, parent)} ${extraTag}</td><td>${tfType(val)}</td><td>${nextComment()}</td></tr>`)
            }
        }

        rows += `<div class='container'>`

        // Build the TOC

        let listOfTypes = []
        const tfType = type => {
            return listOfTypes.includes(type) ? `<a href="#${idPrefix}${type}">${type}</a>` : type
        }

        rows += `<h3>Table of Contents</h3>
  <table class='table table-bordered table-striped' style='width:50%'>
  <thead><tr><td>Key</td><td>Name</td></tr></thead>
  <tbody>
    ${Object.entries(toTransform).map(([k, v]) => {
            if (k.startsWith('!') && !k.startsWith('%')) return ''
            const [type, name] = k.split(',')
            if (!name) return ''
            listOfTypes.push(name)
            return (name.startsWith('packet_') && v?.['!id']) ? `<tr><td><a href="#${idPrefix}${name}">0x${v['!id'].toString(16)}</a></td><td><a href="#${idPrefix}${name}">${name}</a></td></tr>` : `<tr><td><a href="#${idPrefix}${name}">Type</a><td class='name'>${tfType(name)}</td></tr>`
        }).join('\n')}
  </tbody>
  </table><br/><hr/>`


        // Iterate through all the types

        for (const containerId in toTransform) {
            const container = toTransform[containerId]
            if (containerId.startsWith('!')) {
                // Write out the comments not associated with types
                if (containerId.startsWith('!comment')) {
                    if (container.trim().startsWith('===')) rows += `<p>${nextComment()}</p>`
                    else lastComment = lastComment ? lastComment + container : container
                }
                continue
            }

            const [_, name] = containerId.split(',')

            if (!name || !container) continue
            const packetId = container['!id'] || 'Type'
            const bound = container['!bound'] || 'datatype'
            const type = { server: 'Serverbound', client: 'Clientbound', both: 'Bidirectional', datatype: 'Datatype' }[bound]

            rows += `
    <div class="packet-header" id="${idPrefix}${name}">
    <a href="#${idPrefix}${name}"><div class='packet-id ${bound}'>${packetId}</div><div class='packet-name name'>${tfName(name)}</div></a>
      <small style='vertical-align:middle;float:right'>${type}</small>
    </div><br/>
    \n<p>${nextComment()}</p>\n<table class='table-bordered'>${thead}\n`

            if (containerId.startsWith('%container')) { // Inline the container
                Object.entries(container).forEach(([k, v]) => parseContainer(k, v))
            } else {
                parseContainer(containerId, container)
            }

            rows += '</table><br/><hr/><br/>'
        }

        rows += `</div>`

        // console.log(rows)
        return rows
    }

    if (options.schemaSegmented) {
        for (const k in parsedSchema) {
            if (k.startsWith('!')) continue
            const value = parsedSchema[k]
            // protodef-yaml treats "segmented" schemas as standard containers! we unwrap.
            const key = k.split(',')[1]
            if (key.startsWith('^')) {
                rows += `\n<div class="sticky-container"><div class='container sticky-header'>` + key.slice(1).split('.').join(' / ') + '</div>\n'
                work(value, key.slice(1) + '.')
                rows += '</div>'
            }
        }
        return rows
    } else {
        return work(parsedSchema)
    }
}

const defaultHeader = `
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-wEmeIV1mKuiNpC+IOBjI7aAzPcEZeedi5yW5f2yOq55WWLwNGmvvx4Um1vskeMj0" crossorigin="anonymous">
<style>
body{font-family:sans-serif;}
td{padding:8px;}
table {
  /*width: 100%;*/
}
tr{
  /*width:100%;*/
}
td{
  border-bottom:1px solid #E0E0E0;
}
.bordered td {
  border-right: 1px solid #E0E0E0;
}
.field-name { font-weight:bold;}
.fake{font-weight:normal;font-style:italic;}
</style>
<style>
body { font-family: Helvetica, Arial, sans-serif; }
.packet-header div { display: inline-block; padding: 8px; }
.packet-name { font-size: 22px; font-weight: bold; vertical-align:middle; }
.packet-id { 
  border-radius: 20px; 
  font-size: 14px;
  font-weight: 700;
  min-width: 80px;
  padding: 6px 15px;
  text-align: center;
  border-radius: 3px;
}
.datatype { background-color: #941c9f; color:white; }
.client { background-color: #61affe; color:white; }
.both { background-color: #49cc90; color:white; }
.server { background-color: #597794; color:white; }
.tag { border-radius: 10px; margin: 4px; padding: 2px 4px 2px 4px; background-color: lightblue; background-color: black; color: white; }
.tag-switch {
  background-color: #F0F0F0; border: 1px solid #A0A0A0; color: black; padding: 6px;
}
.tag-optional {
  background-color: gold; border: 1px solid #A0A0A0; color: black; padding: 6px;
}
.tag-array {
  background-color: navy;
}
.field-title { font-weight: bold; }
td { vertical-align: middle; text-align: center; }
table table {
  margin: -8px;
}
.table-bordered { border: 1px solid #E0E0E0; }
thead td { font-weight: bold; background-color: #E0E0E0; }
a { text-decoration: none; }
.name { text-transform: capitalize; }
.sitkcy-container { position: relative; }
.sticky-header { position: sticky; top: 0; text-align: center; font-size: 1.5rem; }
</style>
</head>`

function test() {
    const fs = require('fs')
    const file = '../test/files/proto.yaml'
    const { parse } = require('../compiler')
    const intermediary = parse(file, true)
    // console.log('i', intermediary)
    const html = generate(intermediary)
    fs.writeFileSync('./doc.html', html)
}

module.exports = generate