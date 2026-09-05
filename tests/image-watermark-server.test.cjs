const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const sharp = require('sharp')

const projectRoot = process.cwd()

const loadTsModule = (relativePath) => {
  const filePath = path.join(projectRoot, relativePath)
  const source = fs.readFileSync(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText

  const module = { exports: {} }
  const dirname = path.dirname(filePath)
  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  const script = new vm.Script(wrapped, { filename: filePath })
  const fn = script.runInThisContext()
  fn(module.exports, require, module, filePath, dirname)
  return module.exports
}

const countChangedPixels = (raw, width, region) => {
  let changed = 0

  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const index = (y * width + x) * 3
      if (raw[index] !== 255 || raw[index + 1] !== 255 || raw[index + 2] !== 255) {
        changed += 1
      }
    }
  }

  return changed
}

test('server watermark renders centered text without full-image diagonal lines', async () => {
  const { addWatermark } = loadTsModule('lib/imageUtils.server.ts')
  const width = 1200
  const height = 800
  const source = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#ffffff',
    },
  })
    .png()
    .toBuffer()

  const watermarked = await addWatermark(source)
  const raw = await sharp(watermarked).removeAlpha().raw().toBuffer()
  const cornerRegions = [
    { x: 0, y: 0, width: 240, height: 160 },
    { x: width - 240, y: 0, width: 240, height: 160 },
    { x: 0, y: height - 160, width: 240, height: 160 },
    { x: width - 240, y: height - 160, width: 240, height: 160 },
  ]
  const centerRegion = { x: Math.floor(width / 2) - 220, y: Math.floor(height / 2) - 120, width: 440, height: 240 }

  assert.equal(countChangedPixels(raw, width, centerRegion) > 1000, true)
  for (const region of cornerRegions) {
    assert.equal(countChangedPixels(raw, width, region), 0)
  }
})

test('server watermark uses a bundled Traditional Chinese font file', () => {
  const source = fs.readFileSync(path.join(projectRoot, 'lib/imageUtils.server.ts'), 'utf8')

  assert.match(source, /fontfile/)
  assert.match(source, /NotoSansTC/)
  assert.doesNotMatch(source, /buildDiagonalLines|<line x1=/)
})
