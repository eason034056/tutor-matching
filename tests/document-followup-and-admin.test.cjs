const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('document follow-up page exists and includes phone-tail verification and document upload', () => {
  const pagePath = path.join(process.cwd(), 'app/case-documents/[token]/page.tsx')
  assert.ok(fs.existsSync(pagePath), 'expected document follow-up page to exist')

  const source = fs.readFileSync(pagePath, 'utf8')
  assert.match(source, /電話末三碼/)
  assert.match(source, /身分證字號/)
  assert.match(source, /身分證照片/)
})

test('admin dashboard includes document follow-up controls and normalized case display', () => {
  const source = readSource('app/admin/page.tsx')

  assert.match(source, /補件狀態/)
  assert.match(source, /產生補件連結/)
  assert.match(source, /重新產生連結/)
  assert.match(source, /budgetRange/)
})

test('shared case normalization helper exists for legacy and redesigned case data', () => {
  const helperPath = path.join(process.cwd(), 'lib/case-utils.ts')
  assert.ok(fs.existsSync(helperPath), 'expected shared case utils helper to exist')

  const source = fs.readFileSync(helperPath, 'utf8')
  assert.match(source, /normalizeCase/)
  assert.match(source, /budgetRange/)
  assert.match(source, /documentStatus/)
})
