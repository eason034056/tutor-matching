const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('mobile sticky filter avoids horizontal scrolling chips', () => {
  const source = readSource('app/tutor-cases/client.tsx')

  assert.match(source, /sticky top-0 z-30/)
  assert.match(source, /flex min-h-11 flex-wrap items-center gap-2 pt-1/)
  assert.doesNotMatch(source, /overflow-x-auto/)
})

test('apply dialog uses explicit mobile bottom-sheet positioning with clipping', () => {
  const source = readSource('app/tutor-cases/client.tsx')

  assert.match(source, /left-0 right-0 bottom-0 top-auto/)
  assert.match(source, /translate-x-0 translate-y-0 overflow-hidden/)
  assert.match(source, /rounded-t-\[1\.6rem\] rounded-b-none/)
})

test('apply dialog keeps desktop centered modal classes', () => {
  const source = readSource('app/tutor-cases/client.tsx')

  assert.match(source, /md:left-\[50%\]/)
  assert.match(source, /md:right-auto/)
  assert.match(source, /md:top-\[50%\]/)
  assert.match(source, /md:bottom-auto/)
  assert.match(source, /md:-translate-x-1\/2 md:-translate-y-1\/2/)
})
