const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('image processing supports HEIC conversion before upload', () => {
  const source = readSource('lib/imageUtils.ts')

  assert.match(source, /heic2any/)
  assert.match(source, /isHeicLikeFile/)
  assert.match(source, /convertHeicToJpeg/)
  assert.match(source, /toType:\s*'image\/jpeg'/)
})
