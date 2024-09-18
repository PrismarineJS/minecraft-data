var editor = ace.edit("editor")
editor.setTheme("ace/theme/xcode")
editor.session.setMode("ace/mode/yaml")
editor.session.setValue("!StartDocs: true # All comments below are apart of the doc\n\n# # Hello world!\n# This is some markdown, with a horizontal rule (___) and block terminator (===) \n# at the end which tells the parser to flush and write all of the comments.\n# Make sure to be consistent with tabulation, don't mix spaces and tabs.\n# ___\n# ===\n\n# Reads a vector 3f\nvec3:\n    x: f32\n    y: f32\n    z: f32\n\n## Uncomment below (select, Control + /) for an example packet:\n# packet_some_packet:\n#     !id: 4\n#     # Map a i32 to a string\n#     status: i32 =>\n#         0: active\n#         1: inactive\n#     ## Anonymous switch statement\n#     _: status ?\n#         if active:\n#             # read a position\n#             position: vec3[]varint\n#     ## Inline switch\n#     offset: status ?\n#         if active: vec3[]varint")
let timer

function clearErrorState() {
	editor.setTheme("ace/theme/xcode")
	message.style.display = 'none'
}
function showErrorState(msg) {
	editor.setTheme("ace/theme/terminal")
	message.style.display = 'block'
	message.innerText = msg
}

function updateExportType() {
	const type = export_type.value
	update()
}

function update() {
	try {
		if (export_type.value === 'ProtoDef JSON') {
			var json = protoyaml.compile({ main: editor.getValue() }, true, true)
			var html = `<pre>${JSON.stringify(json, null, 2)}</pre>`
		} else {
			var intermediary = protoyaml.parse({ main: editor.getValue() }, true, true)
			// console.log(intermediary)
			var html = protoyaml.genHTML(intermediary, { includeHeader: true })
		}
		clearErrorState()
	} catch (e) {
		console.error(e)
		showErrorState(e.toString())
	}

	console.log('html', html)
	document.getElementById('frame').innerHTML = html
}

editor.session.on('change', function (delta) {
	// delta.start, delta.end, delta.lines, delta.action
	console.log('change')
	clearInterval(timer)
	timer = setTimeout(() => {
		update()
	}, 500)
})

setTimeout(() => update(), 1000)
