const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('case upload page uses a guided hero with inline form entry and support card', () => {
  const source = readSource('app/case-upload/page.tsx')

  assert.match(source, /青椒老師會整理需求重點/)
  assert.match(source, /三步完成需求登錄/)
  assert.match(source, /還沒準備好直接填？先看流程或先問顧問也可以/)
  assert.match(source, /直接問顧問/)
})

test('case upload form uses mobile-first steps and the new address and budget fields', () => {
  const source = readSource('components/case-upload-form.tsx')

  assert.match(source, /步驟 1/)
  assert.match(source, /步驟 2/)
  assert.match(source, /步驟 3/)
  assert.match(source, /city/)
  assert.match(source, /district/)
  assert.match(source, /roadName/)
  assert.match(source, /landmark/)
  assert.match(source, /budgetRange/)
  assert.doesNotMatch(source, /id="idCard"/)
})

test('case upload form scrolls back to the step header when moving between pages', () => {
  const source = readSource('components/case-upload-form.tsx')

  assert.match(source, /scrollIntoView/)
  assert.match(source, /behavior:\s*'smooth'/)
})

test('case upload form highlights invalid required fields and scrolls to the first error', () => {
  const source = readSource('components/case-upload-form.tsx')

  assert.match(source, /fieldErrors/)
  assert.match(source, /fieldErrorStep/)
  assert.match(source, /previousStepRef/)
  assert.match(source, /contactSubmitIntentRef/)
  assert.match(source, /border-red-300/)
  assert.match(source, /scrollToField/)
  assert.match(source, /aria-invalid/)
  assert.match(source, /currentStep < steps\.length - 1/)
})

test('case upload success state promises consultant follow-up instead of immediate document collection', () => {
  const source = readSource('components/case-upload-form.tsx')

  assert.match(source, /已收到需求/)
  assert.match(source, /顧問將盡快與您聯繫/)
  assert.match(source, /補件連結會在需求確認後提供/)
})
