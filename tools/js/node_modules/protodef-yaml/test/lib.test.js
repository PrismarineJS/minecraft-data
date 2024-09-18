const { parse, compile, genHTML } = require('../index')
const fs = require('fs')
const crypto = require('crypto')
const assert = require('assert')
const { join } = require('path')

const f = ([name]) => join(__dirname, 'files', name)

it('can transform basic JSON', function () {
	for (var file of [f`file.yml`, f`file2.yml`]) {
		console.log('Testing ', file)
		const json = compile(file)
		assert(json)
		console.log('ok', json)
	}
})

function sha1(file) {
   const data = fs.readFileSync(file);
   return crypto.createHash('sha1').update(data).digest("hex")
}

it('transforms to ProtoDef', function() {
	compile(f`proto.yaml`, f`proto.json`)

	const hash = sha1(f`proto.json`)
	console.info('sha1', hash)
	assert.strictEqual(hash, 'c31e7a1ecf123f0a99c46851baf20aeef3e8960d')
})

it('transforms optionals to ProtoDef', function() {
	compile(f`opts.yml`, f`opts.json`)
	const hash = sha1(f`opts.json`)
	console.info('sha1 of optionals', hash)
	assert.strictEqual(hash, '3c8517a43bd5f84193be7cb47e1295ecfea77363')
})

it('transforms mcpc with structuring carets to json', function() {
	compile(f`mcpc.yml`, f`mcpc.json`)
	const hash = sha1(f`mcpc.json`)
	console.info('sha1 of mcpc', hash)
	assert.strictEqual(hash, '8968dfbf2ccb49d8608e406a8dd5b1d161be8af4')
})

it('transforms mcpc with structuring carets to html', function() {
    const intermediary = parse(f`mcpc.yml`, true)
    const html = genHTML(intermediary, { includeHeader: true, schemaSegmented: true })
	 fs.writeFileSync(f`mcpc.html`, html)
	assert(fs.readFileSync(f`mcpc.html`))
})

it('works inline', function () {
	const json = compile({
		'main': 'x: bool\n!import: import.yml',
		'import.yml': 'y: bool'
	})
	assert(json)
})

it('transforms to HTML', function() {
    const intermediary = parse(f`proto.yaml`, true)
    // console.log('i', intermediary)
    const html = genHTML(intermediary)
	 fs.writeFileSync(f`doc.html`, html)
	 
	assert(fs.readFileSync(f`doc.html`))
})

